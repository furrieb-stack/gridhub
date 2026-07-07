# GridHub

Социальная сеть для всех.

## Стек

### Frontend
- Next.js 16
- React 19
- Tailwind CSS 4
- TypeScript

### Backend
- FastAPI
- PostgreSQL
- SQLAlchemy
- Redis
- JWT (python-jose)

## Запуск

### Backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload
```

### Frontend

```bash
cd frontend
npm run dev
```

## Переменные окружения

Скопируйте `.env.example` в `.env` в папке `backend/` и заполните значения.
