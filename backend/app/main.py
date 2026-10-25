
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import settings


logging.basicConfig(level=logging.INFO)

app = FastAPI(
    title="AI Resume Customizer API",
    description=(
        "Customize resumes against job descriptions using "
        "Python, FastAPI, and Gemini AI."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {
        "message": "AI Resume Customizer API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
