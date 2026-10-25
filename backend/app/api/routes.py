
import asyncio
import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import ValidationError

from app.core.config import settings
from app.parsers.resume_parser import extract_resume_text
from app.schemas.resume import ResumeCustomizationResponse
from app.services.ai_service import customize_resume


router = APIRouter(prefix="/api/v1")
logger = logging.getLogger(__name__)

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MIN_JD_LENGTH = 50
MAX_JD_LENGTH = 20_000
MAX_RESUME_TEXT_LENGTH = 40_000


@router.get("/health")
async def health_check():
    return {"status": "ok", "service": "resume-customizer-api"}


@router.post(
    "/customize",
    response_model=ResumeCustomizationResponse,
)
async def customize(
    job_description: str = Form(...),
    file: UploadFile = File(...),
):
    job_description = job_description.strip()

    if len(job_description) < MIN_JD_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"Job description must contain at least {MIN_JD_LENGTH} characters.",
        )

    if len(job_description) > MAX_JD_LENGTH:
        raise HTTPException(
            status_code=422,
            detail="Job description is too long.",
        )

    filename = file.filename or ""
    extension = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail="Upload a PDF or DOCX resume.",
        )

    try:
        content = await file.read(settings.max_upload_bytes + 1)
    finally:
        await file.close()

    if not content:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")

    if len(content) > settings.max_upload_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Resume must be smaller than {settings.MAX_UPLOAD_SIZE_MB} MB.",
        )

    try:
        resume_text = await asyncio.to_thread(
            extract_resume_text, filename, content
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    if len(resume_text) > MAX_RESUME_TEXT_LENGTH:
        raise HTTPException(
            status_code=413,
            detail="The extracted resume text is too long.",
        )

    try:
        return await customize_resume(job_description, resume_text)
    except ValidationError as exc:
        logger.exception("Invalid AI response schema")
        raise HTTPException(
            status_code=502,
            detail="The AI response could not be validated. Please try again.",
        ) from exc
    except Exception as exc:
        logger.exception("Resume customization failed")
        raise HTTPException(
            status_code=502,
            detail="Resume customization failed. Please try again later.",
        ) from exc
