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
        print("Creating milestone_templates table...")
        
        # Create milestone_templates table
        conn.execute(text("""
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='milestone_templates' and xtype='U')
            BEGIN
                CREATE TABLE milestone_templates (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    program_id INT NOT NULL FOREIGN KEY REFERENCES programs(id) ON DELETE CASCADE,
                    milestone_name VARCHAR(255) NOT NULL,
                    category VARCHAR(50) NOT NULL,
                    created_at DATETIME NOT NULL DEFAULT GETDATE()
                )
            END
        """))
        
        conn.commit()
        print("Table milestone_templates created successfully.")
        
        # Seed default templates for existing programs
        programs = conn.execute(text("SELECT id, title FROM programs")).fetchall()
        for prog in programs:
            prog_id = prog[0]
            prog_title = prog[1].lower()
            
            # Check if templates already exist
            count = conn.execute(text("SELECT COUNT(*) FROM milestone_templates WHERE program_id = :pid"), {"pid": prog_id}).scalar()
            if count == 0:
                print(f"Seeding default templates for program '{prog[1]}' (ID: {prog_id})...")
                
                # Different milestones based on program level
                if "toddler" in prog_title or "playgroup" in prog_title:
                    templates = [
                        # Cognitive
                        ("Sorts shapes and objects by primary colors", "Cognitive"),
                        ("Identifies at least 3 body parts when named", "Cognitive"),
                        ("Follows simple two-step instructions", "Cognitive"),
                        # Physical
                        ("Walks up stairs with assistance", "Physical"),
                        ("Scribbles freely with jumbo crayons", "Physical"),
                        ("Stacks a tower of 4-6 blocks", "Physical"),
                        # Emotional
                        ("Shows affection for classmates and teachers", "Emotional"),
                        ("Plays alongside other children (parallel play)", "Emotional"),
                        ("Expresses anger or happiness verbally", "Emotional")
                    ]
                elif "kindergarten" in prog_title or "k2" in prog_title or "k1" in prog_title:
                    templates = [
                        # Cognitive
                        ("Writes first and last name independently", "Cognitive"),
                        ("Counts up to 100 and identifies simple math symbols", "Cognitive"),
                        ("Reads simple phonetic 3-letter words", "Cognitive"),
                        # Physical
                        ("Cuts along straight and curved lines with scissors", "Physical"),
                        ("Bounces and catches a medium-sized playground ball", "Physical"),
                        ("Ties shoe loops with minor guidance", "Physical"),
                        # Emotional
                        ("Takes turns and shares resources in group tasks", "Emotional"),
                        ("Verbalizes solutions to conflicts with peers", "Emotional"),
                        ("Demonstrates task completion independence", "Emotional")
                    ]
                else:
                    # Default/Nursery
                    templates = [
                        # Cognitive
                        ("Identifies uppercase letters A-Z", "Cognitive"),
                        ("Counts objects up to 20 accurately", "Cognitive"),
                        ("Solves simple 4-6 piece puzzles", "Cognitive"),
                        # Physical
                        ("Hops on one foot and balances", "Physical"),
                        ("Paints within outline borders", "Physical"),
                        ("Uses child-safe scissors to snip paper", "Physical"),
                        # Emotional
                        ("Shares toys voluntarily with peers", "Emotional"),
                        ("Adapts to classroom routine transitions easily", "Emotional"),
                        ("Expresses emotions verbally instead of crying", "Emotional")
                    ]
                    
                for name, cat in templates:
                    conn.execute(text("""
                        INSERT INTO milestone_templates (program_id, milestone_name, category)
                        VALUES (:pid, :name, :cat)
                    """), {"pid": prog_id, "name": name, "cat": cat})
                    
        conn.commit()
        print("Milestone templates seeding complete!")

if __name__ == "__main__":
    migrate()
