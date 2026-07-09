from app.core.database import engine, SessionLocal
from app import models
from sqlalchemy import text
import json

print("Connecting to SQL Server database via SQLAlchemy...")

# 1. Add weekly_plan_json column using SQL Server syntax if not present
with engine.connect() as conn:
    # Check if column exists in SQL Server
    res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'programs' AND COLUMN_NAME = 'weekly_plan_json'")).fetchone()
    if not res:
        print("Column weekly_plan_json does not exist. Adding column...")
        conn.execute(text("ALTER TABLE programs ADD weekly_plan_json VARCHAR(MAX) NULL;"))
        conn.commit()
        print("Column added successfully.")
    else:
        print("Column weekly_plan_json already exists.")

# 2. Seed default weekly plans
toddler_plan = [
    {"day": "Monday", "study": "Colorful Shapes Exploration", "physical": "Robo-Crawl Obstacle Course", "games": "Tactile Block Stacking"},
    {"day": "Tuesday", "study": "First Animal Sounds & Imitation", "physical": "Tiny Jump & Dance Party", "games": "Soft Ball Roller Chase"},
    {"day": "Wednesday", "study": "Robo-Alphabet Sounds (A-G)", "physical": "Happy Toddler Yoga Stretch", "games": "Glow Button Activity Puzzles"},
    {"day": "Thursday", "study": "Discovering Primary Colors", "physical": "Bubble Catching Race", "games": "Friendly Toy Sorting Match"},
    {"day": "Friday", "study": "Interactive Storytelling Beats", "physical": "Free Play Balloon Bounce", "games": "Robo-Pet Hide & Seek"}
]

preschool_plan = [
    {"day": "Monday", "study": "Logical Order & Step Sequencing", "physical": "Agility Ladder Running", "games": "Rolling Robot Path Maze"},
    {"day": "Tuesday", "study": "Phonics Sounds & Letter Writing", "physical": "Animal Crawls Workout", "games": "Block Coding Card Battles"},
    {"day": "Wednesday", "study": "Creative Counting & Pattern Sorting", "physical": "Fun Hula-Hoop Drills", "games": "Tiny Robot Obstacle Challenge"},
    {"day": "Thursday", "study": "Design Thinking Basics", "physical": "Relay Balloon Bounces", "games": "Engineering Bricks Sandbox"},
    {"day": "Friday", "study": "Robo-Logic & Direction Commands", "physical": "Active Fun Dance Moves", "games": "Kids Coding Race Rally"}
]

kindergarten_plan = [
    {"day": "Monday", "study": "Block-based Code Functions", "physical": "Speed & Coordination Ladder", "games": "Programmed Robot Maze Solvers"},
    {"day": "Tuesday", "study": "Scientific Observation Labs", "physical": "Junior Core Gym Stretch", "games": "Robo-Soccer Team Tournament"},
    {"day": "Wednesday", "study": "Math Foundations & Number Logic", "physical": "Tug-of-War Group Games", "games": "Interactive Tech Board Build"},
    {"day": "Thursday", "study": "Environmental Science & Eco-Bots", "physical": "Shuttle Running Relay", "games": "Block Engineering Craft Labs"},
    {"day": "Friday", "study": "Logic Circuits & Simple Engineering", "physical": "Fun Field Obstacle Run", "games": "Future Innovator Coding Showdown"}
]

db = SessionLocal()
programs = db.query(models.Program).all()
for p in programs:
    plan = None
    if "Toddler" in p.title or "Robo-Tots" in p.title:
        plan = toddler_plan
    elif "Preschool" in p.title or "Junior Coders" in p.title:
        plan = preschool_plan
    elif "Kindergarten" in p.title or "Future Designers" in p.title:
        plan = kindergarten_plan
        
    if plan:
        p.weekly_plan_json = json.dumps(plan)
        print(f"Seeded plan for: {p.title}")

db.commit()
db.close()
print("All done!")
