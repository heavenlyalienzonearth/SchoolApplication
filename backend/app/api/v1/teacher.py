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
            has_assignments = db.query(models.Student).filter(
                models.Student.program_id == program.id,
                models.Student.teacher_id.isnot(None)
            ).first()
            if has_assignments:
                students_count = db.query(models.Student).filter(
                    models.Student.program_id == program.id,
                    models.Student.teacher_id == current_user.id
                ).count()
            else:
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

    # Get all students in this program
    program_students = db.query(models.Student).filter(models.Student.program_id == program.id).all()
    
    # Check if teacher assignments exist in this program
    has_assignments = any(s.teacher_id is not None for s in program_students)
    
    if has_assignments:
        # Get students specifically assigned to THIS logged-in teacher
        assigned_students = [s for s in program_students if s.teacher_id == current_user.id]
        if not assigned_students:
            return []
            
        assigned_student_names = {s.name.strip().lower() for s in assigned_students if s.name}
        assigned_student_ids = {s.id for s in assigned_students}
        
        # Get parent user IDs linked to these assigned students
        parent_user_ids = {
            u.id for u in db.query(models.User).filter(
                models.User.student_id.in_(assigned_student_ids)
            ).all()
        }
        
        # Query orders matching program title AND belonging to assigned students/parents
        all_class_orders = db.query(models.StationaryOrder).filter(
            models.StationaryOrder.class_name == program.title
        ).order_by(models.StationaryOrder.order_date.desc()).all()
        
        filtered_orders = []
        for ord in all_class_orders:
            ord_student_name = (ord.student_name or "").strip().lower()
            if ord_student_name in assigned_student_names or ord.created_by_id in parent_user_ids:
                filtered_orders.append(ord)
                
        return filtered_orders
    else:
        # Fallback: if no teacher assignments exist at all in this program, show all program orders
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

    # Check if any student assignments exist for this program
    has_assignments = db.query(models.Student).filter(
        models.Student.program_id == current_user.assigned_program_id,
        models.Student.teacher_id.isnot(None)
    ).first()

    if has_assignments:
        students = db.query(models.Student).filter(
            models.Student.program_id == current_user.assigned_program_id,
            models.Student.teacher_id == current_user.id
        ).order_by(models.Student.name).all()
    else:
        students = db.query(models.Student).filter(
            models.Student.program_id == current_user.assigned_program_id
        ).order_by(models.Student.name).all()

    return [{
        "id": s.id,
        "name": s.name,
        "parent_name": s.parent_name,
        "phone": s.phone,
        "allergies": s.allergies,
        "blood_group": s.blood_group,
        "date_of_birth": s.date_of_birth,
        "emergency_phone": s.emergency_phone
    } for s in students]


# 6. POST /teacher/kudos
@router.post("/kudos", response_model=schemas.StudentKudosResponse)
def award_student_kudos(
    req: schemas.StudentKudosCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can award student kudos.")

    student = db.query(models.Student).filter(models.Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    kudos = models.StudentKudos(
        student_id=req.student_id,
        teacher_id=current_user.id,
        badge_type=req.badge_type,
        badge_title=req.badge_title,
        comment=req.comment,
        awarded_date=req.awarded_date
    )
    db.add(kudos)
    db.commit()
    db.refresh(kudos)

    res = schemas.StudentKudosResponse.from_orm(kudos)
    res.student_name = student.name
    res.teacher_name = current_user.full_name
    return res


# 7. GET /teacher/kudos
@router.get("/kudos", response_model=List[schemas.StudentKudosResponse])
def get_teacher_kudos(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can view kudos.")

    kudos_list = db.query(models.StudentKudos).filter(
        models.StudentKudos.teacher_id == current_user.id
    ).order_by(models.StudentKudos.created_at.desc()).all()

    result = []
    for k in kudos_list:
        res = schemas.StudentKudosResponse.from_orm(k)
        res.student_name = k.student.name if k.student else "Student"
        res.teacher_name = current_user.full_name
        result.append(res)

    return result


# 8. DELETE /teacher/kudos/{id}
@router.delete("/kudos/{kudos_id}")
def delete_student_kudos(
    kudos_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can delete kudos.")

    kudos = db.query(models.StudentKudos).filter(
        models.StudentKudos.id == kudos_id,
        models.StudentKudos.teacher_id == current_user.id
    ).first()
    if not kudos:
        raise HTTPException(status_code=404, detail="Kudos record not found or not owned by you.")

    db.delete(kudos)
    db.commit()
    return {"message": "Kudos badge removed successfully."}


# 9. POST /teacher/incidents
@router.post("/incidents", response_model=schemas.StudentIncidentLogResponse)
def log_student_incident(
    req: schemas.StudentIncidentLogCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can log student incidents.")

    student = db.query(models.Student).filter(models.Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    incident = models.StudentIncidentLog(
        student_id=req.student_id,
        teacher_id=current_user.id,
        category=req.category,
        title=req.title,
        description=req.description,
        action_taken=req.action_taken,
        severity=req.severity,
        log_date=req.log_date
    )
    db.add(incident)
    db.commit()
    db.refresh(incident)

    res = schemas.StudentIncidentLogResponse.from_orm(incident)
    res.student_name = student.name
    res.teacher_name = current_user.full_name
    return res


# 10. GET /teacher/incidents
@router.get("/incidents", response_model=List[schemas.StudentIncidentLogResponse])
def get_teacher_incidents(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can view incident logs.")

    incidents = db.query(models.StudentIncidentLog).filter(
        models.StudentIncidentLog.teacher_id == current_user.id
    ).order_by(models.StudentIncidentLog.created_at.desc()).all()

    result = []
    for i in incidents:
        res = schemas.StudentIncidentLogResponse.from_orm(i)
        res.student_name = i.student.name if i.student else "Student"
        res.teacher_name = current_user.full_name
        result.append(res)

    return result


# 11. DELETE /teacher/incidents/{id}
@router.delete("/incidents/{incident_id}")
def delete_student_incident(
    incident_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "TEACHER":
        raise HTTPException(status_code=403, detail="Only teachers can delete incident logs.")

    incident = db.query(models.StudentIncidentLog).filter(
        models.StudentIncidentLog.id == incident_id,
        models.StudentIncidentLog.teacher_id == current_user.id
    ).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident log record not found or not owned by you.")

    db.delete(incident)
    db.commit()
    return {"message": "Incident log entry deleted successfully."}
