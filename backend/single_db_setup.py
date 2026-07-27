import json
from datetime import datetime

from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.core.database import Base
from app.core.security import get_password_hash
from app import models


def ensure_database_exists() -> None:
    db_url = settings.DATABASE_URL
    url_obj = make_url(db_url)
    db_name = url_obj.database

    if not db_name:
        raise RuntimeError("DATABASE_URL must include a database name.")

    master_url = url_obj.set(database="master").render_as_string(hide_password=False)

    print(f"[DB] Ensuring database '{db_name}' exists...")
    engine_master = create_engine(master_url, connect_args={"autocommit": True})
    try:
        with engine_master.connect() as conn:
            result = conn.execute(text(f"SELECT database_id FROM sys.databases WHERE name = '{db_name}'")).fetchone()
            if not result:
                conn.execute(text(f"CREATE DATABASE {db_name}"))
                print(f"[DB] Created database '{db_name}'.")
            else:
                print(f"[DB] Database '{db_name}' already exists.")
    finally:
        engine_master.dispose()


def seed_core_data(db) -> None:
    print("[Seed] Seeding core default data...")

    admin_email = settings.SUPERADMIN_EMAIL
    admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin_user:
        admin_user = models.User(
            email=admin_email,
            hashed_password=get_password_hash(settings.SUPERADMIN_PASSWORD),
            full_name="School Administrator",
            role="ADMIN",
            is_active=True,
        )
        db.add(admin_user)
        print(f"[Seed] Created admin user '{admin_email}'.")
    else:
        print(f"[Seed] Admin user '{admin_email}' already exists.")

    if db.query(models.SiteSetting).count() == 0:
        default_settings = [
            ("site_name", "Vidyankuram Club International School", "general"),
            ("site_logo", "/assets/images/logo.png", "general"),
            ("footer_text", "© 2026 Vidyankuram Club International School. All rights reserved.", "general"),
            ("primary_color", "#EE5A24", "theme"),
            ("secondary_color", "#FFD23F", "theme"),
            ("accent_color", "#0652DD", "theme"),
            ("background_color", "#F8EFBA", "theme"),
            ("font_family", "'Quicksand', sans-serif", "theme"),
            ("contact_phone", "+91 98765 43210", "contact"),
            ("contact_email", "admissions@vidyankuramclub.in", "contact"),
            ("address", "123 Kid's Avenue, Sunshine Valley, Mumbai, India", "contact"),
            ("opening_hours", "Mon - Fri: 8:00 AM - 4:00 PM, Sat: 9:00 AM - 1:00 PM", "contact"),
            ("facebook_url", "https://facebook.com", "social"),
            ("instagram_url", "https://instagram.com", "social"),
            ("twitter_url", "https://twitter.com", "social"),
            ("youtube_url", "https://youtube.com", "social"),
        ]
        for key, value, category in default_settings:
            db.add(models.SiteSetting(config_key=key, config_value=value, category=category))
        print("[Seed] Seeded site settings.")

    if db.query(models.PageSection).count() == 0:
        hero_slides = [
            {
                "title": "Welcome to Vidyankuram Club",
                "subtitle": "Nurturing Curious Minds, Shaping Brighter Futures",
                "image": "/assets/images/hero_kids_learning.jpg",
                "cta_text": "Apply Now",
                "cta_link": "/admissions",
            },
            {
                "title": "Holistic Child Development",
                "subtitle": "Active learning methods that spark creativity and independence",
                "image": "/assets/images/gallery_play.jpg",
                "cta_text": "Explore Curriculum",
                "cta_link": "/curriculum",
            },
        ]
        about_features = [
            {"title": "Safe & Secure", "desc": "CCTV monitored campuses and trained support staff."},
            {"title": "Expert Educators", "desc": "Highly qualified teachers specialized in early childhood education."},
            {"title": "Dynamic Playgrounds", "desc": "Vast outdoor play spaces to develop motor and social skills."},
            {"title": "Creative Curriculum", "desc": "Integrating arts, crafts, music, and science experiment play."},
        ]
        sections = [
            models.PageSection(page_code="home", section_code="hero", title="Igniting the Joy of Learning", subtitle="Best Preschool Experience for your Little Ones", description="We offer a child-centered approach that develops key cognitive, motor, social, and emotional skills.", content_json=json.dumps(hero_slides), media_url="/assets/images/hero_kids_learning.jpg", sort_order=1),
            models.PageSection(page_code="home", section_code="about", title="About Vidyankuram Club", subtitle="Where learning meets playing, and dreams take flight", description="Established with a vision to revolutionize early childhood education, Vidyankuram Club provides a nurturing environment where children are encouraged to ask questions, explore their surroundings, and discover their unique talents.", content_json=json.dumps(about_features), media_url="/assets/images/gallery_science.jpg", sort_order=2),
            models.PageSection(page_code="home", section_code="programs", title="Our Programs", subtitle="Tailored learning pathways for every developmental milestone", description="Our curriculum is carefully structured across multiple age groups to ensure optimal growth and happy school memories.", sort_order=3),
            models.PageSection(page_code="home", section_code="gallery", title="Glimpses of Vidyankuram Club", subtitle="Take a visual tour of our vibrant classrooms and active play areas", description="A peak into the daily activities, school celebrations, and learning projects done by our little achievers.", sort_order=4),
            models.PageSection(page_code="home", section_code="testimonials", title="What Parents Say", subtitle="Hear directly from families about their Vidyankuram Club experience", description="Nothing speaks louder than the trust and testimonials of our loving parents.", sort_order=5),
            models.PageSection(page_code="home", section_code="events", title="Upcoming School Events", subtitle="Stay updated with our latest learning and social activities", description="Join us in celebrating child milestones, open house exhibitions, and seasonal carnivals.", sort_order=6),
            models.PageSection(page_code="home", section_code="blogs", title="Educational Insights & Blogs", subtitle="Parenting tips, early learning advice, and school highlights", description="Read articles written by our expert child educators to support your child's growth path at home.", sort_order=7),
            models.PageSection(page_code="home", section_code="contact", title="Get in Touch", subtitle="Have queries? We are here to help you register or answer questions", description="Fill the form to request a campus tour, download brochures, or book a free trial class.", sort_order=8),
        ]
        for section in sections:
            db.add(section)
        print("[Seed] Seeded home page sections.")

    if db.query(models.Program).count() == 0:
        programs = [
            models.Program(title="Toddler Program (Toddlers Club)", age_group="1.5 - 2.5 Years", duration="2 Hours / Day", description="Focuses on sensory exploration, building confidence, fine motor skills, and simple language expansion through fun activities.", highlights_json=json.dumps(["Sensory play activities", "Basic social behavior", "Language development", "Parent-child bonding"]), image_url="/assets/images/program_toddler.jpg", sort_order=1),
            models.Program(title="Preschool (Junior Vidyankurams)", age_group="2.5 - 3.5 Years", duration="3 Hours / Day", description="Introduces structured group activities, phonics, basic numeracy, writing readiness, and social-emotional growth.", highlights_json=json.dumps(["Phonics introduction", "Pre-writing activities", "Simple counting games", "Art & Craft sessions"]), image_url="/assets/images/program_preschool.jpg", sort_order=2),
            models.Program(title="Kindergarten (Senior Vidyankurams)", age_group="3.5 - 5.5 Years", duration="4 Hours / Day", description="Prepares children for primary school with core reading, writing, mathematical concepts, scientific curiosity, and team skills.", highlights_json=json.dumps(["Advanced reading & spelling", "Basic mathematics & logic", "Environmental studies", "Show & Tell public speaking"]), image_url="/assets/images/program_kindergarten.jpg", sort_order=3),
            models.Program(title="Day Care / After School Care", age_group="2.0 - 8.0 Years", duration="Flexible Hours", description="A safe, clean, and engaging home away from home with healthy snacks, nap time, homework assistance, and creative activities.", highlights_json=json.dumps(["Safe nap environments", "Healthy hot meals", "Interactive storytelling", "Supervised playtime"]), image_url="/assets/images/gallery_play.jpg", sort_order=4),
        ]
        for program in programs:
            db.add(program)
        print("[Seed] Seeded school programs.")

    if db.query(models.Testimonial).count() == 0:
        testimonials = [
            models.Testimonial(author_name="Mrs. Shalini Mehta", author_role="Mother of Vivaan (Preschool)", quote="Sending Vivaan to Vidyankuram Club was the best decision we made. Within months, we saw massive improvement in his speech and how he interacts with other children. The teachers are incredibly warm and patient.", rating=5, image_url="/assets/images/parent_avatar1.jpg", sort_order=1),
            models.Testimonial(author_name="Mr. Rajesh Iyer", author_role="Father of Aarav (Kindergarten)", quote="The curriculum here is outstanding. It is not just about rote learning; they teach concepts through experiments, play, and stories. The security measures and daily updates give us absolute peace of mind.", rating=5, image_url="/assets/images/parent_avatar2.jpg", sort_order=2),
        ]
        for testimonial in testimonials:
            db.add(testimonial)
        print("[Seed] Seeded testimonials.")

    if db.query(models.FAQ).count() == 0:
        faqs = [
            models.FAQ(question="What age groups do you cater to?", answer="We welcome children starting from 1.5 years through young learners up to 5.5 years.", category="General", sort_order=1),
            models.FAQ(question="Do you provide transport services?", answer="Yes, transport services can be arranged based on route availability and location.", category="General", sort_order=2),
            models.FAQ(question="How do I apply for admission?", answer="You can submit an admission form online or visit the campus for a guided tour.", category="Admissions", sort_order=3),
        ]
        for faq in faqs:
            db.add(faq)
        print("[Seed] Seeded FAQs.")

    if db.query(models.GalleryItem).count() == 0:
        gallery_items = [
            models.GalleryItem(title="Classroom Learning", media_url="/assets/images/gallery_science.jpg", media_type="IMAGE", category="classroom", sort_order=1),
            models.GalleryItem(title="Playground Time", media_url="/assets/images/gallery_play.jpg", media_type="IMAGE", category="sports", sort_order=2),
        ]
        for item in gallery_items:
            db.add(item)
        print("[Seed] Seeded gallery items.")

    if db.query(models.Event).count() == 0:
        events = [
            models.Event(title="Open House", description="Meet the teachers and explore the campus.", event_date=datetime.utcnow(), location="Campus", image_url="/assets/images/hero_kids_learning.jpg", is_active=True),
            models.Event(title="Parent Orientation", description="Learn about our teaching approach and daily routines.", event_date=datetime.utcnow(), location="Main Hall", image_url="/assets/images/gallery_play.jpg", is_active=True),
        ]
        for event in events:
            db.add(event)
        print("[Seed] Seeded events.")

    if db.query(models.Blog).count() == 0:
        blogs = [
            models.Blog(title="Why Play Matters in Early Learning", slug="why-play-matters", summary="The role of play in child development.", content="Play supports creativity, confidence, and cognitive growth.", author_name="School Team", category="Education", image_url="/assets/images/gallery_play.jpg", is_published=True),
        ]
        for blog in blogs:
            db.add(blog)
        print("[Seed] Seeded initial blog post.")


def seed_preschool_content(db) -> None:
    existing_sections = db.query(models.PageSection).filter(models.PageSection.page_code == "preschool_program").all()
    if existing_sections:
        print("[Seed] Preschool sections already present; skipping.")
        return

    sections = [
        models.PageSection(page_code="preschool_program", section_code="preschool_hero", title="Preschooling Programme", subtitle="The iCan Learning System", description="Nurturing young minds through experiential play and a future-ready curriculum designed for holistic early childhood development.", media_url="/assets/images/program_preschool.jpg", is_active=True, sort_order=1),
        models.PageSection(page_code="preschool_program", section_code="playgroup_info", title="Playgroup Programme", subtitle="Ages: 1.5 - 2.5 Years | Duration: 2.5 Hours/Day", description="Our playgroup program focuses on laying a strong foundation by introducing basic language, math, and science concepts through engaging activities like art, music, dance, and play.", content_json=json.dumps(["Sensory play and tactile exploration activities.", "Language and math concept introduction via music and stories.", "Development of gross and fine motor coordination milestones.", "Warm, secure environment designed to ease home-to-school transition."]), media_url="/assets/images/program_toddler.jpg", is_active=True, sort_order=2),
        models.PageSection(page_code="preschool_program", section_code="nursery_info", title="Nursery Programme", subtitle="Ages: 2.5 - 3.5 Years | Duration: 3 Hours/Day", description="Our nursery program encourages children to think, explore, and ask questions.", content_json=json.dumps(["Encouraging active questioning and independent inquiry.", "Learning stations for personalized choices and hands-on activities.", "Structured pre-reading, pre-writing, and phonics readiness.", "Developing cognitive, math reasoning, and creative expressions."]), media_url="/assets/images/program_preschool.jpg", is_active=True, sort_order=3),
        models.PageSection(page_code="preschool_program", section_code="curriculum_pillars", title="The iCan Learning Pillars", subtitle="Innovative, Agile, and Child-Centric Pedagogy", description="The iCan Learning System is a research-based pedagogical framework that connects developmental statements directly to neuroscience research, Bloom's Taxonomy, and Howard Gardner's Multiple Intelligences theory.", content_json=json.dumps(["9 Core Future Skills (collaboration, creativity, and problem-solving).", "15 Habits of Mind (persistence, independent thinking, and curiosity).", "STEAM theme-based experiential exploration projects.", "Integrated mathematics using the ELPS approach (Experience, Language, Picture, Symbol)."]), media_url="/assets/images/curriculum_learning.png", is_active=True, sort_order=4),
    ]
    for section in sections:
        db.add(section)
    print("[Seed] Seeded preschool program sections.")


def run_setup() -> None:
    ensure_database_exists()

    engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
    Base.metadata.create_all(engine)

    Session = sessionmaker(bind=engine)
    db = Session()
    try:
        seed_core_data(db)
        seed_preschool_content(db)
        db.commit()
        print("[DB] Schema created and seed data applied successfully.")
    except Exception as exc:
        db.rollback()
        raise exc
    finally:
        db.close()
        engine.dispose()


if __name__ == "__main__":
    run_setup()
