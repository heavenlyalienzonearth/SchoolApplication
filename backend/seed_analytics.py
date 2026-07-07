from datetime import datetime, timedelta
import random
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app import models

def seed_analytics_data():
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    print("Seeding historic analytics data for Dashboard...")
    now = datetime.utcnow()
    
    # 1. Seed admissions submissions (subject="Admissions Inquiries" or "Chatbot Lead")
    # Today admissions: 5
    for i in range(5):
        db.add(models.ContactSubmission(
            name=f"Parent Today {i}",
            email=f"parent_today{i}@email.com",
            phone=f"987654320{i}",
            subject="Admissions Inquiries",
            message=f"I want to enroll my child. Please share fee info.",
            status="NEW",
            created_at=now - timedelta(hours=i*2)
        ))

    # This week admissions (excluding today): 13
    for i in range(13):
        db.add(models.ContactSubmission(
            name=f"Parent Week {i}",
            email=f"parent_week{i}@email.com",
            phone=f"987654330{i}",
            subject="Chatbot Lead",
            message=f"Interested in Nursery program. Child name: Kid {i}",
            status="NEW",
            created_at=now - timedelta(days=random.randint(1, 6), hours=i)
        ))

    # This month admissions (excluding this week): 34
    for i in range(34):
        db.add(models.ContactSubmission(
            name=f"Parent Month {i}",
            email=f"parent_month{i}@email.com",
            phone=f"987654340{i}",
            subject="Admissions Inquiries",
            message=f"Admission query for academic year 2026-27.",
            status="RESOLVED" if i % 2 == 0 else "NEW",
            created_at=now - timedelta(days=random.randint(7, 29), hours=i)
        ))

    # Earlier this year admissions: 168
    for i in range(168):
        db.add(models.ContactSubmission(
            name=f"Parent Year {i}",
            email=f"parent_year{i}@email.com",
            phone=f"987654350{i}",
            subject="Chatbot Lead",
            message=f"Enquiry for Playgroup class.",
            status="RESOLVED",
            created_at=now - timedelta(days=random.randint(30, 180))
        ))

    # 2. Seed Transfer Certificate requests: 12
    for i in range(12):
        db.add(models.ContactSubmission(
            name=f"Transfer Parent {i}",
            email=f"tc_parent{i}@email.com",
            phone=f"987654360{i}",
            subject="Transfer Certificate Request",
            message=f"We are moving out of the city and require a Transfer Certificate (TC) for my child. Please issue it.",
            status="NEW" if i < 4 else "RESOLVED",
            created_at=now - timedelta(days=random.randint(1, 45))
        ))

    # 3. Seed other general submissions for ratio: 25
    for i in range(25):
        db.add(models.ContactSubmission(
            name=f"Inquirer {i}",
            email=f"inquirer{i}@email.com",
            phone=f"987654370{i}",
            subject="General Enquiry",
            message=f"What are the school operating hours?",
            status="RESOLVED",
            created_at=now - timedelta(days=random.randint(1, 90))
        ))

    # 4. Seed parent reviews/testimonials for Good vs Improvement Needed
    # Good feedbacks (4-5 stars) are already seeded on seed.py, let's add some more
    db.add(models.Testimonial(
        author_name="Meera Sen",
        author_role="Mother of Kabir (Nursery)",
        quote="Wonderful learning wiggles! My child loves the block building sessions.",
        rating=5,
        is_active=True,
        sort_order=3,
        image_url="/assets/images/parent_avatar1.jpg"
    ))
    db.add(models.Testimonial(
        author_name="David Craig",
        author_role="Father of Emily (Playgroup)",
        quote="Very clean campus and excellent caretakers. Fully satisfied.",
        rating=4,
        is_active=True,
        sort_order=4,
        image_url="/assets/images/parent_avatar2.jpg"
    ))

    # Improvement Needed feedbacks (1-3 stars, marked as inactive so they don't show publically)
    db.add(models.Testimonial(
        author_name="Rohan Kapur",
        author_role="Parent of Vivaan (KG)",
        quote="Playground equipment needs a safety check, some swings are wobbly. Staff is responsive though.",
        rating=3,
        is_active=False,
        sort_order=10,
        image_url=""
    ))
    db.add(models.Testimonial(
        author_name="Tina Watson",
        author_role="Parent of Leo (Playgroup)",
        quote="School bus route timings are delayed by 15 mins sometimes. Need better coordination.",
        rating=2,
        is_active=False,
        sort_order=11,
        image_url=""
    ))

    db.commit()
    db.close()
    print("Database populated with historic metrics successfully!")

if __name__ == "__main__":
    seed_analytics_data()
