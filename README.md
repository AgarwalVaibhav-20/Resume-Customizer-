# AI Resume Customizer

A full-stack application that tailors resumes to specific job descriptions using Google Gemini AI.

## Architecture

This repository contains both the frontend and backend services:

- **`backend/`**: FastAPI (Python) backend providing PDF/DOCX resume parsing, Gemini AI customization, keyword analysis, and score calculation.
- **`next-app/`**: Next.js 15 (React, TypeScript, Tailwind CSS) frontend featuring drag-and-drop resume upload, job description input, and tailored resume preview.

---

## Getting Started

### 1. Backend Setup (FastAPI)

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Open .env and add your GEMINI_API_KEY

# Start backend server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup (Next.js)

```bash
cd next-app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Security & Ignored Files

All sensitive and bulky files are excluded from Git via `.gitignore`:
- `.env` files (API keys and credentials)
- `node_modules/`
- Python `venv/`, `.venv/`, and `__pycache__/`
- Next.js build artifacts (`.next/`, `out/`, `build/`)
