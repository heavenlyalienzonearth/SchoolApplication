import sys
from sqlalchemy import create_engine, text

backend_path = r"e:\AI_Applications\SchoolApplication\backend"
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.core.config import settings

def migrate():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Checking if student_id column exists in users table...")
        result = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'student_id'
        """)).fetchone()
        
        if not result:
            print("Adding student_id column to users table...")
            conn.execute(text("""
                ALTER TABLE users 
                ADD student_id INT NULL FOREIGN KEY REFERENCES students(id)
            """))
            conn.commit()
            print("Column student_id added successfully!")
        else:
            print("student_id column already exists in users table.")

if __name__ == "__main__":
    migrate()
