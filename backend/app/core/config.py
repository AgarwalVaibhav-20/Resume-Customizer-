
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-2.5-flash"
    FRONTEND_ORIGIN: str = "https://resume-customizer-k3jw.vercel.app"
    MAX_UPLOAD_SIZE_MB: int = 5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def max_upload_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def cors_origins(self) -> list[str]:
        if self.FRONTEND_ORIGIN == "*":
            return ["*"]
        origins: set[str] = set()
        for item in self.FRONTEND_ORIGIN.split(","):
            cleaned = item.strip().rstrip("/")
            if cleaned:
                origins.add(cleaned)
        origins.add("https://resume-customizer-k3jw.vercel.app")
        origins.add("http://localhost:3000")
        origins.add("http://127.0.0.1:3000")
        return list(origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
