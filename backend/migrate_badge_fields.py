from app.core.database import engine, SessionLocal
from sqlalchemy import text

print("Connecting to SQL Server database for ID badge columns migration...")

with engine.connect() as conn:
    # 1. Add blood_group and emergency_phone to students table
    res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'blood_group'")).fetchone()
    if not res:
        print("Columns blood_group/emergency_phone do not exist in students. Adding...")
        conn.execute(text("ALTER TABLE students ADD blood_group VARCHAR(50) NULL;"))
        conn.execute(text("ALTER TABLE students ADD emergency_phone VARCHAR(100) NULL;"))
        conn.commit()
        print("Columns blood_group/emergency_phone added to students.")
    else:
        print("Columns blood_group/emergency_phone already exist in students.")

    # 2. Add blood_group and emergency_phone to admissions table
    res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'admissions' AND COLUMN_NAME = 'blood_group'")).fetchone()
    if not res:
        print("Columns blood_group/emergency_phone do not exist in admissions. Adding...")
        conn.execute(text("ALTER TABLE admissions ADD blood_group VARCHAR(50) NULL;"))
        conn.execute(text("ALTER TABLE admissions ADD emergency_phone VARCHAR(100) NULL;"))
        conn.commit()
        print("Columns blood_group/emergency_phone added to admissions.")
    else:
        print("Columns blood_group/emergency_phone already exist in admissions.")

print("Migration completed successfully.")
