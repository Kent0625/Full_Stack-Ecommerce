# Permanent Portfolio Deployment Guide

> **Why did the previous deployment go down after 3 months?**
> - **Hostinger / Cloud Credit Expiration:** Many university student or trial plans (e.g., Hostinger 3-month voucher, AWS/Azure student credits) expire after 90 days. Once the VPS stops, the IP address (`187.77.145.118`) becomes unreachable.
> - **Render Free Database Expiration:** Render's free PostgreSQL databases automatically expire and are deleted after **30 to 90 days**.
>
> To ensure your portfolio project **stays live permanently and never expires**, follow **Method 1 (100% Free Forever Serverless Stack)**.

---

## Architecture Overview

```mermaid
flowchart TD
  User([Portfolio Visitor / Recruiter]) -->|HTTPS| Frontend["Next.js App Router (Vercel)"]
  Frontend -->|/api reverse proxy| Backend["FastAPI REST API (Render / Koyeb)"]
  Backend --> MainDB[("Neon PostgreSQL (Transactional DB)")]
  Backend -->|Automated Background ETL| ReportingDB[("Neon PostgreSQL (Reporting DB)")]
  Dashboard["Analytics Dashboard (/dashboard)"] -->|Queries| ReportingDB
```

---

## Method 1: Permanent Free Cloud Deployment (Zero Expiration)

This stack costs **$0/month forever** and will **never expire** from underneath your portfolio.

| Layer | Provider | Free Tier Details | Why It Won't Expire |
|---|---|---|---|
| **Database** | [Neon](https://neon.tech) | 0.5 GB Serverless Postgres | Unlike Render DB, Neon does not drop databases after 30 days. |
| **Backend** | [Render](https://render.com) or [Koyeb](https://koyeb.com) | Free Web Service | Free web services remain active indefinitely (sleeps on inactivity, wakes on request). |
| **Frontend** | [Vercel](https://vercel.com) | Free Hobby Plan | Unlimited hosting for Next.js, automatic global CDN, free SSL, custom domains. |

---

### Step 1: Create Permanent Free PostgreSQL Databases (Neon)

1. Sign up for a free account at [neon.tech](https://neon.tech).
2. Create a new project named `archive-thrift`.
3. You will immediately get a connection string that looks like:
   ```text
   postgresql://alex:AbCdEf123456@ep-cool-cloud-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. In the Neon Console under **Databases**, create a second database named `thrift_reporting` (or use the same database for both if you prefer single-DB simplicity).
   - **Main DB URL:** `postgresql://.../neondb?sslmode=require`
   - **Reporting DB URL:** `postgresql://.../thrift_reporting?sslmode=require`

---

### Step 2: Deploy Backend to Render

1. Sign up or log into [Render.com](https://render.com).
2. Click **New +** > **Web Service**.
3. Connect your GitHub repository: `https://github.com/Kent0625/Full_Stack-Ecommerce`.
4. Configure the service:
   - **Name:** `archive-thrift-backend`
   - **Root Directory:** `backend`
   - **Runtime:** `Python`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type:** `Free`
5. Add the **Environment Variables**:
   - `DATABASE_URL`: *(Your Neon connection string from Step 1)*
   - `REPORTING_DATABASE_URL`: *(Your Neon reporting connection string or main DB string)*
   - `JWT_SECRET_KEY`: *(Click "Generate" or type a random 32-character string)*
   - `JWT_EXPIRES_SECONDS`: `86400`
   - `FRONTEND_URL`: `https://*.vercel.app,http://localhost:3000`
6. Click **Create Web Service**.
7. Once deployment finishes, open the Render **Shell** tab and run:
   ```bash
   python seed.py
   python etl.py
   ```
   *(This populates your Neon database with all thrift products, categories, demo users, and initial analytics!)*
8. Copy your live backend URL (e.g. `https://archive-thrift-backend.onrender.com`).
   Test it in your browser: `https://archive-thrift-backend.onrender.com/health` should return `{"status": "ok"}`.

---

### Step 3: Deploy Frontend to Vercel

1. Log into [Vercel](https://vercel.com) with GitHub.
2. Click **Add New…** > **Project**.
3. Import `Full_Stack-Ecommerce`.
4. In the project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** Click "Edit" and choose `frontend`
5. Expand **Environment Variables** and add:
   - `BACKEND_URL`: *(Your live Render backend URL from Step 2, e.g. `https://archive-thrift-backend.onrender.com`)*
   - `NEXT_PUBLIC_API_URL`: `/api`
6. Click **Deploy**.
7. In ~60 seconds, you will receive your live URL: `https://archive-thrift.vercel.app`!

---

## Method 2: 1-Command Docker Compose (VPS Deployment)

If you have an active VPS (Hostinger, DigitalOcean, Linode, AWS EC2, or Hetzner):

1. SSH into your VPS:
   ```bash
   ssh root@YOUR_VPS_IP
   ```
2. Clone the repository:
   ```bash
   git clone https://github.com/Kent0625/Full_Stack-Ecommerce.git archive-thrift
   cd archive-thrift
   ```
3. Run the full stack with Docker Compose:
   ```bash
   docker compose up -d --build
   ```
4. Verify all containers are running:
   ```bash
   docker compose ps
   ```
   - Port 3000: Next.js Frontend
   - Port 8000: FastAPI Backend
   - Port 5432: PostgreSQL

5. (Optional) Point your Nginx or domain to port 3000 with SSL via Certbot.

---

## Portfolio Showcase Features & Recruiter Pitch

When sharing this project on your portfolio, resume, or LinkedIn, highlight these technical accomplishments:

- **Enterprise Full-Stack Architecture:** Next.js 16 App Router frontend + FastAPI backend + Dual PostgreSQL architecture (Separation of OLTP transactional database and OLAP analytical reporting warehouse).
- **Automated ETL Pipeline:** Real-time background sync upon order placement and cron-runnable Python batch jobs (`backend/etl.py`) calculating daily sales, customer acquisition, and product demand metrics.
- **Security & Authentication:** Custom JWT bearer authentication, salt-hashed passwords with PBKDF2-SHA256, secure token validation, and protected routes.
- **Production Performance:** Real-time stock locks with Redis/in-memory lock TTLs to prevent double-spending in flash sales.
- **Web Interface Guidelines & Accessibility:** High-contrast visible focus rings, full semantic HTML, screen-reader compatibility (`aria-live`, `aria-label`), keyboard navigation, and responsive mobile-first UI.
- **1-Click Recruiter Demo Access:** Pre-configured demo login button (`demo@example.com` / `DemoPass123`) allowing instant testing without manual registration.
