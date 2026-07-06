from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, Field

# --- AUTH SCHEMAS ---

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: str = "ADMIN"

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshRequest(BaseModel):
    refresh_token: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    email: Optional[str] = None

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
