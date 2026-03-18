## ML Visualisation Tool (Steps 1–3)

### Requirements
- **Node.js** (recommended: LTS)

### Run the backend (port 3001)
```bash
cd backend
npm install
npm run dev
```

### Run the frontend (port 5173)
```bash
cd ..
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:5173/`.

### Notes
- Backend API runs at `http://localhost:3001/`.
- Uploaded files are stored under `backend/uploads/` (generated at runtime; not committed).
