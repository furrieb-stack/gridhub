FROM python:3.12-slim AS backend-builder

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -i https://pypi.org/simple/ -r requirements.txt
COPY backend/ .

FROM node:22-alpine AS frontend-builder

WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ .
RUN rm -rf .next
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM python:3.12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    nginx supervisor && \
    rm -rf /var/lib/apt/lists/*

COPY --from=backend-builder /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=backend-builder /usr/local/bin /usr/local/bin
COPY --from=backend-builder /app /app/backend
COPY --from=frontend-builder /app /app/frontend

COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisord.conf

RUN mkdir -p /app/backend/media /app/backend/uploads

EXPOSE 10000

CMD ["supervisord", "-c", "/etc/supervisord.conf"]