"""
API Contract Conformance tests for Candy Loz Orders endpoints (T-58).
"""

from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

from apps.catalog.models import Category, Product, ProductWeightOption
from apps.delivery.models import DeliveryZone
from apps.orders.models import (
    Order,
    STATUS_NEW,
    STATUS_ACCEPTED,
    STATUS_IN_PREPARATION,
    STATUS_CANCELLED,
)

User = get_user_model()


class OrderAPIEndpointsTestCase(APITestCase):
    def setUp(self):
        self.manager = User.objects.create_user(
            username='mgr_api',
            email='mgr_api@candyloz.ps',
            full_name='مدير الـ API',
            role='manager',
            password='Password@123',
        )
        self.staff = User.objects.create_user(
            username='staff_api',
            email='staff_api@candyloz.ps',
            full_name='موظف الـ API',
            role='staff',
            password='Password@123',
        )

        self.manager_token = str(RefreshToken.for_user(self.manager).access_token)
        self.staff_token = str(RefreshToken.for_user(self.staff).access_token)

        self.category = Category.objects.create(
            name="حلويات العقود",
            slug="contract-sweets",
            is_active=True,
        )
        self.product = Product.objects.create(
            name="وربات بالقشطة",
            slug="warbat-cream",
            category=self.category,
            price=Decimal('40.00'),
            unit="kg",
            is_available=True,
        )
        self.weight_opt = ProductWeightOption.objects.create(
            product=self.product,
            label="كيلو كامل",
            multiplier=Decimal('1.00'),
            price=Decimal('40.00'),
        )
        self.zone = DeliveryZone.objects.create(
            name="غزة - الرمال",
            delivery_fee=Decimal('10.00'),
            min_order_amount=Decimal('30.00'),
            estimated_time_min=20,
            estimated_time_max=40,
            is_active=True,
        )

    def test_guest_checkout_success_and_camel_case_envelope(self):
        """Guest checkout creates order and returns camelCase wrapped 201 response."""
        payload = {
            "customer": {
                "name": "محمود خليل",
                "phone": "+970 59 912 3456",
                "zoneId": self.zone.id,
                "streetAddress": "شارع الوحدة بجوار المستشفى",
                "buildingOrApt": "طابق 2",
                "notes": "يرجى الطرق على الباب",
            },
            "items": [
                {
                    "productId": self.product.id,
                    "quantity": 2,
                    "weightOptionId": self.weight_opt.id,
                    "packagingLabel": "علبة هدايا كاندي لوز",
                    "packagingFee": "5.00",
                }
            ]
        }

        response = self.client.post('/api/v1/orders', payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        data = response.data['data']

        self.assertIn('orderNumber', data)
        self.assertTrue(data['orderNumber'].startswith('CL-'))
        self.assertEqual(data['status'], 'new')
        # Subtotal: (40 * 2) + (5 * 2) = 90. Total: 90 + 10 = 100.
        self.assertEqual(Decimal(str(data['subtotal'])), Decimal('90.00'))
        self.assertEqual(Decimal(str(data['total'])), Decimal('100.00'))
        self.assertEqual(data['customer']['phone'], '0599123456')

    def test_guest_checkout_idempotency_replay(self):
        """Submitting duplicate request with same Idempotency-Key returns existing order."""
        payload = {
            "customer": {
                "name": "محمود خليل",
                "phone": "0599123456",
                "zoneId": self.zone.id,
                "streetAddress": "شارع الوحدة",
            },
            "items": [{"productId": self.product.id, "quantity": 1}]
        }
        headers = {'HTTP_IDEMPOTENCY_KEY': 'idemp_key_unique_abc'}

        res1 = self.client.post('/api/v1/orders', payload, format='json', **headers)
        self.assertEqual(res1.status_code, status.HTTP_201_CREATED)
        order_num1 = res1.data['data']['orderNumber']

        res2 = self.client.post('/api/v1/orders', payload, format='json', **headers)
        self.assertEqual(res2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res2.data['data']['orderNumber'], order_num1)
        self.assertEqual(Order.objects.count(), 1)

    def test_order_tracking_success_and_failure(self):
        """Order tracking succeeds with valid credentials and fails on mismatch."""
        order = Order.objects.create(
            order_number="CL-2026-9901",
            status=STATUS_NEW,
            customer_name="سعيد عبد الله",
            customer_phone="0568999888",
            zone=self.zone,
            street_address="شارع عمر المختار",
            subtotal=Decimal('40.00'),
            delivery_fee=Decimal('10.00'),
            total=Decimal('50.00'),
        )

        # Successful tracking
        res_ok = self.client.post('/api/v1/orders/track', {
            'orderNumber': 'CL-2026-9901',
            'phone': '0568999888',
        }, format='json')
        self.assertEqual(res_ok.status_code, status.HTTP_200_OK)
        self.assertTrue(res_ok.data['success'])
        self.assertEqual(res_ok.data['data']['orderNumber'], 'CL-2026-9901')

        # Failed tracking (mismatched phone)
        res_fail = self.client.post('/api/v1/orders/track', {
            'orderNumber': 'CL-2026-9901',
            'phone': '0599000000',
        }, format='json')
        self.assertEqual(res_fail.status_code, status.HTTP_404_NOT_FOUND)
        self.assertFalse(res_fail.data['success'])

    def test_admin_orders_rbac_and_listing(self):
        """Unauthenticated requests are rejected (401); Staff and Manager can view paginated list."""
        # Unauthenticated request rejected
        res_unauth = self.client.get('/api/v1/admin/orders')
        self.assertEqual(res_unauth.status_code, status.HTTP_401_UNAUTHORIZED)

        # Staff can list orders
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.staff_token}')
        res_staff = self.client.get('/api/v1/admin/orders?page=1&limit=10')
        self.assertEqual(res_staff.status_code, status.HTTP_200_OK)
        self.assertIn('meta', res_staff.data)
        self.assertIn('page', res_staff.data['meta'])

    def test_admin_order_status_patch_and_policies(self):
        """Staff can advance status; Manager only can cancel with reason."""
        order = Order.objects.create(
            order_number="CL-2026-7777",
            status=STATUS_NEW,
            customer_name="خالد سعيد",
            customer_phone="0599111222",
            zone=self.zone,
            street_address="شارع النصر",
            subtotal=Decimal('40.00'),
            delivery_fee=Decimal('10.00'),
            total=Decimal('50.00'),
        )

        # Staff advances to accepted
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.staff_token}')
        res_accept = self.client.patch(
            f'/api/v1/admin/orders/{order.id}/status',
            {'status': 'accepted', 'note': 'تم القبول من الموظف'},
            format='json'
        )
        self.assertEqual(res_accept.status_code, status.HTTP_200_OK)
        self.assertEqual(res_accept.data['data']['status'], 'accepted')

        # Staff attempts to cancel -> 403 Forbidden
        res_staff_cancel = self.client.patch(
            f'/api/v1/admin/orders/{order.id}/status',
            {'status': 'cancelled', 'reason': 'سبب إلغاء تجريبي'},
            format='json'
        )
        self.assertEqual(res_staff_cancel.status_code, status.HTTP_403_FORBIDDEN)

        # Manager cancels with reason -> 200 OK
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.manager_token}')
        res_mgr_cancel = self.client.patch(
            f'/api/v1/admin/orders/{order.id}/status',
            {'status': 'cancelled', 'reason': 'تم إلغاء الطلب بناء على رغبة الزبون'},
            format='json'
        )
        self.assertEqual(res_mgr_cancel.status_code, status.HTTP_200_OK)
        self.assertEqual(res_mgr_cancel.data['data']['status'], 'cancelled')
