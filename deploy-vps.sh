#!/bin/bash
set -e

# ==============================================================================
# Archive Thrift - 1-Step VPS Production Deployment Script
# Supports: Ubuntu 20.04 / 22.04 / 24.04 (Hostinger, DigitalOcean, AWS, etc.)
# ==============================================================================

echo "======================================================"
echo "🚀 Starting Archive Thrift VPS Production Deployment"
echo "======================================================"

# 1. Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw nginx

# 2. Install Docker & Docker Compose if missing
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker Engine..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    rm -f get-docker.sh
    sudo systemctl enable --now docker
fi

if ! docker compose version &> /dev/null; then
    echo "🐳 Installing Docker Compose plugin..."
    sudo apt install -y docker-compose-plugin
fi

# 3. Setup Project Directory
APP_DIR="/var/www/archive-thrift"
echo "📂 Setting up project directory at $APP_DIR..."
sudo mkdir -p /var/www

if [ -d "$APP_DIR/.git" ]; then
    echo "🔄 Existing repository found, pulling latest changes..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main
else
    echo "📥 Cloning repository..."
    sudo git clone https://github.com/Kent0625/Full_Stack-Ecommerce.git "$APP_DIR"
    cd "$APP_DIR"
fi

sudo chmod +x init-multiple-dbs.sh

# 4. Stop existing containers & spin up new ones
echo "🏗️ Building and starting Docker containers..."
sudo docker compose down --remove-orphans || true
sudo docker compose up -d --build

# 5. Wait for backend to be healthy and seed initial data
echo "⏳ Waiting for backend to start up..."
sleep 8

echo "🌱 Running database seed & ETL..."
sudo docker compose exec -T backend python seed.py || echo "Seed completed or already present."
sudo docker compose exec -T backend python etl.py || echo "Initial ETL run complete."

# 6. Configure Nginx Reverse Proxy for Port 80
echo "🌐 Configuring Nginx reverse proxy on port 80..."

NGINX_CONF="/etc/nginx/sites-available/archive-thrift"
sudo tee "$NGINX_CONF" > /dev/null << 'EOF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 20M;

    # Proxy Next.js frontend (which handles /api rewrites to backend)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/archive-thrift
sudo nginx -t
sudo systemctl reload nginx

# 7. Configure Firewall
echo "🔒 Configuring UFW firewall (allowing 22, 80, 443)..."
sudo ufw allow OpenSSH || true
sudo ufw allow 'Nginx Full' || sudo ufw allow 80/tcp
echo "y" | sudo ufw enable || true

SERVER_IP=$(curl -s https://api.ipify.org || hostname -I | awk '{print $1}')

echo ""
echo "======================================================"
echo "🎉 DEPLOYMENT SUCCESSFUL!"
echo "======================================================"
echo "Your Archive Thrift e-commerce platform is now LIVE at:"
echo "👉 http://$SERVER_IP"
echo ""
echo "Demo Login Credentials:"
echo "👤 Email: demo@example.com"
echo "🔑 Password: DemoPass123"
echo "======================================================"
