import json
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    API_PORT: int = 8000
    API_HOST: str = "127.0.0.1"
    CORS_ORIGINS: str = '["http://localhost:4200", "http://127.0.0.1:4200", "http://localhost", "https://localhost", "http://200.97.168.156", "https://200.97.168.156", "http://deepfusion.cloud", "https://deepfusion.cloud", "http://www.deepfusion.cloud", "https://www.deepfusion.cloud"]'
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    # School Identity & Branding
    SCHOOL_NAME: str = "Vidyankuram"
    SCHOOL_SHORT_NAME: str = "Kangaroo Kids"

    # School Contact Information
    SCHOOL_CONTACT_EMAIL: str = "admissions@school.com"
    SCHOOL_CONTACT_PHONE: str = "1800-210-6868"
    SCHOOL_ADMISSIONS_EMAIL: str = "admissions@kangarookids.com"
    SCHOOL_NOREPLY_EMAIL: str = "noreply@kangarookids.com"
    SCHOOL_CIRCULARS_EMAIL: str = "circulars@vidyankuram.edu"
    SCHOOL_PRINTSHOP_EMAIL: str = "printshop@schoolcards.com"

    # Super Admin Seed Credentials
    SUPERADMIN_EMAIL: str = "superadmin@school.com"
    SUPERADMIN_PASSWORD: str = "superadmin@123"

    # 2FA Issuer Name
    TWO_FA_ISSUER_NAME: str = "Vidyankuram School"

    # TTS Voice Configuration
    TTS_VOICE_NAME: str = "en-IN-NeerjaExpressiveNeural"
    TTS_FALLBACK_LANG: str = "en"
    TTS_FALLBACK_TLD: str = "co.in"

    # File Upload Limits
    MAX_UPLOAD_SIZE_MB: int = 100

    # Student Moments Retention
    MOMENTS_RETENTION_DAYS: int = 2

    # Production Environment Detection
    PRODUCTION_DB_HOST: str = "200.97.168.156"
    PRODUCTION_DOMAIN: str = "deepfusion.cloud"

    # Frontend Portal URL (used in reset password links)
    FRONTEND_URL: str = "http://localhost:4200"

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["http://localhost:4200", "http://127.0.0.1:4200"]
            
        raw = self.CORS_ORIGINS.strip()
        
        # 1. Parse JSON list format (e.g. ["http://a.com", "http://b.com"])
        if raw.startswith("[") and raw.endswith("]"):
            try:
                origins = json.loads(raw)
                if isinstance(origins, list):
                    return [o.strip().rstrip("/") for o in origins if o.strip() and o.strip() != "*"]
            except Exception:
                pass
                
        # 2. Parse comma-separated lists (e.g. "http://a.com, http://b.com")
        if "," in raw:
            return [o.strip().rstrip("/") for o in raw.split(",") if o.strip() and o.strip() != "*"]
            
        # 3. Single value
        if raw == "*":
            return []
        return [raw.rstrip("/")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
