# HealthML — Interactive Clinical Machine Learning Visualization Tool

HealthML is an educational web application that allows users to explore and understand machine learning workflows applied to clinical datasets. The system guides users through a 7-step ML pipeline while supporting 20 different clinical domains and multiple machine learning algorithms.

This project is developed as part of the **B-SENG-430 Software Engineering course** using Scrum methodology with 5 sprints.

---

## Project Goals

The goal of the system is to help healthcare students and professionals understand how machine learning models are trained, evaluated, and interpreted in clinical contexts.

Users can:

• Select a clinical domain  
• Upload or explore datasets  
• Prepare and clean data  
• Train ML models  
• Evaluate model performance  
• Understand model decisions  
• Analyze ethical and bias considerations  

---

## ML Pipeline (7 Steps)

1. Clinical Context Selection  
2. Data Exploration  
3. Data Preparation  
4. Model & Parameters  
5. Results & Metrics  
6. Explainability  
7. Ethics & Bias  

---

## Supported Machine Learning Models

The system will support the following models:

• K-Nearest Neighbors (KNN)  
• Support Vector Machine (SVM)  
• Decision Tree  
• Random Forest  
• Logistic Regression  
• Naive Bayes  

---

## Tech Stack

Frontend  
• React  
• Vite  
• TypeScript  

Backend  
• Node.js (TypeScript)

Machine Learning  
• scikit-learn  
• pandas  
• numpy  

Project Tools  
• Jira (Scrum backlog & sprint management)  
• Figma (UI / UX wireframes)  
• GitHub (version control)  

---

## Sprint 1 Deliverables

Sprint 1 focuses on **Foundation & Design**.

Deliverables:

• Jira backlog with 20+ user stories  
• System architecture diagram  
• Figma wireframes for all 7 pipeline steps  
• Domain coverage plan for 20 clinical datasets  
• GitHub repository structure  

Relevant documentation can be found in the **docs** directory.

---

## Repository Structure

```
HealthML/

README.md
SETUP.md
.gitignore
LICENSE

/docs
    /architecture
        architecture_drawio.pdf

    /domain-coverage
        domain-coverage-plan.md

    /wireframes
        figma-links.md

    /api
        api-contract.md

    /meetings
        week1-meeting-notes.md
        decisions-log.md

    /backlog-traceability
        jira-traceability.md

/frontend
    README.md
    package.json
    vite.config.ts
    tsconfig.json

    /src
        main.tsx
        App.tsx

        /pages
            Step1ClinicalContext.tsx
            Step2DataUpload.tsx
            Step3DataPrep.tsx

        /components
            DomainPillBar.tsx
            Stepper.tsx
            Layout.tsx

        /types
            index.ts

/backend
    README.md
    requirements.txt

    /app
        main.py

        /api
            routes_health.py
            routes_domain.py
            routes_upload.py

        /core
            config.py

        /services
            csv_validator.py
            storage.py

/.github

    PULL_REQUEST_TEMPLATE.md

    /ISSUE_TEMPLATE
        user-story.md
        task.md

    /workflows
        ci.yml
```

---

## Architecture Overview

The system follows a layered architecture:

Frontend  
React application responsible for UI, data visualization, and user interaction.

Backend  
FastAPI service responsible for data validation, preprocessing, and model execution.

ML Layer  
Machine learning models implemented with scikit-learn.

Data Flow

User → React UI → FastAPI API → ML Models → Results → UI Visualization

---

## Setup

### Run locally (current implementation: steps 1–3)

#### Requirements
- **Node.js** (recommended: LTS)

#### Run the backend (port 3001)
```bash
cd backend
npm install
npm run dev
```

#### Run the frontend (port 5173)
```bash
cd ..
npm install --legacy-peer-deps
npm run dev
```

Open `http://localhost:5173/`.

#### Notes
- Backend API runs at `http://localhost:3001/`.
- Uploaded files are stored under `backend/uploads/` (generated at runtime; not committed).

### Setup doc

To run the project locally see:

SETUP.md

---

## License

This project is distributed for educational purposes.
