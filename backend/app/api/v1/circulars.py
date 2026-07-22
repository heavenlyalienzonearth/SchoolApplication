import os
import shutil
import uuid
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_permission
from app import models, schemas

router = APIRouter(tags=["School Circulars"])

@router.get("/", response_model=List[schemas.CircularResponse])
def get_circulars(
    program_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Circular).filter(models.Circular.is_active == True)
    if program_id is not None:
        query = query.filter(
            (models.Circular.program_id == program_id) | (models.Circular.program_id.is_(None))
        )
        
    return query.order_by(models.Circular.created_at.desc()).all()

@router.get("/admin", response_model=List[schemas.CircularResponse])
def get_circulars_admin(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("circulars"))
):
        
    return db.query(models.Circular).order_by(models.Circular.created_at.desc()).all()

@router.post("/", response_model=schemas.CircularResponse, status_code=status.HTTP_201_CREATED)
def create_circular(
    circular: schemas.CircularCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("circulars"))
):
        
    db_circular = models.Circular(**circular.model_dump())
    db.add(db_circular)
    db.commit()
    db.refresh(db_circular)
    
    # 📧 Trigger simulated parent bulk email notifications
    target_class = "All Classes"
    parent_emails = []
    
    if db_circular.program_id:
        prog = db.query(models.Program).filter(models.Program.id == db_circular.program_id).first()
        if prog:
            target_class = prog.title
        # Query parents of students in this program
        parents = db.query(models.User).join(models.Student, models.User.student_id == models.Student.id).filter(
            models.Student.program_id == db_circular.program_id,
            models.User.role == "PARENT",
            models.User.is_active == True
        ).all()
        parent_emails = [p.email for p in parents if p.email]
    else:
        # Query all active parent users
        parents = db.query(models.User).filter(
            models.User.role == "PARENT",
            models.User.is_active == True
        ).all()
        parent_emails = [p.email for p in parents if p.email]
        
    # Print outbox dispatch details to console
    try:
        print("\n" + "="*60)
        print("📢 EMAIL OUTBOX NOTIFICATION (NEW SCHOOL CIRCULAR)")
        print(f"From: circulars@vidyankuram.edu")
        print(f"Subject: 📢 Vidyankuram School Circular: {db_circular.title}")
        print(f"Target Class: {target_class}")
        if parent_emails:
            print(f"Recipients ({len(parent_emails)}): {', '.join(parent_emails)}")
        else:
            print("Recipients: (No active parent email logins found for this class)")
        print("-"*60)
        print(f"Title: {db_circular.title}")
        print(f"Content: {db_circular.content}")
        if db_circular.attachment_url:
            print(f"Attachment: {db_circular.attachment_url}")
        print("="*60 + "\n")
    except UnicodeEncodeError:
        print("[CIRCULAR] New circular published - console emoji display unsupported on this terminal.")
    
    return db_circular

@router.put("/{circular_id}", response_model=schemas.CircularResponse)
def update_circular(
    circular_id: int,
    circular_update: schemas.CircularCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("circulars"))
):
        
    db_circular = db.query(models.Circular).filter(models.Circular.id == circular_id).first()
    if not db_circular:
        raise HTTPException(status_code=404, detail="Circular not found")
        
    for key, value in circular_update.model_dump().items():
        setattr(db_circular, key, value)
        
    db.commit()
    db.refresh(db_circular)
    return db_circular

@router.delete("/{circular_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_circular(
    circular_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("circulars"))
):
        
    db_circular = db.query(models.Circular).filter(models.Circular.id == circular_id).first()
    if not db_circular:
        raise HTTPException(status_code=404, detail="Circular not found")
        
    db.delete(db_circular)
    db.commit()
    return None
