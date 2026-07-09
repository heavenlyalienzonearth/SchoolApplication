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
        # Create holidays table if not exists
        print("Checking if 'holidays' table exists...")
        table_exists = conn.execute(text("""
            SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'holidays'
        """)).fetchone()
        
        if not table_exists:
            print("Creating 'holidays' table...")
            create_table_sql = """
            CREATE TABLE holidays (
                id INT IDENTITY(1,1) PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT NULL,
                holiday_date VARCHAR(50) NOT NULL,
                year INT NOT NULL,
                is_active BIT NOT NULL DEFAULT 1,
                created_at DATETIME NOT NULL DEFAULT GETDATE()
            );
            """
            conn.execute(text(create_table_sql))
            conn.commit()
            print("Table 'holidays' created successfully.")
        else:
            print("Table 'holidays' already exists.")

        # Seed holidays for 2026
        print("Seeding default 2026 holidays...")
        holidays_to_seed = [
            ("New Year's Day", "Beginning of the year celebration", "2026-01-01", 2026),
            ("Republic Day", "National holiday of India", "2026-01-26", 2026),
            ("Maha Shivratri", "Hindu festival dedicated to Lord Shiva", "2026-02-15", 2026),
            ("Ugadi", "Karnataka New Year Festival", "2026-03-19", 2026),
            ("Good Friday", "Christian religious holiday", "2026-04-03", 2026),
            ("Labor Day", "International Workers' Day", "2026-05-01", 2026),
            ("Bakrid / Eid al-Adha", "Islamic festival", "2026-05-28", 2026),
            ("Independence Day", "Celebrating national freedom", "2026-08-15", 2026),
            ("Ganesh Chaturthi", "Festival honoring Lord Ganesha", "2026-09-15", 2026),
            ("Gandhi Jayanti", "Birthday of Mahatma Gandhi", "2026-10-02", 2026),
            ("Kannada Rajyotsava", "Karnataka State Formation Day", "2026-11-01", 2026),
            ("Christmas Day", "Celebrating the birth of Jesus Christ", "2026-12-25", 2026)
        ]
        
        for title, desc, h_date, year in holidays_to_seed:
            exists = conn.execute(text(
                "SELECT id FROM holidays WHERE title = :title AND holiday_date = :h_date"
            ), {"title": title, "h_date": h_date}).fetchone()
            
            if not exists:
                conn.execute(text("""
                    INSERT INTO holidays (title, description, holiday_date, year, is_active)
                    VALUES (:title, :desc, :h_date, :year, 1)
                """), {"title": title, "desc": desc, "h_date": h_date, "year": year})
                print(f"Seeded holiday: {title} ({h_date})")
                
        conn.commit()
        print("Holidays seed complete.")

if __name__ == "__main__":
    migrate()
