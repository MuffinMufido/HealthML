# HealthML — ML Clinical Visualizer

> An educational web application that walks healthcare professionals and students through a complete **end-to-end clinical machine-learning pipeline** — from choosing a medical specialty to training a model, interpreting results, and auditing fairness.

| | |
|---|---|
| **Live URL** | <http://www.healthml.com.tr/> |
| **Public IP** | `35.190.207.2` |
| **Course** | SENG 430 — Software Quality Assurance Laboratory |
| **Group** | KaraKartallar |
| **Methodology** | Scrum · 5 Sprints · 10 Weeks |

---

## Features

- **7-step guided pipeline** — Clinical Context → Data Exploration → Data Preparation → Model & Parameters → Results → Explainability → Ethics & Bias
- **20 clinical domains** — Cardiology, Radiology, Nephrology, Oncology, Neurology, Endocrinology, Hepatology, Mental Health, Pulmonology, Haematology, Dermatology, Ophthalmology, Orthopaedics, ICU/Sepsis, Obstetrics, and more
- **6 ML models** — Logistic Regression, Decision Tree, Random Forest, SVM, KNN, Naive Bayes
- **Real scikit-learn training** — actual model fitting, not simulated
- **SMOTE** — synthetic minority oversampling on training data only
- **Ablation-based explainability** — per-patient waterfall explanations
- **Subgroup fairness audit** — gender and age-band bias detection (>10 pp threshold)
- **EU AI Act compliance checklist** — 8-item interactive checklist
- **PDF certificate generation** — downloadable model summary report
- **ML Glossary** — plain-language definitions for 20 key terms
- **Step access control** — blocks skipping steps without completing prerequisites
- **Responsive UI** — works on desktop and tablet

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Client Browser                     │
│              React 19 + Vite 8 + TailwindCSS 4          │
└────────────────────────┬────────────────────────────────┘
                         │ /api/*
┌────────────────────────▼────────────────────────────────┐
│                   Nginx (port 80)                       │
│            Static files + reverse proxy                 │
└────────────────────────┬────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────┐
│              Backend API (port 3001)                    │
│           Node.js + Express 5 + TypeScript              │
│    CSV upload · column mapping · ML service proxy       │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP
┌────────────────────────▼────────────────────────────────┐
│              ML Service (port 8000)                     │
│           Python 3.11 + FastAPI + scikit-learn           │
│  Training · Explainability · Fairness · Certificate     │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TypeScript, TailwindCSS 4, Recharts, Framer Motion, Radix UI (shadcn/ui) |
| Backend API | Node.js, Express 5, TypeScript, Multer (file upload), PapaParse (CSV) |
| ML Service | Python 3.11, FastAPI, scikit-learn, imbalanced-learn (SMOTE), pandas, numpy, fpdf2 |
| Deployment | Docker Compose (3 containers), Nginx, GCP Compute Engine |
| Testing | Playwright (E2E) |
| Project Management | Jira (Scrum), Figma (wireframes), GitHub Wiki |

---

## Clinical Domains (20)

| # | Domain | Clinical Problem | Target Variable |
|---|--------|-----------------|-----------------|
| 1 | Cardiology | 30-Day Readmission Risk | DEATH_EVENT |
| 2 | Radiology | Pneumonia Classification | Finding Label |
| 3 | Nephrology | Chronic Kidney Disease Stage | CKD / not CKD |
| 4 | Oncology — Breast | Breast Biopsy Malignancy | diagnosis (M/B) |
| 5 | Neurology | Parkinson's Disease Detection | status (0/1) |
| 6 | Endocrinology — Diabetes | Diabetes Onset Prediction | Outcome (0/1) |
| 7 | Hepatology | Liver Disease Detection | liver disease |
| 8 | Cardiology — Stroke | Stroke Risk Prediction | stroke (0/1) |
| 9 | Mental Health | Depression Severity | severity class |
| 10 | Pulmonology | COPD Exacerbation Risk | exacerbation |
| 11 | Haematology | Anaemia Type Classification | anemia_type |
| 12 | Dermatology | Skin Lesion Classification | dx_type |
| 13 | Ophthalmology | Diabetic Retinopathy Severity | severity grade |
| 14 | Orthopaedics | Disc Herniation Detection | Normal / Abnormal |
| 15 | ICU / Sepsis | Sepsis Onset Prediction | SepsisLabel |
| 16 | Obstetrics | Fetal Health Classification | fetal_health |
| 17 | Cardiology — Arrhythmia | Cardiac Arrhythmia Detection | arrhythmia (0/1) |
| 18 | Oncology — Cervical | Cervical Cancer Risk | Biopsy (0/1) |
| 19 | Endocrinology — Thyroid | Thyroid Function Classification | class (3 types) |
| 20 | Pharmacy | Hospital Readmission Risk | readmitted |

---

## Run Locally

> See [SETUP.md](SETUP.md) for full step-by-step instructions.

### Prerequisites

- Node.js 18+ (LTS)
- Python 3.10+
- npm, pip, Git

### Quick Start (3 terminals)

```bash
# 1 — Install all dependencies
npm install --legacy-peer-deps
cd backend && npm install && cd ..
cd backend/ml && pip install -r requirements.txt && cd ../..

# 2 — Terminal A: ML Service (port 8000)
cd backend/ml
python -m uvicorn main:app --host 127.0.0.1 --port 8000

# 3 — Terminal B: Backend API (port 3001)
cd backend
npm run dev

# 4 — Terminal C: Frontend (port 5173)
npm run dev -- --host 127.0.0.1
```

Open <http://127.0.0.1:5173/> in your browser.

### Run with Docker (single command)

```bash
docker-compose up --build
```

Open <http://localhost/> — all three services start automatically.

---

## API Reference

### Backend (Express — port 3001)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Backend health check |
| `POST` | `/api/dataset/upload` | Upload CSV (multipart, max 50 MB) |
| `POST` | `/api/dataset/:id/map-columns` | Save column type mappings |
| `POST` | `/api/dataset/:id/prepare` | Prepare data (proxy → ML service) |
| `POST` | `/api/dataset/train` | Train model (proxy → ML service) |
| `GET` | `/api/ml/explain?modelId=` | Feature importance + patient explanations |
| `GET` | `/api/ml/fairness?modelId=` | Subgroup fairness audit |
| `POST` | `/api/generate-certificate` | Generate PDF certificate |

### ML Service (FastAPI — port 8000)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | ML service health check |
| `POST` | `/prepare` | Missing values, normalize, split, SMOTE |
| `POST` | `/train` | Train model, return metrics + ROC |
| `GET` | `/explain?modelId=` | Global importance + patient waterfall |
| `GET` | `/fairness?modelId=` | Subgroup bias analysis |
| `POST` | `/generate-certificate` | Generate PDF (fpdf2) |

---

## Project Structure

```
HealthML/
├── app/                          # Frontend source
│   ├── App.tsx                   # Root component (MLProvider + StepRouter)
│   ├── main.tsx                  # Vite entry point
│   └── components/
│       ├── MLContext.tsx          # Global pipeline state (React Context)
│       ├── StepLayout.tsx        # Navigation shell + Glossary modal
│       ├── steps/                # 7 pipeline step components
│       │   ├── ClinicalContext.tsx
│       │   ├── DataExploration.tsx
│       │   ├── DataPreparation.tsx
│       │   ├── ModelParameters.tsx
│       │   ├── Results.tsx
│       │   ├── Explainability.tsx
│       │   └── EthicsBias.tsx
│       └── ui/                   # shadcn/ui component library (48 files)
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry
│   │   └── routes/
│   │       ├── dataset.ts        # Upload, mapping, prepare, train
│   │       └── ml.ts             # Explain, fairness, certificate proxy
│   └── ml/
│       ├── main.py               # FastAPI ML service (all endpoints)
│       └── requirements.txt      # Python dependencies
├── styles/                       # CSS (TailwindCSS + theme tokens)
├── tests/e2e/                    # Playwright E2E tests
├── docker-compose.yml            # 3-service orchestration
├── Dockerfile.frontend           # Multi-stage: build → Nginx
├── Dockerfile.backend            # Multi-stage: build → Node runtime
├── Dockerfile.ml                 # Python 3.11 + scikit-learn
├── nginx.conf                    # Reverse proxy config
└── vite.config.ts                # Vite + TailwindCSS + proxy config
```

---

## Testing

### E2E Tests (Playwright)

```bash
npx playwright test --reporter=line
```

### Health Checks

```bash
# Backend
curl http://localhost:3001/health
# → {"status":"ok","message":"ML Tool Backend is running"}

# ML Service
curl http://localhost:8000/health
# → {"status":"ok","message":"HealthML Python ML service running"}
```

---

## Project Links

| Resource | URL |
|----------|-----|
| Live Application | <http://www.healthml.com.tr/> |
| GitHub Repository | <https://github.com/MuffinMufido/HealthML> |
| GitHub Wiki | <https://github.com/MuffinMufido/HealthML/wiki> |
| Jira Board | <https://techmufido.atlassian.net/jira/software/projects/HCML/boards/37> |
| Figma Wireframes | <https://www.figma.com/community/file/1610750429482770416> |

---

## Sprint History

| Sprint | Weeks | Theme | Key Deliverables |
|--------|-------|-------|-----------------|
| 1 | 1–2 | Foundation & Design | Jira setup, architecture diagram, Figma wireframes |
| 2 | 3–4 | MVP (Steps 1–3) | Clinical context, CSV upload, data preparation |
| 3 | 5–6 | Core ML (Steps 4–5) | 6 model tabs, confusion matrix, metric cards |
| 4 | 7–8 | Full Pipeline (Steps 6–7) | Explainability, fairness audit, PDF certificate |
| 5 | 9–10 | Polish & Test | User testing, Docker deployment, performance tuning |

---

## Notes

- CSV uploads are stored at runtime in `backend/uploads/`.
- Trained models are kept in memory — restarting the ML service clears them.
- The application is for **educational purposes only** and must not be used for clinical decisions.

## License

Educational use only — SENG 430, Çankaya University. Group: KaraKartallar.
