
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
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/")
async def root():
    return {
        "message": "AI Resume Customizer API",
        "docs": "/docs",
        "health": "/api/v1/health",
    }
