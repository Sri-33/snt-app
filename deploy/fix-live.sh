#!/usr/bin/env bash
# Run ON THE VPS (after ssh) to fix 500 on app.srinandhinitex.com
# Usage: bash /var/www/snt-app/deploy/fix-live.sh

set -euo pipefail

APP="/var/www/snt-app"

echo "==> Check client build..."
if [ ! -f "$APP/client/dist/index.html" ]; then
  echo "Building client (dist missing)..."
  cd "$APP/client"
  npm install
  npm run build
fi

echo "==> Check server..."
cd "$APP/server"
npm install --production

if [ ! -f .env ]; then
  touch .env
fi
if ! grep -q '^OPENAI_API_KEY=.' .env 2>/dev/null; then
  echo ""
  echo "WARNING: OPENAI_API_KEY missing in $APP/server/.env"
  echo "  Add it: nano $APP/server/.env"
  echo "  Then: pm2 restart snt-courier"
  echo ""
fi

pm2 restart snt-courier 2>/dev/null || pm2 start "$APP/deploy/ecosystem.config.js"
pm2 save 2>/dev/null || true

echo "==> Install nginx config (proxy all traffic to Node)..."
if [ -f "$APP/deploy/nginx-app.srinandhinitex.com.conf" ]; then
  sudo cp "$APP/deploy/nginx-app.srinandhinitex.com.conf" /etc/nginx/sites-available/snt-app
  sudo ln -sf /etc/nginx/sites-available/snt-app /etc/nginx/sites-enabled/snt-app
  sudo nginx -t
  sudo systemctl reload nginx
else
  echo "WARN: nginx config not found — skip nginx reload"
fi

echo "==> Health checks..."
curl -sf http://127.0.0.1:3001/api/health && echo " Node OK"
curl -sfI https://app.srinandhinitex.com/api/health | head -1 || true
curl -sfI https://app.srinandhinitex.com/ | head -1 || true

echo "Done."
