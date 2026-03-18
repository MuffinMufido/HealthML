# Environment Setup Guide

## Prerequisites
* Node.js (v18 or higher)
* Python (3.10 or higher)
* Git

## 1. Backend Setup (FastAPI & scikit-learn)
1. Navigate to the backend directory: `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate the virtual environment:
   * Windows: `venv\Scripts\activate`
   * macOS/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Start the server: `uvicorn app.main:app --reload`
   * The API docs will be available at `http://localhost:8000/docs`.

## 2. Frontend Setup (React 18 & Vite)
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the development server: `npm run dev`
   * The browser-based UI will be available at `http://localhost:5173`.
