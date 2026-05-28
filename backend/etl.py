from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from database import SessionLocal
from models import Order, OrderItem, Product, User
from reporting_database import ReportingSessionLocal, reporting_engine
from reporting_models import (
    DailySalesSummary,
    DimCustomer,
    DimProduct,
    FactOrder,
    FactOrderItem,
    ReportingBase,
)


def as_date(value):
    if hasattr(value, "date"):
        return value.date()
    if isinstance(value, str):
        return datetime.strptime(value[:10], "%Y-%m-%d").date()
    return value


def upsert_dim_customers(main_db: Session, rep_db: Session) -> None:
    for user in main_db.query(User).all():
        existing = rep_db.query(DimCustomer).filter(DimCustomer.original_user_id == user.id).first()
        if not existing:
            rep_db.add(
                DimCustomer(
                    original_user_id=user.id,
                    name=user.name,
                    email=user.email,
                    created_at=user.created_at,
                )
            )
            continue

        existing.name = user.name
        existing.email = user.email
        existing.created_at = user.created_at


def upsert_dim_products(main_db: Session, rep_db: Session) -> None:
    for product in main_db.query(Product).all():
        status = "sold_out" if product.stock_quantity <= 0 else product.status
        existing = rep_db.query(DimProduct).filter(DimProduct.original_product_id == product.id).first()
        if not existing:
            rep_db.add(
                DimProduct(
                    original_product_id=product.id,
                    name=product.name,
                    category=product.category,
                    price=product.price,
                    status=status,
                    stock_quantity=product.stock_quantity,
                    created_at=product.created_at,
                )
            )
            continue

        existing.name = product.name
        existing.category = product.category
        existing.price = product.price
        existing.status = status
        existing.stock_quantity = product.stock_quantity
        existing.created_at = product.created_at


def upsert_fact_orders(main_db: Session, rep_db: Session) -> None:
    for order in main_db.query(Order).all():
        existing = rep_db.query(FactOrder).filter(FactOrder.original_order_id == order.id).first()
        if not existing:
            rep_db.add(
                FactOrder(
                    original_order_id=order.id,
                    user_id=order.user_id,
                    total_amount=order.total_amount,
                    status=order.status,
                    payment_method=order.payment_method,
                    delivery_zone=order.delivery_zone,
                    created_at=order.created_at,
                )
            )
            continue

        existing.user_id = order.user_id
        existing.total_amount = order.total_amount
        existing.status = order.status
        existing.payment_method = order.payment_method
        existing.delivery_zone = order.delivery_zone
        existing.created_at = order.created_at


def upsert_fact_order_items(main_db: Session, rep_db: Session) -> None:
    for item in main_db.query(OrderItem).join(Order).all():
        existing = (
            rep_db.query(FactOrderItem)
            .filter(FactOrderItem.original_order_item_id == item.id)
            .first()
        )
        if not existing:
            rep_db.add(
                FactOrderItem(
                    original_order_item_id=item.id,
                    original_order_id=item.order_id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    subtotal=item.subtotal,
                    created_at=item.order.created_at,
                )
            )
            continue

        existing.original_order_id = item.order_id
        existing.product_id = item.product_id
        existing.quantity = item.quantity
        existing.unit_price = item.unit_price
        existing.subtotal = item.subtotal
        existing.created_at = item.order.created_at


def rebuild_daily_sales_summary(rep_db: Session) -> None:
    rep_db.query(DailySalesSummary).delete()

    sales_data = (
        rep_db.query(
            func.date(FactOrder.created_at).label("date"),
            func.count(FactOrder.id).label("total_orders"),
            func.coalesce(func.sum(FactOrder.total_amount), 0).label("total_revenue"),
        )
        .filter(FactOrder.status == "paid")
        .group_by(func.date(FactOrder.created_at))
        .all()
    )

    for row in sales_data:
        total_items = (
            rep_db.query(func.coalesce(func.sum(FactOrderItem.quantity), 0))
            .join(FactOrder, FactOrderItem.original_order_id == FactOrder.original_order_id)
            .filter(FactOrder.status == "paid")
            .filter(func.date(FactOrder.created_at) == row.date)
            .scalar()
            or 0
        )
        rep_db.add(
            DailySalesSummary(
                date=as_date(row.date),
                total_orders=int(row.total_orders or 0),
                total_items=int(total_items or 0),
                total_revenue=float(row.total_revenue or 0.0),
            )
        )


def run_etl():
    print("Starting ETL process...")
    ReportingBase.metadata.create_all(bind=reporting_engine)

    main_db: Session = SessionLocal()
    rep_db: Session = ReportingSessionLocal()

    try:
        upsert_dim_customers(main_db, rep_db)
        upsert_dim_products(main_db, rep_db)
        upsert_fact_orders(main_db, rep_db)
        upsert_fact_order_items(main_db, rep_db)
        rep_db.commit()

        rebuild_daily_sales_summary(rep_db)
        rep_db.commit()
        print("ETL process completed successfully.")
    except Exception as exc:
        rep_db.rollback()
        print(f"ETL process failed: {exc}")
        raise
    finally:
        main_db.close()
        rep_db.close()


if __name__ == "__main__":
    run_etl()
