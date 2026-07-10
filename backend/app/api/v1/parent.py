from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas
from typing import Dict, Any, List
import json

router = APIRouter(prefix="/parent", tags=["Parent Portal"])

@router.get("/dashboard", response_model=Dict[str, Any])
def get_parent_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "PARENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only parent users can access the parent dashboard."
        )
        
    if not current_user.student_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No student record linked to this parent account."
        )
        
    student = db.query(models.Student).filter(models.Student.id == current_user.student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked student record not found."
        )
        
    # Get attendance records
    attendance_records = db.query(models.Attendance).filter(models.Attendance.student_id == student.id).order_by(models.Attendance.date.desc()).all()
    total_days = len(attendance_records)
    present_days = sum(1 for r in attendance_records if r.status.upper() in ["PRESENT", "LATE"])
    attendance_percentage = (present_days / total_days * 100) if total_days > 0 else 100.0
    
    # Get program details
    program = db.query(models.Program).filter(models.Program.id == student.program_id).first()
    program_title = program.title if program else "N/A"
    
    # Parse weekly plan
    weekly_plan = None
    if program and program.weekly_plan_json:
        try:
            weekly_plan = json.loads(program.weekly_plan_json)
        except Exception:
            pass
            
    # Get admission application to get vaccinations & issued items
    admission = db.query(models.Admission).filter(
        models.Admission.child_name == student.name,
        models.Admission.parent_name == student.parent_name
    ).order_by(models.Admission.created_at.desc()).first()
    
    vaccinations = []
    issued_items = []
    
    if admission:
        # Load vaccinations links
        vac_links = db.query(models.AdmissionVaccination).filter(models.AdmissionVaccination.admission_id == admission.id).all()
        for link in vac_links:
            vaccinations.append({
                "vaccination_name": link.vaccination.name if link.vaccination else "Vaccination",
                "administered_date": link.administered_date
            })
            
        # Parse issued items
        if admission.issued_items_json:
            try:
                issued_items = json.loads(admission.issued_items_json)
            except Exception:
                pass
                
    # Get student's stationary orders
    orders = db.query(models.StationaryOrder).filter(
        models.StationaryOrder.student_name == student.name
    ).order_by(models.StationaryOrder.order_date.desc()).all()
    
    orders_list = []
    for order in orders:
        items = []
        for o_item in order.items:
            items.append({
                "name": o_item.item.name if o_item.item else "Item",
                "quantity": o_item.quantity,
                "unit_price": float(o_item.unit_price)
            })
        orders_list.append({
            "id": order.id,
            "order_date": order.order_date.isoformat(),
            "status": order.status,
            "total_price": float(order.total_price),
            "items": items
        })

    return {
        "parent_name": current_user.full_name,
        "email": current_user.email,
        "kid": {
            "id": student.id,
            "name": student.name,
            "dob": student.date_of_birth,
            "photo_url": student.photo_url or "/photos/default.jpg",
            "blood_group": student.blood_group or "Not Specified",
            "allergies": student.allergies or "None",
            "program_title": program_title,
            "emergency_phone": student.emergency_phone
        },
        "attendance": {
            "percentage": round(attendance_percentage, 1),
            "present": present_days,
            "total": total_days,
            "records": [
                {"date": r.date, "status": r.status, "notes": r.notes}
                for r in attendance_records[:10]
            ]
        },
        "weekly_plan": weekly_plan,
        "vaccinations": vaccinations,
        "issued_items": issued_items,
        "stationary_orders": orders_list
    }
