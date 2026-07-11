#!/bin/bash
set -e

echo "=== PORT: $PORT ==="

cd /app/frontend
echo "=== starting frontend on :3456 ==="
(unset PORT; node_modules/.bin/next start -p 3456 > /tmp/frontend.log 2>&1) &
PID_FRONTEND=$!

cd /app/backend
echo "=== starting backend on :8000 ==="
uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &
PID_BACKEND=$!

sleep 4
echo "=== frontend log: ==="
cat /tmp/frontend.log
echo "=== backend log: ==="
cat /tmp/backend.log

sed "s/8080/${PORT:-8080}/g; s/127.0.0.1:3000/127.0.0.1:3456/g" \
    /etc/nginx/nginx.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/nginx.conf

echo "=== starting nginx on $PORT ==="
nginx -g "daemon off;"
