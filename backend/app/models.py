from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="ADMIN", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(500), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="refresh_tokens")

class SiteSetting(Base):
    __tablename__ = "site_settings"

    id = Column(Integer, primary_key=True, index=True)
    config_key = Column(String(255), unique=True, index=True, nullable=False)
    config_value = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)  # general, theme, contact, social

class PageSection(Base):
    __tablename__ = "page_sections"

    id = Column(Integer, primary_key=True, index=True)
    page_code = Column(String(100), nullable=False, index=True)  # home, about, admissions, franchise, etc.
    section_code = Column(String(100), nullable=False, index=True)  # hero, about, programs, testimonials, gallery, etc.
    title = Column(String(255), nullable=True)
    subtitle = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    content_json = Column(Text, nullable=True)  # JSON-encoded string for flexible parameters (slider items, key benefits, features)
    media_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

class Program(Base):
    __tablename__ = "programs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    age_group = Column(String(100), nullable=True)
    duration = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    highlights_json = Column(Text, nullable=True)  # JSON list of features / benefits
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

class Testimonial(Base):
    __tablename__ = "testimonials"

    id = Column(Integer, primary_key=True, index=True)
    author_name = Column(String(255), nullable=False)
    author_role = Column(String(255), nullable=True)  # e.g., 'Parent of Aarav'
    quote = Column(Text, nullable=False)
    rating = Column(Integer, default=5, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

class GalleryItem(Base):
    __tablename__ = "gallery_items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=True)
    media_url = Column(String(500), nullable=False)
    media_type = Column(String(50), default="IMAGE", nullable=False)  # IMAGE, VIDEO
    category = Column(String(100), nullable=False)  # classroom, sports, events, play_area
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_date = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Blog(Base):
    __tablename__ = "blogs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, index=True, nullable=False)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    author_name = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)
    image_url = Column(String(500), nullable=True)
    is_published = Column(Boolean, default=False, nullable=False)
    published_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class FAQ(Base):
    __tablename__ = "faqs"

    id = Column(Integer, primary_key=True, index=True)
    question = Column(String(500), nullable=False)
    answer = Column(Text, nullable=False)
    category = Column(String(100), default="General", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    sort_order = Column(Integer, default=0, nullable=False)

class Career(Base):
    __tablename__ = "careers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    department = Column(String(255), nullable=True)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=False)
    requirements_json = Column(Text, nullable=True)  # JSON-encoded array of requirements
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    applications = relationship("JobApplication", back_populates="career", cascade="all, delete-orphan")

class JobApplication(Base):
    __tablename__ = "job_applications"

    id = Column(Integer, primary_key=True, index=True)
    career_id = Column(Integer, ForeignKey("careers.id", ondelete="CASCADE"), nullable=False)
    applicant_name = Column(String(255), nullable=False)
    applicant_email = Column(String(255), nullable=False)
    applicant_phone = Column(String(100), nullable=False)
    resume_url = Column(String(500), nullable=True)
    cover_letter = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    career = relationship("Career", back_populates="applications")

class ContactSubmission(Base):
    __tablename__ = "contact_submissions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(100), nullable=False)
    subject = Column(String(255), nullable=True)
    message = Column(Text, nullable=False)
    status = Column(String(50), default="NEW", nullable=False)  # NEW, IN_PROGRESS, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class FranchiseInquiry(Base):
    __tablename__ = "franchise_inquiries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(100), nullable=False)
    city = Column(String(255), nullable=False)
    state = Column(String(255), nullable=False)
    investment_range = Column(String(100), nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String(50), default="NEW", nullable=False)  # NEW, IN_PROGRESS, RESOLVED
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
