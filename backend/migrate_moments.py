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
        print("Creating student_daily_moments table...")
        
        # Create student_daily_moments table
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='student_daily_moments' and xtype='U')
            BEGIN
                CREATE TABLE student_daily_moments (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    student_id INT NOT NULL FOREIGN KEY REFERENCES students(id) ON DELETE CASCADE,
                    teacher_id INT NOT NULL FOREIGN KEY REFERENCES users(id) ON DELETE CASCADE,
                    file_path VARCHAR(500) NOT NULL,
                    file_type VARCHAR(50) NOT NULL,
                    title VARCHAR(255) NULL,
                    created_at DATETIME NOT NULL DEFAULT GETDATE(),
                    expires_at DATETIME NOT NULL
                )
            END
        """))
        
        conn.commit()
        print("Table student_daily_moments created successfully.")

if __name__ == "__main__":
    migrate()
