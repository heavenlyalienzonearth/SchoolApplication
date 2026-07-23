import os
import shutil
import time
import io
import zipfile
from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.responses import Response

from sqlalchemy.orm import Session


from app import models
from app.core.database import get_db
from app.api.v1.auth import get_current_user

router = APIRouter(prefix="/moments", tags=["Student Moments"])

# Resolve static/moments directory path
STATIC_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "static"))
MOMENTS_DIR = os.path.join(STATIC_DIR, "moments")

def purge_expired_moments(db: Session):
    """
    Purges any student moments that have passed their 2-day expiration date,
    deleting both the file from disk and the record from the database.
    """
    now = datetime.utcnow()
    expired = db.query(models.StudentDailyMoment).filter(models.StudentDailyMoment.expires_at < now).all()
    if not expired:
        return
        
    os.makedirs(MOMENTS_DIR, exist_ok=True)
    for m in expired:
        try:
            filename = os.path.basename(m.file_path)
            full_path = os.path.join(MOMENTS_DIR, filename)
            if os.path.exists(full_path):
                os.remove(full_path)
                print(f"[PURGE] Deleted expired moment file from disk: {full_path}")
        except Exception as e:
            print(f"[PURGE] Error deleting file for moment {m.id}: {str(e)}")
        
        db.delete(m)
        print(f"[PURGE] Deleted expired moment record ID: {m.id}")
    db.commit()

@router.post("/upload")
def upload_student_moment(
    student_id: int = Form(...),
    title: str = Form(""),
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Verify current user is Admin, Principal, or Teacher
    role_upper = current_user.role.upper()
    if role_upper not in ["ADMIN", "PRINCIPAL", "TEACHER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only teachers, principals, and administrators can upload daily moments."
        )
        
    # Verify student exists
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    os.makedirs(MOMENTS_DIR, exist_ok=True)
    created_moments = []
    now = datetime.utcnow()
    expires_at = now + timedelta(days=2)
    
    for idx, file in enumerate(files):
        # Verify file is image or video
        content_type = file.content_type or ""
        if not (content_type.startswith("image/") or content_type.startswith("video/")):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file type for {file.filename}. Only image or video files are supported."
            )
            
        # Determine file type
        file_type = "video" if content_type.startswith("video/") else "image"
        
        # Save file on disk
        extension = os.path.splitext(file.filename)[1] if file.filename else (".mp4" if file_type == "video" else ".jpg")
        unique_filename = f"moment_{student_id}_{int(time.time())}_{idx}{extension}"
        dest_path = os.path.join(MOMENTS_DIR, unique_filename)
        
        try:
            with open(dest_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to save file {file.filename}: {str(e)}")
            
        # Database path (relative web access url)
        web_path = f"/static/moments/{unique_filename}"
        
        # Create record
        moment = models.StudentDailyMoment(
            student_id=student_id,
            teacher_id=current_user.id,
            file_path=web_path,
            file_type=file_type,
            title=title,
            created_at=now,
            expires_at=expires_at
        )
        db.add(moment)
        db.commit()
        db.refresh(moment)
        created_moments.append(moment)
        
    # Trigger Auto-Notification Email to Parents (Summary for all files)
    parents = db.query(models.User).filter(
        models.User.student_id == student_id,
        models.User.role == "PARENT"
    ).all()
    
    for p in parents:
        parent_email = p.email
        parent_name = p.full_name or "Parent"
        
        # Print simulated beautiful notification email outbox block
        print("="*60)
        print("EMAIL OUTBOX NOTIFICATION (NEW STUDENT MOMENTS)")
        print(f"From: notifications@kangarookids.edu")
        print(f"To: {parent_email} ({parent_name})")
        print(f"Subject: 📸 {len(files)} new daily moments shared for {student.name}!")
        print("-"*60)
        print(f"Hello {parent_name},")
        print(f"Class Teacher {current_user.full_name} has just shared {len(files)} new daily moments (photos/videos) for {student.name}!")
        print(f"Caption: '{title}'")
        print(f"Link: http://localhost:4200/parent/dashboard?tab=overview")
        print(f"\n*Note: These updates will be available in the portal for 2 days (until {expires_at.strftime('%Y-%m-%d %H:%M UTC')}) and will then be automatically deleted for student privacy.*")
        print("="*60)
        
    return {
        "message": f"Successfully uploaded {len(files)} moments and notified parents.",
        "moments": [
            {
                "id": m.id,
                "student_id": m.student_id,
                "file_path": m.file_path,
                "file_type": m.file_type,
                "title": m.title,
                "expires_at": m.expires_at.isoformat()
            } for m in created_moments
        ]
    }

@router.get("/student/{student_id}")
def get_moments_by_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    role_upper = current_user.role.upper()
    if role_upper not in ["ADMIN", "PRINCIPAL", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Permission denied.")
        
    # Purge old ones first
    purge_expired_moments(db)
    
    moments = db.query(models.StudentDailyMoment).filter(
        models.StudentDailyMoment.student_id == student_id
    ).order_by(models.StudentDailyMoment.created_at.desc()).all()
    
    return moments

@router.delete("/{moment_id}")
def delete_student_moment(
    moment_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    role_upper = current_user.role.upper()
    if role_upper not in ["ADMIN", "PRINCIPAL", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Permission denied.")
        
    moment = db.query(models.StudentDailyMoment).filter(models.StudentDailyMoment.id == moment_id).first()
    if not moment:
        raise HTTPException(status_code=404, detail="Moment not found.")
        
    # Delete from disk
    try:
        filename = os.path.basename(moment.file_path)
        full_path = os.path.join(MOMENTS_DIR, filename)
        if os.path.exists(full_path):
            os.remove(full_path)
    except Exception as e:
        print(f"Error deleting file on manual removal: {str(e)}")
        
    db.delete(moment)
    db.commit()
    return {"message": "Moment deleted successfully."}

@router.get("/parent/active")
def get_parent_moments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "PARENT":
        raise HTTPException(status_code=403, detail="Access denied. Parent role required.")
        
    if not current_user.student_id:
        return []
        
    # Run self-cleaning task
    purge_expired_moments(db)
    
    # Fetch active ones
    moments = db.query(models.StudentDailyMoment).filter(
        models.StudentDailyMoment.student_id == current_user.student_id
    ).order_by(models.StudentDailyMoment.created_at.desc()).all()
    
    results = []
    now = datetime.utcnow()
    for m in moments:
        # Calculate time remaining
        remaining = m.expires_at - now
        hours_remaining = max(0, int(remaining.total_seconds() / 3600))
        
        results.append({
            "id": m.id,
            "file_path": m.file_path,
            "file_type": m.file_type,
            "title": m.title,
            "created_at": m.created_at.isoformat(),
            "expires_at": m.expires_at.isoformat(),
            "hours_remaining": hours_remaining
        })
        
    return results

@router.get("/parent/download-album")
def download_parent_album_zip(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "PARENT":
        raise HTTPException(status_code=403, detail="Access denied. Parent role required.")
    if not current_user.student_id:
        raise HTTPException(status_code=404, detail="No pupil associated with this parent account.")
        
    purge_expired_moments(db)
    student = db.query(models.Student).filter(models.Student.id == current_user.student_id).first()
    moments = db.query(models.StudentDailyMoment).filter(
        models.StudentDailyMoment.student_id == current_user.student_id
    ).all()
    
    if not moments:
        raise HTTPException(status_code=404, detail="No active photos found in album to download.")

    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for idx, m in enumerate(moments):
            filename = os.path.basename(m.file_path)
            disk_path = os.path.join(MOMENTS_DIR, filename)
            if os.path.exists(disk_path):
                ext = os.path.splitext(filename)[1]
                student_slug = (student.name if student else "Pupil").replace(" ", "_")
                arcname = f"{student_slug}_Photo_{idx + 1}{ext}"
                zip_file.write(disk_path, arcname=arcname)
                
    zip_buffer.seek(0)
    student_slug = (student.name if student else "Student").replace(" ", "_")
    download_filename = f"{student_slug}_Photo_Album.zip"
    
    return Response(
        content=zip_buffer.getvalue(),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={download_filename}"}
    )

