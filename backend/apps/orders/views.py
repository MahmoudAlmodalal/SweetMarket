"""
Thin Django REST Framework views for Candy Loz Orders.
"""

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

from apps.accounts.permissions import IsAdminAuthenticated, IsStaffOrManager
from apps.common.exceptions import BusinessLogicError
from apps.common.pagination import StandardPagination
from apps.orders.throttling import OrderTrackFailedAttemptThrottle
from apps.orders.services import create_guest_order, update_order_status
from apps.orders.selectors import (
    get_order_for_tracking,
    list_admin_orders,
    get_admin_order_detail,
)
from apps.orders.serializers import (
    GuestCheckoutSerializer,
    OrderTrackingInputSerializer,
    OrderStatusUpdateInputSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
)


class GuestCheckoutView(APIView):
    """
    Public guest checkout endpoint. Supports Idempotency-Key header (BR-004).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        idempotency_key = (
            request.headers.get('Idempotency-Key')
            or request.headers.get('idempotency-key')
            or request.META.get('HTTP_IDEMPOTENCY_KEY')
        )

        serializer = GuestCheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        validated_data = serializer.validated_data
        customer_data = validated_data['customer']
        items_data = validated_data['items']

        order, created = create_guest_order(
            customer_name=customer_data['name'],
            customer_phone=customer_data['phone'],
            zone_id=customer_data['zone_id'],
            street_address=customer_data['street_address'],
            building_or_apt=customer_data.get('building_or_apt', ''),
            notes=customer_data.get('notes', ''),
            items_data=items_data,
            idempotency_key=idempotency_key,
        )

        response_data = OrderDetailSerializer(order).data
        return Response(response_data, status=status.HTTP_201_CREATED)


class OrderTrackingView(APIView):
    """
    Secure public order fulfillment tracking view with rate limiting (T-57).
    """
    permission_classes = [AllowAny]
    throttle_classes = [OrderTrackFailedAttemptThrottle]

    def post(self, request):
        serializer = OrderTrackingInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        order_number = serializer.validated_data['order_number']
        phone = serializer.validated_data['phone']

        order = get_order_for_tracking(order_number=order_number, phone=phone)

        if not order:
            OrderTrackFailedAttemptThrottle.record_failure(request)
            raise BusinessLogicError(
                message="لم يتم العثور على طلب يطابق البيانات المدخلة",
                code="ORDER_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        OrderTrackFailedAttemptThrottle.reset_failures(request)
        response_data = OrderDetailSerializer(order).data
        return Response(response_data, status=status.HTTP_200_OK)


class AdminOrderListView(APIView):
    """
    Administrative orders listing view with filtering and pagination.
    """
    permission_classes = [IsAdminAuthenticated, IsStaffOrManager]
    pagination_class = StandardPagination

    def get(self, request):
        status_filter = request.query_params.get('status')
        zone_id = request.query_params.get('zoneId') or request.query_params.get('zone')
        search = request.query_params.get('search')

        orders_qs = list_admin_orders(
            status=status_filter,
            zone_id=zone_id,
            search=search,
        )

        paginator = self.pagination_class()
        paginated_orders = paginator.paginate_queryset(orders_qs, request, view=self)
        serializer = OrderListSerializer(paginated_orders, many=True)
        return paginator.get_paginated_response(serializer.data)


class AdminOrderDetailView(APIView):
    """
    Administrative single order detail inspection view.
    """
    permission_classes = [IsAdminAuthenticated, IsStaffOrManager]

    def get(self, request, id):
        order = get_admin_order_detail(order_id=id)
        if not order:
            raise BusinessLogicError(
                message="الطلب غير موجود",
                code="ORDER_NOT_FOUND",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        serializer = OrderDetailSerializer(order)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminOrderStatusUpdateView(APIView):
    """
    Administrative order state transition view with policy enforcement.
    """
    permission_classes = [IsAdminAuthenticated, IsStaffOrManager]

    def patch(self, request, id):
        serializer = OrderStatusUpdateInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_status = serializer.validated_data['status']
        reason = serializer.validated_data.get('reason', '')
        note = serializer.validated_data.get('note', '')

        updated_order = update_order_status(
            order_id=id,
            target_status=target_status,
            actor=request.user,
            reason=reason,
            note=note,
        )

        response_data = OrderDetailSerializer(updated_order).data
        return Response(response_data, status=status.HTTP_200_OK)
