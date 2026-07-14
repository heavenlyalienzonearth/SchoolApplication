import sys
import os
from sqlalchemy import create_engine, text
from datetime import datetime

# Append the absolute path of the backend directory
backend_path = r"e:\AI_Applications\SchoolApplication\backend"
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.core.config import settings

def migrate():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Checking if 'circulars' table exists...")
        table_exists = conn.execute(text("""
            SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'circulars'
        """)).fetchone()
        
        if not table_exists:
            print("Creating 'circulars' table...")
            # We use SET NULL on program_id so if a class/program is deleted, the circular becomes a general circular.
            conn.execute(text("""
                CREATE TABLE circulars (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    content TEXT NOT NULL,
                    program_id INT NULL FOREIGN KEY REFERENCES programs(id) ON DELETE SET NULL,
                    attachment_url VARCHAR(500) NULL,
                    is_active BIT NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT GETDATE()
                );
            """))
            conn.commit()
            print("Table 'circulars' created successfully.")
            
        # Check if circulars table is empty, if so, seed it
        circular_count = conn.execute(text("SELECT COUNT(*) FROM circulars")).scalar()
        if circular_count == 0:
            # Find program IDs to seed class-specific circulars
            programs = conn.execute(text("SELECT id, title FROM programs")).fetchall()
            print("Found programs:", programs)
            
            toddler_id = None
            kindergarten_id = None
            for p in programs:
                p_id, p_title = p[0], p[1]
                if "Toddler" in p_title:
                    toddler_id = p_id
                elif "Kindergarten" in p_title or "Kangaroo" in p_title or "Vidyankuram" in p_title:
                    kindergarten_id = p_id
                    
            if not toddler_id and len(programs) > 0:
                toddler_id = programs[0][0]
            if not kindergarten_id and len(programs) > 1:
                kindergarten_id = programs[1][0]
                
            print(f"Seeding initial circulars (Toddler ID: {toddler_id}, Kindergarten ID: {kindergarten_id})...")
            
            # Seed 1: School-wide circular
            conn.execute(text("""
                INSERT INTO circulars (title, content, program_id, attachment_url, is_active, created_at)
                VALUES (
                    'Vidyankuram Uniform & Welcome Kits Distribution',
                    'Dear Parents, we are pleased to announce that school uniforms and academic welcome kits are ready for pickup. Please collect them from the administrative office on weekdays between 9:00 AM and 2:00 PM.',
                    NULL,
                    NULL,
                    1,
                    GETDATE()
                );
            """))
            
            # Seed 2: Toddler specific
            if toddler_id:
                conn.execute(text(f"""
                    INSERT INTO circulars (title, content, program_id, attachment_url, is_active, created_at)
                    VALUES (
                        'Toddler Outdoor Messy Play Kit Guidelines',
                        'Dear Toddler Parents, next week we are initiating our sensory outdoor play activities. Please pack a spare change of clothes, a small towel, and water-friendly sandals in your child''s bag labeled with their name.',
                        {toddler_id},
                        NULL,
                        1,
                        GETDATE()
                    );
                """))
                
            # Seed 3: Kindergarten specific
            if kindergarten_id:
                conn.execute(text(f"""
                    INSERT INTO circulars (title, content, program_id, attachment_url, is_active, created_at)
                    VALUES (
                        'Kindergarten Science Exhibition & Projects',
                        'Dear Parents, our annual Kindergarten Science Fair is scheduled for next month. Please assist your child in choosing a simple experiment or topic. A detailed project format document has been attached to this announcement.',
                        {kindergarten_id},
                        NULL,
                        1,
                        GETDATE()
                    );
                """))
                
            conn.commit()
            print("Initial circulars seeded successfully.")
        else:
            print("Table 'circulars' already has data.")
            
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
