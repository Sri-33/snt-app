#!/usr/bin/env bash
# Deploy SNT app to VPS. Usage:
#   VPS_USER=root ./deploy/deploy.sh
# Or: ./deploy/deploy.sh user@187.127.175.116

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VPS_HOST="${1:-${VPS_USER:-root}@187.127.175.116}"
REMOTE="/var/www/snt-app"

echo "==> Building client..."
cd "$ROOT/client"
npm run build

echo "==> Uploading to $VPS_HOST:$REMOTE ..."
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude '.cursor' \
  --exclude 'server/data' \
  --exclude 'server/.env' \
  --exclude 'client/node_modules' \
  --exclude 'server/node_modules' \
  "$ROOT/" "$VPS_HOST:$REMOTE/"

echo "==> Server install & restart..."
ssh "$VPS_HOST" bash -s << 'REMOTE_SCRIPT'
set -euo pipefail
APP="/var/www/snt-app"

# Ensure frontend build exists on server
if [ ! -f "$APP/client/dist/index.html" ]; then
  echo "WARN: client/dist missing on server — building..."
  cd "$APP/client" && npm install && npm run build
fi

cd "$APP/server"
npm install --production
if pm2 describe snt-courier >/dev/null 2>&1; then
  pm2 restart snt-courier
else
  pm2 start "$APP/deploy/ecosystem.config.js"
  pm2 save
fi

# Fix nginx: proxy all traffic to Node (fixes 500 when nginx root/permissions break static files)
if [ -f "$APP/deploy/nginx-app.srinandhinitex.com.conf" ]; then
  sudo cp "$APP/deploy/nginx-app.srinandhinitex.com.conf" /etc/nginx/sites-available/snt-app
  sudo ln -sf /etc/nginx/sites-available/snt-app /etc/nginx/sites-enabled/snt-app
  sudo nginx -t && sudo systemctl reload nginx
fi

pm2 status snt-courier
curl -sf http://127.0.0.1:3001/api/health && echo " — Node API OK"
REMOTE_SCRIPT

echo ""
echo "==> Live at http://187.127.175.116"
echo "    (Hard refresh or clear cache if you see an old version)"
