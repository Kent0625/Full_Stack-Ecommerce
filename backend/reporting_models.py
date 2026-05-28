from datetime import datetime

from sqlalchemy import Column, Date, DateTime, Float, Integer, String
from sqlalchemy.orm import declarative_base


ReportingBase = declarative_base()


class DimProduct(ReportingBase):
    __tablename__ = "dim_products"

    id = Column(Integer, primary_key=True, index=True)
    original_product_id = Column(Integer, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    status = Column(String, nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False)


class DimCustomer(ReportingBase):
    __tablename__ = "dim_customers"

    id = Column(Integer, primary_key=True, index=True)
    original_user_id = Column(Integer, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)


class FactOrder(ReportingBase):
    __tablename__ = "fact_orders"

    id = Column(Integer, primary_key=True, index=True)
    original_order_id = Column(Integer, unique=True, index=True, nullable=False)
    user_id = Column(Integer, nullable=True)
    total_amount = Column(Float, nullable=False)
    status = Column(String, nullable=False)
    payment_method = Column(String, nullable=True)
    delivery_zone = Column(String, nullable=True)
    created_at = Column(DateTime, nullable=False)


class FactOrderItem(ReportingBase):
    __tablename__ = "fact_order_items"

    id = Column(Integer, primary_key=True, index=True)
    original_order_item_id = Column(Integer, unique=True, index=True, nullable=False)
    original_order_id = Column(Integer, index=True, nullable=False)
    product_id = Column(Integer, index=True, nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class DailySalesSummary(ReportingBase):
    __tablename__ = "daily_sales_summary"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, index=True, nullable=False)
    total_orders = Column(Integer, default=0, nullable=False)
    total_items = Column(Integer, default=0, nullable=False)
    total_revenue = Column(Float, default=0.0, nullable=False)
