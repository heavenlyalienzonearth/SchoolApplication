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
            print("Table 'holidays' does not exist! Running full holidays table migration first.")
            from migrate_holidays import migrate as run_base_migration
            run_base_migration()
            
        # Check if category column exists in holidays
        print("Checking if 'category' column exists in 'holidays' table...")
        column_exists = conn.execute(text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'holidays' AND COLUMN_NAME = 'category'
        """)).fetchone()
        
        if not column_exists:
            print("Adding 'category' column to 'holidays' table...")
            conn.execute(text("""
                ALTER TABLE holidays ADD category VARCHAR(100) NULL DEFAULT 'National Holiday';
            """))
            conn.commit()
            print("Column 'category' added successfully.")
        else:
            print("Column 'category' already exists.")

        # Update categories of default 2026 holidays
        print("Updating holiday categories and adding vacations...")
        category_updates = {
            "New Year's Day": "Public Event",
            "Republic Day": "National Holiday",
            "Maha Shivratri": "Religious Event",
            "Ugadi": "Religious Event",
            "Good Friday": "Religious Event",
            "Labor Day": "Public Event",
            "Bakrid / Eid al-Adha": "Religious Event",
            "Independence Day": "National Holiday",
            "Ganesh Chaturthi": "Religious Event",
            "Gandhi Jayanti": "National Holiday",
            "Kannada Rajyotsava": "Public Event",
            "Christmas Day": "Religious Event"
        }
        
        for title, category in category_updates.items():
            conn.execute(text("""
                UPDATE holidays 
                SET category = :category 
                WHERE title = :title
            """), {"category": category, "title": title})
        
        # Insert a couple of sample Vacation entries for 2026 if they do not exist
        vacations = [
            ("Summer Vacation", "Summer break for all standard classes", "2026-04-15", 2026, "Vacation"),
            ("Winter Break", "Winter holidays and Christmas recess", "2026-12-24", 2026, "Vacation")
        ]
        
        for title, desc, h_date, year, category in vacations:
            exists = conn.execute(text(
                "SELECT id FROM holidays WHERE title = :title AND holiday_date = :h_date"
            ), {"title": title, "h_date": h_date}).fetchone()
            
            if not exists:
                conn.execute(text("""
                    INSERT INTO holidays (title, description, holiday_date, year, category, is_active)
                    VALUES (:title, :desc, :h_date, :year, :category, 1)
                """), {"title": title, "desc": desc, "h_date": h_date, "year": year, "category": category})
                print(f"Added vacation entry: {title} ({h_date})")
                
        conn.commit()
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
