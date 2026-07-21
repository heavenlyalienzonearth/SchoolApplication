from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field

# --- AUTH SCHEMAS ---

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "ADMIN"
    photo_url: Optional[str] = None
    cv_url: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    achievements: Optional[str] = None
    assigned_program_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    two_factor_enabled: bool
    student_id: Optional[int] = None
    permissions: Optional[List[str]] = None

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    captcha_id: str
    captcha_code: str

class CaptchaResponse(BaseModel):
    captcha_id: str
    captcha_svg: str

class RefreshRequest(BaseModel):
    refresh_token: str

class Token(BaseModel):
    access_token: Optional[str] = None
    refresh_token: Optional[str] = None
    token_type: str = "bearer"
    user: Optional[UserResponse] = None
    two_factor_required: bool = False
    two_factor_token: Optional[str] = None

class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code_url: str

class TwoFactorVerifySetupRequest(BaseModel):
    secret: str
    code: str

class TwoFactorDisableRequest(BaseModel):
    code: str

class TwoFactorLoginRequest(BaseModel):
    two_factor_token: str
    code: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None
    photo_url: Optional[str] = None
    cv_url: Optional[str] = None
    education: Optional[str] = None
    experience: Optional[str] = None
    achievements: Optional[str] = None
    assigned_program_id: Optional[int] = None

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

# --- SETTINGS SCHEMAS ---

class SiteSettingBase(BaseModel):
    config_key: str
    config_value: Optional[str] = None
    category: str

class SiteSettingResponse(SiteSettingBase):
    id: int

    class Config:
        from_attributes = True

class SiteSettingUpdate(BaseModel):
    config_value: Optional[str] = None

# --- PAGE SECTIONS SCHEMAS ---

class PageSectionBase(BaseModel):
    page_code: str
    section_code: str
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    content_json: Optional[str] = None
    media_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class PageSectionResponse(PageSectionBase):
    id: int

    class Config:
        from_attributes = True

class PageSectionUpdate(BaseModel):
    title: Optional[str] = None
    subtitle: Optional[str] = None
    description: Optional[str] = None
    content_json: Optional[str] = None
    media_url: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None

# --- PROGRAM SCHEMAS ---

class ProgramBase(BaseModel):
    title: str
    age_group: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    highlights_json: Optional[str] = None
    weekly_plan_json: Optional[str] = None
    uniform_items_json: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class ProgramCreate(ProgramBase):
    pass

class ProgramResponse(ProgramBase):
    id: int

    class Config:
        from_attributes = True

# --- TESTIMONIAL SCHEMAS ---

class TestimonialBase(BaseModel):
    author_name: str
    author_role: Optional[str] = None
    quote: str
    rating: int = Field(5, ge=1, le=5)
    image_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class TestimonialCreate(TestimonialBase):
    pass

class TestimonialResponse(TestimonialBase):
    id: int

    class Config:
        from_attributes = True

# --- GALLERY SCHEMAS ---

class GalleryItemBase(BaseModel):
    title: Optional[str] = None
    media_url: str
    media_type: str = "IMAGE"
    category: str
    is_active: bool = True
    sort_order: int = 0

class GalleryItemCreate(GalleryItemBase):
    pass

class GalleryItemResponse(GalleryItemBase):
    id: int

    class Config:
        from_attributes = True

# --- EVENT SCHEMAS ---

class EventBase(BaseModel):
    title: str
    description: Optional[str] = None
    event_date: datetime
    location: Optional[str] = None
    image_url: Optional[str] = None
    is_active: bool = True

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- BLOG SCHEMAS ---

class BlogBase(BaseModel):
    title: str
    slug: str
    summary: Optional[str] = None
    content: str
    author_name: Optional[str] = None
    category: Optional[str] = None
    image_url: Optional[str] = None
    is_published: bool = False
    published_at: Optional[datetime] = None

class BlogCreate(BlogBase):
    pass

class BlogResponse(BlogBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- FAQ SCHEMAS ---

class FAQBase(BaseModel):
    question: str
    answer: str
    category: str = "General"
    is_active: bool = True
    sort_order: int = 0

class FAQCreate(FAQBase):
    pass

class FAQResponse(FAQBase):
    id: int

    class Config:
        from_attributes = True

# --- CAREER SCHEMAS ---

class JobApplicationBase(BaseModel):
    applicant_name: str
    applicant_email: EmailStr
    applicant_phone: str
    resume_url: Optional[str] = None
    cover_letter: Optional[str] = None

class JobApplicationCreate(JobApplicationBase):
    career_id: int

class JobApplicationResponse(JobApplicationBase):
    id: int
    career_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CareerBase(BaseModel):
    title: str
    department: Optional[str] = None
    location: Optional[str] = None
    description: str
    requirements_json: Optional[str] = None
    is_active: bool = True

class CareerCreate(CareerBase):
    pass

class CareerResponse(CareerBase):
    id: int
    created_at: datetime
    applications: List[JobApplicationResponse] = []

    class Config:
        from_attributes = True

# --- SUBMISSION SCHEMAS ---

class ContactSubmissionBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    subject: Optional[str] = None
    message: str

class ContactSubmissionCreate(ContactSubmissionBase):
    pass

class ContactSubmissionResponse(ContactSubmissionBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class ContactSubmissionStatusUpdate(BaseModel):
    status: str

class FranchiseInquiryBase(BaseModel):
    name: str
    email: EmailStr
    phone: str
    city: str
    state: str
    investment_range: Optional[str] = None
    message: Optional[str] = None

class FranchiseInquiryCreate(FranchiseInquiryBase):
    pass

class FranchiseInquiryResponse(FranchiseInquiryBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class FranchiseInquiryStatusUpdate(BaseModel):
    status: str

# --- STUDENT SCHEMAS ---
class StudentBase(BaseModel):
    name: str
    parent_name: str
    phone: str
    program_id: int
    allergies: Optional[str] = None
    photo_url: Optional[str] = None
    issued_items_json: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    is_active: bool = True

class StudentCreate(StudentBase):
    pass

class StudentResponse(StudentBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- ATTENDANCE SCHEMAS ---
class AttendanceBase(BaseModel):
    student_id: int
    date: str
    status: str  # PRESENT, ABSENT, LATE
    notes: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(AttendanceBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceBulkItem(BaseModel):
    student_id: int
    status: str
    notes: Optional[str] = None

class AttendanceBulkSave(BaseModel):
    program_id: int
    date: str
    records: List[AttendanceBulkItem]

# --- VACCINATION SCHEMAS ---
class VaccinationBase(BaseModel):
    name: str
    age_group: str

class VaccinationResponse(VaccinationBase):
    id: int

    class Config:
        from_attributes = True

# --- ADMISSION SCHEMAS ---
class AdmissionVaccinationCreate(BaseModel):
    vaccination_id: int
    administered_date: str

class AdmissionVaccinationResponse(BaseModel):
    id: int
    vaccination_id: int
    administered_date: str
    vaccination: VaccinationResponse

    class Config:
        from_attributes = True

class AdmissionCreate(BaseModel):
    child_name: str
    parent_name: str
    email: str
    phone: str
    date_of_birth: str
    program_id: int
    allergies: Optional[str] = None
    photo_url: Optional[str] = None
    issued_items_json: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_phone: Optional[str] = None
    vaccinations: List[AdmissionVaccinationCreate] = []

class AdmissionResponse(BaseModel):
    id: int
    child_name: str
    parent_name: str
    email: str
    phone: str
    date_of_birth: str
    program_id: int
    allergies: Optional[str] = None
    photo_url: Optional[str] = None
    issued_items_json: Optional[str] = None
    blood_group: Optional[str] = None
    emergency_phone: Optional[str] = None
    status: str
    created_at: datetime
    vaccinations: List[AdmissionVaccinationResponse] = []

    class Config:
        from_attributes = True

class AdmissionStatusUpdate(BaseModel):
    status: str

class HolidayBase(BaseModel):
    title: str
    description: Optional[str] = None
    holiday_date: str  # YYYY-MM-DD
    year: int
    category: Optional[str] = "National Holiday"
    image_url: Optional[str] = None
    is_active: bool = True

class HolidayCreate(HolidayBase):
    send_email: Optional[bool] = False

class HolidayResponse(HolidayBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class CustomHolidayEmailRequest(BaseModel):
    reason: str
    start_date: str
    end_date: str
    reopen_date: str

# --- CIRCULAR SCHEMAS ---
class CircularBase(BaseModel):
    title: str
    content: str
    program_id: Optional[int] = None
    attachment_url: Optional[str] = None
    is_active: bool = True

class CircularCreate(CircularBase):
    pass

class CircularResponse(CircularBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- LIBRARY SCHEMAS ---
class BookBase(BaseModel):
    title: str
    author: str
    isbn: Optional[str] = None
    category: str
    total_copies: int = 1
    available_copies: int = 1

class BookCreate(BookBase):
    pass

class BookResponse(BookBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class BorrowBase(BaseModel):
    book_id: int
    student_id: int
    borrow_date: str
    due_date: str
    return_date: Optional[str] = None
    status: str = "Borrowed"

class BorrowCreate(BorrowBase):
    pass

class BorrowResponse(BorrowBase):
    id: int
    created_at: datetime
    book: Optional[BookResponse] = None
    student: Optional[StudentResponse] = None

    class Config:
        from_attributes = True

# --- STATIONERY SCHEMAS ---

from decimal import Decimal

class StationaryItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: str
    price: Decimal
    stock: int
    is_active: bool = True

class StationaryItemCreate(StationaryItemBase):
    pass

class StationaryItemResponse(StationaryItemBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class StationaryOrderItemBase(BaseModel):
    item_id: int
    quantity: int

class StationaryOrderItemCreate(StationaryOrderItemBase):
    pass

class StationaryOrderItemResponse(BaseModel):
    id: int
    item_id: int
    quantity: int
    unit_price: Decimal
    item: Optional[StationaryItemResponse] = None

    class Config:
        from_attributes = True

class StationaryOrderBase(BaseModel):
    student_name: Optional[str] = None
    class_name: Optional[str] = None
    payment_status: Optional[str] = "Unpaid"
    reimbursement_status: Optional[str] = None

class StationaryOrderCreate(StationaryOrderBase):
    items: List[StationaryOrderItemCreate]

class StationaryOrderResponse(StationaryOrderBase):
    id: int
    order_date: datetime
    status: str
    total_price: Decimal
    created_by_id: int
    created_by: Optional[UserResponse] = None
    items: List[StationaryOrderItemResponse] = []

    class Config:
        from_attributes = True

class StationaryOrderStatusUpdate(BaseModel):
    status: str

# --- MEAL PLAN SCHEMAS ---

class MealPlanBase(BaseModel):
    day_of_week: str
    meal_type: str
    menu_item: str
    description: Optional[str] = None
    allergens: Optional[str] = None
    calories: Optional[int] = None

class MealPlanCreate(MealPlanBase):
    pass

class MealPlanResponse(MealPlanBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- FEATURE PERMISSION SCHEMAS ---

class FeaturePermissionBase(BaseModel):
    role: str
    feature: str
    is_enabled: bool

class FeaturePermissionResponse(FeaturePermissionBase):
    id: int

    class Config:
        from_attributes = True

class FeaturePermissionUpdate(BaseModel):
    role: str
    feature: str
    is_enabled: bool


# --- CLASS ASSIGNMENT SCHEMAS ---

class ClassAssignmentBase(BaseModel):
    program_id: int
    title: str
    description: Optional[str] = None
    date: str

class ClassAssignmentCreate(ClassAssignmentBase):
    pass

class ClassAssignmentResponse(ClassAssignmentBase):
    id: int
    teacher_id: Optional[int] = None
    files_json: str
    created_at: datetime
    program: Optional[ProgramResponse] = None
    teacher: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# --- TEACHER ACHIEVEMENT SCHEMAS ---

class TeacherAchievementBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: str

class TeacherAchievementCreate(TeacherAchievementBase):
    pass

class TeacherAchievementResponse(TeacherAchievementBase):
    id: int
    teacher_id: int
    certificate_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


