import sys
import os
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
        # Check if holidays table exists
        print("Checking if 'holidays' table exists...")
        table_exists = conn.execute(text("""
            SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'holidays'
        """)).fetchone()
        
        if not table_exists:
            print("Table 'holidays' does not exist.")
            return
            
        # Check if image_url column exists in holidays
        print("Checking if 'image_url' column exists in 'holidays' table...")
        column_exists = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'holidays' AND COLUMN_NAME = 'image_url'
        """)).fetchone()
        
        if not column_exists:
            print("Adding 'image_url' column to 'holidays' table...")
            conn.execute(text("""
                ALTER TABLE holidays ADD image_url VARCHAR(500) NULL;
            """))
            conn.commit()
            print("Column 'image_url' added successfully.")
        else:
            print("Column 'image_url' already exists.")
            
        conn.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
