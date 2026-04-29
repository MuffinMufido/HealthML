# HealthML — ML Clinical Visualizer

HealthML is an educational web app for demonstrating an end-to-end clinical ML workflow.
The interface follows a 7-step pipeline with working implementations for:
- Step 1: Clinical Context
- Step 2: Data Exploration
- Step 3: Data Preparation
- Step 4: Model & Parameters
- Step 5: Results
- Step 6: Explainability
- Step 7: Ethics & Bias

## Tech Stack (current implementation)
- Frontend: React + Vite + TypeScript
- Backend API: Node.js + Express + TypeScript
- ML Service: Python + FastAPI + scikit-learn

## Run Locally

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm
- Python 3.10+
- pip

### 1) Install dependencies
```bash
# root (frontend)
npm install --legacy-peer-deps

# backend
cd backend
npm install

# ml service
cd ml
python -m pip install -r requirements.txt
cd ../..
```

### 2) Start backend API (Terminal A)
```bash
cd backend
npm run dev
```

### 3) Start frontend (Terminal B)
```bash
npm run dev -- --host 127.0.0.1
```

### 4) Start ML service (Terminal C)
```bash
cd backend/ml
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### 5) Open app
- Frontend: `http://127.0.0.1:5173/`
- Backend health: `http://localhost:3001/health`
- ML health: `http://127.0.0.1:8000/health`

Expected backend health response:
```json
{"status":"ok","message":"ML Tool Backend is running"}
```

Expected ML health response:
```json
{"status":"ok","message":"HealthML Python ML service running"}
```

## Test
Run end-to-end tests:
```bash
npm run test:e2e -- --reporter=line
```

## Live Deployment
- Public IP: `http://35.190.207.2/`
- Live URL: http://www.healthml.com.tr/  


## Key Project Paths
- Frontend app: `app/`
- Backend API: `backend/src/`
- ML service: `backend/ml/`
- Sprint 5 deliverables: `Sprint 5 deliveries/`
- Project wiki clone (local): `HealthML.wiki/`

## Notes
- CSV uploads are stored at runtime in `backend/uploads/`.
- For full setup instructions, see `SETUP.md`.

## License
Educational use only.
