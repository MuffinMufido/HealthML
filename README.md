# ML Visualization Tool for Healthcare Professionals

## Overview
[cite_start]The ML Visualization Tool helps doctors, nurses, and other healthcare professionals understand how artificial intelligence and machine learning work in real clinical settings[cite: 7]. [cite_start]The application runs entirely in the web browser, requiring no technical background, installation, or coding[cite: 5]. [cite_start]Users work through seven guided steps ranging from choosing a medical specialty to uploading patient data, training a model, and interpreting the results[cite: 8].

## Clinical Context
[cite_start]The tool supports 20 clinical specialties[cite: 16]. [cite_start]The ML engine implements six model types: K-Nearest Neighbors, Support Vector Machine, Decision Tree, Random Forest, Logistic Regression, and Naive Bayes[cite: 78].

## Tech Stack
| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite | Browser-based UI (stepper, sliders, charts) |
| **Backend** | FastAPI | REST API endpoints for training and prediction |
| **ML Engine** | scikit-learn | Algorithm implementations |
| **Documentation** | GitHub Wiki | Architecture decisions and sprint notes |

## Repository Structure

```
health-ai-ml-learning-tool/
├── .github/
│   └── workflows/              # CI/CD pipelines (Lighthouse, accessibility checks)
├── frontend/                   # React 18 + Vite application
│   ├── public/
│   ├── src/
│   │   ├── components/         # UI components (stepper, sliders, matrix)
│   │   ├── pages/              # 7-step journey views
│   │   ├── services/           # API integration calls
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/                    # FastAPI application
│   ├── app/
│   │   ├── api/                # REST API endpoints
│   │   ├── ml_models/          # scikit-learn implementations
│   │   ├── preprocessing/      # Data cleaning and SMOTE logic
│   │   └── main.py
│   ├── tests/
│   └── requirements.txt
├── docs/                       # Project documentation
│   ├── architecture/
│   └── testing/                # Usability testing PDFs
├── README.md
└── SETUP.md
```

