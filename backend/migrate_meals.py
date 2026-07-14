import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add backend directory to path so we can import app modules
sys.path.append(r"E:\AI_Applications\SchoolApplication\backend")
from app.core.config import settings
from app.core.database import Base
from app import models

def main():
    print("Connecting to database...")
    engine = create_engine(settings.DATABASE_URL)
    
    # Create the meal_plans table using SQLAlchemy metadata
    print("Creating meal_plans table...")
    Base.metadata.create_all(engine)
    
    Session = sessionmaker(bind=engine)
    db = Session()
    
    # Check if table is empty
    count = db.query(models.MealPlan).count()
    if count == 0:
        print("Seeding weekly meal planner database...")
        # Create standard weekly menu (Monday - Friday)
        menu = [
            # Monday
            models.MealPlan(day_of_week="Monday", meal_type="Breakfast", menu_item="Ragi Porridge & Fresh Fruits", description="Nutritious finger millet porridge served with fresh banana slices and honey.", allergens="None", calories=220),
            models.MealPlan(day_of_week="Monday", meal_type="Lunch", menu_item="Veg Pulao with Cucumber Raita", description="Fragrant basmati rice cooked with peas, carrots, beans, served with yogurt raita.", allergens="Dairy", calories=380),
            models.MealPlan(day_of_week="Monday", meal_type="Snack", menu_item="Roasted Makhana (Lotus Seeds)", description="Lightly roasted with ghee and mild turmeric powder.", allergens="Dairy", calories=110),
            # Tuesday
            models.MealPlan(day_of_week="Tuesday", meal_type="Breakfast", menu_item="Whole Wheat Pancakes", description="Fluffy wheat pancakes with organic maple syrup and fresh blueberries.", allergens="Gluten", calories=250),
            models.MealPlan(day_of_week="Tuesday", meal_type="Lunch", menu_item="Dal Tadka & Steamed Rice", description="Yellow lentil soup served with soft steamed rice, carrots, and cucumber sticks.", allergens="None", calories=340),
            models.MealPlan(day_of_week="Tuesday", meal_type="Snack", menu_item="Apple Slices with Peanut Butter", description="Fresh red apple slices served with cream peanut dip.", allergens="Peanuts", calories=180),
            # Wednesday
            models.MealPlan(day_of_week="Wednesday", meal_type="Breakfast", menu_item="Vegetable Idli with Coconut Chutney", description="Steamed rice cakes loaded with finely grated carrots and beans.", allergens="Coconut", calories=190),
            models.MealPlan(day_of_week="Wednesday", meal_type="Lunch", menu_item="Paneer Bhurji & Roti", description="Scrambled paneer (cottage cheese) with tomatoes, served with whole wheat flatbread.", allergens="Dairy, Gluten", calories=410),
            models.MealPlan(day_of_week="Wednesday", meal_type="Snack", menu_item="Banana Oat Muffins", description="Home-baked eggless muffins made with ripe bananas and rolled oats.", allergens="Gluten", calories=150),
            # Thursday
            models.MealPlan(day_of_week="Thursday", meal_type="Breakfast", menu_item="Moong Dal Cheela", description="Savoury green gram pancakes stuffed with mild grated cottage cheese.", allergens="Dairy", calories=210),
            models.MealPlan(day_of_week="Thursday", meal_type="Lunch", menu_item="Sambar Rice with Potato Wedges", description="Rice mashed with lentils and mixed vegetables, served with baked potato wedges.", allergens="None", calories=370),
            models.MealPlan(day_of_week="Thursday", meal_type="Snack", menu_item="Mixed Fruit Cup", description="Papaya, pomegranate, watermelon, and pineapple cubes.", allergens="None", calories=90),
            # Friday
            models.MealPlan(day_of_week="Friday", meal_type="Breakfast", menu_item="Oatmeal with Honey & Chia Seeds", description="Warm rolled oats cooked in milk, topped with organic honey and chia seeds.", allergens="Dairy", calories=240),
            models.MealPlan(day_of_week="Friday", meal_type="Lunch", menu_item="Aloo Paratha with Curd", description="Whole wheat flatbread stuffed with spiced potato mash, served with fresh yogurt.", allergens="Dairy, Gluten", calories=450),
            models.MealPlan(day_of_week="Friday", meal_type="Snack", menu_item="Sweet Corn Salad", description="Steamed sweet corn kernels tossed with butter and cucumber.", allergens="Dairy", calories=130)
        ]
        db.add_all(menu)
        db.commit()
        print("Successfully seeded 15 weekly meal plans.")
    else:
        print(f"Table meal_plans already has {count} entries.")
        
    db.close()

if __name__ == "__main__":
    main()
