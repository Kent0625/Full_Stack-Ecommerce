import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

try:
    from . import models, reporting_models, reporting_database
    from .database import engine, get_db, redis_client
    from .reporting_database import get_reporting_db
    from .etl import run_etl
except ImportError:
    import models, reporting_models, reporting_database
    from database import engine, get_db, redis_client
    from reporting_database import get_reporting_db
    from etl import run_etl


load_dotenv()

models.Base.metadata.create_all(bind=engine)
reporting_models.ReportingBase.metadata.create_all(bind=reporting_database.reporting_engine)

app = FastAPI(title="Archive Premium Thrift API", version="2.0.0")
bearer_scheme = HTTPBearer(auto_error=False)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-in-production")
JWT_EXPIRES_SECONDS = int(os.getenv("JWT_EXPIRES_SECONDS", str(60 * 60 * 24)))
ALLOWED_CATEGORIES = {"Clothing", "Bags", "Accessories"}


def parse_origins() -> list[str]:
    raw_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    origins = [origin.strip() for origin in raw_frontend_url.split(",") if origin.strip()]
    origins.extend(["http://127.0.0.1:3000", "http://localhost:3000"])
    return sorted(set(origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=parse_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=5, max_length=255)
    password: str = Field(min_length=1, max_length=128)


class OrderItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0, le=99)


class OrderCreateRequest(BaseModel):
    items: list[OrderItemRequest]
    customer_name: str = Field(min_length=2, max_length=120)
    customer_phone: str = Field(min_length=7, max_length=40)
    shipping_address: str = Field(min_length=5, max_length=500)
    payment_method: str = Field(min_length=2, max_length=80)
    delivery_zone: Optional[str] = Field(default=None, max_length=80)


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    iterations = 260_000
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), iterations)
    return f"pbkdf2_sha256${iterations}${salt}${digest.hex()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        scheme, iterations, salt, digest = stored_hash.split("$", 3)
        if scheme != "pbkdf2_sha256":
            return False
        candidate = hashlib.pbkdf2_hmac(
            "sha256", password.encode("utf-8"), salt.encode("utf-8"), int(iterations)
        ).hex()
        return hmac.compare_digest(candidate, digest)
    except ValueError:
        return False


def b64url_encode(payload: bytes) -> str:
    return base64.urlsafe_b64encode(payload).rstrip(b"=").decode("ascii")


def b64url_decode(payload: str) -> bytes:
    padding = "=" * (-len(payload) % 4)
    return base64.urlsafe_b64decode(f"{payload}{padding}")


def create_access_token(user: models.User) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "name": user.name,
        "exp": int(time.time()) + JWT_EXPIRES_SECONDS,
    }
    signing_input = ".".join(
        [
            b64url_encode(json.dumps(header, separators=(",", ":")).encode("utf-8")),
            b64url_encode(json.dumps(payload, separators=(",", ":")).encode("utf-8")),
        ]
    )
    signature = hmac.new(JWT_SECRET_KEY.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256).digest()
    return f"{signing_input}.{b64url_encode(signature)}"


def decode_access_token(token: str) -> dict:
    try:
        header_part, payload_part, signature_part = token.split(".", 2)
        signing_input = f"{header_part}.{payload_part}"
        expected_signature = hmac.new(
            JWT_SECRET_KEY.encode("utf-8"), signing_input.encode("ascii"), hashlib.sha256
        ).digest()
        if not hmac.compare_digest(b64url_encode(expected_signature), signature_part):
            raise ValueError("Bad token signature")
        payload = json.loads(b64url_decode(payload_part))
        if int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError("Token expired")
        return payload
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    payload = decode_access_token(credentials.credentials)
    user = db.query(models.User).filter(models.User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def parse_images(product: models.Product) -> list[str]:
    if product.images:
        try:
            parsed = json.loads(product.images)
            if isinstance(parsed, list):
                return [str(item) for item in parsed if item]
        except json.JSONDecodeError:
            pass
    return [product.image_url] if product.image_url else []


def product_status(product: models.Product) -> str:
    if product.stock_quantity <= 0:
        return "sold_out"
    if product.status in {"reserved", "sold"}:
        return product.status
    return "available"


def serialize_user(user: models.User) -> dict:
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


def serialize_product(product: models.Product) -> dict:
    images = parse_images(product)
    image_url = product.image_url or (images[0] if images else "")
    status_value = product_status(product)
    return {
        "id": product.id,
        "archive_id": product.archive_id or f"ARC-{product.id:04d}",
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "category": product.category,
        "image_url": image_url,
        "images": images or ([image_url] if image_url else []),
        "stock_quantity": product.stock_quantity,
        "status": status_value,
        "created_at": product.created_at.isoformat() if product.created_at else None,
        "era": product.era,
        "brand": product.brand or "Archive Thrift",
        "srp": product.srp or product.price,
        "size": product.size or "One Size",
        "color": product.color or "Assorted",
        "fit_details": product.fit_details or product.description,
        "fabric_details": product.fabric_details or "Curated pre-loved materials.",
        "condition_details": product.condition_details or "Quality checked and ready to wear.",
    }


def serialize_order_item(item: models.OrderItem) -> dict:
    return {
        "id": item.id,
        "product_id": item.product_id,
        "product_name": item.product.name if item.product else None,
        "quantity": item.quantity,
        "unit_price": item.unit_price,
        "subtotal": item.subtotal,
    }


def serialize_order(order: models.Order) -> dict:
    return {
        "id": order.id,
        "user_id": order.user_id,
        "total_amount": order.total_amount,
        "status": order.status,
        "customer_name": order.customer_name,
        "customer_phone": order.customer_phone,
        "shipping_address": order.shipping_address,
        "payment_method": order.payment_method,
        "delivery_zone": order.delivery_zone,
        "created_at": order.created_at.isoformat() if order.created_at else None,
        "items": [serialize_order_item(item) for item in order.items],
    }


def get_or_create_checkout_user(customer_name: Optional[str], customer_phone: Optional[str], db: Session) -> models.User:
    digits = "".join(ch for ch in (customer_phone or "") if ch.isdigit())
    if digits:
        customer_key = hashlib.sha256(digits.encode("utf-8")).hexdigest()[:16]
        email = f"checkout-{customer_key}@archive.local"
    else:
        email = "guest@archive.local"

    user = db.query(models.User).filter(models.User.email == email).first()
    if user:
        return user

    user = models.User(
        name=(customer_name or "Guest Customer").strip() or "Guest Customer",
        email=email,
        hashed_password=hash_password(secrets.token_urlsafe(16)),
    )
    db.add(user)
    db.flush()
    return user


@app.get("/")
def root():
    return {"service": "Archive Premium Thrift API", "status": "online"}


@app.get("/health")
def health():
    return {"status": "ok", "checked_at": datetime.utcnow().isoformat()}


@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    email = normalize_email(payload.email)
    if "@" not in email or "." not in email.split("@")[-1]:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Enter a valid email address")
    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")

    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = models.User(name=payload.name.strip(), email=email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"access_token": create_access_token(user), "token_type": "bearer", "user": serialize_user(user)}


@app.post("/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = normalize_email(payload.email)
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    return {"access_token": create_access_token(user), "token_type": "bearer", "user": serialize_user(user)}


@app.get("/auth/me")
def me(current_user: models.User = Depends(get_current_user)):
    return serialize_user(current_user)


@app.get("/products")
def list_products(
    category: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(models.Product)

    if category:
        if category not in ALLOWED_CATEGORIES:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Unsupported category")
        query = query.filter(models.Product.category == category)

    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(models.Product.name.ilike(term), models.Product.description.ilike(term)))

    products = query.order_by(models.Product.created_at.desc(), models.Product.id.desc()).all()
    return [serialize_product(product) for product in products]


@app.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    payload = serialize_product(product)
    payload["is_locked"] = bool(redis_client.exists(f"lock:product:{product_id}"))
    payload["lock_ttl"] = redis_client.ttl(f"lock:product:{product_id}") if payload["is_locked"] else 0
    return payload


@app.post("/products/{product_id}/reserve")
def reserve_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product_status(product) != "available":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Item is not available")

    redis_client.set(f"lock:product:{product_id}", "reserved", ex=600)
    product.status = "reserved"
    db.commit()
    return {"message": "Item reserved for 10 minutes", "ttl": 600}


@app.post("/products/{product_id}/unreserve")
def unreserve_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    redis_client.delete(f"lock:product:{product_id}")
    if product.status == "reserved":
        product.status = "available" if product.stock_quantity > 0 else "sold_out"
        db.commit()
    return {"message": "Item released"}


@app.post("/orders", status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreateRequest,
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Order must include items")

    requested_quantities: dict[int, int] = {}
    for item in payload.items:
        requested_quantities[item.product_id] = requested_quantities.get(item.product_id, 0) + item.quantity

    products = (
        db.query(models.Product)
        .filter(models.Product.id.in_(requested_quantities.keys()))
        .with_for_update()
        .all()
    )
    products_by_id = {product.id: product for product in products}

    missing_ids = set(requested_quantities) - set(products_by_id)
    if missing_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product not found: {sorted(missing_ids)[0]}",
        )

    for product_id, quantity in requested_quantities.items():
        product = products_by_id[product_id]
        if product_status(product) != "available" or product.stock_quantity < quantity:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Not enough stock for {product.name}",
            )

    total_amount = sum(products_by_id[item.product_id].price * item.quantity for item in payload.items)
    order = models.Order(
        user_id=current_user.id,
        total_amount=round(total_amount, 2),
        status="paid",
        customer_name=payload.customer_name.strip(),
        customer_phone=payload.customer_phone.strip(),
        shipping_address=payload.shipping_address.strip(),
        payment_method=payload.payment_method.strip(),
        delivery_zone=payload.delivery_zone,
    )
    db.add(order)
    db.flush()

    for item in payload.items:
        product = products_by_id[item.product_id]
        subtotal = round(product.price * item.quantity, 2)
        db.add(
            models.OrderItem(
                order_id=order.id,
                product_id=product.id,
                quantity=item.quantity,
                unit_price=product.price,
                subtotal=subtotal,
            )
        )
        product.stock_quantity -= item.quantity
        product.status = "sold_out" if product.stock_quantity <= 0 else "available"
        redis_client.delete(f"lock:product:{product.id}")

    db.commit()
    db.refresh(order)
    background_tasks.add_task(run_etl)
    return serialize_order(order)


@app.get("/orders/me")
def my_orders(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    orders = (
        db.query(models.Order)
        .filter(models.Order.user_id == current_user.id)
        .order_by(models.Order.created_at.desc())
        .all()
    )
    return [serialize_order(order) for order in orders]


@app.post("/products/{product_id}/checkout")
def checkout_product(
    product_id: int,
    delivery_zone: str,
    background_tasks: BackgroundTasks,
    customer_name: Optional[str] = None,
    customer_phone: Optional[str] = None,
    db: Session = Depends(get_db),
):
    product = db.query(models.Product).filter(models.Product.id == product_id).with_for_update().first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    if product_status(product) not in {"available", "reserved"} or product.stock_quantity < 1:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Item is not available")

    user = get_or_create_checkout_user(customer_name, customer_phone, db)
    order = models.Order(
        user_id=user.id,
        product_id=product.id,
        total_amount=product.price,
        status="paid",
        customer_name=customer_name,
        customer_phone=customer_phone,
        delivery_zone=delivery_zone,
        payment_method="Legacy checkout",
        shipping_address=delivery_zone,
    )
    db.add(order)
    db.flush()
    db.add(
        models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=1,
            unit_price=product.price,
            subtotal=product.price,
        )
    )
    product.stock_quantity -= 1
    product.status = "sold_out" if product.stock_quantity <= 0 else "available"
    redis_client.delete(f"lock:product:{product_id}")

    db.commit()
    db.refresh(order)
    background_tasks.add_task(run_etl)
    return {"message": "Purchase successful", "order_id": order.id, "order": serialize_order(order)}


@app.get("/analytics/summary")
def get_analytics_summary(rep_db: Session = Depends(get_reporting_db)):
    total_revenue = rep_db.query(func.sum(reporting_models.DailySalesSummary.total_revenue)).scalar() or 0.0
    total_orders = rep_db.query(func.sum(reporting_models.DailySalesSummary.total_orders)).scalar() or 0
    total_customers = rep_db.query(func.count(reporting_models.DimCustomer.id)).scalar() or 0

    return {
        "total_revenue": float(total_revenue),
        "total_orders": int(total_orders),
        "total_customers": int(total_customers),
    }


@app.get("/analytics/sales")
def get_sales_analytics(rep_db: Session = Depends(get_reporting_db)):
    sales = (
        rep_db.query(reporting_models.DailySalesSummary)
        .order_by(reporting_models.DailySalesSummary.date)
        .all()
    )
    return [
        {
            "date": item.date.isoformat() if hasattr(item.date, "isoformat") else item.date,
            "total_orders": item.total_orders,
            "total_items": item.total_items,
            "total_revenue": item.total_revenue,
        }
        for item in sales
    ]


@app.get("/analytics/top-products")
def get_top_products(rep_db: Session = Depends(get_reporting_db)):
    top_products = (
        rep_db.query(
            reporting_models.DimProduct.name,
            reporting_models.DimProduct.category,
            func.sum(reporting_models.FactOrderItem.quantity).label("sold_count"),
            func.sum(reporting_models.FactOrderItem.subtotal).label("revenue"),
        )
        .join(
            reporting_models.FactOrderItem,
            reporting_models.DimProduct.original_product_id == reporting_models.FactOrderItem.product_id,
        )
        .group_by(reporting_models.DimProduct.id, reporting_models.DimProduct.name, reporting_models.DimProduct.category)
        .order_by(func.sum(reporting_models.FactOrderItem.quantity).desc())
        .limit(5)
        .all()
    )

    return [
        {
            "name": item.name,
            "category": item.category,
            "sold_count": int(item.sold_count or 0),
            "revenue": float(item.revenue or 0.0),
        }
        for item in top_products
    ]


@app.get("/analytics/recent-sales")
def get_recent_sales(rep_db: Session = Depends(get_reporting_db)):
    recent_items = (
        rep_db.query(
            reporting_models.FactOrderItem.subtotal,
            reporting_models.FactOrderItem.created_at,
            reporting_models.DimProduct.name.label("product_name"),
            reporting_models.DimCustomer.name.label("customer_name"),
        )
        .join(
            reporting_models.DimProduct,
            reporting_models.FactOrderItem.product_id == reporting_models.DimProduct.original_product_id,
        )
        .join(
            reporting_models.FactOrder,
            reporting_models.FactOrderItem.original_order_id == reporting_models.FactOrder.original_order_id,
        )
        .join(
            reporting_models.DimCustomer,
            reporting_models.FactOrder.user_id == reporting_models.DimCustomer.original_user_id,
        )
        .order_by(reporting_models.FactOrderItem.created_at.desc())
        .limit(6)
        .all()
    )

    return [
        {
            "product_name": item.product_name,
            "customer_name": item.customer_name,
            "subtotal": float(item.subtotal),
            "created_at": item.created_at.isoformat(),
        }
        for item in recent_items
    ]


@app.get("/analytics/customers")
def get_customer_analytics(rep_db: Session = Depends(get_reporting_db)):
    customers = (
        rep_db.query(
            func.date(reporting_models.DimCustomer.created_at).label("date"),
            func.count(reporting_models.DimCustomer.id).label("new_customers"),
        )
        .group_by(func.date(reporting_models.DimCustomer.created_at))
        .order_by(func.date(reporting_models.DimCustomer.created_at))
        .all()
    )

    return [
        {
            "date": item.date.isoformat() if hasattr(item.date, "isoformat") else item.date,
            "new_customers": item.new_customers,
        }
        for item in customers
    ]
