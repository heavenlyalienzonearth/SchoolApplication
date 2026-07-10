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
        print("Creating fee_structures table...")
        
        # 1. Create fee_structures table
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='fee_structures' and xtype='U')
            BEGIN
                CREATE TABLE fee_structures (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    amount NUMERIC(10, 2) NOT NULL,
                    frequency VARCHAR(50) NOT NULL DEFAULT 'Termly',
                    program_id INT NULL FOREIGN KEY REFERENCES programs(id) ON DELETE SET NULL,
                    is_active BIT NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT GETDATE()
                )
            END
        """))
        
        # 2. Add columns to parent_bills table if they don't exist
        print("Adding waiver_amount and notes columns to parent_bills...")
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('parent_bills') AND name = 'waiver_amount')
            BEGIN
                ALTER TABLE parent_bills ADD waiver_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00
            END
        """))
        
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('parent_bills') AND name = 'notes')
            BEGIN
                ALTER TABLE parent_bills ADD notes VARCHAR(500) NULL
            END
        """))
        
        conn.commit()

        # 3. Seed default fee structures
        print("Seeding default fee structures...")
        
        # We check if any structures exist
        existing_count = conn.execute(text("SELECT COUNT(*) FROM fee_structures")).scalar()
        if existing_count == 0:
            structures = [
                # Toddlers (Program ID = 1)
                {"name": "Tuition Fee (Toddler)", "category": "Tuition", "amount": 12000.00, "frequency": "Termly", "program_id": 1},
                # Preschool (Program ID = 2)
                {"name": "Tuition Fee (Preschool)", "category": "Tuition", "amount": 10000.00, "frequency": "Termly", "program_id": 2},
                # Kindergarten (Program ID = 3)
                {"name": "Tuition Fee (Kindergarten)", "category": "Tuition", "amount": 15000.00, "frequency": "Termly", "program_id": 3},
                # General (Program ID = None)
                {"name": "School Transport Service", "category": "Transport", "amount": 3000.00, "frequency": "Termly", "program_id": None},
                {"name": "Activity Kit & Uniform Set", "category": "Uniforms", "amount": 1500.00, "frequency": "One-time", "program_id": None}
            ]
            
            for s in structures:
                conn.execute(text("""
                    INSERT INTO fee_structures (name, category, amount, frequency, program_id, is_active)
                    VALUES (:name, :category, :amount, :frequency, :program_id, 1)
                """), s)
            
            conn.commit()
            print("Default fee structures seeded successfully!")
        else:
            print("Fee structures table already contains data, skipping seed.")

if __name__ == "__main__":
    migrate()
