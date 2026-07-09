from app.core.database import engine, SessionLocal
from app import models
from sqlalchemy import text
import json

print("Connecting to SQL Server database for breakfast and allergy migration...")

# 1. Add allergies column to students table
with engine.connect() as conn:
    res = conn.execute(text("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'students' AND COLUMN_NAME = 'allergies'")).fetchone()
    if not res:
        print("Column allergies does not exist in students. Adding column...")
        conn.execute(text("ALTER TABLE students ADD allergies VARCHAR(255) NULL;"))
        conn.commit()
        print("Column added successfully.")
    else:
        print("Column allergies already exists in students.")

db = SessionLocal()
try:
    # 2. Seed allergies for sample students
    print("Seeding student food allergies...")
    aarav = db.query(models.Student).filter(models.Student.name == "Aarav Sharma").first()
    if aarav: aarav.allergies = "Peanuts & Strawberries"
    
    sam = db.query(models.Student).filter(models.Student.name == "Sam Wilson").first()
    if sam: sam.allergies = "Dairy & Soy"
    
    ryan = db.query(models.Student).filter(models.Student.name == "Ryan Jones").first()
    if ryan: ryan.allergies = "Gluten & Honey"
    
    nova = db.query(models.Student).filter(models.Student.name == "Nova Star").first()
    if nova: nova.allergies = "Citrus Fruits"
    
    # 3. Seed daily kids-only breakfast plan into program weekly plans
    print("Seeding daily breakfast plans...")
    programs = db.query(models.Program).order_by(models.Program.sort_order).all()
    
    t_breakfast = [
        "Apple Puree & Warm Milk",
        "Oats Porridge & Banana Slices",
        "Sweet Potato Mash & Milk",
        "Mashed Avocado & Berry Puree",
        "Rice Kheer (Nut-Free) & Milk"
    ]
    p_breakfast = [
        "Whole Wheat Pancakes & Fruit Salad",
        "Scrambled Eggs & Mango Cubes",
        "Ragi Dosa & Apple Juice",
        "Cornflakes with Banana & Milk",
        "Vegetable Poha (No Peanuts) & Fruit Juice"
    ]
    k_breakfast = [
        "Veggie Sandwich & Berry Mix",
        "Boiled Eggs & Whole Wheat Toast",
        "Oats Idli with Coconut Chutney",
        "Cheese Toast & Fresh Apple Slices",
        "Multi-grain Paratha & Yogurt Cup"
    ]
    
    for p in programs:
        if not p.weekly_plan_json:
            continue
        try:
            plan = json.loads(p.weekly_plan_json)
        except Exception:
            continue
            
        b_list = []
        if "Toddler" in p.title or "Robo-Tots" in p.title:
            b_list = t_breakfast
        elif "Preschool" in p.title or "Junior Coders" in p.title:
            b_list = p_breakfast
        elif "Kindergarten" in p.title or "Future Designers" in p.title:
            b_list = k_breakfast
            
        if len(b_list) >= 5 and len(plan) >= 5:
            for idx in range(5):
                plan[idx]["breakfast"] = b_list[idx]
            p.weekly_plan_json = json.dumps(plan)
            print(f"Added breakfast menu to: {p.title}")
            
    db.commit()
    print("Migration and seeding finished successfully.")
finally:
    db.close()
