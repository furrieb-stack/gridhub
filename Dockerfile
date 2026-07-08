FROM python:3.12-slim AS backend-builder

WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -i https://pypi.org/simple/ -r requirements.txt
COPY backend/ .

RUN python -c "from database import create_tables; print('Backend OK')"

FROM node:22-alpine AS frontend-builder

WORKDIR /app
COPY frontend/package.json .
RUN npm install
COPY frontend/ .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM nginx:alpine

RUN apk add --no-cache python3 py3-pip supervisor && \
    pip3 install --no-cache-dir uvicorn fastapi sqlalchemy psycopg2-binary python-dotenv bcrypt python-jose[cryptography] slowapi python-multipart aiofiles Pillow websockets redis hiredis httpx pywebpush

COPY --from=backend-builder /app /app/backend
COPY --from=frontend-builder /app /app/frontend
COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /app/backend/media /app/backend/uploads

COPY supervisord.conf /etc/supervisord.conf

EXPOSE 10000

CMD ["supervisord", "-c", "/etc/supervisord.conf"]