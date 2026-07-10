import sys
from sqlalchemy import create_engine, text

# Append the absolute path of the backend directory
backend_path = r"e:\AI_Applications\SchoolApplication\backend"
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.core.config import settings

def migrate():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Checking columns in 'users' table...")
        
        # Check two_factor_secret
        secret_exists = conn.execute(text("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'two_factor_secret'
        """)).fetchone()
        
        if not secret_exists:
            print("Adding 'two_factor_secret' column...")
            conn.execute(text("ALTER TABLE users ADD two_factor_secret VARCHAR(100) NULL"))
            print("Added 'two_factor_secret'.")
        else:
            print("'two_factor_secret' column already exists.")
            
        # Check two_factor_enabled
        enabled_exists = conn.execute(text("""
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'two_factor_enabled'
        """)).fetchone()
        
        if not enabled_exists:
            print("Adding 'two_factor_enabled' column...")
            conn.execute(text("ALTER TABLE users ADD two_factor_enabled BIT NOT NULL DEFAULT 0"))
            print("Added 'two_factor_enabled'.")
        else:
            print("'two_factor_enabled' column already exists.")
            
        conn.commit()
        print("2FA Database Migration complete!")

if __name__ == "__main__":
    migrate()
