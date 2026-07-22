from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_permission
from app import models, schemas
from sqlalchemy import text, or_


router = APIRouter(prefix="/attendance", tags=["Kid Attendance"])

# --- ROSTER MANAGEMENT ---

@router.get("/students", response_model=List[schemas.StudentResponse])
def get_students(
    program_id: Optional[int] = None,
    teacher_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Student)
    
    # If user is a Teacher, restrict exclusively to their assigned pupils
    if current_user.role.upper() == "TEACHER":
        query = query.filter(models.Student.teacher_id == current_user.id)
    else:
        if teacher_id is not None:
            query = query.filter(models.Student.teacher_id == teacher_id)
            
    if program_id is not None:
        query = query.filter(models.Student.program_id == program_id)
        
    students = query.order_by(models.Student.name).all()
    
    # Populate teacher_name dynamically
    results = []
    for s in students:
        s_resp = schemas.StudentResponse.model_validate(s)
        if s.teacher:
            s_resp.teacher_name = s.teacher.full_name or s.teacher.email
        results.append(s_resp)
        
    return results

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
        
    # Validate teacher_id if provided
    if student.teacher_id:
        t_user = db.query(models.User).filter(models.User.id == student.teacher_id).first()
        if not t_user:
            raise HTTPException(status_code=404, detail="Assigned teacher user not found")
        if t_user.assigned_program_id and t_user.assigned_program_id != student.program_id:
            raise HTTPException(
                status_code=400,
                detail="Cannot assign student to a teacher of a different class/program."
            )
        
    db_student = models.Student(**student.model_dump())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    
    resp = schemas.StudentResponse.model_validate(db_student)
    if db_student.teacher:
        resp.teacher_name = db_student.teacher.full_name or db_student.teacher.email
    return resp

@router.put("/students/{student_id}", response_model=schemas.StudentResponse)
def update_student(
    student_id: int,
    student_update: schemas.StudentUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    update_data = student_update.model_dump(exclude_unset=True)
    
    # Validate teacher swapping / assignment
    if "teacher_id" in update_data and update_data["teacher_id"] is not None:
        target_teacher_id = update_data["teacher_id"]
        t_user = db.query(models.User).filter(models.User.id == target_teacher_id).first()
        if not t_user:
            raise HTTPException(status_code=404, detail="Target teacher not found")
            
        # Target student's program (or updated program)
        prog_id = update_data.get("program_id", db_student.program_id)
        if t_user.assigned_program_id and t_user.assigned_program_id != prog_id:
            raise HTTPException(
                status_code=400,
                detail="Swapping failed: Cannot assign/swap student to a teacher of a different class/program."
            )
            
    for key, value in update_data.items():
        setattr(db_student, key, value)
        
    db.commit()
    db.refresh(db_student)
    
    resp = schemas.StudentResponse.model_validate(db_student)
    if db_student.teacher:
        resp.teacher_name = db_student.teacher.full_name or db_student.teacher.email
    return resp

@router.delete("/students/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only Admin or Principal can delete students (TC cases)
    if current_user.role.upper() not in ["ADMIN", "PRINCIPAL"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="TC Removal Access Denied: Only Admin or Principal can delete a student from any teacher."
        )
        
    db_student = models.Student(**{"id": student_id}) if False else db.query(models.Student).filter(models.Student.id == student_id).first()
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

from pydantic import BaseModel
from datetime import datetime, timedelta

class MilestoneTemplateCreate(BaseModel):
    program_id: int
    milestone_name: str
    category: str

class MilestoneTemplateUpdate(BaseModel):
    milestone_name: str
    category: str

class StudentMilestoneUpdate(BaseModel):
    id: int
    status: str
    completed_date: Optional[str] = None
    teacher_comments: Optional[str] = None

class StudentMilestonesSave(BaseModel):
    milestones: List[StudentMilestoneUpdate]

class LeaveStatusUpdate(BaseModel):
    status: str  # Approved, Declined
    admin_comment: Optional[str] = None

# --- MILESTONE TEMPLATES CONFIGURATOR ---
@router.get("/milestones/templates", response_model=List[Dict[str, Any]])
def get_milestone_templates(
    program_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    templates = db.query(models.MilestoneTemplate).filter(models.MilestoneTemplate.program_id == program_id).all()
    return [
        {
            "id": t.id,
            "program_id": t.program_id,
            "milestone_name": t.milestone_name,
            "category": t.category
        }
        for t in templates
    ]

@router.post("/milestones/templates")
def create_milestone_template(
    data: MilestoneTemplateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("milestones"))
):
    template = models.MilestoneTemplate(
        program_id=data.program_id,
        milestone_name=data.milestone_name,
        category=data.category
    )
    db.add(template)
    db.commit()
    return {"message": "Milestone template added successfully."}

@router.delete("/milestones/templates/{template_id}")
def delete_milestone_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("milestones"))
):
    template = db.query(models.MilestoneTemplate).filter(models.MilestoneTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")
        
    db.delete(template)
    db.commit()
    return {"message": "Milestone template deleted."}

@router.put("/milestones/templates/{template_id}")
def update_milestone_template(
    template_id: int,
    data: MilestoneTemplateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("milestones"))
):
    template = db.query(models.MilestoneTemplate).filter(models.MilestoneTemplate.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found.")
        
    template.milestone_name = data.milestone_name
    template.category = data.category
    db.commit()
    return {"message": "Milestone template updated successfully."}

# --- STUDENT MILESTONES MANAGEMENT ---
@router.get("/milestones/student/{student_id}")
def get_or_init_student_milestones(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    milestones = db.query(models.ParentMilestone).filter(models.ParentMilestone.student_id == student_id).all()
    templates = db.query(models.MilestoneTemplate).filter(models.MilestoneTemplate.program_id == student.program_id).all()
    
    existing_names = {m.milestone_name for m in milestones}
    new_added = False
    
    for t in templates:
        if t.milestone_name not in existing_names:
            m = models.ParentMilestone(
                student_id=student_id,
                milestone_name=t.milestone_name,
                category=t.category,
                status="Not Started"
            )
            db.add(m)
            new_added = True
            
    if new_added:
        db.commit()
        milestones = db.query(models.ParentMilestone).filter(models.ParentMilestone.student_id == student_id).all()
        
    return [
        {
            "id": m.id,
            "milestone_name": m.milestone_name,
            "category": m.category,
            "status": m.status,
            "completed_date": m.completed_date,
            "teacher_comments": m.teacher_comments
        }
        for m in milestones
    ]

@router.post("/milestones/student/{student_id}")
def save_student_milestones(
    student_id: int,
    data: StudentMilestonesSave,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    for m_update in data.milestones:
        db_m = db.query(models.ParentMilestone).filter(
            models.ParentMilestone.id == m_update.id,
            models.ParentMilestone.student_id == student_id
        ).first()
        if db_m:
            db_m.status = m_update.status
            db_m.completed_date = m_update.completed_date if m_update.status.upper() == "COMPLETED" else None
            db_m.teacher_comments = m_update.teacher_comments
            
    db.commit()
    return {"message": "Student progress milestones updated successfully."}

# --- LEAVE APPROVALS ---
@router.get("/leaves")
def get_all_leave_requests(
    program_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("leaves"))
):
    query = db.query(models.LeaveRequest).join(
        models.Student, models.LeaveRequest.student_id == models.Student.id
    )
    
    if current_user.role and current_user.role.upper() == "TEACHER":
        filters = []
        if current_user.assigned_program_id:
            filters.append(models.Student.program_id == current_user.assigned_program_id)
        filters.append(models.Student.teacher_id == current_user.id)
        if filters:
            query = query.filter(or_(*filters))
    elif program_id:
        query = query.filter(models.Student.program_id == program_id)

    if program_id and current_user.role and current_user.role.upper() == "TEACHER":
        query = query.filter(models.Student.program_id == program_id)

    leaves = query.order_by(models.LeaveRequest.created_at.desc()).all()
    
    leaves_list = []
    for l in leaves:
        student = l.student
        leaves_list.append({
            "id": l.id,
            "student_id": l.student_id,
            "student_name": student.name if student else "Unknown Student",
            "program_title": student.program.title if student and student.program else "N/A",
            "program_id": student.program_id if student else None,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "reason": l.reason,
            "status": l.status,
            "admin_comment": l.admin_comment,
            "created_at": l.created_at.isoformat()
        })
        
    return leaves_list


@router.put("/leaves/{leave_id}/status")
def update_leave_request_status(
    leave_id: int,
    req: LeaveStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("leaves"))
):
    leave = db.query(models.LeaveRequest).filter(models.LeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(status_code=404, detail="Leave request not found.")
        
    leave.status = req.status
    leave.admin_comment = req.admin_comment
    
    # Sync with attendance table if approved
    if req.status.upper() == "APPROVED":
        # Generate dates in range
        date_strings = []
        try:
            start_dt = datetime.strptime(leave.start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(leave.end_date, "%Y-%m-%d")
            delta = end_dt - start_dt
            for i in range(delta.days + 1):
                date_strings.append((start_dt + timedelta(days=i)).strftime("%Y-%m-%d"))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")
            
        for d_str in date_strings:
            existing_att = db.query(models.Attendance).filter(
                models.Attendance.student_id == leave.student_id,
                models.Attendance.date == d_str
            ).first()
            
            if existing_att:
                existing_att.status = "LEAVE"
                existing_att.notes = f"Approved Leave: {leave.reason}"
            else:
                db_att = models.Attendance(
                    student_id=leave.student_id,
                    date=d_str,
                    status="LEAVE",
                    notes=f"Approved Leave: {leave.reason}"
                )
                db.add(db_att)
                
    db.commit()
    return {"message": f"Leave request status updated to {req.status} and synced with attendance.", "admin_comment": leave.admin_comment}

