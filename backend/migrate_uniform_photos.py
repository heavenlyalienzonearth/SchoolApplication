from app.core.database import engine, SessionLocal
from app import models
from sqlalchemy import text
import json

print("Connecting to SQL Server database for Uniform and Photos columns migration...")

with engine.connect() as conn:
    # 1. Add uniform_items_json to programs table
    res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'programs' AND COLUMN_NAME = 'uniform_items_json'")).fetchone()
    if not res:
        print("Column uniform_items_json does not exist in programs. Adding...")
        conn.execute(text("ALTER TABLE programs ADD uniform_items_json VARCHAR(max) NULL;"))
        conn.commit()
        print("Column uniform_items_json added.")
    else:
        print("Column uniform_items_json already exists in programs.")

    # 2. Add photo_url and issued_items_json to students table
    res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'photo_url'")).fetchone()
    if not res:
        print("Columns photo_url/issued_items_json do not exist in students. Adding...")
        conn.execute(text("ALTER TABLE students ADD photo_url VARCHAR(255) NULL;"))
        conn.execute(text("ALTER TABLE students ADD issued_items_json VARCHAR(max) NULL;"))
        conn.commit()
        print("Columns photo_url/issued_items_json added to students.")
    else:
        print("Columns photo_url/issued_items_json already exist in students.")

    # 3. Add photo_url and issued_items_json to admissions table
    res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admissions' AND COLUMN_NAME = 'photo_url'")).fetchone()
    if not res:
        print("Columns photo_url/issued_items_json do not exist in admissions. Adding...")
        conn.execute(text("ALTER TABLE admissions ADD photo_url VARCHAR(255) NULL;"))
        conn.execute(text("ALTER TABLE admissions ADD issued_items_json VARCHAR(max) NULL;"))
        conn.commit()
        print("Columns photo_url/issued_items_json added to admissions.")
    else:
        print("Columns photo_url/issued_items_json already exist in admissions.")

# 4. Seed default configurations
db = SessionLocal()
try:
    print("Seeding class-specific uniform and supplies lists...")
    programs = db.query(models.Program).order_by(models.Program.sort_order).all()
    
    t_items = ["Books", "School Shorts", "Kangaroo Shoes"]
    p_items = ["Books", "School Blazer", "School Shorts", "Pants", "Kangaroo Shoes", "Girls Dress", "School Tie"]
    k_items = ["Books", "School Blazer", "Pants", "Kangaroo Shoes", "Girls Dress", "School Tie"]
    
    for p in programs:
        if "Toddler" in p.title or "Robo-Tots" in p.title:
            p.uniform_items_json = json.dumps(t_items)
            print(f"Seeded Toddler uniform items: {t_items}")
        elif "Preschool" in p.title or "Junior Coders" in p.title:
            p.uniform_items_json = json.dumps(p_items)
            print(f"Seeded Preschool uniform items: {p_items}")
        elif "Kindergarten" in p.title or "Future Designers" in p.title:
            p.uniform_items_json = json.dumps(k_items)
            print(f"Seeded Kindergarten uniform items: {k_items}")
            
    db.commit()
    print("Uniform and photos migration completed successfully.")
finally:
    db.close()
