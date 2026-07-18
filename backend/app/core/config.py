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
    CORS_ORIGINS: str = '["http://localhost:4200"]'
    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["http://localhost:4200"]
            
        raw = self.CORS_ORIGINS.strip()
        
        # 1. Parse JSON list format (e.g. ["http://a.com", "http://b.com"])
        if raw.startswith("[") and raw.endswith("]"):
            try:
                origins = json.loads(raw)
                if isinstance(origins, list):
                    return [o.strip().rstrip("/") for o in origins if o.strip()]
            except Exception:
                pass
                
        # 2. Parse comma-separated lists (e.g. "http://a.com, http://b.com")
        if "," in raw:
            return [o.strip().rstrip("/") for o in raw.split(",") if o.strip()]
            
        # 3. Single value
        return [raw.rstrip("/")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
