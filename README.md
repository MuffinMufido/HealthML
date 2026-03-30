# HealthML — ML Clinical Visualizer

HealthML is an educational web app for demonstrating an end-to-end clinical ML workflow.
The interface follows a 7-step pipeline and currently includes working implementations for:
- Step 1-3 (Clinical Context, Data Exploration, Data Preparation)
- Step 4-5 (Model & Parameters, Results)

## Tech Stack (current implementation)
- Frontend: React + Vite + TypeScript
- Backend: Node.js + Express + TypeScript

## Run Locally

### Prerequisites
- Node.js 18+ (LTS recommended)
- npm

### 1) Install dependencies
```bash
# root (frontend)
npm install --legacy-peer-deps

# backend
cd backend
npm install
cd ..
```

### 2) Start backend (Terminal A)
```bash
cd backend
npm run dev
```

### 3) Start frontend (Terminal B)
```bash
cd ..
npm run dev -- --host 127.0.0.1
```

### 4) Open app
- Frontend: `http://127.0.0.1:5173/`
- Backend health: `http://localhost:3001/health`

Expected backend health response:
```json
{"status":"ok","message":"ML Tool Backend is running"}
```

## Key Project Paths
- Frontend app: `app/`
- Backend API: `backend/src/`
- Sprint 3 evidence: `Sprint 3/evidence/`
- Sprint 3 report: `Sprint 3/Sprint3_Screenshot_Report.pdf`

## Notes
- CSV uploads are stored at runtime in `backend/uploads/`.
- For full setup instructions, see `SETUP.md`.

## License
Educational use only.
