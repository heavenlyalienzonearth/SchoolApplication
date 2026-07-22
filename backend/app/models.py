from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Numeric
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
    two_factor_secret = Column(String(100), nullable=True)
    two_factor_enabled = Column(Boolean, default=False, nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="SET NULL"), nullable=True)
    photo_url = Column(String(255), nullable=True)
    cv_url = Column(String(500), nullable=True)
    education = Column(Text, nullable=True)
    experience = Column(Text, nullable=True)
    achievements = Column(Text, nullable=True)
    assigned_program_id = Column(Integer, ForeignKey("programs.id", ondelete="SET NULL"), nullable=True)

    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    student = relationship("Student", foreign_keys=[student_id])
    assigned_program = relationship("Program", foreign_keys=[assigned_program_id])
    teacher_achievements = relationship("TeacherAchievement", back_populates="teacher", cascade="all, delete-orphan")

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String(500), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_revoked = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="refresh_tokens")

class TeacherAchievement(Base):
    __tablename__ = "teacher_achievements"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    date = Column(String(50), nullable=False)
    certificate_url = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    teacher = relationship("User", back_populates="teacher_achievements")

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
    weekly_plan_json = Column(Text, nullable=True)  # JSON-encoded weekly schedule (study, physical, games)
    uniform_items_json = Column(Text, nullable=True)  # JSON-encoded list of configurable supplies
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

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    parent_name = Column(String(255), nullable=False)
    phone = Column(String(100), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    allergies = Column(String(255), nullable=True) # e.g. "Dairy, Eggs, Peanuts"
    photo_url = Column(String(255), nullable=True)
    issued_items_json = Column(Text, nullable=True)
    blood_group = Column(String(50), nullable=True)
    emergency_phone = Column(String(100), nullable=True)
    date_of_birth = Column(String(50), nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    program = relationship("Program")
    teacher = relationship("User", foreign_keys=[teacher_id])

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    date = Column(String(50), nullable=False)  # YYYY-MM-DD
    status = Column(String(50), nullable=False)  # PRESENT, ABSENT, LATE
    notes = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student")

class Vaccination(Base):
    __tablename__ = "vaccinations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    age_group = Column(String(255), nullable=False)

class Admission(Base):
    __tablename__ = "admissions"

    id = Column(Integer, primary_key=True, index=True)
    child_name = Column(String(255), nullable=False)
    parent_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(100), nullable=False)
    date_of_birth = Column(String(100), nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    allergies = Column(String(255), nullable=True)
    photo_url = Column(String(255), nullable=True)
    issued_items_json = Column(Text, nullable=True)
    blood_group = Column(String(50), nullable=True)
    emergency_phone = Column(String(100), nullable=True)
    status = Column(String(50), default="NEW", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    program = relationship("Program")

class AdmissionVaccination(Base):
    __tablename__ = "admission_vaccinations"

    id = Column(Integer, primary_key=True, index=True)
    admission_id = Column(Integer, ForeignKey("admissions.id", ondelete="CASCADE"), nullable=False)
    vaccination_id = Column(Integer, ForeignKey("vaccinations.id", ondelete="CASCADE"), nullable=False)
    administered_date = Column(String(100), nullable=False)

    admission = relationship("Admission", back_populates="vaccinations")
    vaccination = relationship("Vaccination")

Admission.vaccinations = relationship("AdmissionVaccination", back_populates="admission", cascade="all, delete-orphan")

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    holiday_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    year = Column(Integer, nullable=False, index=True)
    category = Column(String(100), default="National Holiday", nullable=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class Circular(Base):
    __tablename__ = "circulars"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="SET NULL"), nullable=True)
    attachment_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    program = relationship("Program")

class LibraryBook(Base):
    __tablename__ = "library_books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=False)
    isbn = Column(String(100), nullable=True)
    category = Column(String(100), nullable=False)
    total_copies = Column(Integer, default=1, nullable=False)
    available_copies = Column(Integer, default=1, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class LibraryBorrow(Base):
    __tablename__ = "library_borrows"

    id = Column(Integer, primary_key=True, index=True)
    book_id = Column(Integer, ForeignKey("library_books.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    borrow_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    due_date = Column(String(50), nullable=False)     # YYYY-MM-DD
    return_date = Column(String(50), nullable=True)  # YYYY-MM-DD
    status = Column(String(50), default="Borrowed", nullable=False)  # Borrowed, Returned
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    book = relationship("LibraryBook")
    student = relationship("Student")

class StationaryItem(Base):
    __tablename__ = "stationary_items"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    stationery_type = Column(String(50), default="school", nullable=False)  # school | teacher | student
    order_date = Column(DateTime, nullable=True)
    total_amount = Column(Numeric(10, 2), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class StationaryOrder(Base):
    __tablename__ = "stationary_orders"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String(255), nullable=True)
    class_name = Column(String(100), nullable=True)
    order_date = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(String(50), default="Pending", nullable=False)  # Pending, Dispatched, Delivered
    payment_status = Column(String(50), default="Unpaid", nullable=False)  # Unpaid, Paid
    reimbursement_status = Column(String(50), nullable=True)  # None, Pending, Approved, Rejected
    total_price = Column(Numeric(10, 2), nullable=False)
    created_by_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    created_by = relationship("User")
    items = relationship("StationaryOrderItem", back_populates="order", cascade="all, delete-orphan")

class StationaryOrderItem(Base):
    __tablename__ = "stationary_order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("stationary_orders.id", ondelete="CASCADE"), nullable=False)
    item_id = Column(Integer, ForeignKey("stationary_items.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)

    order = relationship("StationaryOrder", back_populates="items")
    item = relationship("StationaryItem")

class ParentBill(Base):
    __tablename__ = "parent_bills"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    due_date = Column(String(50), nullable=False)
    status = Column(String(50), default="Unpaid", nullable=False)  # Paid, Unpaid
    paid_date = Column(DateTime, nullable=True)
    payment_method = Column(String(50), nullable=True)
    receipt_no = Column(String(100), nullable=True)
    waiver_amount = Column(Numeric(10, 2), default=0.00, nullable=False)
    waiver_approved_by = Column(String(100), nullable=True)
    waiver_date = Column(String(50), nullable=True)
    waiver_file_url = Column(String(255), nullable=True)
    notes = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student")

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # Tuition, Transport, Uniforms, Other
    amount = Column(Numeric(10, 2), nullable=False)
    frequency = Column(String(50), default="Termly", nullable=False)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    program = relationship("Program")

class ParentMilestone(Base):
    __tablename__ = "parent_milestones"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    milestone_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # Cognitive, Physical, Emotional
    status = Column(String(50), default="Not Started", nullable=False)  # Completed, In Progress, Not Started
    completed_date = Column(String(50), nullable=True)
    teacher_comments = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student")

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    start_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    end_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    reason = Column(String(550), nullable=True)
    status = Column(String(50), default="Approved", nullable=False)
    admin_comment = Column(String(550), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student")

class MealSuspensionRequest(Base):
    __tablename__ = "meal_suspension_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    request_date = Column(String(50), nullable=False)  # YYYY-MM-DD
    reason = Column(String(550), nullable=True)
    status = Column(String(50), default="Pending", nullable=False)  # Pending, Acknowledged
    acknowledged_by = Column(String(100), nullable=True)
    acknowledged_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student")


class MilestoneTemplate(Base):
    __tablename__ = "milestone_templates"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    milestone_name = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)  # Cognitive, Physical, Emotional
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    program = relationship("Program")

class StudentDailyMoment(Base):
    __tablename__ = "student_daily_moments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_type = Column(String(50), nullable=False)  # image or video
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    student = relationship("Student")
    teacher = relationship("User")

class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    day_of_week = Column(String(50), nullable=False)  # Monday, Tuesday, etc.
    meal_type = Column(String(50), nullable=False)    # Breakfast, Lunch, Snack
    menu_item = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    allergens = Column(String(255), nullable=True)     # e.g. "Dairy, Nuts"
    calories = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class VisitorLog(Base):
    __tablename__ = "visitor_logs"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String(100), nullable=True, index=True)
    method = Column(String(10), nullable=True)
    endpoint = Column(String(500), nullable=True)
    status_code = Column(Integer, nullable=True)
    user_agent = Column(String(500), nullable=True)
    browser = Column(String(100), nullable=True)
    browser_version = Column(String(50), nullable=True)
    os = Column(String(100), nullable=True)
    device_type = Column(String(50), nullable=True)   # desktop, mobile, tablet, bot
    referer = Column(String(500), nullable=True)
    # Geo fields populated async from ip-api.com
    country = Column(String(100), nullable=True)
    country_code = Column(String(10), nullable=True)
    region = Column(String(100), nullable=True)
    city = Column(String(100), nullable=True)
    latitude = Column(String(30), nullable=True)
    longitude = Column(String(30), nullable=True)
    timezone = Column(String(100), nullable=True)
    isp = Column(String(255), nullable=True)
    is_proxy = Column(Boolean, default=False, nullable=True)
    geo_fetched = Column(Boolean, default=False, nullable=False)
    visited_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)


class FeaturePermission(Base):
    __tablename__ = "feature_permissions"

    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(50), nullable=False, index=True)
    feature = Column(String(50), nullable=False, index=True)
    is_enabled = Column(Boolean, default=True, nullable=False)


class ClassAssignment(Base):
    __tablename__ = "class_assignments"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("programs.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    files_json = Column(Text, nullable=False)  # JSON list of relative file paths
    date = Column(String(50), nullable=False)   # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    program = relationship("Program")
    teacher = relationship("User")


class StudentKudos(Base):
    __tablename__ = "student_kudos"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    badge_type = Column(String(100), nullable=False)
    badge_title = Column(String(255), nullable=False)
    comment = Column(Text, nullable=True)
    awarded_date = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student")
    teacher = relationship("User")


class StudentIncidentLog(Base):
    __tablename__ = "student_incident_logs"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    category = Column(String(100), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    action_taken = Column(Text, nullable=True)
    severity = Column(String(50), default="LOW", nullable=False)
    parent_acknowledged = Column(Boolean, default=False, nullable=False)
    log_date = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    student = relationship("Student")
    teacher = relationship("User")



