import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas

router = APIRouter(tags=["Content Management"])

# --- PAGE SECTIONS ENDPOINTS ---

@router.get("/pages/{page_code}", response_model=List[schemas.PageSectionResponse])
def get_page_sections(page_code: str, db: Session = Depends(get_db)):
    return db.query(models.PageSection).filter(
        models.PageSection.page_code == page_code,
        models.PageSection.is_active == True
    ).order_by(models.PageSection.sort_order).all()

@router.get("/pages/admin/{page_code}", response_model=List[schemas.PageSectionResponse])
def get_page_sections_admin(
    page_code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.PageSection).filter(
        models.PageSection.page_code == page_code
    ).order_by(models.PageSection.sort_order).all()

@router.put("/pages/{page_code}/{section_code}", response_model=schemas.PageSectionResponse)
def update_page_section(
    page_code: str,
    section_code: str,
    updates: schemas.PageSectionUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    section = db.query(models.PageSection).filter(
        models.PageSection.page_code == page_code,
        models.PageSection.section_code == section_code
    ).first()
    
    if not section:
        # Create it if it doesn't exist
        section = models.PageSection(
            page_code=page_code,
            section_code=section_code,
            title=updates.title,
            subtitle=updates.subtitle,
            description=updates.description,
            content_json=updates.content_json,
            media_url=updates.media_url,
            is_active=updates.is_active if updates.is_active is not None else True,
            sort_order=updates.sort_order if updates.sort_order is not None else 0
        )
        db.add(section)
    else:
        # Update existing
        if updates.title is not None: section.title = updates.title
        if updates.subtitle is not None: section.subtitle = updates.subtitle
        if updates.description is not None: section.description = updates.description
        if updates.content_json is not None: section.content_json = updates.content_json
        if updates.media_url is not None: section.media_url = updates.media_url
        if updates.is_active is not None: section.is_active = updates.is_active
        if updates.sort_order is not None: section.sort_order = updates.sort_order
        
    db.commit()
    db.refresh(section)
    return section


# --- PROGRAMS ENDPOINTS ---

@router.get("/programs", response_model=List[schemas.ProgramResponse])
def get_programs(db: Session = Depends(get_db)):
    return db.query(models.Program).filter(
        models.Program.is_active == True
    ).order_by(models.Program.sort_order).all()

@router.get("/programs/admin", response_model=List[schemas.ProgramResponse])
def get_programs_admin(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Program).order_by(models.Program.sort_order).all()

@router.post("/programs", response_model=schemas.ProgramResponse, status_code=status.HTTP_201_CREATED)
def create_program(
    program: schemas.ProgramCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_program = models.Program(**program.model_dump())
    db.add(db_program)
    db.commit()
    db.refresh(db_program)
    return db_program

@router.put("/programs/{program_id}", response_model=schemas.ProgramResponse)
def update_program(
    program_id: int,
    updates: schemas.ProgramCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not db_program:
        raise HTTPException(status_code=404, detail="Program not found")
        
    for key, value in updates.model_dump().items():
        setattr(db_program, key, value)
        
    db.commit()
    db.refresh(db_program)
    return db_program

@router.delete("/programs/{program_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_program(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_program = db.query(models.Program).filter(models.Program.id == program_id).first()
    if not db_program:
        raise HTTPException(status_code=404, detail="Program not found")
    db.delete(db_program)
    db.commit()
    return None


# --- TESTIMONIALS ENDPOINTS ---

@router.get("/testimonials", response_model=List[schemas.TestimonialResponse])
def get_testimonials(db: Session = Depends(get_db)):
    return db.query(models.Testimonial).filter(
        models.Testimonial.is_active == True
    ).order_by(models.Testimonial.sort_order).all()

@router.get("/testimonials/admin", response_model=List[schemas.TestimonialResponse])
def get_testimonials_admin(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Testimonial).order_by(models.Testimonial.sort_order).all()

@router.post("/testimonials", response_model=schemas.TestimonialResponse, status_code=status.HTTP_201_CREATED)
def create_testimonial(
    testimonial: schemas.TestimonialCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_testimonial = models.Testimonial(**testimonial.model_dump())
    db.add(db_testimonial)
    db.commit()
    db.refresh(db_testimonial)
    return db_testimonial

@router.put("/testimonials/{testimonial_id}", response_model=schemas.TestimonialResponse)
def update_testimonial(
    testimonial_id: int,
    updates: schemas.TestimonialCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_testimonial = db.query(models.Testimonial).filter(models.Testimonial.id == testimonial_id).first()
    if not db_testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
        
    for key, value in updates.model_dump().items():
        setattr(db_testimonial, key, value)
        
    db.commit()
    db.refresh(db_testimonial)
    return db_testimonial

@router.delete("/testimonials/{testimonial_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testimonial(
    testimonial_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_testimonial = db.query(models.Testimonial).filter(models.Testimonial.id == testimonial_id).first()
    if not db_testimonial:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    db.delete(db_testimonial)
    db.commit()
    return None


# --- GALLERY ENDPOINTS ---

@router.get("/gallery", response_model=List[schemas.GalleryItemResponse])
def get_gallery_items(db: Session = Depends(get_db)):
    return db.query(models.GalleryItem).filter(
        models.GalleryItem.is_active == True
    ).order_by(models.GalleryItem.sort_order).all()

@router.get("/gallery/admin", response_model=List[schemas.GalleryItemResponse])
def get_gallery_items_admin(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.GalleryItem).order_by(models.GalleryItem.sort_order).all()

@router.post("/gallery", response_model=schemas.GalleryItemResponse, status_code=status.HTTP_201_CREATED)
def create_gallery_item(
    item: schemas.GalleryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_item = models.GalleryItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/gallery/{item_id}", response_model=schemas.GalleryItemResponse)
def update_gallery_item(
    item_id: int,
    updates: schemas.GalleryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_item = db.query(models.GalleryItem).filter(models.GalleryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
        
    for key, value in updates.model_dump().items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/gallery/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_gallery_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_item = db.query(models.GalleryItem).filter(models.GalleryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Gallery item not found")
    db.delete(db_item)
    db.commit()
    return None


# --- EVENTS ENDPOINTS ---

@router.get("/events", response_model=List[schemas.EventResponse])
def get_events(db: Session = Depends(get_db)):
    return db.query(models.Event).filter(
        models.Event.is_active == True
    ).order_by(models.Event.event_date.desc()).all()

@router.get("/events/admin", response_model=List[schemas.EventResponse])
def get_events_admin(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Event).order_by(models.Event.event_date.desc()).all()

@router.post("/events", response_model=schemas.EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_event = models.Event(**event.model_dump())
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event

@router.put("/events/{event_id}", response_model=schemas.EventResponse)
def update_event(
    event_id: int,
    updates: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
        
    for key, value in updates.model_dump().items():
        setattr(db_event, key, value)
        
    db.commit()
    db.refresh(db_event)
    return db_event

@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if not db_event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(db_event)
    db.commit()
    return None


# --- BLOG ENDPOINTS ---

@router.get("/blogs", response_model=List[schemas.BlogResponse])
def get_blogs(db: Session = Depends(get_db)):
    return db.query(models.Blog).filter(
        models.Blog.is_published == True
    ).order_by(models.Blog.published_at.desc()).all()

@router.get("/blogs/admin", response_model=List[schemas.BlogResponse])
def get_blogs_admin(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Blog).order_by(models.Blog.created_at.desc()).all()

@router.get("/blogs/{slug}", response_model=schemas.BlogResponse)
def get_blog_by_slug(slug: str, db: Session = Depends(get_db)):
    blog = db.query(models.Blog).filter(
        models.Blog.slug == slug,
        models.Blog.is_published == True
    ).first()
    if not blog:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return blog

@router.post("/blogs", response_model=schemas.BlogResponse, status_code=status.HTTP_201_CREATED)
def create_blog(
    blog: schemas.BlogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_blog = models.Blog(**blog.model_dump())
    if db_blog.is_published and not db_blog.published_at:
        db_blog.published_at = datetime.utcnow()
    db.add(db_blog)
    db.commit()
    db.refresh(db_blog)
    return db_blog

@router.put("/blogs/{blog_id}", response_model=schemas.BlogResponse)
def update_blog(
    blog_id: int,
    updates: schemas.BlogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_blog = db.query(models.Blog).filter(models.Blog.id == blog_id).first()
    if not db_blog:
        raise HTTPException(status_code=404, detail="Blog not found")
        
    for key, value in updates.model_dump().items():
        setattr(db_blog, key, value)
        
    if db_blog.is_published and not db_blog.published_at:
        db_blog.published_at = datetime.utcnow()
    elif not db_blog.is_published:
        db_blog.published_at = None
        
    db.commit()
    db.refresh(db_blog)
    return db_blog

@router.delete("/blogs/{blog_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blog(
    blog_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_blog = db.query(models.Blog).filter(models.Blog.id == blog_id).first()
    if not db_blog:
        raise HTTPException(status_code=404, detail="Blog not found")
    db.delete(db_blog)
    db.commit()
    return None


# --- FAQS ENDPOINTS ---

@router.get("/faqs", response_model=List[schemas.FAQResponse])
def get_faqs(db: Session = Depends(get_db)):
    return db.query(models.FAQ).filter(
        models.FAQ.is_active == True
    ).order_by(models.FAQ.sort_order).all()

@router.get("/faqs/admin", response_model=List[schemas.FAQResponse])
def get_faqs_admin(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.FAQ).order_by(models.FAQ.sort_order).all()

@router.post("/faqs", response_model=schemas.FAQResponse, status_code=status.HTTP_201_CREATED)
def create_faq(
    faq: schemas.FAQCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_faq = models.FAQ(**faq.model_dump())
    db.add(db_faq)
    db.commit()
    db.refresh(db_faq)
    return db_faq

@router.put("/faqs/{faq_id}", response_model=schemas.FAQResponse)
def update_faq(
    faq_id: int,
    updates: schemas.FAQCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_faq = db.query(models.FAQ).filter(models.FAQ.id == faq_id).first()
    if not db_faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
        
    for key, value in updates.model_dump().items():
        setattr(db_faq, key, value)
        
    db.commit()
    db.refresh(db_faq)
    return db_faq

@router.delete("/faqs/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_faq(
    faq_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_faq = db.query(models.FAQ).filter(models.FAQ.id == faq_id).first()
    if not db_faq:
        raise HTTPException(status_code=404, detail="FAQ not found")
    db.delete(db_faq)
    db.commit()
    return None


# --- CAREERS ENDPOINTS ---

@router.get("/careers", response_model=List[schemas.CareerResponse])
def get_careers(db: Session = Depends(get_db)):
    # Returns careers without application list for public
    return db.query(models.Career).filter(
        models.Career.is_active == True
    ).order_by(models.Career.created_at.desc()).all()

@router.get("/careers/admin", response_model=List[schemas.CareerResponse])
def get_careers_admin(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Career).order_by(models.Career.created_at.desc()).all()

@router.post("/careers", response_model=schemas.CareerResponse, status_code=status.HTTP_201_CREATED)
def create_career(
    career: schemas.CareerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_career = models.Career(**career.model_dump())
    db.add(db_career)
    db.commit()
    db.refresh(db_career)
    return db_career

@router.put("/careers/{career_id}", response_model=schemas.CareerResponse)
def update_career(
    career_id: int,
    updates: schemas.CareerCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_career = db.query(models.Career).filter(models.Career.id == career_id).first()
    if not db_career:
        raise HTTPException(status_code=404, detail="Career opening not found")
        
    for key, value in updates.model_dump().items():
        setattr(db_career, key, value)
        
    db.commit()
    db.refresh(db_career)
    return db_career

@router.delete("/careers/{career_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_career(
    career_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_career = db.query(models.Career).filter(models.Career.id == career_id).first()
    if not db_career:
        raise HTTPException(status_code=404, detail="Career opening not found")
    db.delete(db_career)
    db.commit()
    return None

@router.post("/upload")
def upload_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are allowed")
        
    orig_filename = file.filename
    import re
    name, ext = os.path.splitext(orig_filename)
    sanitized_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', name)
    safe_filename = f"{sanitized_name}{ext}"
    
    src_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend", "public", "assets", "images"))
    dist_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend", "dist", "frontend", "browser", "assets", "images"))
    
    os.makedirs(src_dir, exist_ok=True)
    src_path = os.path.join(src_dir, safe_filename)
    
    try:
        with open(src_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    if os.path.exists(dist_dir):
        dist_path = os.path.join(dist_dir, safe_filename)
        try:
            shutil.copyfile(src_path, dist_path)
        except:
            pass
            
    return {"url": f"http://localhost:8000/assets/images/{safe_filename}"}

