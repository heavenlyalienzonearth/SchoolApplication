import os
import sys
import uvicorn
from app.core.config import settings

# Force UTF-8 output on Windows (fixes emoji UnicodeEncodeError in print statements)
os.environ.setdefault('PYTHONUTF8', '1')
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

if __name__ == "__main__":
    print(f"Starting server on http://{settings.API_HOST}:{settings.API_PORT}...")
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True
    )
