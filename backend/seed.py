import json
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.core.database import Base
from app.core.security import get_password_hash
from app import models

def create_database_if_not_exists():
    from sqlalchemy.engine import make_url
    db_url = settings.DATABASE_URL
    url_obj = make_url(db_url)
    db_name = url_obj.database
    
    # Connect to master database first to check/create the target database
    master_url = url_obj.set(database="master").render_as_string(hide_password=False)
    
    print(f"Checking if database '{db_name}' exists on SQL Server...")
    engine_master = create_engine(master_url, connect_args={"autocommit": True})
    
    # Check sys.databases
    with engine_master.connect() as conn:
        result = conn.execute(text(f"SELECT database_id FROM sys.databases WHERE name = '{db_name}'")).fetchone()
        if not result:
            print(f"Database '{db_name}' does not exist. Creating database...")
            conn.execute(text(f"CREATE DATABASE {db_name}"))
            print(f"Database '{db_name}' created successfully.")
        else:
            print(f"Database '{db_name}' already exists.")
    engine_master.dispose()

def seed_data():
    create_database_if_not_exists()
    
    engine = create_engine(settings.DATABASE_URL)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    db = Session()
    
    print("Seeding default data...")
    
    # 1. Seed admin user if not exists
    admin_email = "admin@school.com"
    admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
    if not admin_user:
        hashed_pw = get_password_hash("Admin@123")
        admin_user = models.User(
            email=admin_email,
            hashed_password=hashed_pw,
            full_name="School Administrator",
            role="ADMIN",
            is_active=True
        )
        db.add(admin_user)
        print(f"Created default admin user: {admin_email} (Password: Admin@123)")
    else:
        print("Admin user already exists.")

    # 2. Seed site settings if empty
    settings_count = db.query(models.SiteSetting).count()
    if settings_count == 0:
        default_settings = [
            # General
            ("site_name", "Vidyankuram Club International School", "general"),
            ("site_logo", "/assets/images/logo.png", "general"),
            ("footer_text", "© 2026 Vidyankuram Club International School. All rights reserved.", "general"),
            ("primary_color", "#EE5A24", "theme"), # Coral
            ("secondary_color", "#FFD23F", "theme"), # Yellow
            ("accent_color", "#0652DD", "theme"), # Navy blue
            ("background_color", "#F8EFBA", "theme"), # Cream
            ("font_family", "'Quicksand', sans-serif", "theme"),
            
            # Contact
            ("contact_phone", "+91 98765 43210", "contact"),
            ("contact_email", "admissions@vidyankuramclub.in", "contact"),
            ("address", "123 Kid's Avenue, Sunshine Valley, Mumbai, India", "contact"),
            ("opening_hours", "Mon - Fri: 8:00 AM - 4:00 PM, Sat: 9:00 AM - 1:00 PM", "contact"),
            
            # Socials
            ("facebook_url", "https://facebook.com", "social"),
            ("instagram_url", "https://instagram.com", "social"),
            ("twitter_url", "https://twitter.com", "social"),
            ("youtube_url", "https://youtube.com", "social")
        ]
        for key, val, cat in default_settings:
            db.add(models.SiteSetting(config_key=key, config_value=val, category=cat))
        print("Seeded global site settings.")

    # 3. Seed Page Sections if empty
    sections_count = db.query(models.PageSection).count()
    if sections_count == 0:
        hero_slides = [
            {
                "title": "Welcome to Vidyankuram Club",
                "subtitle": "Nurturing Curious Minds, Shaping Brighter Futures",
                "image": "/assets/images/hero_kids_learning.jpg",
                "cta_text": "Apply Now",
                "cta_link": "/admissions"
            },
            {
                "title": "Holistic Child Development",
                "subtitle": "Active learning methods that spark creativity and independence",
                "image": "/assets/images/gallery_play.jpg",
                "cta_text": "Explore Curriculum",
                "cta_link": "/curriculum"
            }
        ]
        
        about_features = [
            {"title": "Safe & Secure", "desc": "CCTV monitored campuses and trained support staff."},
            {"title": "Expert Educators", "desc": "Highly qualified teachers specialized in early childhood education."},
            {"title": "Dynamic Playgrounds", "desc": "Vast outdoor play spaces to develop motor and social skills."},
            {"title": "Creative Curriculum", "desc": "Integrating arts, crafts, music, and science experiment play."}
        ]
        
        sections = [
            models.PageSection(
                page_code="home",
                section_code="hero",
                title="Igniting the Joy of Learning",
                subtitle="Best Preschool Experience for your Little Ones",
                description="We offer a child-centered approach that develops key cognitive, motor, social, and emotional skills.",
                content_json=json.dumps(hero_slides),
                media_url="/assets/images/hero_kids_learning.jpg",
                sort_order=1
            ),
            models.PageSection(
                page_code="home",
                section_code="about",
                title="About Vidyankuram Club",
                subtitle="Where learning meets playing, and dreams take flight",
                description="Established with a vision to revolutionize early childhood education, Vidyankuram Club provides a nurturing environment where children are encouraged to ask questions, explore their surroundings, and discover their unique talents.",
                content_json=json.dumps(about_features),
                media_url="/assets/images/gallery_science.jpg",
                sort_order=2
            ),
            models.PageSection(
                page_code="home",
                section_code="programs",
                title="Our Programs",
                subtitle="Tailored learning pathways for every developmental milestone",
                description="Our curriculum is carefully structured across multiple age groups to ensure optimal growth and happy school memories.",
                sort_order=3
            ),
            models.PageSection(
                page_code="home",
                section_code="gallery",
                title="Glimpses of Vidyankuram Club",
                subtitle="Take a visual tour of our vibrant classrooms and active play areas",
                description="A peak into the daily activities, school celebrations, and learning projects done by our little achievers.",
                sort_order=4
            ),
            models.PageSection(
                page_code="home",
                section_code="testimonials",
                title="What Parents Say",
                subtitle="Hear directly from families about their Vidyankuram Club experience",
                description="Nothing speaks louder than the trust and testimonials of our loving parents.",
                sort_order=5
            ),
            models.PageSection(
                page_code="home",
                section_code="events",
                title="Upcoming School Events",
                subtitle="Stay updated with our latest learning and social activities",
                description="Join us in celebrating child milestones, open house exhibitions, and seasonal carnivals.",
                sort_order=6
            ),
            models.PageSection(
                page_code="home",
                section_code="blogs",
                title="Educational Insights & Blogs",
                subtitle="Parenting tips, early learning advice, and school highlights",
                description="Read articles written by our expert child educators to support your child's growth path at home.",
                sort_order=7
            ),
            models.PageSection(
                page_code="home",
                section_code="contact",
                title="Get in Touch",
                subtitle="Have queries? We are here to help you register or answer questions",
                description="Fill the form to request a campus tour, download brochures, or book a free trial class.",
                sort_order=8
            )
        ]
        for sec in sections:
            db.add(sec)
        print("Seeded page sections.")

    # 4. Seed Programs if empty
    programs_count = db.query(models.Program).count()
    if programs_count == 0:
        p_highlights = [
            ["Sensory play activities", "Basic social behavior", "Language development", "Parent-child bonding"],
            ["Phonics introduction", "Pre-writing activities", "Simple counting games", "Art & Craft sessions"],
            ["Advanced reading & spelling", "Basic mathematics & logic", "Environmental studies", "Show & Tell public speaking"],
            ["Safe nap environments", "Healthy hot meals", "Interactive storytelling", "Supervised playtime"]
        ]
        
        programs = [
            models.Program(
                title="Toddler Program (Toddlers Club)",
                age_group="1.5 - 2.5 Years",
                duration="2 Hours / Day",
                description="Focuses on sensory exploration, building confidence, fine motor skills, and simple language expansion through fun activities.",
                highlights_json=json.dumps(p_highlights[0]),
                image_url="/assets/images/program_toddler.jpg",
                sort_order=1
            ),
            models.Program(
                title="Preschool (Junior Vidyankurams)",
                age_group="2.5 - 3.5 Years",
                duration="3 Hours / Day",
                description="Introduces structured group activities, phonics, basic numeracy, writing readiness, and social-emotional growth.",
                highlights_json=json.dumps(p_highlights[1]),
                image_url="/assets/images/program_preschool.jpg",
                sort_order=2
            ),
            models.Program(
                title="Kindergarten (Senior Vidyankurams)",
                age_group="3.5 - 5.5 Years",
                duration="4 Hours / Day",
                description="Prepares children for primary school with core reading, writing, mathematical concepts, scientific curiosity, and team skills.",
                highlights_json=json.dumps(p_highlights[2]),
                image_url="/assets/images/program_kindergarten.jpg",
                sort_order=3
            ),
            models.Program(
                title="Day Care / After School Care",
                age_group="2.0 - 8.0 Years",
                duration="Flexible Hours",
                description="A safe, clean, and engaging home away from home with healthy snacks, nap time, homework assistance, and creative activities.",
                highlights_json=json.dumps(p_highlights[3]),
                image_url="/assets/images/gallery_play.jpg",
                sort_order=4
            )
        ]
        for prog in programs:
            db.add(prog)
        print("Seeded school programs.")

    # 5. Seed Testimonials if empty
    testimonials_count = db.query(models.Testimonial).count()
    if testimonials_count == 0:
        testimonials = [
            models.Testimonial(
                author_name="Mrs. Shalini Mehta",
                author_role="Mother of Vivaan (Preschool)",
                quote="Sending Vivaan to Vidyankuram Club was the best decision we made. Within months, we saw massive improvement in his speech and how he interacts with other children. The teachers are incredibly warm and patient.",
                rating=5,
                image_url="/assets/images/parent_avatar1.jpg",
                sort_order=1
            ),
            models.Testimonial(
                author_name="Mr. Rajesh Iyer",
                author_role="Father of Aarav (Kindergarten)",
                quote="The curriculum here is outstanding. It is not just about rote learning; they teach concepts through experiments, play, and stories. The security measures and daily updates give us absolute peace of mind.",
                rating=5,
                image_url="/assets/images/parent_avatar2.jpg",
                sort_order=2
            )
        ]
        for test in testimonials:
            db.add(test)
        print("Seeded parent testimonials.")

    # 6. Seed Gallery Items if empty
    gallery_count = db.query(models.GalleryItem).count()
    if gallery_count == 0:
        gallery_items = [
            models.GalleryItem(title="Vibrant Classroom Setup", media_url="/assets/images/hero_kids_learning.jpg", category="Classrooms", sort_order=1),
            models.GalleryItem(title="Outdoor Fun and Slides", media_url="/assets/images/gallery_play.jpg", category="Play Area", sort_order=2),
            models.GalleryItem(title="Interactive Science Experiment", media_url="/assets/images/gallery_science.jpg", category="Activities", sort_order=3),
            models.GalleryItem(title="Toddler Block Construction", media_url="/assets/images/program_toddler.jpg", category="Classrooms", sort_order=4),
            models.GalleryItem(title="Finger Painting Session", media_url="/assets/images/program_preschool.jpg", category="Activities", sort_order=5),
            models.GalleryItem(title="Reading Circle Time", media_url="/assets/images/program_kindergarten.jpg", category="Classrooms", sort_order=6)
        ]
        for gi in gallery_items:
            db.add(gi)
        print("Seeded gallery items.")

    # 7. Seed Events if empty
    events_count = db.query(models.Event).count()
    if events_count == 0:
        events = [
            models.Event(
                title="Annual Parents Orientation & High Tea",
                description="An interactive session for parents to meet class teachers, understand the curriculum structure, and discuss milestones.",
                event_date=datetime.now() + timedelta(days=15),
                location="School Main Auditorium",
                image_url="/assets/images/hero_kids_learning.jpg"
            ),
            models.Event(
                title="Monsoon Splash Carnival 2026",
                description="A fun-filled event with water games, splash pools, rain dance, and delicious snack stalls for children and parents.",
                event_date=datetime.now() + timedelta(days=30),
                location="School Open Turf Ground",
                image_url="/assets/images/gallery_play.jpg"
            )
        ]
        for ev in events:
            db.add(ev)
        print("Seeded upcoming school events.")

    # 8. Seed Blogs if empty
    blogs_count = db.query(models.Blog).count()
    if blogs_count == 0:
        blogs = [
            models.Blog(
                title="Unlocking Creativity in Early Childhood",
                slug="unlocking-creativity-early-childhood",
                summary="Discover why free play, arts, and sensory activities are critical for building neural connections in toddlers.",
                content="<p>Early childhood is a period of rapid brain development. Research shows that child-led creative activities promote problem-solving skills, emotional regulation, and fine motor abilities.</p><h4>Why Play Matters</h4><p>When children engage in painting or modeling clay, they are not just having fun; they are experimenting with cause and effect, weight, texture, and spatial awareness.</p><p>We encourage parents to provide open-ended toys and limit screen time to foster authentic imagination.</p>",
                author_name="Ms. Clara Oswald (Child Psychologist)",
                category="Parenting Tips",
                image_url="/assets/images/program_preschool.jpg",
                is_published=True,
                published_at=datetime.utcnow() - timedelta(days=5)
            ),
            models.Blog(
                title="The Power of Phonics in Reading Success",
                slug="power-of-phonics-reading-success",
                summary="A guide on how phonics helps young readers decode new words and gain absolute reading independence.",
                content="<p>Phonics teaches children the relationship between letters and sounds. Mastering this link gives kids the confidence to read unfamiliar words easily.</p><h4>Fun Phonics Games to Try at Home:</h4><ul><li>Letter Hunt: Find items in the room starting with the 'B' sound.</li><li>Sound Blending: Say letters slowly (C-A-T) and ask them to guess the animal.</li></ul>",
                author_name="Mrs. Shalini Sharma (Senior Coordinator)",
                category="Early Education",
                image_url="/assets/images/program_kindergarten.jpg",
                is_published=True,
                published_at=datetime.utcnow() - timedelta(days=2)
            )
        ]
        for blog in blogs:
            db.add(blog)
        print("Seeded default blog posts.")

    # 9. Seed FAQs if empty
    faqs_count = db.query(models.FAQ).count()
    if faqs_count == 0:
        faqs = [
            models.FAQ(question="What is the student-to-teacher ratio?", answer="We maintain an optimal ratio of 10:1 for Toddlers and 12:1 for Kindergarten, each assisted by a qualified helper.", category="Admissions", sort_order=1),
            models.FAQ(question="Do you offer school transportation?", answer="Yes, we provide safe, air-conditioned school buses with CCTV cameras, GPS tracking, and female bus attendants.", category="Facilities", sort_order=2),
            models.FAQ(question="How do you handle medical emergencies?", answer="We have an in-house nurse, a fully stocked medical room, and a tied-up emergency response ambulance with nearby pediatric hospitals.", category="Safety", sort_order=3),
            models.FAQ(question="Is admissions open mid-term?", answer="Yes, admissions for Toddlers and Daycare are open throughout the year, subject to seat availability.", category="Admissions", sort_order=4)
        ]
        for faq in faqs:
            db.add(faq)
        print("Seeded school FAQs.")

    # 10. Seed Careers if empty
    careers_count = db.query(models.Career).count()
    if careers_count == 0:
        reqs = ["Montessori or ECCE certification required.", "Minimum 2 years of experience in preschool coaching.", "Excellent verbal and written communication skills in English.", "Loving, patient, and child-friendly attitude."]
        careers = [
            models.Career(
                title="Early Childhood Teacher (Preschool)",
                department="Academics",
                location="Mumbai Center",
                description="We are looking for passionate, certified educators who love teaching toddlers and preschool kids. You will lead lesson activities, observe student milestones, and maintain regular communication with parents.",
                requirements_json=json.dumps(reqs),
                is_active=True
            ),
            models.Career(
                title="School Day Care Supervisor",
                department="Administration",
                location="Mumbai Center",
                description="Responsible for managing the afternoon daycare program, supervising daycare aides, planning healthy snacks, and organizing fun games/naps for children.",
                requirements_json=json.dumps(["Experience in childcare or school administration.", "First aid and CPR certification.", "Strong organization skills."]),
                is_active=True
            )
        ]
        for car in careers:
            db.add(car)
        print("Seeded job openings.")

    db.commit()
    db.close()
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_data()
