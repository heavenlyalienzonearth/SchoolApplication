from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, settings as api_settings, content, submissions, chatbot

from fastapi.staticfiles import StaticFiles
import os

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
app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["Chatbot"])

# Mount static assets folder
assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "assets"))
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
else:
    print(f"Warning: assets directory not found at {assets_dir}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "name": "School Application Core API",
        "version": "1.0.0"
    }
