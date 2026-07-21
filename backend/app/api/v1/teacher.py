import os
import shutil
import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas

router = APIRouter(prefix="/teacher", tags=["Teacher"])

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "static", "uploads", "certificates"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# 1. GET /teacher/dashboard
@router.get("/dashboard")
def get_teacher_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teacher users can access the teacher dashboard."
        )

    # Get teacher's assigned program/class
    program = None
    students_count = 0
    moments_count = 0
    assignments_count = 0
    
    if current_user.assigned_program_id:
        program = db.query(models.Program).filter(models.Program.id == current_user.assigned_program_id).first()
        if program:
            students_count = db.query(models.Student).filter(models.Student.program_id == program.id).count()
            moments_count = db.query(models.StudentDailyMoment).filter(models.StudentDailyMoment.teacher_id == current_user.id).count()
            assignments_count = db.query(models.ClassAssignment).filter(models.ClassAssignment.program_id == program.id).count()

    achievements_count = db.query(models.TeacherAchievement).filter(models.TeacherAchievement.teacher_id == current_user.id).count()

    # Retrieve teacher profile info
    teacher_profile = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "photo_url": current_user.photo_url,
        "education": current_user.education,
        "experience": current_user.experience,
        "achievements_summary": current_user.achievements,
        "assigned_program": {
            "id": program.id if program else None,
            "title": program.title if program else "Not Assigned"
        } if program else None
    }

    return {
        "profile": teacher_profile,
        "stats": {
            "students_count": students_count,
            "moments_count": moments_count,
            "assignments_count": assignments_count,
            "achievements_count": achievements_count
        }
    }

# 2. GET /teacher/orders
@router.get("/orders", response_model=List[schemas.StationaryOrderResponse])
def get_class_stationery_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teacher users can access class stationery orders."
        )

    if not current_user.assigned_program_id:
        return []

    program = db.query(models.Program).filter(models.Program.id == current_user.assigned_program_id).first()
    if not program:
        return []

    # Get parent orders matching student class
    orders = db.query(models.StationaryOrder).filter(
        models.StationaryOrder.class_name == program.title
    ).order_by(models.StationaryOrder.order_date.desc()).all()

    return orders

# 3. GET /teacher/achievements
@router.get("/achievements", response_model=List[schemas.TeacherAchievementResponse])
def get_teacher_achievements(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teacher users can view achievements."
        )

    return db.query(models.TeacherAchievement).filter(
        models.TeacherAchievement.teacher_id == current_user.id
    ).order_by(models.TeacherAchievement.created_at.desc()).all()

# 4. POST /teacher/achievements
@router.post("/achievements", response_model=schemas.TeacherAchievementResponse)
def upload_teacher_achievement(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    date: str = Form(...),
    certificate: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teacher users can create achievements."
        )

    certificate_url = None
    if certificate:
        filename = f"{uuid.uuid4().hex}_{certificate.filename}"
        filepath = os.path.join(UPLOAD_DIR, filename)
        try:
            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(certificate.file, buffer)
            certificate_url = f"/static/uploads/certificates/{filename}"
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to save certificate document: {str(e)}"
            )

    achievement = models.TeacherAchievement(
        teacher_id=current_user.id,
        title=title,
        description=description,
        date=date,
        certificate_url=certificate_url
    )
    db.add(achievement)
    db.commit()
    db.refresh(achievement)
    return achievement

# 5. DELETE /teacher/achievements/{achievement_id}
@router.delete("/achievements/{achievement_id}")
def delete_teacher_achievement(
    achievement_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teacher users can delete achievements."
        )

    achievement = db.query(models.TeacherAchievement).filter(
        models.TeacherAchievement.id == achievement_id,
        models.TeacherAchievement.teacher_id == current_user.id
    ).first()

    if not achievement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Achievement not found."
        )

    # Clean certificate file on disk
    if achievement.certificate_url:
        filename = achievement.certificate_url.split("/")[-1]
        filepath = os.path.join(UPLOAD_DIR, filename)
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception as e:
                print(f"Failed to delete certificate file: {str(e)}")

    db.delete(achievement)
    db.commit()
    return {"message": "Achievement deleted successfully."}

# 6. GET /teacher/students
@router.get("/students")
def get_class_students(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teacher users can list class students."
        )

    if not current_user.assigned_program_id:
        return []

    students = db.query(models.Student).filter(
        models.Student.program_id == current_user.assigned_program_id
    ).order_by(models.Student.name).all()

    return [{"id": s.id, "name": s.name} for s in students]
