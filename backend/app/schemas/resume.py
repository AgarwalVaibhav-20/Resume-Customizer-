
from pydantic import BaseModel, Field


class ResumeSection(BaseModel):
    heading: str
    content: str


class TailoredResume(BaseModel):
    full_name: str = ""
    professional_title: str = ""
    contact_info: list[str] = Field(default_factory=list)
    summary: str = ""
    skills: list[str] = Field(default_factory=list)
    experience: list[ResumeSection] = Field(default_factory=list)
    education: list[ResumeSection] = Field(default_factory=list)
    projects: list[ResumeSection] = Field(default_factory=list)
    certifications: list[str] = Field(default_factory=list)


class ResumeCustomizationResponse(BaseModel):
    success: bool = True
    resume: TailoredResume
    match_score: int = Field(ge=0, le=100)
    matched_keywords: list[str] = Field(default_factory=list)
    missing_keywords: list[str] = Field(default_factory=list)
    suggestions: list[str] = Field(default_factory=list)
    changes_made: list[str] = Field(default_factory=list)
