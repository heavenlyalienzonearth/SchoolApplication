from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas
from sqlalchemy import text

router = APIRouter(prefix="/attendance", tags=["Kid Attendance"])

# --- ROSTER MANAGEMENT ---

@router.get("/students", response_model=List[schemas.StudentResponse])
def get_students(
    program_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Student)
    if program_id is not None:
        query = query.filter(models.Student.program_id == program_id)
    return query.order_by(models.Student.name).all()

@router.post("/students", response_model=schemas.StudentResponse, status_code=status.HTTP_201_CREATED)
def create_student(
    student: schemas.StudentCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify program exists
    prog = db.query(models.Program).filter(models.Program.id == student.program_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
        
    db_student = models.Student(**student.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(db_student)
    db.commit()
    return None

# --- DAILY CHECK-INS ---

@router.get("/records", response_model=List[schemas.AttendanceResponse])
def get_attendance_records(
    program_id: int,
    date: str,  # YYYY-MM-DD
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Retrieve all attendance records for students in this program on this date
    records = db.query(models.Attendance)\
        .join(models.Student)\
        .filter(models.Student.program_id == program_id, models.Attendance.date == date)\
        .all()
    return records

@router.post("/records", status_code=status.HTTP_200_OK)
def save_attendance_records(
    data: schemas.AttendanceBulkSave,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify program has students
    students = db.query(models.Student).filter(models.Student.program_id == data.program_id).all()
    student_ids = {s.id for s in students}
    
    # Save or update records
    for item in data.records:
        if item.student_id not in student_ids:
            continue
            
        # Check if record already exists
        existing = db.query(models.Attendance).filter(
            models.Attendance.student_id == item.student_id,
            models.Attendance.date == data.date
        ).first()
        
        if existing:
            existing.status = item.status
            existing.notes = item.notes
        else:
            db_record = models.Attendance(
                student_id=item.student_id,
                date=data.date,
                status=item.status,
                notes=item.notes
            )
            db.add(db_record)
            
    db.commit()
    return {"message": "Attendance records saved successfully."}

# --- STATISTICS ---

@router.get("/stats")
def get_attendance_stats(
    program_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get students roster
    s_query = db.query(models.Student)
    if program_id is not None:
        s_query = s_query.filter(models.Student.program_id == program_id)
    students = s_query.all()
    
    stats_list = []
    for s in students:
        total_days = db.query(models.Attendance).filter(models.Attendance.student_id == s.id).count()
        present_days = db.query(models.Attendance).filter(
            models.Attendance.student_id == s.id,
            models.Attendance.status == "PRESENT"
        ).count()
        late_days = db.query(models.Attendance).filter(
            models.Attendance.student_id == s.id,
            models.Attendance.status == "LATE"
        ).count()
        
        # Consider Present and Late as "present" for rates (Late contributes partially or fully)
        presence_rate = 100
        if total_days > 0:
            presence_rate = int(((present_days + late_days) / total_days) * 100)
            
        stats_list.append({
            "student_id": s.id,
            "student_name": s.name,
            "presence_rate": presence_rate,
            "total_days": total_days,
            "present_days": present_days,
            "late_days": late_days,
            "absent_days": total_days - (present_days + late_days)
        })
        
    return stats_list
