# Fart Steward

[中文版](../README.md)

A personal health tracking tool for recording and analyzing fart statistics. Built with React + Flask + SQLite + Docker.

## Features

- **Record fart events**: Track duration, type (loud, silent, continuous), smell level, temperature, and moisture
- **Daily statistics**: View daily fart counts and trends
- **Chart analysis**: Visualize your fart patterns over time (coming soon)
- **Web access**: Access from any device via browser
- **Self-hosted**: Deploy on your NAS using Docker

## Tech Stack

- **Frontend**: React + Vite (served by NGINX on port 80)
- **Backend**: Flask (port 5000)
- **Database**: SQLite (persistent via bind mount)
- **Deployment**: Docker + Docker Compose
- **E2E Testing**: Playwright

## Prerequisites

- Docker + Docker Compose (Docker Desktop works fine)

## Quick Start

1. Create a local env file:

```bash
cp .env.example .env
```

2. Build and start services:

```bash
docker-compose build --no-cache
docker-compose up -d
```

3. Verify services:

```bash
curl http://localhost:5000/api/health
curl http://localhost:80
```

Expected:
- `GET http://localhost:5000/api/health` returns `{"status":"ok"}`
- `GET http://localhost:80` returns the frontend HTML

## Architecture

- **Backend (Flask)**
  - Exposed: `localhost:5000`
  - Persists SQLite to `./data/app.db` via bind mount `./data:/app/data`
  - Health check: `GET /api/health`

- **Frontend (NGINX)**
  - Exposed: `localhost:80`
  - Serves compiled static files
  - Proxies `http://localhost:80/api/*` -> `http://backend:5000/api/*`

## Data Persistence

The backend uses `SQLITE_PATH` (default `/app/data/app.db`). The `docker-compose.yml` mounts `./data` into `/app/data`, so the database persists across restarts.

To verify persistence:

```bash
docker-compose restart
```

Your previously created records should still exist.

## Running E2E Tests (Playwright)

E2E tests live under `frontend/e2e` and run against the Docker stack.

1. Ensure the stack is running:

```bash
docker-compose up -d
```

2. Install test dependencies (once):

```bash
cd frontend
npm install
npx playwright install
```

3. Run tests:

```bash
cd frontend
npm run e2e
```

The test suite includes a desktop journey and a mobile viewport check.

## Documentation

- [API Reference](API.md)
- [Deployment Guide](DEPLOYMENT.md)
- [Architecture](ARCHITECTURE.md)

## Stop / Cleanup

```bash
docker-compose down
```

To remove persisted data:

```bash
rm -rf data
```

## Why Fart Steward?

Tracking your digestive health can provide valuable insights. If you notice unusual patterns, it might be time to consult a doctor. This tool helps you keep a personal record for your health awareness.

---

*Stay healthy, track responsibly.*
