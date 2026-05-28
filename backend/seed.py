import os
import sys
from datetime import datetime, timedelta


sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import models
from database import SessionLocal, engine
from main import hash_password


PRODUCTS = [
    {
        "archive_id": "ARC-CLO-001",
        "name": "Vintage Denim Jacket",
        "description": "A washed blue denim jacket with soft fading, metal buttons, and a relaxed thrifted shape.",
        "price": 1450.0,
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1544441893-675973e31985?w=900&q=85",
        "stock_quantity": 7,
        "status": "available",
        "brand": "Levi's Vintage",
        "era": "Circa 1980s",
        "srp": 3200.0,
        "size": "L",
        "color": "Indigo",
        "fit_details": "Relaxed trucker fit. Best for layering over shirts and hoodies.",
        "fabric_details": "Heavy cotton denim with naturally softened hand feel.",
        "condition_details": "Great vintage fading with light signs of wear.",
    },
    {
        "archive_id": "ARC-CLO-002",
        "name": "Oversized Graphic Shirt",
        "description": "A soft cotton graphic tee with a boxy oversized cut and faded concert-style print.",
        "price": 520.0,
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=85",
        "stock_quantity": 12,
        "status": "available",
        "brand": "Archive Streetwear",
        "era": "Circa 1990s",
        "srp": 980.0,
        "size": "XL",
        "color": "Faded Black",
        "fit_details": "Oversized boxy fit with dropped shoulders.",
        "fabric_details": "Breathable pre-loved cotton jersey.",
        "condition_details": "Cracked print and soft fading, no holes.",
    },
    {
        "archive_id": "ARC-CLO-003",
        "name": "Corduroy Pants",
        "description": "Straight-leg corduroy trousers in warm brown with a structured waist and everyday drape.",
        "price": 890.0,
        "category": "Clothing",
        "image_url": "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=900&q=85",
        "stock_quantity": 6,
        "status": "available",
        "brand": "Weekend Archive",
        "era": "Circa 2000s",
        "srp": 1900.0,
        "size": "32W",
        "color": "Chestnut",
        "fit_details": "Straight leg with a mid-rise waist.",
        "fabric_details": "Midweight cotton corduroy.",
        "condition_details": "Excellent condition with clean hems.",
    },
    {
        "archive_id": "ARC-BAG-001",
        "name": "Leather Shoulder Bag",
        "description": "Compact black leather shoulder bag with a curved flap, brass hardware, and clean interior.",
        "price": 1750.0,
        "category": "Bags",
        "image_url": "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=900&q=85",
        "stock_quantity": 4,
        "status": "available",
        "brand": "Metro Archive",
        "era": "Circa 2010s",
        "srp": 4200.0,
        "size": "Medium",
        "color": "Black",
        "fit_details": "Sits comfortably on the shoulder with daily-carry capacity.",
        "fabric_details": "Genuine leather with cotton lining.",
        "condition_details": "Light creasing on the flap, clean corners.",
    },
    {
        "archive_id": "ARC-BAG-002",
        "name": "Canvas Tote Bag",
        "description": "Durable canvas tote with reinforced handles and enough room for books, laptop, and market finds.",
        "price": 650.0,
        "category": "Bags",
        "image_url": "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=900&q=85",
        "stock_quantity": 10,
        "status": "available",
        "brand": "Daily Reuse",
        "era": "Modern thrift",
        "srp": 1200.0,
        "size": "Large",
        "color": "Natural",
        "fit_details": "Large open-top daily tote.",
        "fabric_details": "Heavy recycled cotton canvas.",
        "condition_details": "Freshly cleaned with minimal wear.",
    },
    {
        "archive_id": "ARC-BAG-003",
        "name": "Mini Backpack",
        "description": "Small nylon backpack with front zip pocket, adjustable straps, and city-friendly proportions.",
        "price": 980.0,
        "category": "Bags",
        "image_url": "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&q=85",
        "stock_quantity": 5,
        "status": "available",
        "brand": "Nomad Finds",
        "era": "Circa 2000s",
        "srp": 2100.0,
        "size": "Mini",
        "color": "Olive",
        "fit_details": "Compact backpack for essentials.",
        "fabric_details": "Water-resistant nylon shell.",
        "condition_details": "Clean straps and smooth zippers.",
    },
    {
        "archive_id": "ARC-ACC-001",
        "name": "Retro Sunglasses",
        "description": "Tinted rectangular sunglasses with lightweight frames and a clean retro profile.",
        "price": 430.0,
        "category": "Accessories",
        "image_url": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=900&q=85",
        "stock_quantity": 15,
        "status": "available",
        "brand": "Sun Archive",
        "era": "Y2K inspired",
        "srp": 900.0,
        "size": "One Size",
        "color": "Tortoise",
        "fit_details": "Medium-width rectangular frame.",
        "fabric_details": "Acetate-style frame with tinted lenses.",
        "condition_details": "No major scratches, includes pouch.",
    },
    {
        "archive_id": "ARC-ACC-002",
        "name": "Beaded Bracelet",
        "description": "Hand-strung beaded bracelet with warm neutral stones and elastic fit.",
        "price": 260.0,
        "category": "Accessories",
        "image_url": "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=900&q=85",
        "stock_quantity": 20,
        "status": "available",
        "brand": "Handmade Rack",
        "era": "Artisan thrift",
        "srp": 520.0,
        "size": "One Size",
        "color": "Earth Mix",
        "fit_details": "Stretch fit for most wrists.",
        "fabric_details": "Mixed beads on elastic cord.",
        "condition_details": "Newly restrung and inspected.",
    },
    {
        "archive_id": "ARC-ACC-003",
        "name": "Classic Watch",
        "description": "Minimal gold-tone analog watch with a black strap and polished vintage face.",
        "price": 1250.0,
        "category": "Accessories",
        "image_url": "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=900&q=85",
        "stock_quantity": 3,
        "status": "available",
        "brand": "Classic Time",
        "era": "Circa 1990s",
        "srp": 2800.0,
        "size": "One Size",
        "color": "Gold / Black",
        "fit_details": "Adjustable strap for everyday wear.",
        "fabric_details": "Stainless case with faux leather strap.",
        "condition_details": "Battery replaced and time tested.",
    },
]


DEMO_USERS = [
    {"name": "Demo Buyer", "email": "demo@example.com", "password": "DemoPass123"},
    {"name": "Ana Santos", "email": "ana@example.com", "password": "DemoPass123"},
    {"name": "Luis Cruz", "email": "luis@example.com", "password": "DemoPass123"},
]


def upsert_products(db):
    products_by_archive_id = {}
    for product_data in PRODUCTS:
        existing = (
            db.query(models.Product)
            .filter(models.Product.archive_id == product_data["archive_id"])
            .first()
        )
        if existing:
            for key, value in product_data.items():
                if key == "stock_quantity" and existing.stock_quantity < value:
                    setattr(existing, key, value)
                elif key != "stock_quantity":
                    setattr(existing, key, value)
            product = existing
        else:
            product = models.Product(**product_data)
            db.add(product)
        products_by_archive_id[product_data["archive_id"]] = product
    db.flush()
    return products_by_archive_id


def upsert_users(db):
    users = []
    for user_data in DEMO_USERS:
        existing = db.query(models.User).filter(models.User.email == user_data["email"]).first()
        if existing:
            users.append(existing)
            continue

        user = models.User(
            name=user_data["name"],
            email=user_data["email"],
            hashed_password=hash_password(user_data["password"]),
        )
        db.add(user)
        users.append(user)
    db.flush()
    return users


def create_demo_orders(db, products_by_archive_id, users):
    if db.query(models.Order).count() > 0:
        return

    order_specs = [
        (users[0], [("ARC-CLO-001", 1), ("ARC-BAG-002", 2)], "GCash", 2),
        (users[1], [("ARC-ACC-003", 1)], "Cash on Delivery", 1),
        (users[2], [("ARC-CLO-002", 2), ("ARC-ACC-002", 3)], "Bank Transfer", 0),
    ]

    for user, line_items, payment_method, days_ago in order_specs:
        created_at = datetime.utcnow() - timedelta(days=days_ago)
        total = 0.0
        order = models.Order(
            user_id=user.id,
            total_amount=0.0,
            status="paid",
            customer_name=user.name,
            customer_phone="09170000000",
            shipping_address="Demo Street, Manila",
            payment_method=payment_method,
            delivery_zone="Zone 1",
            created_at=created_at,
        )
        db.add(order)
        db.flush()

        for archive_id, quantity in line_items:
            product = products_by_archive_id[archive_id]
            subtotal = product.price * quantity
            total += subtotal
            db.add(
                models.OrderItem(
                    order_id=order.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_price=product.price,
                    subtotal=subtotal,
                )
            )
            product.stock_quantity = max(product.stock_quantity - quantity, 0)
            product.status = "sold_out" if product.stock_quantity == 0 else "available"

        order.total_amount = round(total, 2)


def seed():
    models.Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        products_by_archive_id = upsert_products(db)
        users = upsert_users(db)
        create_demo_orders(db, products_by_archive_id, users)
        db.commit()
        print(f"Database seeded successfully with {len(PRODUCTS)} products and demo checkout data.")
        print("Demo login: demo@example.com / DemoPass123")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
