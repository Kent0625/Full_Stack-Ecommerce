# Hostinger VPS Deployment Guide

These steps assume an Ubuntu Hostinger VPS and a project path of `/var/www/archive-thrift`. Replace `your-domain.com`, passwords, and repository path values with your real deployment values.

## 1. Connect By SSH

```bash
ssh root@YOUR_VPS_IP
```

Create a deploy user if you do not already have one:

```bash
adduser deploy
usermod -aG sudo deploy
su - deploy
```

## 2. Install Required Packages

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl nginx postgresql postgresql-contrib python3 python3-venv python3-pip build-essential
```

Install Node.js 20 with NVM and PM2:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20
nvm alias default 20
npm install -g pm2
```

## 3. Clone The Repository

```bash
sudo mkdir -p /var/www
sudo chown -R deploy:deploy /var/www
cd /var/www
git clone https://github.com/Kent0625/CLOUD_COMPUTING_FINAL_PROJECT.git archive-thrift
cd archive-thrift
```

## 4. Create PostgreSQL Databases And User

```bash
sudo -u postgres psql
```

Inside `psql`:

```sql
CREATE DATABASE thrift_store;
CREATE DATABASE thrift_reporting;
CREATE USER thrift_user WITH ENCRYPTED PASSWORD 'CHANGE_THIS_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE thrift_store TO thrift_user;
GRANT ALL PRIVILEGES ON DATABASE thrift_reporting TO thrift_user;
\c thrift_store
GRANT ALL ON SCHEMA public TO thrift_user;
\c thrift_reporting
GRANT ALL ON SCHEMA public TO thrift_user;
\q
```

## 5. Configure Backend Environment

```bash
cd /var/www/archive-thrift/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env
nano .env
```

Use production values:

```env
DATABASE_URL=postgresql://thrift_user:CHANGE_THIS_STRONG_PASSWORD@localhost:5432/thrift_store
REPORTING_DATABASE_URL=postgresql://thrift_user:CHANGE_THIS_STRONG_PASSWORD@localhost:5432/thrift_reporting
JWT_SECRET_KEY=GENERATE_A_LONG_RANDOM_SECRET
JWT_EXPIRES_SECONDS=86400
FRONTEND_URL=http://your-domain.com,http://YOUR_VPS_IP
REDIS_URL=
```

Generate a random secret:

```bash
openssl rand -hex 32
```

## 6. Create Tables, Seed Data, And Run ETL

```bash
cd /var/www/archive-thrift/backend
source venv/bin/activate
python seed.py
python etl.py
```

## 7. Test FastAPI Backend

```bash
cd /var/www/archive-thrift/backend
source venv/bin/activate
uvicorn main:app --host 127.0.0.1 --port 8000
```

In another SSH session:

```bash
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/products
```

Stop the temporary Uvicorn process with `CTRL+C`.

## 8. Run Backend Persistently With systemd

Create the service:

```bash
sudo nano /etc/systemd/system/archive-backend.service
```

Paste:

```ini
[Unit]
Description=Archive Thrift FastAPI Backend
After=network.target postgresql.service

[Service]
User=deploy
Group=deploy
WorkingDirectory=/var/www/archive-thrift/backend
EnvironmentFile=/var/www/archive-thrift/backend/.env
ExecStart=/var/www/archive-thrift/backend/venv/bin/gunicorn -w 3 -k uvicorn.workers.UvicornWorker main:app --bind 127.0.0.1:8000
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable archive-backend
sudo systemctl start archive-backend
sudo systemctl status archive-backend --no-pager
```

## 9. Configure Frontend Environment

```bash
cd /var/www/archive-thrift/frontend
cp .env.example .env.local
nano .env.local
```

Use:

```env
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://127.0.0.1:8000
```

Install and build:

```bash
npm install
npm run build
```

Run with PM2:

```bash
pm2 start npm --name archive-frontend -- start
pm2 save
pm2 startup
```

Follow the command printed by `pm2 startup` if it asks you to run one with `sudo`.

## 10. Configure Nginx Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/archive-thrift
```

Paste:

```nginx
server {
    listen 80;
    server_name your-domain.com YOUR_VPS_IP;

    client_max_body_size 20M;

    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/archive-thrift /etc/nginx/sites-enabled/archive-thrift
sudo nginx -t
sudo systemctl reload nginx
```

Optional HTTPS with Certbot after DNS points to the VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 11. Configure Cron Job For ETL

```bash
cd /var/www/archive-thrift/backend
chmod +x run_etl.sh
./run_etl.sh
crontab -e
```

Run every 15 minutes for demo freshness:

```cron
*/15 * * * * /var/www/archive-thrift/backend/run_etl.sh >> /var/www/archive-thrift/backend/etl.log 2>&1
```

For nightly production-style reporting:

```cron
0 0 * * * /var/www/archive-thrift/backend/run_etl.sh >> /var/www/archive-thrift/backend/etl.log 2>&1
```

## 12. Deployment Testing Checklist

```bash
curl http://127.0.0.1:8000/health
curl http://YOUR_VPS_IP/api/health
curl http://YOUR_VPS_IP/api/products
pm2 status
sudo systemctl status archive-backend --no-pager
sudo nginx -t
```

Browser flow:

1. Visit `http://YOUR_VPS_IP` or your domain.
2. Open Products and filter Clothing, Bags, Accessories.
3. Login with `demo@example.com` / `DemoPass123` or register.
4. Add a product to cart.
5. Checkout.
6. Run `cd /var/www/archive-thrift/backend && ./run_etl.sh`.
7. Open `/dashboard` and verify updated revenue, orders, top products, and customers.

## 13. Updating The Deployment

```bash
cd /var/www/archive-thrift
git pull
cd backend
source venv/bin/activate
pip install -r requirements.txt
python seed.py
python etl.py
sudo systemctl restart archive-backend
cd ../frontend
npm install
npm run build
pm2 restart archive-frontend
sudo systemctl reload nginx
```

## Troubleshooting

Backend service fails:

```bash
sudo journalctl -u archive-backend -n 100 --no-pager
```

Frontend not reachable:

```bash
pm2 logs archive-frontend --lines 100
pm2 restart archive-frontend
```

Nginx returns 502:

```bash
sudo nginx -t
curl http://127.0.0.1:3000
curl http://127.0.0.1:8000/health
```

PostgreSQL authentication errors:

```bash
sudo -u postgres psql -c "\l"
sudo -u postgres psql -c "\du"
```

ETL does not update dashboard:

```bash
cd /var/www/archive-thrift/backend
source venv/bin/activate
python etl.py
tail -n 100 etl.log
```

CORS errors:

- Ensure `FRONTEND_URL` in `backend/.env` includes your domain or VPS IP.
- Restart backend after changing `.env`: `sudo systemctl restart archive-backend`.

Database tables missing:

```bash
cd /var/www/archive-thrift/backend
source venv/bin/activate
python seed.py
python etl.py
```
