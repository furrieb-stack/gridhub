#!/bin/bash
set -e

echo "=== PORT: $PORT ==="

# Next.js читает PORT из окружения, переопределяем принудительно
cd /app/frontend
echo "=== starting frontend on :3000 ==="
PORT=3000 node_modules/.bin/next start -p 3000 &
PID_FRONTEND=$!

sleep 1

cd /app/backend
echo "=== starting backend on PORT ($PORT) ==="
uvicorn main:app --host 0.0.0.0 --port "$PORT" 2>&1
