#!/bin/bash

echo "=== PORT: $PORT ==="

cd /app/backend
echo "=== starting backend on $PORT ==="
uvicorn main:app --host 0.0.0.0 --port "$PORT" 2>&1
