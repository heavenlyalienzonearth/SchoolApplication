import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app import models

def update_db_sections():
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    print("Checking and updating page sections...")
    
    # 1. Update/Insert 'curriculum' page content
    curriculum_bullets = [
        "Playgroup Program (Toddler transition, sensory exploration, and basic fine-motor wiggles).",
        "Nursery Program (Introduction to phonics, pre-writing skills, social collaboration, and blocks).",
        "Junior KG Program (Development of language confidence, pre-math logic, and creative expressions).",
        "Senior KG Program (Advanced reading, complex counting, logical reasoning, and social preparedness)."
    ]
    
    curriculum_sec = db.query(models.PageSection).filter(
        models.PageSection.page_code == "curriculum",
        models.PageSection.section_code == "curriculum_info"
    ).first()
    
    if curriculum_sec:
        curriculum_sec.title = "Our Programmes & Curriculum"
        curriculum_sec.subtitle = "Innovation in Curriculum for Pre-school"
        curriculum_sec.description = "A preschool has two programs - Playgroup and Nursery. The best age to get admission for playgroup is 2 years. For Nursery, the best age to start is 3 years. Kangaroo Kids International Preschool will set a strong foundation for your child to join Junior KG at the age of 4 and senior KG at the age of 5. Kangaroo Kids curriculum is designed to offer each child an engaging and developmentally fulfilling experience with Fluidic Learning Methodology."
        curriculum_sec.content_json = json.dumps(curriculum_bullets)
        curriculum_sec.media_url = "/assets/images/curriculum_learning.png"
        curriculum_sec.is_active = True
    else:
        db.add(models.PageSection(
            page_code="curriculum",
            section_code="curriculum_info",
            title="Our Programmes & Curriculum",
            subtitle="Innovation in Curriculum for Pre-school",
            description="A preschool has two programs - Playgroup and Nursery. The best age to get admission for playgroup is 2 years. For Nursery, the best age to start is 3 years. Kangaroo Kids International Preschool will set a strong foundation for your child to join Junior KG at the age of 4 and senior KG at the age of 5. Kangaroo Kids curriculum is designed to offer each child an engaging and developmentally fulfilling experience with Fluidic Learning Methodology.",
            content_json=json.dumps(curriculum_bullets),
            media_url="/assets/images/curriculum_learning.png",
            is_active=True,
            sort_order=1
        ))

    # 2. Update/Insert 'why_us' page content
    why_us_bullets = [
        "Imparting Quality Education for over 30+ years.",
        "Excellent Teacher Student Ratio of 1:6.",
        "Innovative Curriculum & Pedagogy built for futuristic kids.",
        "The New Age iCan Learning System (agile and fluid methodology).",
        "Personalized Learning through structured plays and custom tools.",
        "Extended Learning at home using our in-house App.",
        "Highly Trained, certified, and experienced Early Childhood educators."
    ]

    why_us_sec = db.query(models.PageSection).filter(
        models.PageSection.page_code == "why_us",
        models.PageSection.section_code == "why_us_info"
    ).first()

    if why_us_sec:
        why_us_sec.title = "Why Kangaroo Kids?"
        why_us_sec.subtitle = "learner centric & committed to child growth"
        why_us_sec.description = "Kangaroo Kids has always been ‘learner centric’ and open to change which has reflected in our approach towards preschool, playschool, kindergarten, and nursery learning over the last 30 years. Our new age iCan Learning System has been developed to prepare our children to live in this thriving and accelerated world. We are committed to supporting your child's growth and happiness as they go through life's earliest developmental milestones."
        why_us_sec.content_json = json.dumps(why_us_bullets)
        why_us_sec.media_url = "/assets/images/why_kangaroo_kids.png"
        why_us_sec.is_active = True
    else:
        db.add(models.PageSection(
            page_code="why_us",
            section_code="why_us_info",
            title="Why Kangaroo Kids?",
            subtitle="learner centric & committed to child growth",
            description="Kangaroo Kids has always been ‘learner centric’ and open to change which has reflected in our approach towards preschool, playschool, kindergarten, and nursery learning over the last 30 years. Our new age iCan Learning System has been developed to prepare our children to live in this thriving and accelerated world. We are committed to supporting your child's growth and happiness as they go through life's earliest developmental milestones.",
            content_json=json.dumps(why_us_bullets),
            media_url="/assets/images/why_kangaroo_kids.png",
            is_active=True,
            sort_order=1
        ))

    db.commit()
    db.close()
    print("Database pages updated successfully!")

if __name__ == "__main__":
    update_db_sections()
