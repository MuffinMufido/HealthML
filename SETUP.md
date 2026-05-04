# HealthML — Environment Setup Guide

Complete setup instructions for running HealthML locally or via Docker.
Project by Group: KaraKartallar

---

## Prerequisites

| Requirement | Version | Check Command |
|------------|---------|---------------|
| Node.js | 18+ (LTS) | `node -v` |
| npm | 9+ | `npm -v` |
| Python | 3.10+ | `python --version` |
| pip | 22+ | `pip --version` |
| Git | any | `git --version` |
| Docker *(optional)* | 24+ | `docker --version` |

---

## Option A — Run Locally (3 terminals)

### Step 1: Clone the repository

```bash
git clone https://github.com/MuffinMufido/HealthML.git
cd HealthML
```

### Step 2: Install dependencies

```bash
# Frontend (root directory)
npm install --legacy-peer-deps

# Backend API
cd backend
npm install
cd ..

# ML Service (Python)
cd backend/ml
pip install -r requirements.txt
cd ../..
```

### Step 3: Start the ML Service (Terminal A)

```bash
cd backend/ml
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Wait until you see:

```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

Verify: <http://127.0.0.1:8000/health>

```json
{"status":"ok","message":"HealthML Python ML service running"}
```

### Step 4: Start the Backend API (Terminal B)

```bash
cd backend
npm run dev
```

Wait until you see:

```
Server is running on port 3001
```

Verify: <http://localhost:3001/health>

```json
{"status":"ok","message":"ML Tool Backend is running"}
```

### Step 5: Start the Frontend (Terminal C)

```bash
npm run dev -- --host 127.0.0.1
```

Wait until you see:

```
  VITE v8.x.x  ready in XXX ms

  ➜  Local:   http://127.0.0.1:5173/
```

### Step 6: Open the app

Navigate to <http://127.0.0.1:5173/> in your browser.

> **Start order matters:** ML Service → Backend → Frontend.  
> The backend proxies requests to the ML service, and the frontend proxies `/api/*` to the backend via Vite.

---

## Option B — Run with Docker (single command)

Docker Compose starts all three services (ML, Backend, Frontend+Nginx) automatically.

### Step 1: Build and run

```bash
docker-compose up --build
```

First build takes 3–5 minutes (downloading dependencies). Subsequent starts are faster.

### Step 2: Open the app

Navigate to <http://localhost/> — Nginx serves the frontend on port 80 and proxies `/api/*` to the backend.

### Stop the services

```bash
docker-compose down
```

---

## Service Ports

| Service | Local Port | Docker Internal | Health Check |
|---------|-----------|-----------------|--------------|
| Frontend | 5173 (Vite dev) | 80 (Nginx) | Open in browser |
| Backend API | 3001 | 3001 | `GET /health` |
| ML Service | 8000 | 8000 | `GET /health` |

---

## Project Structure

```
HealthML/
├── app/                  # React frontend source code
│   ├── components/
│   │   ├── steps/        # 7 pipeline step components
│   │   ├── ui/           # shadcn/ui component library
│   │   ├── MLContext.tsx  # Global state management
│   │   └── StepLayout.tsx # Navigation shell
│   ├── App.tsx           # Root component
│   └── main.tsx          # Entry point
├── backend/
│   ├── src/              # Express API (TypeScript)
│   │   ├── index.ts      # Server entry
│   │   └── routes/       # dataset.ts, ml.ts
│   └── ml/
│       ├── main.py       # FastAPI ML service
│       └── requirements.txt
├── styles/               # TailwindCSS + theme tokens
├── tests/e2e/            # Playwright tests
├── docker-compose.yml    # 3-service orchestration
├── Dockerfile.frontend   # Multi-stage: Node build → Nginx
├── Dockerfile.backend    # Multi-stage: TS compile → Node runtime
├── Dockerfile.ml         # Python 3.11 + scikit-learn
├── nginx.conf            # Reverse proxy (frontend + /api/)
├── vite.config.ts        # Vite config with /api proxy
├── package.json          # Frontend dependencies
└── index.html            # HTML entry point
```

---

## Common Issues

### "ML service unavailable" in the app

The backend cannot reach the ML service. Make sure:

1. The ML service is running on port 8000
2. You started it **before** the backend
3. Check `http://127.0.0.1:8000/health`

### "SMOTE skipped" warning

SMOTE requires at least 2 samples of the minority class and ≥ 2 classes. If your dataset is too small or has only one class, SMOTE is automatically skipped.

### CSV upload fails

- File must be `.csv` format
- Must have at least 10 rows
- Must have at least one numeric column
- Maximum file size: 50 MB

### Docker build fails

- Ensure Docker Desktop is running
- Run `docker-compose down` first to clean up
- Try `docker-compose build --no-cache` for a fresh build

---

## Running E2E Tests

```bash
# Make sure all 3 services are running first, then:
npx playwright test --reporter=line
```

---

## Environment Variables

| Variable | Default | Used By | Description |
|----------|---------|---------|-------------|
| `PORT` | `3001` | Backend | Express server port |
| `ML_HOST` | `localhost` | Backend | ML service hostname (set to `ml` in Docker) |

---

## Useful Links

| Resource | URL |
|----------|-----|
| Live App | <http://www.healthml.com.tr/> |
| GitHub | <https://github.com/MuffinMufido/HealthML> |
| Wiki | <https://github.com/MuffinMufido/HealthML/wiki> |
| Jira | <https://techmufido.atlassian.net/jira/software/projects/HCML/boards/37> |
| Figma | <https://www.figma.com/community/file/1610750429482770416> |
