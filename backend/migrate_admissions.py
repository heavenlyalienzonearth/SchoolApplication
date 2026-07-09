from app.core.database import engine, SessionLocal
from app import models
from sqlalchemy import text
import json

print("Connecting to SQL Server database for Admissions migration...")

# 1. Create tables using SQL Server DDL statements
with engine.connect() as conn:
    # Create vaccinations table
    try:
        conn.execute(text("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='vaccinations' AND xtype='U')
        CREATE TABLE vaccinations (
            id INT IDENTITY(1,1) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            age_group VARCHAR(255) NOT NULL
        );
        """))
        conn.commit()
        print("vaccinations table checked/created successfully.")
    except Exception as e:
        print(f"Error creating vaccinations table: {e}")

    # Create admissions table
    try:
        conn.execute(text("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='admissions' AND xtype='U')
        CREATE TABLE admissions (
            id INT IDENTITY(1,1) PRIMARY KEY,
            child_name VARCHAR(255) NOT NULL,
            parent_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL,
            phone VARCHAR(100) NOT NULL,
            date_of_birth VARCHAR(100) NOT NULL,
            program_id INT NOT NULL FOREIGN KEY REFERENCES programs(id) ON DELETE CASCADE,
            allergies VARCHAR(255) NULL,
            status VARCHAR(50) NOT NULL DEFAULT 'NEW',
            created_at DATETIME NOT NULL DEFAULT GETDATE()
        );
        """))
        conn.commit()
        print("admissions table checked/created successfully.")
    except Exception as e:
        print(f"Error creating admissions table: {e}")

    # Create admission_vaccinations table
    try:
        conn.execute(text("""
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='admission_vaccinations' AND xtype='U')
        CREATE TABLE admission_vaccinations (
            id INT IDENTITY(1,1) PRIMARY KEY,
            admission_id INT NOT NULL FOREIGN KEY REFERENCES admissions(id) ON DELETE CASCADE,
            vaccination_id INT NOT NULL FOREIGN KEY REFERENCES vaccinations(id) ON DELETE CASCADE,
            administered_date VARCHAR(100) NOT NULL
        );
        """))
        conn.commit()
        print("admission_vaccinations table checked/created successfully.")
    except Exception as e:
        print(f"Error creating admission_vaccinations table: {e}")

# 2. Seed Default Vaccinations
db = SessionLocal()
try:
    v_count = db.query(models.Vaccination).count()
    if v_count == 0:
        print("Seeding default vaccination lists...")
        default_vaccines = [
            # Toddlers (Age 1-2)
            ("Hepatitis B (HepB)", "Toddler Explorers (Robo-Tots)"),
            ("DTaP (Diphtheria, Tetanus, Pertussis)", "Toddler Explorers (Robo-Tots)"),
            ("Haemophilus influenzae type b (Hib)", "Toddler Explorers (Robo-Tots)"),
            ("Pneumococcal conjugate (PCV13)", "Toddler Explorers (Robo-Tots)"),
            ("Measles, Mumps, Rubella (MMR)", "Toddler Explorers (Robo-Tots)"),
            # Preschool (Age 3-4)
            ("Inactivated Poliovirus (IPV)", "Preschool Engineers (Junior Coders)"),
            ("Varicella (Chickenpox)", "Preschool Engineers (Junior Coders)"),
            ("Hepatitis A (HepA)", "Preschool Engineers (Junior Coders)"),
            ("Influenza (Flu Shot)", "Preschool Engineers (Junior Coders)"),
            # Kindergarten (Age 5-6)
            ("Meningococcal Booster", "Kindergarten Innovators (Future Designers)"),
            ("Tdap Booster", "Kindergarten Innovators (Future Designers)"),
            ("HPV Vaccine", "Kindergarten Innovators (Future Designers)")
        ]
        
        for name, group in default_vaccines:
            db.add(models.Vaccination(name=name, age_group=group))
            
        db.commit()
        print("Successfully seeded default vaccinations list.")
    else:
        print(f"Vaccinations list already has {v_count} entries. Skipping seeding.")
        
    # 3. Seed Sample Admission Application
    a_count = db.query(models.Admission).count()
    if a_count == 0:
        print("Seeding a sample student admission application...")
        programs = db.query(models.Program).order_by(models.Program.sort_order).all()
        if len(programs) > 0:
            prog = programs[0] # Toddler
            sample_app = models.Admission(
                child_name="Kabir Patel",
                parent_name="Amit Patel",
                email="amit.patel@gmail.com",
                phone="9876543211",
                date_of_birth="2024-05-15",
                program_id=prog.id,
                allergies="Strawberries",
                status="NEW"
            )
            db.add(sample_app)
            db.commit()
            
            # Link a sample vaccination
            v = db.query(models.Vaccination).filter(models.Vaccination.age_group == prog.title).first()
            if v:
                db.add(models.AdmissionVaccination(
                    admission_id=sample_app.id,
                    vaccination_id=v.id,
                    administered_date="2025-06-20"
                ))
                db.commit()
                print("Seeded sample admission with 1 vaccination detail.")
    else:
        print("Admissions already has records. Skipping sample seeding.")
finally:
    db.close()

print("All done!")
