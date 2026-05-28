# Demo-Ready Thrift Store Design

## Context

The repository already contains a Next.js frontend, FastAPI backend, SQLAlchemy models, seed data, an ETL script, and a README. The current implementation is incomplete for the final project requirements: auth is missing, product categories are not limited to the required three categories, checkout only handles one reserved product at a time, there is no `order_items` table, reporting lacks order item facts, and frontend imports under `src/lib` are missing.

## Recommended Approach

Use the existing project structure and upgrade it in place. The backend will expose a conventional e-commerce API for auth, product browsing, order creation, and analytics. The frontend will use client-side cart state in localStorage, require login for checkout, create real backend orders, and show analytics from the reporting database after ETL.

This is lower risk than a full rewrite because it keeps the current FastAPI/Next.js shape, deployment expectations, and demo presentation assets while fixing the missing contracts.

## Backend Design

The transactional schema uses `users`, `products`, `orders`, and `order_items`. Passwords are hashed with Passlib, login returns a JWT, and protected endpoints use `Authorization: Bearer <token>`. Product APIs support category and search filters. Checkout is handled by `POST /orders`, which validates stock, stores order and order items, computes totals server-side, and reduces stock quantities.

Legacy `/products/{id}/reserve`, `/products/{id}/unreserve`, and `/products/{id}/checkout` routes remain as compatibility helpers for older UI flows.

## Reporting Design

The reporting database contains `dim_products`, `dim_customers`, `fact_orders`, `fact_order_items`, and `daily_sales_summary`. `backend/etl.py` extracts transactional tables, upserts reporting dimensions/facts, and rebuilds daily summary metrics. Analytics APIs read from the reporting database and return summary, sales over time, top products, and customer growth.

## Frontend Design

The frontend keeps the premium thrift-store brand but adds complete flows: landing, product listing with category/search filters, product detail, login, register, cart, checkout, and dashboard. Product categories are limited to Clothing, Bags, and Accessories. Cart quantities are local frontend state. Checkout requires login and then posts cart line items to the backend.

## Deployment Design

Deployment uses Ubuntu on Hostinger VPS, PostgreSQL installed locally with two databases, FastAPI under systemd/Gunicorn/Uvicorn, Next.js under PM2, Nginx as reverse proxy, `.env` files for secrets, and Linux cron for ETL automation.
