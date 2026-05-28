import importlib
import os
import sys
import tempfile
import unittest
from pathlib import Path

from fastapi.testclient import TestClient


BACKEND_DIR = Path(__file__).resolve().parents[1]


class EcommerceFlowTests(unittest.TestCase):
    def setUp(self):
        self.tmpdir = tempfile.TemporaryDirectory()
        tmp_path = Path(self.tmpdir.name)
        os.environ["DATABASE_URL"] = f"sqlite:///{tmp_path / 'main.sqlite'}"
        os.environ["REPORTING_DATABASE_URL"] = f"sqlite:///{tmp_path / 'reporting.sqlite'}"
        os.environ["JWT_SECRET_KEY"] = "test-secret"
        os.environ.pop("REDIS_URL", None)
        os.environ["FRONTEND_URL"] = "http://localhost:3000"

        if str(BACKEND_DIR) not in sys.path:
            sys.path.insert(0, str(BACKEND_DIR))

        for module_name in [
            "main",
            "database",
            "models",
            "reporting_database",
            "reporting_models",
            "etl",
            "seed",
        ]:
            sys.modules.pop(module_name, None)

    def tearDown(self):
        database = sys.modules.get("database")
        if database is not None:
            database.engine.dispose()

        reporting_database = sys.modules.get("reporting_database")
        if reporting_database is not None:
            reporting_database.reporting_engine.dispose()

        self.tmpdir.cleanup()

    def test_register_login_and_me_use_jwt(self):
        app_module = importlib.import_module("main")
        client = TestClient(app_module.app, raise_server_exceptions=False)

        register_response = client.post(
            "/auth/register",
            json={
                "name": "Mika Santos",
                "email": "mika@example.com",
                "password": "StrongPass123",
                "confirm_password": "StrongPass123",
            },
        )

        self.assertEqual(register_response.status_code, 201)
        self.assertEqual(register_response.json()["user"]["email"], "mika@example.com")
        self.assertIn("access_token", register_response.json())

        login_response = client.post(
            "/auth/login",
            json={"email": "mika@example.com", "password": "StrongPass123"},
        )

        self.assertEqual(login_response.status_code, 200)
        token = login_response.json()["access_token"]

        me_response = client.get("/auth/me", headers={"Authorization": f"Bearer {token}"})

        self.assertEqual(me_response.status_code, 200)
        self.assertEqual(me_response.json()["name"], "Mika Santos")

    def test_products_can_be_filtered_by_required_category_and_search(self):
        app_module = importlib.import_module("main")
        models = importlib.import_module("models")
        database = importlib.import_module("database")
        client = TestClient(app_module.app, raise_server_exceptions=False)

        db = database.SessionLocal()
        try:
            db.add_all(
                [
                    models.Product(
                        name="Vintage Denim Jacket",
                        description="Washed blue denim jacket.",
                        price=1450.0,
                        category="Clothing",
                        image_url="https://example.com/jacket.jpg",
                        stock_quantity=4,
                        status="available",
                    ),
                    models.Product(
                        name="Canvas Tote Bag",
                        description="Everyday canvas tote.",
                        price=650.0,
                        category="Bags",
                        image_url="https://example.com/tote.jpg",
                        stock_quantity=2,
                        status="available",
                    ),
                ]
            )
            db.commit()
        finally:
            db.close()

        category_response = client.get("/products", params={"category": "Bags"})
        search_response = client.get("/products", params={"search": "denim"})

        self.assertEqual(category_response.status_code, 200)
        self.assertEqual([item["category"] for item in category_response.json()], ["Bags"])
        self.assertEqual(search_response.status_code, 200)
        self.assertEqual(search_response.json()[0]["name"], "Vintage Denim Jacket")

    def test_create_order_stores_items_and_reduces_stock(self):
        app_module = importlib.import_module("main")
        models = importlib.import_module("models")
        database = importlib.import_module("database")
        client = TestClient(app_module.app, raise_server_exceptions=False)

        token = client.post(
            "/auth/register",
            json={
                "name": "Buyer One",
                "email": "buyer@example.com",
                "password": "StrongPass123",
                "confirm_password": "StrongPass123",
            },
        ).json()["access_token"]

        db = database.SessionLocal()
        try:
            jacket = models.Product(
                name="Vintage Denim Jacket",
                description="Washed blue denim jacket.",
                price=1450.0,
                category="Clothing",
                image_url="https://example.com/jacket.jpg",
                stock_quantity=3,
                status="available",
            )
            tote = models.Product(
                name="Canvas Tote Bag",
                description="Everyday canvas tote.",
                price=650.0,
                category="Bags",
                image_url="https://example.com/tote.jpg",
                stock_quantity=1,
                status="available",
            )
            db.add_all([jacket, tote])
            db.commit()
            db.refresh(jacket)
            db.refresh(tote)
            jacket_id = jacket.id
            tote_id = tote.id
        finally:
            db.close()

        response = client.post(
            "/orders",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "items": [
                    {"product_id": jacket_id, "quantity": 2},
                    {"product_id": tote_id, "quantity": 1},
                ],
                "customer_name": "Buyer One",
                "customer_phone": "09171234567",
                "shipping_address": "123 Demo Street, Manila",
                "payment_method": "Cash on Delivery",
            },
        )

        self.assertEqual(response.status_code, 201)
        payload = response.json()
        self.assertEqual(payload["total_amount"], 3550.0)
        self.assertEqual(len(payload["items"]), 2)

        db = database.SessionLocal()
        try:
            order_items = db.query(models.OrderItem).all()
            jacket = db.query(models.Product).filter(models.Product.id == jacket_id).one()
            tote = db.query(models.Product).filter(models.Product.id == tote_id).one()

            self.assertEqual(len(order_items), 2)
            self.assertEqual(jacket.stock_quantity, 1)
            self.assertEqual(tote.stock_quantity, 0)
            self.assertEqual(tote.status, "sold_out")
        finally:
            db.close()

    def test_etl_loads_order_item_facts_for_top_products(self):
        app_module = importlib.import_module("main")
        database = importlib.import_module("database")
        reporting_database = importlib.import_module("reporting_database")
        reporting_models = importlib.import_module("reporting_models")
        etl = importlib.import_module("etl")
        client = TestClient(app_module.app, raise_server_exceptions=False)

        token = client.post(
            "/auth/register",
            json={
                "name": "Report Buyer",
                "email": "report@example.com",
                "password": "StrongPass123",
                "confirm_password": "StrongPass123",
            },
        ).json()["access_token"]

        models = importlib.import_module("models")
        db = database.SessionLocal()
        try:
            product = models.Product(
                name="Classic Watch",
                description="Gold-tone everyday watch.",
                price=1250.0,
                category="Accessories",
                image_url="https://example.com/watch.jpg",
                stock_quantity=5,
                status="available",
            )
            db.add(product)
            db.commit()
            db.refresh(product)
            product_id = product.id
        finally:
            db.close()

        order_response = client.post(
            "/orders",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "items": [{"product_id": product_id, "quantity": 3}],
                "customer_name": "Report Buyer",
                "customer_phone": "09170000000",
                "shipping_address": "ETL Street",
                "payment_method": "GCash",
            },
        )
        self.assertEqual(order_response.status_code, 201)

        etl.run_etl()

        rep_db = reporting_database.ReportingSessionLocal()
        try:
            fact_items = rep_db.query(reporting_models.FactOrderItem).all()
            self.assertEqual(len(fact_items), 1)
            self.assertEqual(fact_items[0].quantity, 3)
        finally:
            rep_db.close()

        top_response = client.get("/analytics/top-products")
        self.assertEqual(top_response.status_code, 200)
        self.assertEqual(top_response.json()[0]["name"], "Classic Watch")
        self.assertEqual(top_response.json()[0]["sold_count"], 3)


if __name__ == "__main__":
    unittest.main()
