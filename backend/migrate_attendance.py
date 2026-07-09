from app.core.database import engine, SessionLocal
from app import models
from sqlalchemy import text
import json

print("Connecting to SQL Server database for Attendance table creation...")

# 1. Create tables using SQL Server DDL statements
with engine.connect() as conn:
    # Create students table
    try:
        conn.execute(text("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='students' AND xtype='U')
        CREATE TABLE students (
            id INT IDENTITY(1,1) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            parent_name VARCHAR(255) NOT NULL,
            phone VARCHAR(100) NOT NULL,
            program_id INT NOT NULL FOREIGN KEY REFERENCES programs(id) ON DELETE CASCADE,
            is_active BIT NOT NULL DEFAULT 1,
            created_at DATETIME NOT NULL DEFAULT GETDATE()
        );
        """))
        conn.commit()
        print("students table checked/created successfully.")
    except Exception as e:
        print(f"Error creating students table: {e}")

    # Create attendance table
    try:
        conn.execute(text("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='attendance' AND xtype='U')
        CREATE TABLE attendance (
            id INT IDENTITY(1,1) PRIMARY KEY,
            student_id INT NOT NULL FOREIGN KEY REFERENCES students(id) ON DELETE CASCADE,
            date VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL,
            notes VARCHAR(255) NULL,
            created_at DATETIME NOT NULL DEFAULT GETDATE()
        );
        """))
        conn.commit()
        print("attendance table checked/created successfully.")
    except Exception as e:
        print(f"Error creating attendance table: {e}")

# 2. Seed Default kids
db = SessionLocal()
try:
    students_count = db.query(models.Student).count()
    if students_count == 0:
        print("Seeding default kids roster...")
        programs = db.query(models.Program).order_by(models.Program.sort_order).all()
        if len(programs) >= 3:
            t_prog = programs[0]
            p_prog = programs[1]
            k_prog = programs[2]
            
            # Toddler Tots roster
            t_kids = [
                ("Aarav Sharma", "Raj Sharma", "9876543210"),
                ("Riya Patel", "Amit Patel", "9876543211"),
                ("Kavi Singh", "Preeti Singh", "9876543212"),
                ("Zoe Chen", "Li Chen", "9876543213"),
                ("Leo Rover", "Sarah Rover", "9876543214")
            ]
            for name, parent, phone in t_kids:
                db.add(models.Student(name=name, parent_name=parent, phone=phone, program_id=t_prog.id))
                
            # Preschool Coders roster
            p_kids = [
                ("Sam Wilson", "John Wilson", "9876543215"),
                ("Mia Gupta", "Sanjay Gupta", "9876543216"),
                ("Ryan Jones", "Mary Jones", "9876543217"),
                ("Tara Sen", "Vikram Sen", "9876543218"),
                ("Eli Bot", "Emma Bot", "9876543219")
            ]
            for name, parent, phone in p_kids:
                db.add(models.Student(name=name, parent_name=parent, phone=phone, program_id=p_prog.id))
                
            # Kindergarten roster
            k_kids = [
                ("Diya Reddy", "Kishore Reddy", "9876543220"),
                ("Arjun Das", "Nikhil Das", "9876543221"),
                ("Chloe Smith", "Paul Smith", "9876543222"),
                ("Kabir Mehta", "Asha Mehta", "9876543223"),
                ("Nova Star", "Arthur Star", "9876543224")
            ]
            for name, parent, phone in k_kids:
                db.add(models.Student(name=name, parent_name=parent, phone=phone, program_id=k_prog.id))
                
            db.commit()
            print("Successfully seeded 15 kids into the student roster.")
        else:
            print(f"Warning: Not enough active programs to seed rosters. Count = {len(programs)}")
    else:
        print(f"Roster already has {students_count} kids. Skipping seeding.")
finally:
    db.close()

print("All done!")
