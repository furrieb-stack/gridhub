#!/bin/bash
set -e

echo "=== PORT: $PORT ==="

cd /app/frontend
echo "=== starting frontend on :3000 ==="
node_modules/.bin/next start --port 3000 &
PID_FRONTEND=$!

sleep 1

cd /app/backend
echo "=== starting backend on PORT ($PORT) ==="
uvicorn main:app --host 0.0.0.0 --port "$PORT"
