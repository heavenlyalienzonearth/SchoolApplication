from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas
import openpyxl
import io
import csv

router = APIRouter(prefix="/admissions", tags=["Student Admissions"])

# --- VACCINATIONS ---

@router.get("/vaccinations", response_model=List[schemas.VaccinationResponse])
def get_vaccinations(db: Session = Depends(get_db)):
    return db.query(models.Vaccination).order_by(models.Vaccination.age_group, models.Vaccination.name).all()

@router.post("/vaccinations/upload", status_code=status.HTTP_200_OK)
async def upload_vaccinations(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    filename = file.filename.lower()
    vaccines_to_add = []
    
    try:
        content = await file.read()
        
        if filename.endswith('.xlsx'):
            # Parse Excel sheet using openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(content), data_only=True)
            sheet = wb.active
            # Assumes columns: Name, Age Group (or Vaccination Name, Target Class)
            # Row 1 is header: Name, Age Group
            for row in sheet.iter_rows(min_row=2, values_only=True):
                if not row or not row[0]:
                    continue
                name = str(row[0]).strip()
                age_group = str(row[1]).strip() if len(row) > 1 and row[1] else "General"
                vaccines_to_add.append({"name": name, "age_group": age_group})
                
        elif filename.endswith('.csv'):
            # Parse CSV sheet
            decoded = content.decode('utf-8').splitlines()
            reader = csv.reader(decoded)
            header = next(reader, None) # skip header
            for row in reader:
                if not row or not row[0]:
                    continue
                name = row[0].strip()
                age_group = row[1].strip() if len(row) > 1 and row[1] else "General"
                vaccines_to_add.append({"name": name, "age_group": age_group})
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload an Excel (.xlsx) or CSV (.csv) file.")
            
        if not vaccines_to_add:
            raise HTTPException(status_code=400, detail="No valid vaccination records found in the uploaded file.")
            
        # Delete existing list or just insert new ones
        # For simplicity, we append new unique ones or refresh the table
        # Let's delete all and import the new sheet
        db.query(models.Vaccination).delete()
        
        for item in vaccines_to_add:
            db_vaccine = models.Vaccination(name=item["name"], age_group=item["age_group"])
            db.add(db_vaccine)
            
        db.commit()
        return {"message": f"Successfully imported {len(vaccines_to_add)} vaccinations."}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to process vaccination list: {str(e)}")

# --- ADMISSION APPLICATIONS ---

@router.post("/apply", response_model=schemas.AdmissionResponse, status_code=status.HTTP_201_CREATED)
def submit_admission_application(
    admission: schemas.AdmissionCreate,
    db: Session = Depends(get_db)
):
    # Verify program exists
    prog = db.query(models.Program).filter(models.Program.id == admission.program_id).first()
    if not prog:
        raise HTTPException(status_code=404, detail="Program not found")
        
    # Create application record
    db_admission = models.Admission(
        child_name=admission.child_name,
        parent_name=admission.parent_name,
        email=admission.email,
        phone=admission.phone,
        date_of_birth=admission.date_of_birth,
        program_id=admission.program_id,
        allergies=admission.allergies,
        photo_url=admission.photo_url,
        issued_items_json=admission.issued_items_json,
        blood_group=admission.blood_group,
        emergency_phone=admission.emergency_phone,
        status="NEW"
    )
    db.add(db_admission)
    db.commit()
    db.refresh(db_admission)
    
    # Save selected vaccinations
    for vac_item in admission.vaccinations:
        # Verify vaccination exists
        v = db.query(models.Vaccination).filter(models.Vaccination.id == vac_item.vaccination_id).first()
        if not v:
            continue
            
        db_vac_link = models.AdmissionVaccination(
            admission_id=db_admission.id,
            vaccination_id=vac_item.vaccination_id,
            administered_date=vac_item.administered_date
        )
        db.add(db_vac_link)
        
    db.commit()
    db.refresh(db_admission)
    return db_admission

@router.get("/applications", response_model=List[schemas.AdmissionResponse])
def get_admission_applications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Admission).order_by(models.Admission.created_at.desc()).all()

@router.put("/applications/{admission_id}/status", response_model=schemas.AdmissionResponse)
def update_admission_status(
    admission_id: int,
    status_update: schemas.AdmissionStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_admission = db.query(models.Admission).filter(models.Admission.id == admission_id).first()
    if not db_admission:
        raise HTTPException(status_code=404, detail="Admission application not found")
        
    new_status = status_update.status.upper()
    if new_status not in ["APPROVED", "REJECTED", "NEW"]:
        raise HTTPException(status_code=400, detail="Invalid status. Must be NEW, APPROVED, or REJECTED.")
        
    old_status = db_admission.status
    db_admission.status = new_status
    
    # Trigger auto-register if status changes to APPROVED
    if new_status == "APPROVED" and old_status != "APPROVED":
        # Check if student already exists
        existing_student = db.query(models.Student).filter(
            models.Student.name == db_admission.child_name,
            models.Student.parent_name == db_admission.parent_name
        ).first()
        
        if not existing_student:
            student = models.Student(
                name=db_admission.child_name,
                parent_name=db_admission.parent_name,
                phone=db_admission.phone,
                program_id=db_admission.program_id,
                allergies=db_admission.allergies,
                photo_url=db_admission.photo_url,
                issued_items_json=db_admission.issued_items_json,
                blood_group=db_admission.blood_group,
                emergency_phone=db_admission.emergency_phone,
                date_of_birth=db_admission.date_of_birth,
                is_active=True
            )
            db.add(student)
            
    db.commit()
    db.refresh(db_admission)
    return db_admission

import os
import uuid

@router.post("/upload-photo", status_code=status.HTTP_200_OK)
async def upload_child_photo(
    file: UploadFile = File(...)
):
    filename = file.filename.lower()
    if not filename.endswith(('.png', '.jpg', '.jpeg', '.webp')):
        raise HTTPException(status_code=400, detail="Only image files (.png, .jpg, .jpeg, .webp) are allowed.")
        
    try:
        # Generate a unique filename to prevent collisions
        ext = os.path.splitext(filename)[1]
        unique_filename = f"{uuid.uuid4()}{ext}"
        
        # Save to backend static/photos folder
        photos_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "static", "photos"))
        os.makedirs(photos_dir, exist_ok=True)
        file_path = os.path.join(photos_dir, unique_filename)
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
            
        # Return the public URL
        photo_url = f"/photos/{unique_filename}"
        return {"photo_url": photo_url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save child photo: {str(e)}")

@router.post("/applications/{admission_id}/email-badge", status_code=status.HTTP_200_OK)
def email_student_badge(
    admission_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_admission = db.query(models.Admission).filter(models.Admission.id == admission_id).first()
    if not db_admission:
        raise HTTPException(status_code=404, detail="Admission application not found")
        
    from datetime import datetime
    program_title = db_admission.program.title if db_admission.program else "Preschool"
    current_year = datetime.now().year
    
    # Setup mock email contents
    recipient = "printshop@schoolcards.com"
    subject = f"📇 ID Card Printing Request: {db_admission.child_name}"
    
    email_body = f"""
============================================================
📧 MOCK EMAIL DISPATCHED TO ID CARD PRINTER
============================================================
From: Kangaroo Kids System <noreply@kangarookids.com>
To: {recipient}
Subject: {subject}

Hello Printing Department,

Please print the following student ID badge:

- Child's Name: {db_admission.child_name}
- Class: {program_title}
- Class Current Year: {current_year}
- Emergency Phone: {db_admission.emergency_phone or db_admission.phone}
- Blood Group: {db_admission.blood_group or "Not Specified"}
- Photo Path: http://localhost:8000{db_admission.photo_url if db_admission.photo_url else "/photos/default.jpg"}

Please reply once the badge has been printed and shipped.

Regards,
Kangaroo Kids Admin Portal
============================================================
"""
    print(email_body)
    
    return {"message": "Success! The ID badge request has been directly emailed to printshop@schoolcards.com."}
