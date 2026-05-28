# Demo-Ready Thrift Store Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete, demo-ready thrift-store e-commerce system with FastAPI, Next.js, PostgreSQL transactional and reporting databases, ETL, analytics, and Hostinger VPS deployment docs.

**Architecture:** Upgrade the existing repo in place. Keep FastAPI as the API server, SQLAlchemy for both databases, Next.js App Router for the UI, localStorage for cart state, JWT auth for protected checkout, and cron-runnable Python ETL for reporting.

**Tech Stack:** FastAPI, SQLAlchemy, PostgreSQL, Passlib, python-jose, Next.js, React, Tailwind CSS, PM2, systemd, Nginx, Linux cron.

---

### Task 1: Backend Behavior Tests

**Files:**
- Create: `backend/tests/test_ecommerce_flow.py`
- Modify: `backend/tests/test_reporting_api.py`

**Steps:**
1. Add failing tests for register/login/me, product filters, order creation with stock reduction and order items, and ETL loading fact order items.
2. Run `python -m unittest discover -s tests`.
3. Confirm the tests fail because the API/schema behavior is missing.

### Task 2: Backend Schema and API

**Files:**
- Modify: `backend/models.py`
- Modify: `backend/reporting_models.py`
- Modify: `backend/main.py`
- Modify: `backend/database.py`
- Modify: `backend/reporting_database.py`
- Modify: `backend/requirements.txt`

**Steps:**
1. Add users with names, products with category/image/stock fields, orders, and order items.
2. Add Pydantic request/response models in `main.py`.
3. Add auth endpoints and JWT dependency.
4. Add product list/detail APIs with category/search filters.
5. Add `POST /orders`, `GET /orders/me`, analytics routes, and compatibility checkout route.
6. Run backend tests until green.

### Task 3: Seed Data and ETL

**Files:**
- Modify: `backend/seed.py`
- Modify: `backend/etl.py`
- Modify: `backend/run_etl.sh`
- Create: `backend/.env.example`

**Steps:**
1. Seed realistic thrift products using only Clothing, Bags, and Accessories.
2. Upsert reporting dimensions, order facts, item facts, and daily summaries.
3. Keep ETL runnable manually and from cron.
4. Run `python seed.py` and `python etl.py`.

### Task 4: Frontend Contracts and Flows

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/types.ts`
- Create: `frontend/src/lib/format.ts`
- Create: `frontend/src/contexts/AuthContext.tsx`
- Modify: `frontend/src/contexts/CartContext.tsx`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/components/Navbar.tsx`
- Modify: `frontend/src/components/HomePage.tsx`
- Modify: `frontend/src/components/ProductCard.tsx`
- Modify: `frontend/src/components/ProductPage.tsx`
- Modify: `frontend/src/components/SlideOutCart.tsx`
- Create: `frontend/src/app/products/page.tsx`
- Create: `frontend/src/app/cart/page.tsx`
- Create: `frontend/src/app/login/page.tsx`
- Create: `frontend/src/app/register/page.tsx`
- Create: `frontend/.env.example`

**Steps:**
1. Add typed API helpers matching the backend.
2. Add auth provider and token persistence.
3. Add quantity-aware cart state and checkout integration.
4. Add responsive product list, auth, cart, and dashboard pages.
5. Run lint/build until green.

### Task 5: Documentation and Deployment

**Files:**
- Modify: `README.md`
- Create: `docs/HOSTINGER_VPS_DEPLOYMENT.md`

**Steps:**
1. Document architecture, schema, ETL, local setup, demo flow, verification commands, and limitations.
2. Add exact Hostinger VPS steps for SSH, packages, PostgreSQL, env files, backend systemd, frontend PM2, Nginx, cron, and troubleshooting.

### Task 6: Verification

**Commands:**
- `cd backend && python -m unittest discover -s tests`
- `cd backend && python -m compileall .`
- `cd frontend && npm install`
- `cd frontend && npm run lint`
- `cd frontend && npm run build`

**Expected:** Backend tests and compile pass; frontend lint/build pass or any blocker is documented with exact output.
