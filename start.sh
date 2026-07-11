#!/bin/bash
set -e

echo "=== PORT: $PORT ==="

cd /app/frontend
echo "=== starting frontend on :3456 ==="
env -u PORT node_modules/.bin/next start -p 3456 &
PID_FRONTEND=$!

cd /app/backend
echo "=== starting backend on :8000 ==="
uvicorn main:app --host 0.0.0.0 --port 8000 &
PID_BACKEND=$!

sed "s/8080/${PORT:-8080}/g; s/localhost:3000/localhost:3456/g" \
    /etc/nginx/nginx.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/nginx.conf

echo "=== nginx config ==="
head -15 /etc/nginx/nginx.conf

sleep 2

echo "=== starting nginx on $PORT ==="
nginx -g "daemon off;"
