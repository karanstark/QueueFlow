# QueueFlow

> A distributed job scheduling and queue management platform built for engineers who need reliable background job processing — with a real-time dashboard, retry strategies, dead letter queues, and worker monitoring.

![QueueFlow Dashboard](https://img.shields.io/badge/QueueFlow-v1.0-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0yMSA4YTIgMiAwIDAgMC0xLTEuNzNsLTctNGEyIDIgMCAwIDAtMiAwbC03IDRBMiAyIDAgMCAwIDMgOHY4YTIgMiAwIDAgMCAxIDEuNzNsNyA0YTIgMiAwIDAgMCAyIDBsNy00QTIgMiAwIDAgMCAyMSAxNnoiLz48L3N2Zz4=)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=for-the-badge&logo=fastapi)
![React](https://img.shields.io/badge/React-18+-61DAFB?style=for-the-badge&logo=react)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite)

---

## What is QueueFlow?

QueueFlow is a full-stack distributed job queue system. Think of it as a lightweight self-hosted alternative to BullMQ or Celery — with a polished dark-mode dashboard. You create projects, add queues, dispatch jobs, and the built-in worker picks them up automatically, retries on failure, and moves permanently failed jobs to a Dead Letter Queue.

---

## Features

### Core
- **Job Dispatching** — Submit jobs with a JSON payload to any queue via UI or API
- **Automatic Job Processing** — Background worker polls every 5s and executes jobs
- **Retry Strategies** — Choose from Fixed, Linear, or Exponential backoff per job
- **Dead Letter Queue (DLQ)** — Jobs exceeding max retries land here for review
- **Queue Management** — Create, pause, resume, and delete queues per project
- **Project Isolation** — Organize queues under projects, each with its own API key

### Dashboard & Monitoring
- **Real-time Stats** — Total, queued, running, completed, failed, DLQ counts
- **Charts** — Job throughput, queue distribution, worker utilization, failure rate
- **Activity Feed** — Live event log on the dashboard
- **Worker Monitor** — See online workers, their status, and running job counts
- **Execution Logs** — Terminal-style log viewer with INFO / WARN / ERROR / DEBUG filters

### Auth & Security
- **JWT Authentication** — Secure login with Bearer tokens (8-day expiry)
- **Per-user Data Isolation** — Each user only sees their own projects, queues, and jobs
- **Password Hashing** — bcrypt via passlib

### Developer Experience
- **OpenAPI Docs** — Auto-generated at `http://localhost:8000/api/openapi.json`
- **Alembic Migrations** — Schema versioning built in
- **Async All the Way** — FastAPI + SQLAlchemy async for non-blocking I/O

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS v4, Recharts, React Router v7 |
| Backend | FastAPI, SQLAlchemy (async), Alembic, Pydantic v2 |
| Auth | JWT (python-jose), bcrypt (passlib) |
| Database | SQLite (dev) / PostgreSQL (prod via `asyncpg`) |
| Worker | Asyncio-based in-process job runner |

---

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- Git

---

### Backend Setup

```bash
# 1. Navigate to the backend
cd backend

# 2. Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run database migrations
alembic upgrade head

# 5. Start the server
uvicorn app.main:app --reload
```

Backend runs at **http://localhost:8000**

API docs at **http://localhost:8000/api/openapi.json**

---

### Frontend Setup

```bash
# 1. Navigate to the frontend
cd frontend

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Edit .env — set VITE_API_BASE_URL=http://localhost:8000 for local dev

# 4. Start the dev server
npm run dev
```

Frontend runs at **http://localhost:5205**

---

### Environment Variables

**Frontend (`frontend/.env`)**

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | URL of your FastAPI backend | `http://localhost:8000` |

**Backend (`backend/.env`)**

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | SQLAlchemy async DB URL | `sqlite+aiosqlite:///./queueflow.db` |
| `SECRET_KEY` | JWT signing secret — change in prod! | `YOUR_SUPER_SECRET_KEY_HERE` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Token lifetime | `11520` (8 days) |

---

## Deploying to Vercel (Frontend)

The frontend is a standard Vite + React SPA, fully compatible with Vercel.

```bash
# From the frontend directory
npm run build
```

Or connect your GitHub repo to Vercel and set:

- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variable**: `VITE_API_BASE_URL` → your backend URL (see below)

> The `vercel.json` file is already included to handle client-side routing rewrites.

---

## Deploying the Backend

The backend needs a persistent server (not serverless) because of the async job worker. Recommended options:

| Platform | Notes |
|----------|-------|
| [Railway](https://railway.app) | Free tier, easy GitHub deploy, supports PostgreSQL add-on |
| [Render](https://render.com) | Free tier web service, sleeps after inactivity |
| [Fly.io](https://fly.io) | Fast, global, always-on free tier |

### Backup Plan — If Your Backend Goes Down

The frontend degrades gracefully:
- Dashboard shows **zero stats** with a warning instead of crashing
- Workers page shows **demo workers** as fallback
- All pages show empty states with clear messages — no white screens of death
- Auth errors return users to login without app crashes

For long-term reliability (the "1 year later" scenario), deploy with:
1. **PostgreSQL** instead of SQLite — change `DATABASE_URL` to `postgresql+asyncpg://...`
2. A platform that **doesn't sleep** (Railway or Fly.io paid tier)
3. Set a **strong `SECRET_KEY`** — the default is not safe for production

---

## Project Structure

```
QueueFlow/
├── backend/
│   ├── app/
│   │   ├── auth/          # JWT deps, security helpers
│   │   ├── config/        # Settings, DB engine
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── routes/        # FastAPI routers (auth, projects, queues, jobs, stats, workers, logs, dlq)
│   │   ├── schemas/       # Pydantic request/response models
│   │   ├── workers/       # Async job runner
│   │   └── main.py        # App entry point, CORS, lifespan
│   ├── alembic/           # DB migration scripts
│   └── requirements.txt
│
└── frontend/
    ├── src/
    │   ├── components/    # Reusable UI components
    │   ├── context/       # AuthContext (JWT state)
    │   ├── layouts/       # MainLayout (sidebar + navbar)
    │   ├── pages/         # All route pages
    │   └── services/      # Axios API client
    ├── vercel.json        # SPA routing rewrite rule
    └── .env.example       # Environment variable template
```

---

## API Reference

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Login, get JWT token |
| `GET`  | `/api/auth/me` | Get current user |
| `GET`  | `/api/projects/` | List projects |
| `POST` | `/api/projects/` | Create project |
| `DELETE` | `/api/projects/{id}` | Delete project |
| `GET`  | `/api/queues/?project_id=` | List queues |
| `POST` | `/api/queues/` | Create queue |
| `PATCH` | `/api/queues/{id}/pause` | Pause queue |
| `PATCH` | `/api/queues/{id}/resume` | Resume queue |
| `DELETE` | `/api/queues/{id}` | Delete queue |
| `GET`  | `/api/jobs/?queue_id=` | List jobs |
| `POST` | `/api/jobs/` | Dispatch job |
| `PATCH` | `/api/jobs/{id}/cancel` | Cancel job |
| `PATCH` | `/api/jobs/{id}/retry` | Retry failed job |
| `GET`  | `/api/stats/` | Dashboard stats |
| `GET`  | `/api/workers/` | List workers |
| `GET`  | `/api/logs/?job_id=` | Job execution logs |
| `GET`  | `/api/dlq/` | Dead letter queue |
| `POST` | `/api/dlq/{id}/retry` | Re-queue DLQ job |
| `DELETE` | `/api/dlq/{id}` | Delete DLQ entry |

---

## Future Plans

- [ ] **Priority Queues** — High / Normal / Low priority lanes per queue
- [ ] **Job Scheduling** — Cron-style recurring job support (`0 */6 * * *`)
- [ ] **Webhook Callbacks** — POST to a URL when a job completes or fails
- [ ] **Multi-worker Scaling** — Horizontal scaling with Redis-backed queue and distributed locking
- [ ] **Real-time WebSocket Updates** — Push live job status changes to the dashboard
- [ ] **Rate Limiting per Queue** — Throttle job execution (e.g., max 10 jobs/min)
- [ ] **Team / Organization Support** — Invite members, role-based access control
- [ ] **Job Dependencies** — Chain jobs so Job B only runs after Job A completes
- [ ] **PostgreSQL Support** — Production-ready database with full migration support
- [ ] **Metrics Export** — Prometheus-compatible `/metrics` endpoint
- [ ] **Mobile-Responsive UI** — Optimized layouts for tablet and mobile
- [ ] **Dark / Light Mode Toggle** — User preference persistence
- [ ] **CLI Tool** — `queueflow dispatch --queue my-queue --payload '{}'`

---

## Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT License — free to use, modify, and distribute.

---

## Author

Built with care by **karanstark**

> "Write clean queues. Ship clean jobs."

---

*Made with FastAPI, React, and a lot of async/await.*
