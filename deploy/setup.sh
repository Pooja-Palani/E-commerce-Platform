#!/bin/bash
# Full setup: database, app build, nginx, SSL, and run everything
set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "==> E-commerce Platform Setup"
echo "    Project root: $PROJECT_ROOT"
echo ""

# 1. Create .env if missing
if [ ! -f .env ]; then
  echo "==> Creating .env from .env.example"
  cp .env.example .env
  echo "    Edit .env to customize (DATABASE_URL, JWT_SECRET, APP_URL)"
else
  echo "==> .env exists, skipping"
fi

# 2. Start PostgreSQL via Docker
echo "==> Starting PostgreSQL (docker-compose)"
docker compose up -d db
echo "    Waiting for Postgres to be ready..."
sleep 3
for i in {1..30}; do
  if docker compose exec -T db pg_isready -U theepak 2>/dev/null; then
    echo "    Postgres is ready"
    break
  fi
  sleep 1
  if [ $i -eq 30 ]; then
    echo "ERROR: Postgres failed to start"
    exit 1
  fi
done

# 3. Install dependencies
echo "==> Installing npm dependencies"
npm install

# 4. Setup database (create tables, add columns)
echo "==> Setting up database schema"
npm run db:setup

# 5. Build the application
echo "==> Building application"
npm run build

# 6. Generate SSL certs (if not present)
SSL_CERT_DIR="/etc/nginx/ssl/ecommerce"
LOCAL_SSL_DIR="$PROJECT_ROOT/deploy/ssl/certs"
if [ ! -f "$LOCAL_SSL_DIR/cert.pem" ] || [ ! -f "$LOCAL_SSL_DIR/key.pem" ]; then
  echo "==> Generating self-signed SSL certificate"
  bash "$PROJECT_ROOT/deploy/ssl/generate-self-signed.sh"
fi

# Copy or symlink certs for nginx
echo "==> Preparing SSL certificates for nginx"
sudo mkdir -p "$SSL_CERT_DIR"
if [ -f "$LOCAL_SSL_DIR/cert.pem" ]; then
  sudo cp "$LOCAL_SSL_DIR/cert.pem" "$SSL_CERT_DIR/"
  sudo cp "$LOCAL_SSL_DIR/key.pem" "$SSL_CERT_DIR/"
  sudo chmod 644 "$SSL_CERT_DIR/cert.pem"
  sudo chmod 600 "$SSL_CERT_DIR/key.pem"
  echo "    Certificates copied to $SSL_CERT_DIR"
fi

# 7. Install and configure nginx (if not already)
if ! command -v nginx &>/dev/null; then
  echo "==> Installing nginx"
  sudo apt-get update -qq && sudo apt-get install -y nginx
fi

echo "==> Configuring nginx"
# Use PORT from .env (default 5000)
APP_PORT=5000
if [ -f .env ]; then
  source <(grep -E '^PORT=' .env 2>/dev/null || true)
  APP_PORT="${PORT:-5000}"
fi
echo "    Using app port: $APP_PORT"
sed "s|proxy_pass http://127.0.0.1:[0-9]*;|proxy_pass http://127.0.0.1:${APP_PORT};|" "$PROJECT_ROOT/deploy/nginx/ecommerce.conf" | sudo tee /etc/nginx/sites-available/ecommerce > /dev/null
sudo ln -sf /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
# Remove default site if it conflicts
sudo rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
sudo nginx -t && sudo systemctl reload nginx
echo "    Nginx configured and reloaded"

# 8. Start the application (in background with nohup, or use systemd)
echo ""
echo "==> Setup complete!"
echo ""
echo "To run the app:"
echo "  cd $PROJECT_ROOT"
echo "  npm start"
echo ""
echo "Or run in background:"
echo "  npm start &"
echo ""
echo "Access:"
echo "  - HTTPS: https://localhost (or https://$(hostname -I | awk '{print $1}'))"
echo "  - Accept self-signed cert in browser when prompted"
echo ""
echo "Starting the app now (background)..."
mkdir -p "$PROJECT_ROOT/logs"
export NODE_ENV=production
cd "$PROJECT_ROOT" && nohup npm start > logs/app.log 2>&1 &
APP_PID=$!
sleep 2
if kill -0 $APP_PID 2>/dev/null; then
  echo "    App started (PID $APP_PID)"
else
  echo "    App may have failed - check logs/app.log"
fi
echo ""
echo "All services running. Access via https://localhost or https://$(hostname -I 2>/dev/null | awk '{print $1}')"
