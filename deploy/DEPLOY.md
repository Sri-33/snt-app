# SNT Courier Manager — VPS Deployment Guide

Deploy to Ubuntu 24.04 VPS at `187.127.175.116` using PM2 + Nginx.

## Prerequisites

- SSH access to the VPS
- Node.js 20+ installed on VPS
- PM2 and Nginx installed

```bash
# On VPS
sudo apt update && sudo apt install -y nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 1. Create directories

```bash
sudo mkdir -p /var/www/snt-app
sudo mkdir -p /var/data
sudo chown -R $USER:$USER /var/www/snt-app
sudo chown -R $USER:$USER /var/data
```

## 2. Upload project

From your local machine:

```bash
# Build client locally first
cd client && npm run build && cd ..

# Copy to VPS (replace user@ with your SSH user)
rsync -avz --exclude node_modules --exclude .git \
  ./ user@187.127.175.116:/var/www/snt-app/
```

Or clone via git if you push to a repository:

```bash
cd /var/www
git clone <your-repo-url> snt-app
```

## 3. Install dependencies on VPS

```bash
cd /var/www/snt-app/server
npm install --production

cd /var/www/snt-app/client
npm install
npm run build
```

## 4. Configure environment

```bash
# Optional: create server .env
cat > /var/www/snt-app/server/.env << 'EOF'
PORT=3001
SNT_DB_PATH=/var/data/snt.db
N8N_TRACKING_WEBHOOK=https://snt-sales.app.n8n.cloud/webhook/tracking-update
N8N_EMAIL_WEBHOOK=https://snt-sales.app.n8n.cloud/webhook/email-report
EOF
```

## 5. Start with PM2

```bash
cd /var/www/snt-app
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup   # follow the printed command to enable auto-start
```

Verify:

```bash
pm2 status
curl http://localhost:3001/api/health
```

## 6. Configure Nginx

```bash
sudo cp /var/www/snt-app/deploy/nginx-snt.conf /etc/nginx/sites-available/snt
sudo ln -sf /etc/nginx/sites-available/snt /etc/nginx/sites-enabled/snt
sudo rm -f /etc/nginx/sites-enabled/default   # if needed
sudo nginx -t
sudo systemctl reload nginx
```

## 7. Firewall

```bash
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
sudo ufw enable
```

## 8. SSL (recommended)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Update `server_name` in the Nginx config to your domain.

## 9. Updates

```bash
cd /var/www/snt-app
# pull/copy new code
cd client && npm install && npm run build
cd ../server && npm install
pm2 restart snt-courier
```

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 502 Bad Gateway | Check `pm2 logs snt-courier` — ensure server is running on port 3001 |
| DB permission error | `sudo chown $USER:$USER /var/data && chmod 755 /var/data` |
| Blank page | Ensure `client/dist` exists — run `npm run build` in client |
| API 403 for staff | Expected — analytics/export require admin role header |

## Login PINs

| Role  | PIN  |
|-------|------|
| Admin | 6763 |
| Staff | 1111 |

## n8n Webhooks

- **Tracking:** `POST https://snt-sales.app.n8n.cloud/webhook/tracking-update`
  - Payload: `{ customerPhone, customerName, trackingNumber, courierService, orderId }`
- **Email Report:** `POST https://snt-sales.app.n8n.cloud/webhook/email-report`
  - Payload: `{ email, subject, reportType, dateFrom, dateTo, data }`

Ensure your n8n workflows are active and listening on these webhook URLs.
