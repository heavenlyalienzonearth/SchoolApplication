from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, settings as api_settings, content, submissions

app = FastAPI(
    title="School Application API",
    description="Backend services for dynamic and configurable school application",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(api_settings.router, prefix="/api/v1")
app.include_router(content.router, prefix="/api/v1")
app.include_router(submissions.router, prefix="/api/v1")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "name": "School Application Core API",
        "version": "1.0.0"
    }
