#!/bin/bash
set -e

echo "=== PORT: $PORT ==="

sed -i "s/8080/${PORT:-8080}/g" /etc/nginx/nginx.conf
echo "=== nginx config after sed ==="
head -20 /etc/nginx/nginx.conf

echo "=== testing nginx config ==="
nginx -t

cd /app/backend
echo "=== starting backend on :8000 ==="
uvicorn main:app --host 0.0.0.0 --port 8000 &
PID_BACKEND=$!

cd /app/frontend
echo "=== starting frontend on :3000 ==="
node_modules/.bin/next start --port 3000 &
PID_FRONTEND=$!

sleep 2

echo "=== starting nginx ==="
nginx -g "daemon off;"
