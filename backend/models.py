from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import declarative_base, relationship


Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, default="Guest Customer")
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    orders = relationship("Order", back_populates="user")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    archive_id = Column(String, unique=True, index=True, nullable=True)
    name = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False, default="")
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False, index=True, default="Clothing")
    image_url = Column(Text, nullable=False, default="")
    stock_quantity = Column(Integer, nullable=False, default=1)
    status = Column(String, nullable=False, default="available")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Presentation-friendly optional thrift metadata kept from the original app.
    era = Column(String, nullable=True)
    brand = Column(String, nullable=True)
    srp = Column(Float, nullable=True)
    size = Column(String, nullable=True)
    color = Column(String, nullable=True)
    images = Column(Text, nullable=True)
    fit_details = Column(Text, nullable=True)
    fabric_details = Column(Text, nullable=True)
    condition_details = Column(Text, nullable=True)

    order_items = relationship("OrderItem", back_populates="product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String, nullable=False, default="pending")
    customer_name = Column(String, nullable=True)
    customer_phone = Column(String, nullable=True)
    shipping_address = Column(Text, nullable=True)
    payment_method = Column(String, nullable=True)
    delivery_zone = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Legacy single-product checkout compatibility. New orders use order_items.
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")
