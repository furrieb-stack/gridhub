#!/bin/bash

echo "=== PORT: $PORT ==="

cd /app/frontend
echo "=== starting frontend on :3456 ==="
(unset PORT; node_modules/.bin/next start -p 3456 > /tmp/frontend.log 2>&1) &

cd /app/backend
echo "=== starting backend on :8000 ==="
uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/backend.log 2>&1 &

echo "=== waiting for backend :8000 ==="
for i in $(seq 1 30); do
    if echo >/dev/tcp/127.0.0.1/8000 2>/dev/null; then
        echo "=== backend ready ==="
        break
    fi
    sleep 1
done

echo "=== waiting for frontend :3456 ==="
for i in $(seq 1 30); do
    if echo >/dev/tcp/127.0.0.1/3456 2>/dev/null; then
        echo "=== frontend ready ==="
        break
    fi
    sleep 1
done

sed "s/8080/${PORT:-8080}/g; s/127.0.0.1:3000/127.0.0.1:3456/g" \
    /etc/nginx/nginx.conf > /tmp/nginx.conf
mv /tmp/nginx.conf /etc/nginx/nginx.conf

echo "=== starting nginx on $PORT ==="
nginx -g "daemon off;"
