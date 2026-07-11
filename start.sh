#!/bin/bash
set -e

sed -i "s/8080/${PORT:-8080}/g" /etc/nginx/nginx.conf

cd /app/backend
echo "Starting backend on port 8000..."
uvicorn main:app --host 0.0.0.0 --port 8000 --log-level info > /tmp/backend.log 2>&1 &
PID_BACKEND=$!
echo "Backend PID: $PID_BACKEND"

cd /app/frontend
echo "Starting frontend on port 3000..."
node_modules/.bin/next start --port 3000 > /tmp/frontend.log 2>&1 &
PID_FRONTEND=$!
echo "Frontend PID: $PID_FRONTEND"

sleep 2

# Check if processes are still alive
if ! kill -0 $PID_BACKEND 2>/dev/null; then
    echo "Backend failed to start!"
    echo "=== Backend logs ==="
    cat /tmp/backend.log
    exit 1
fi

if ! kill -0 $PID_FRONTEND 2>/dev/null; then
    echo "Frontend failed to start!"
    echo "=== Frontend logs ==="
    cat /tmp/frontend.log
    exit 1
fi

echo "All services started successfully"
nginx -g "daemon off;"

