import os
import json
import uuid
from datetime import datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas

router = APIRouter(prefix="/assignments", tags=["Class Assignments"])

# Dynamic upload folder path relative to app folder
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "static", "assignments"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

def cleanup_expired_assignments(db: Session):
    """Permanently deletes assignments older than 3 days from database and disk."""
    cutoff_date = (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d")
    expired = db.query(models.ClassAssignment).filter(models.ClassAssignment.date < cutoff_date).all()
    
    deleted_count = 0
    for a in expired:
        try:
            files = json.loads(a.files_json)
            for file_path in files:
                # Strip leading slash to locate file relative to backend root
                rel_path = file_path.lstrip("/")
                full_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", rel_path))
                if os.path.exists(full_path):
                    os.remove(full_path)
        except Exception as e:
            print(f"[Cleanup] Error deleting files on disk: {str(e)}")
            
        db.delete(a)
        deleted_count += 1
        
    if deleted_count > 0:
        db.commit()
        print(f"[Cleanup] Automatically cleaned up {deleted_count} expired assignments.")

@router.post("/upload")
def upload_assignment(
    program_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(None),
    date: str = Form(...),  # YYYY-MM-DD
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "SUPERADMIN", "PRINCIPAL", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Not authorized to upload class assignments.")

    # Trigger automatic cleanup
    cleanup_expired_assignments(db)

    uploaded_files = []
    for file in files:
        # Generate safe unique filename
        ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)
        
        # Save file to static folder
        with open(file_path, "wb") as f:
            f.write(file.file.read())
            
        # Store relative url path (compatible with Hostinger VPS and local dev)
        uploaded_files.append(f"/static/assignments/{unique_filename}")

    assignment = models.ClassAssignment(
        program_id=program_id,
        teacher_id=current_user.id,
        title=title,
        description=description,
        files_json=json.dumps(uploaded_files),
        date=date
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)

    return {"message": "Assignment uploaded successfully.", "assignment": assignment}

@router.get("/teacher", response_model=List[schemas.ClassAssignmentResponse])
def get_teacher_assignments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "SUPERADMIN", "PRINCIPAL", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Not authorized to access assignments.")

    # Clean up expired ones
    cleanup_expired_assignments(db)

    # Filter to teacher's assignments, or all if Admin/Principal
    if current_user.role.upper() in ["ADMIN", "SUPERADMIN", "PRINCIPAL"]:
        return db.query(models.ClassAssignment).order_by(models.ClassAssignment.date.desc()).all()
    
    return db.query(models.ClassAssignment).filter(
        models.ClassAssignment.teacher_id == current_user.id
    ).order_by(models.ClassAssignment.date.desc()).all()

@router.get("/parent/{student_id}", response_model=List[schemas.ClassAssignmentResponse])
def get_parent_assignments(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Enforce parent access, or admin access
    if current_user.role.upper() == "PARENT" and current_user.student_id != student_id:
        raise HTTPException(status_code=403, detail="Not authorized to access assignments for this student.")

    # Run cleanups
    cleanup_expired_assignments(db)

    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")

    # Get assignments for child's class (program_id) dated within last 3 days
    cutoff_date = (datetime.utcnow() - timedelta(days=3)).strftime("%Y-%m-%d")
    
    return db.query(models.ClassAssignment).filter(
        models.ClassAssignment.program_id == student.program_id,
        models.ClassAssignment.date >= cutoff_date
    ).order_by(models.ClassAssignment.date.desc()).all()

@router.delete("/{assignment_id}")
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "SUPERADMIN", "PRINCIPAL", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete assignments.")

    assignment = db.query(models.ClassAssignment).filter(models.ClassAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found.")

    # Teacher can only delete their own
    if current_user.role.upper() == "TEACHER" and assignment.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own assignments.")

    # Remove files from disk
    try:
        files = json.loads(assignment.files_json)
        for file_path in files:
            rel_path = file_path.lstrip("/")
            full_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", rel_path))
            if os.path.exists(full_path):
                os.remove(full_path)
    except Exception as e:
        print(f"[Delete] Error deleting files on disk: {str(e)}")

    db.delete(assignment)
    db.commit()

    return {"message": "Assignment deleted successfully."}
