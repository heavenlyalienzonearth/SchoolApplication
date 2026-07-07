import json
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app import models

def seed_preschool():
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    print("Checking and seeding PreSchooling page sections...")

    # Clear existing preschool_program page sections if any to avoid duplication
    db.query(models.PageSection).filter(models.PageSection.page_code == "preschool_program").delete()
    db.commit()

    sections = [
        models.PageSection(
            page_code="preschool_program",
            section_code="preschool_hero",
            title="Preschooling Programme",
            subtitle="The iCan Learning System",
            description="Nurturing young minds through experiential play and a future-ready curriculum designed for holistic early childhood development.",
            media_url="/assets/images/program_preschool.jpg",
            is_active=True,
            sort_order=1
        ),
        models.PageSection(
            page_code="preschool_program",
            section_code="playgroup_info",
            title="Playgroup Programme",
            subtitle="Ages: 1.5 - 2.5 Years | Duration: 2.5 Hours/Day",
            description="Our playgroup program focuses on laying a strong foundation by introducing basic language, math, and science concepts through engaging activities like art, music, dance, and play. We emphasize sensory exploration, gross motor development, and peer socialization in a safe, warm environment.",
            content_json=json.dumps([
                "Sensory play and tactile exploration activities.",
                "Language and math concept introduction via music and stories.",
                "Development of gross and fine motor coordination milestones.",
                "Warm, secure environment designed to ease home-to-school transition."
            ]),
            media_url="/assets/images/program_toddler.jpg",
            is_active=True,
            sort_order=2
        ),
        models.PageSection(
            page_code="preschool_program",
            section_code="nursery_info",
            title="Nursery Programme",
            subtitle="Ages: 2.5 - 3.5 Years | Duration: 3 Hours/Day",
            description="Our nursery program encourages children to think, explore, and ask questions. Learning is facilitated through multiple interactive 'learning stations' spread across the classroom, allowing kids to build their own learning path, develop pre-literacy, numeracy, and cooperative play habits.",
            content_json=json.dumps([
                "Encouraging active questioning and independent inquiry.",
                "Learning stations for personalized choices and hands-on activities.",
                "Structured pre-reading, pre-writing, and phonics readiness.",
                "Developing cognitive, math reasoning, and creative expressions."
            ]),
            media_url="/assets/images/program_preschool.jpg",
            is_active=True,
            sort_order=3
        ),
        models.PageSection(
            page_code="preschool_program",
            section_code="curriculum_pillars",
            title="The iCan Learning Pillars",
            subtitle="Innovative, Agile, and Child-Centric Pedagogy",
            description="The iCan Learning System is a research-based pedagogical framework that connects developmental statements directly to neuroscience research, Bloom's Taxonomy, and Howard Gardner's Multiple Intelligences theory. We move past rote learning to inspire innovators and leaders.",
            content_json=json.dumps([
                "9 Core Future Skills (collaboration, creativity, and problem-solving).",
                "15 Habits of Mind (persistence, independent thinking, and curiosity).",
                "STEAM theme-based experiential exploration projects.",
                "Integrated mathematics using the ELPS approach (Experience, Language, Picture, Symbol)."
            ]),
            media_url="/assets/images/curriculum_learning.png",
            is_active=True,
            sort_order=4
        )
    ]

    for sec in sections:
        db.add(sec)
    
    db.commit()
    db.close()
    print("PreSchooling sections seeded successfully in database!")

if __name__ == "__main__":
    seed_preschool()
