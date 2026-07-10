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
        print("Creating parent features tables...")
        
        # 1. Create parent_bills table
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='parent_bills' and xtype='U')
            BEGIN
                CREATE TABLE parent_bills (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    student_id INT NOT NULL FOREIGN KEY REFERENCES students(id) ON DELETE CASCADE,
                    title VARCHAR(255) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    due_date VARCHAR(50) NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'Unpaid',
                    paid_date DATETIME NULL,
                    payment_method VARCHAR(50) NULL,
                    receipt_no VARCHAR(100) NULL,
                    created_at DATETIME NOT NULL DEFAULT GETDATE()
                )
            END
        """))

        # 2. Create parent_milestones table
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='parent_milestones' and xtype='U')
            BEGIN
                CREATE TABLE parent_milestones (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    student_id INT NOT NULL FOREIGN KEY REFERENCES students(id) ON DELETE CASCADE,
                    milestone_name VARCHAR(255) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'Not Started',
                    completed_date VARCHAR(50) NULL,
                    teacher_comments NVARCHAR(MAX) NULL,
                    created_at DATETIME NOT NULL DEFAULT GETDATE()
                )
            END
        """))

        # 3. Create leave_requests table
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='leave_requests' and xtype='U')
            BEGIN
                CREATE TABLE leave_requests (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    student_id INT NOT NULL FOREIGN KEY REFERENCES students(id) ON DELETE CASCADE,
                    start_date VARCHAR(50) NOT NULL,
                    end_date VARCHAR(50) NOT NULL,
                    reason VARCHAR(550) NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'Approved',
                    created_at DATETIME NOT NULL DEFAULT GETDATE()
                )
            END
        """))
        
        conn.commit()
        print("Tables created successfully. Seeding default data for existing students...")

        # Get all students
        students = conn.execute(text("SELECT id FROM students")).fetchall()
        for row in students:
            student_id = row[0]
            
            # Check if bills exist
            bill_count = conn.execute(text("SELECT COUNT(*) FROM parent_bills WHERE student_id = :sid"), {"sid": student_id}).scalar()
            if bill_count == 0:
                print(f"Seeding bills for student ID {student_id}...")
                conn.execute(text("""
                    INSERT INTO parent_bills (student_id, title, amount, due_date, status, paid_date, payment_method, receipt_no)
                    VALUES 
                    (:sid, 'Term 1 Tuition & Admin Fees', 12500.00, '2026-03-31', 'Paid', '2026-03-15 10:30:00', 'Online', 'REC-2026-0091'),
                    (:sid, 'Nursery Learning Material & Supplies Kit', 4500.00, '2026-04-15', 'Paid', '2026-04-10 14:15:00', 'Card', 'REC-2026-0142'),
                    (:sid, 'Term 2 Tuition & Sports Fees', 12500.00, '2026-10-15', 'Unpaid', NULL, NULL, NULL),
                    (:sid, 'Annual Science Fair Excursion', 1200.00, '2026-11-20', 'Unpaid', NULL, NULL, NULL)
                """), {"sid": student_id})
                
            # Check if milestones exist
            milestone_count = conn.execute(text("SELECT COUNT(*) FROM parent_milestones WHERE student_id = :sid"), {"sid": student_id}).scalar()
            if milestone_count == 0:
                print(f"Seeding milestones for student ID {student_id}...")
                conn.execute(text("""
                    INSERT INTO parent_milestones (student_id, milestone_name, category, status, completed_date, teacher_comments)
                    VALUES 
                    (:sid, 'Identifies standard uppercase & lowercase letters', 'Cognitive', 'Completed', '2026-05-12', 'Excellent progress! Quickly recognizes vowels and primary consonants.'),
                    (:sid, 'Counts and maps objects up to 20', 'Cognitive', 'Completed', '2026-06-08', 'Demonstrates good sorting and counting accuracy with play blocks.'),
                    (:sid, 'Solves simple 4-6 piece jigsaw puzzles', 'Cognitive', 'In Progress', NULL, 'Beginning to group colors together. Needs slight encouragement to finish corner pieces.'),
                    (:sid, 'Ties shoelaces independently', 'Physical', 'Not Started', NULL, 'Fine motor skills are developing well. We will practice lace loops next month.'),
                    (:sid, 'Hops on one foot and maintains balance', 'Physical', 'Completed', '2026-06-15', 'Very active and shows great coordination during morning yoga sessions.'),
                    (:sid, 'Paints within bounds of shapes', 'Physical', 'In Progress', NULL, 'Grip is firm. Still learning boundaries but shows wonderful creativity.'),
                    (:sid, 'Shares toys voluntarily with peers', 'Emotional', 'Completed', '2026-06-20', 'Friendly behavior. Enthusiastically shares coloring kits during playgroup time.'),
                    (:sid, 'Expresses distress or needs verbally instead of crying', 'Emotional', 'Completed', '2026-07-02', 'Communicates needs clearly to class monitors and teachers.')
                """), {"sid": student_id})
        
        conn.commit()
        print("Parent Portal Features migration complete!")

if __name__ == "__main__":
    migrate()
