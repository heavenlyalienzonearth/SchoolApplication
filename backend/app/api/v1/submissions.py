from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas

router = APIRouter(tags=["User Submissions"])

# --- CONTACT SUBMISSIONS ---

@router.post("/contact", response_model=schemas.ContactSubmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_contact_form(
    submission: schemas.ContactSubmissionCreate,
    db: Session = Depends(get_db)
):
    db_sub = models.ContactSubmission(**submission.model_dump())
    db.add(db_sub)
    db.commit()
    db.refresh(db_sub)
    return db_sub

@router.get("/contact/admin", response_model=List[schemas.ContactSubmissionResponse])
def get_contact_submissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.ContactSubmission).order_by(models.ContactSubmission.created_at.desc()).all()

@router.put("/contact/admin/{sub_id}", response_model=schemas.ContactSubmissionResponse)
def update_contact_status(
    sub_id: int,
    status_update: schemas.ContactSubmissionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    sub = db.query(models.ContactSubmission).filter(models.ContactSubmission.id == sub_id).first()
    if not sub:
        raise HTTPException(status_code=404, detail="Submission not found")
    sub.status = status_update.status
    db.commit()
    db.refresh(sub)
    return sub


# --- FRANCHISE INQUIRIES ---

@router.post("/franchise", response_model=schemas.FranchiseInquiryResponse, status_code=status.HTTP_201_CREATED)
def submit_franchise_inquiry(
    inquiry: schemas.FranchiseInquiryCreate,
    db: Session = Depends(get_db)
):
    db_inq = models.FranchiseInquiry(**inquiry.model_dump())
    db.add(db_inq)
    db.commit()
    db.refresh(db_inq)
    return db_inq

@router.get("/franchise/admin", response_model=List[schemas.FranchiseInquiryResponse])
def get_franchise_inquiries(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.FranchiseInquiry).order_by(models.FranchiseInquiry.created_at.desc()).all()

@router.put("/franchise/admin/{inq_id}", response_model=schemas.FranchiseInquiryResponse)
def update_franchise_status(
    inq_id: int,
    status_update: schemas.FranchiseInquiryStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    inq = db.query(models.FranchiseInquiry).filter(models.FranchiseInquiry.id == inq_id).first()
    if not inq:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    inq.status = status_update.status
    db.commit()
    db.refresh(inq)
    return inq


# --- CAREER APPLICATIONS ---

@router.post("/careers/apply", response_model=schemas.JobApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_to_job(
    application: schemas.JobApplicationCreate,
    db: Session = Depends(get_db)
):
    # Verify career exists
    career = db.query(models.Career).filter(
        models.Career.id == application.career_id,
        models.Career.is_active == True
    ).first()
    if not career:
        raise HTTPException(status_code=404, detail="Career opening not found or inactive")
        
    db_app = models.JobApplication(**application.model_dump())
    db.add(db_app)
    db.commit()
    db.refresh(db_app)
    return db_app

@router.get("/careers/applications/admin", response_model=List[schemas.JobApplicationResponse])
def get_job_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.JobApplication).order_by(models.JobApplication.created_at.desc()).all()


# --- ANALYTICS DASHBOARD ---

@router.get("/submissions/analytics")
def get_dashboard_analytics(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    from datetime import datetime, timedelta
    from sqlalchemy import or_
    
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)
    year_start = datetime(now.year, 1, 1)

    # 1. Admissions Count (subject in ['Admissions Inquiries', 'Chatbot Lead'])
    admissions_query = db.query(models.ContactSubmission).filter(
        or_(
            models.ContactSubmission.subject == "Admissions Inquiries",
            models.ContactSubmission.subject == "Chatbot Lead"
        )
    )
    
    admissions_day = admissions_query.filter(models.ContactSubmission.created_at >= today_start).count()
    admissions_week = admissions_query.filter(models.ContactSubmission.created_at >= week_start).count()
    admissions_month = admissions_query.filter(models.ContactSubmission.created_at >= month_start).count()
    admissions_year = admissions_query.filter(models.ContactSubmission.created_at >= year_start).count()

    # 2. Transfer Certificates Count
    tc_query = db.query(models.ContactSubmission).filter(
        or_(
            models.ContactSubmission.subject == "Transfer Certificate",
            models.ContactSubmission.subject == "Transfer Certificate Request",
            models.ContactSubmission.message.ilike("%transfer certificate%")
        )
    )
    
    tc_count = tc_query.count()
    total_submissions = db.query(models.ContactSubmission).count()
    other_submissions = max(0, total_submissions - tc_count)
    
    tc_percentage = 0
    if total_submissions > 0:
        tc_percentage = int((tc_count / total_submissions) * 100)

    # 3. Parent Feedbacks (Testimonials table ratings)
    good_feedback = db.query(models.Testimonial).filter(
        models.Testimonial.rating >= 4
    ).count()
    
    improvement_feedback = db.query(models.Testimonial).filter(
        models.Testimonial.rating < 4
    ).count()
    
    total_feedback = good_feedback + improvement_feedback

    return {
        "admissions": {
            "day": admissions_day,
            "week": admissions_week,
            "month": admissions_month,
            "year": admissions_year
        },
        "transfer_certificates": {
            "requests": tc_count,
            "other": other_submissions,
            "percentage": tc_percentage
        },
        "feedback": {
            "good": good_feedback,
            "improvement_needed": improvement_feedback,
            "total": total_feedback
        }
    }
