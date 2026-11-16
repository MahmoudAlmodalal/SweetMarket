"""
T-53: Admin User Accounts & Gaza Delivery Zones Seeder
Seeds initial admin users and Gaza-area delivery zones for Candy Loz.
"""

from decimal import Decimal
from typing import TypedDict


class SeedCounts(TypedDict):
    users_created: int
    users_skipped: int
    zones_created: int
    zones_skipped: int


def seed_admin_users() -> dict:
    """
    Idempotently seed admin users (manager + staff).
    Uses create_user to ensure PBKDF2 password hashing.
    Skips existing users identified by username.
    """
    from apps.accounts.models import AdminUser

    users_to_seed = [
        {
            "username": "admin",
            "email": "admin@candyloz.com",
            "full_name": "مدير المتجر العام",
            "role": AdminUser.ROLE_MANAGER,
            "password": "Admin@123456",
            "is_staff": True,
            "is_active": True,
        },
        {
            "username": "staff1",
            "email": "staff1@candyloz.com",
            "full_name": "مشرف تجهيز الطلبات",
            "role": AdminUser.ROLE_STAFF,
            "password": "Staff@123456",
            "is_staff": False,
            "is_active": True,
        },
    ]

    created = 0
    skipped = 0

    for user_data in users_to_seed:
        username = user_data["username"]
        if AdminUser.objects.filter(username=username).exists():
            skipped += 1
            continue

        password = user_data.pop("password")
        AdminUser.objects.create_user(password=password, **user_data)
        created += 1

    return {"users_created": created, "users_skipped": skipped}


def seed_delivery_zones() -> dict:
    """
    Idempotently seed the 6 Gaza delivery zones.
    Skips existing zones identified by name.
    """
    from apps.delivery.models import DeliveryZone

    zones_to_seed = [
        {
            "name": "مدينة غزة والرمال والنصر",
            "delivery_fee": Decimal("10.00"),
            "min_order_amount": Decimal("30.00"),
            "estimated_time_min": 30,
            "estimated_time_max": 50,
            "is_active": True,
        },
        {
            "name": "المحافظة الوسطى (دير البلح والنصيرات)",
            "delivery_fee": Decimal("12.00"),
            "min_order_amount": Decimal("40.00"),
            "estimated_time_min": 40,
            "estimated_time_max": 60,
            "is_active": True,
        },
        {
            "name": "خان يونس ووسط البلد",
            "delivery_fee": Decimal("15.00"),
            "min_order_amount": Decimal("50.00"),
            "estimated_time_min": 45,
            "estimated_time_max": 75,
            "is_active": True,
        },
        {
            "name": "شمال غزة (جباليا وبيت لاهيا)",
            "delivery_fee": Decimal("15.00"),
            "min_order_amount": Decimal("40.00"),
            "estimated_time_min": 45,
            "estimated_time_max": 70,
            "is_active": True,
        },
        {
            "name": "مدينة رفح",
            "delivery_fee": Decimal("20.00"),
            "min_order_amount": Decimal("50.00"),
            "estimated_time_min": 60,
            "estimated_time_max": 90,
            "is_active": True,
        },
        {
            "name": "الشيخ عجلين وتل الهوا",
            "delivery_fee": Decimal("10.00"),
            "min_order_amount": Decimal("30.00"),
            "estimated_time_min": 25,
            "estimated_time_max": 45,
            "is_active": True,
        },
    ]

    created = 0
    skipped = 0

    for zone_data in zones_to_seed:
        name = zone_data["name"]
        if DeliveryZone.objects.filter(name=name).exists():
            skipped += 1
            continue

        DeliveryZone.objects.create(**zone_data)
        created += 1

    return {"zones_created": created, "zones_skipped": skipped}


def seed_accounts_and_zones() -> SeedCounts:
    """
    Run all account and zone seeders, returning combined counts.
    """
    user_counts = seed_admin_users()
    zone_counts = seed_delivery_zones()

    return {
        "users_created": user_counts["users_created"],
        "users_skipped": user_counts["users_skipped"],
        "zones_created": zone_counts["zones_created"],
        "zones_skipped": zone_counts["zones_skipped"],
    }
