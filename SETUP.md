# Environment Setup Guide

## Prerequisites
- Node.js 18+ (LTS recommended)
- npm
- Git

## Project Stack (current)
- Frontend: React + Vite (root project)
- Backend: Node.js + Express + TypeScript (`backend`)

## 1) Install dependencies

### Frontend (root)
```bash
npm install --legacy-peer-deps
```

### Backend
```bash
cd backend
npm install
cd ..
```

## 2) Run locally

### Terminal A — Backend (port 3001)
```bash
cd backend
npm run dev
```

### Terminal B — Frontend (port 5173)
```bash
cd ..
npm run dev -- --host 127.0.0.1
```

## 3) Verify services
- Frontend: `http://127.0.0.1:5173/`
- Backend health: `http://localhost:3001/health`

Expected backend response:
```json
{"status":"ok","message":"ML Tool Backend is running"}
```

## Notes
- Uploaded CSV files are saved under `backend/uploads/` at runtime.
- No Python/FastAPI setup is required for the current implementation.
