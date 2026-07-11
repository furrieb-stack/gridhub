#!/bin/bash
set -e

sed -i "s/8080/${PORT:-8080}/g" /etc/nginx/nginx.conf

cd /app/backend
uvicorn main:app --host 0.0.0.0 --port 8000 --log-level error &
PID_BACKEND=$!

cd /app/frontend
node_modules/.bin/next start --port 3000 &
PID_FRONTEND=$!

sleep 2

nginx -g "daemon off;"
