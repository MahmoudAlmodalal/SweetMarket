"""
T-52: Management Command Scaffold, Transaction Runner & Clean Reset Engine
Implements `python manage.py seed_candy_loz` with --clean flag support.
"""

from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    """
    Django management command to seed Candy Loz with realistic sample data.

    Supports:
      --clean: Wipe existing domain data before seeding (reverse FK order).
      --verbosity: Standard Django verbosity control (0=silent, 1=normal, 2=verbose).
    """

    help = "Seed Candy Loz database with admin users, delivery zones, catalog, and sample orders."

    def add_arguments(self, parser):
        parser.add_argument(
            "--clean",
            action="store_true",
            default=False,
            help="Delete existing domain records in reverse FK order before seeding.",
        )

    def handle(self, *args, **options):
        clean = options["clean"]
        verbosity = options["verbosity"]

        try:
            with transaction.atomic():
                if clean:
                    self._clean_all(verbosity)
                results = self._run_seeders(verbosity)
            self._print_summary(results, verbosity)
        except Exception as exc:  # pragma: no cover
            self.stderr.write(self.style.ERROR(f"[seed_candy_loz] Transaction rolled back: {exc}"))
            raise

    # ------------------------------------------------------------------
    # Clean phase
    # ------------------------------------------------------------------

    def _clean_all(self, verbosity: int) -> None:
        """Delete records in reverse FK dependency order."""
        from apps.orders.models import OrderStatusHistory, OrderItem, Order, OrderSequence
        from apps.catalog.models import ProductWeightOption, Product, Category
        from apps.delivery.models import DeliveryZone
        from apps.accounts.models import AdminUser

        deletion_plan = [
            ("OrderStatusHistory", OrderStatusHistory),
            ("OrderItem", OrderItem),
            ("Order", Order),
            ("OrderSequence", OrderSequence),
            ("ProductWeightOption", ProductWeightOption),
            ("Product", Product),
            ("Category", Category),
            ("DeliveryZone", DeliveryZone),
            ("AdminUser", AdminUser),
        ]

        if verbosity >= 1:
            self.stdout.write(self.style.WARNING("[clean] Deleting existing domain data..."))

        for label, model_class in deletion_plan:
            count, _ = model_class.objects.all().delete()
            if verbosity >= 2:
                self.stdout.write(f"  → deleted {count} {label} records")

        if verbosity >= 1:
            self.stdout.write(self.style.SUCCESS("[clean] Domain tables cleared."))

    # ------------------------------------------------------------------
    # Seed phase
    # ------------------------------------------------------------------

    def _run_seeders(self, verbosity: int) -> dict:
        """Import and orchestrate all seeders; return combined results dict."""
        from .seeders.accounts_and_zones import seed_admin_users, seed_delivery_zones
        from .seeders.catalog import seed_catalog
        from .seeders.orders import seed_orders

        results = {}

        # 1. Admin users
        if verbosity >= 1:
            self.stdout.write("[1/4] Seeding admin users...")
        user_counts = seed_admin_users()
        results["users"] = user_counts
        if verbosity >= 1:
            self.stdout.write(
                f"      ✓ users created={user_counts['users_created']} "
                f"skipped={user_counts['users_skipped']}"
            )

        # 2. Delivery zones
        if verbosity >= 1:
            self.stdout.write("[2/4] Seeding delivery zones...")
        zone_counts = seed_delivery_zones()
        results["zones"] = zone_counts
        if verbosity >= 1:
            self.stdout.write(
                f"      ✓ zones created={zone_counts['zones_created']} "
                f"skipped={zone_counts['zones_skipped']}"
            )

        # 3. Catalog (categories + products + weight options)
        if verbosity >= 1:
            self.stdout.write("[3/4] Seeding catalog...")
        catalog_counts = seed_catalog()
        results["catalog"] = catalog_counts
        if verbosity >= 1:
            self.stdout.write(
                f"      ✓ categories created={catalog_counts.get('categories_created', 0)} "
                f"skipped={catalog_counts.get('categories_skipped', 0)}"
            )
            self.stdout.write(
                f"      ✓ products created={catalog_counts.get('products_created', 0)} "
                f"skipped={catalog_counts.get('products_skipped', 0)}"
            )
            self.stdout.write(
                f"      ✓ weight_options created={catalog_counts.get('weight_options_created', 0)}"
            )

        # 4. Sample orders
        if verbosity >= 1:
            self.stdout.write("[4/4] Seeding sample orders...")
        order_counts = seed_orders()
        results["orders"] = order_counts
        if verbosity >= 1:
            self.stdout.write(
                f"      ✓ orders created={order_counts.get('orders_created', 0)} "
                f"skipped={order_counts.get('orders_skipped', 0)}"
            )
            self.stdout.write(
                f"      ✓ order_items created={order_counts.get('items_created', 0)}"
            )
            self.stdout.write(
                f"      ✓ status_history created={order_counts.get('history_created', 0)}"
            )

        return results

    # ------------------------------------------------------------------
    # Summary
    # ------------------------------------------------------------------

    def _print_summary(self, results: dict, verbosity: int) -> None:
        """Print a structured summary to stdout."""
        if verbosity < 1:
            return

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("=" * 55))
        self.stdout.write(self.style.SUCCESS("  seed_candy_loz — Completed Successfully"))
        self.stdout.write(self.style.SUCCESS("=" * 55))

        u = results.get("users", {})
        z = results.get("zones", {})
        c = results.get("catalog", {})
        o = results.get("orders", {})

        self.stdout.write(
            f"  Admin users  : {u.get('users_created', 0)} created, {u.get('users_skipped', 0)} skipped"
        )
        self.stdout.write(
            f"  Delivery zones: {z.get('zones_created', 0)} created, {z.get('zones_skipped', 0)} skipped"
        )
        self.stdout.write(
            f"  Categories   : {c.get('categories_created', 0)} created, {c.get('categories_skipped', 0)} skipped"
        )
        self.stdout.write(
            f"  Products     : {c.get('products_created', 0)} created, {c.get('products_skipped', 0)} skipped"
        )
        self.stdout.write(
            f"  Weight opts  : {c.get('weight_options_created', 0)} created"
        )
        self.stdout.write(
            f"  Orders       : {o.get('orders_created', 0)} created, {o.get('orders_skipped', 0)} skipped"
        )
        self.stdout.write(
            f"  Order items  : {o.get('items_created', 0)} created"
        )
        self.stdout.write(
            f"  Status hist  : {o.get('history_created', 0)} created"
        )
        self.stdout.write(self.style.SUCCESS("=" * 55))
