# Vishnu Priya Function Hall — Booking & Management Platform

Full-stack celebration venue website, booking workflow, Grok AI Chat Bot, Google Calendar & Meta WhatsApp integration, and management console for **Vishnu Priya Function Hall, Eluru**.

- **Address**: Tilak Colony, Santosh Nagar, Eluru, Andhra Pradesh 534002, India
- **Phone / WhatsApp**: +91 75999 96956
- **Capacity**: 150–200 seated guests (Separate A/C Function Hall & Separate A/C Dining Hall)

---

## Architecture

- **Frontend (`/src`)**: React 19, TypeScript, Vite, Tailwind CSS v4, Shadcn/UI, React Router, TanStack Query, React Hook Form + Zod, Framer Motion, `@vis.gl/react-google-maps`, and interactive architectural/capacity/booking infographics.
- **Backend (`/backend`)**: Python 3.12+, FastAPI, Pydantic v2, SQLAlchemy 2.0 (async), Alembic migrations, PostgreSQL (single source of truth with `SELECT ... FOR UPDATE` row locks and exclusive `date_reservations` unique constraint), Redis caching, xAI Grok AI Chat Bot (with function calling & guardrails + optional Gemini adapter), Google Calendar API (`Asia/Kolkata`), Meta WhatsApp Business Cloud API, Argon2 + JWT RBAC.

---

## Security & Environment Variables

- All sensitive credentials (`XAI_API_KEY`, `JWT_SECRET_KEY`, `DATABASE_URL`, `WHATSAPP_ACCESS_TOKEN`, `GOOGLE_SERVICE_ACCOUNT_JSON`) are server-side only and never exposed to the React client bundle (`envPrefix: 'VITE_'`).
- `.env` files are excluded via `.gitignore` and `.dockerignore`; use `.env.example` as a template.
- In production (`ENVIRONMENT=production`), FastAPI enforces a strong `JWT_SECRET_KEY` (≥ 32 chars), disables public `/api/docs`, and redacts secret patterns in structured JSON logs.

---

## Local Development

### 1. Frontend (React + Vite)
```bash
npm install
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000 when running with FastAPI
npm run dev
```

### 2. Backend (FastAPI + PostgreSQL + Redis)
```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Run Alembic migrations against PostgreSQL
alembic upgrade head

# Bootstrap the initial administrator (no public registration endpoint exists)
ADMIN_EMAIL="manager@vishnupriyafunctionhall.in" \
ADMIN_PASSWORD="ReplaceWithStrongPassword123!" \
python -m app.services.bootstrap_admin

# Start FastAPI
uvicorn app.main:app --reload --port 8000
```

### 3. Docker Compose (Full Stack)
```bash
cp .env.example .env
# Fill POSTGRES_PASSWORD and JWT_SECRET_KEY in .env
docker compose up --build
```
- Frontend: `http://localhost:3000`
- FastAPI Backend: `http://localhost:8000`

---

## Automated Tests & CI

GitHub Actions CI (`.github/workflows/ci.yml`) automatically verifies TypeScript, Vitest, Vite production build, and FastAPI `pytest`.

### Frontend (`Vitest` + React Testing Library)
```bash
npm test
```

### Backend (`pytest`)
```bash
cd backend
pytest -v
```

---

## Submitting / Pushing to GitHub

1. Create an empty repository on GitHub (e.g., `vishnu-priya-function-hall`) **without** initializing a README or `.gitignore`.
2. Link your local repository and push the `main` branch:
   ```bash
   git remote add origin https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
   git push -u origin main
   ```

---

## Cloud Run + Cloud SQL + Upstash Redis Deployment

1. **PostgreSQL (Cloud SQL)**: Provision a PostgreSQL 16 instance, set `DATABASE_URL=postgresql+asyncpg://...` in Secret Manager, and run `alembic upgrade head`.
2. **Redis (Upstash)**: Set `REDIS_URL=rediss://...` for public catalog & short-TTL availability caching.
3. **FastAPI Backend (Cloud Run)**:
   ```bash
   gcloud builds submit ./backend --tag gcr.io/<PROJECT_ID>/vishnupriya-api
   gcloud run deploy vishnupriya-api \
     --image gcr.io/<PROJECT_ID>/vishnupriya-api \
     --region asia-south1 \
     --allow-unauthenticated
   ```
4. **React Frontend (Cloud Run)**:
   Build with `--build-arg VITE_API_BASE_URL=https://<api-service-url>` and `--build-arg VITE_GOOGLE_MAPS_API_KEY=<maps-key>` using the root `Dockerfile`, then deploy to Cloud Run.
