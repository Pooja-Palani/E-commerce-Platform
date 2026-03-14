# E-commerce Platform Deployment

## Quick Setup (all-in-one)

```bash
# Run with sudo for Docker, nginx, SSL
sudo bash deploy/setup.sh
```

This will:
1. Start PostgreSQL (Docker)
2. Create `.env` from `.env.example` if missing
3. Install npm dependencies
4. Run database migrations & setup
5. Build the application
6. Generate self-signed SSL certificate
7. Configure nginx with HTTPS
8. Start the app in background

## Manual Steps

### 1. Database

```bash
# Start Postgres
docker compose up -d db

# Setup schema (after .env has DATABASE_URL)
npm run db:setup
npm run db:push   # if using Drizzle schema
```

### 2. Build

```bash
npm install
npm run build
```

### 3. Nginx + HTTPS

```bash
# Generate self-signed cert (dev only)
bash deploy/ssl/generate-self-signed.sh

# Copy certs
sudo mkdir -p /etc/nginx/ssl/ecommerce
sudo cp deploy/ssl/certs/*.pem /etc/nginx/ssl/ecommerce/

# Configure nginx (ensure PORT in .env matches proxy_pass in ecommerce.conf)
sudo cp deploy/nginx/ecommerce.conf /etc/nginx/sites-available/ecommerce
sudo ln -sf /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Run App

```bash
# Foreground
npm start

# Background
nohup npm start > logs/app.log 2>&1 &
```

## Port Configuration

- Default app port: **5000** (set `PORT` in `.env`)
- Nginx proxies HTTPS (443) → `http://127.0.0.1:PORT`
- If you change `PORT` in `.env`, update `proxy_pass` in `deploy/nginx/ecommerce.conf` to match

## Production HTTPS (Let's Encrypt)

For a real domain, use certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Then update `decommerce.conf` to use certbot's cert paths:

```
ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
```
