from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas
from typing import Dict, Any, List, Optional
import json
import razorpay
from app.core.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/parent", tags=["Parent Portal"])

class RazorpayVerifySchema(BaseModel):
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    is_mock: bool = False

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

from pydantic import BaseModel
import random
from datetime import datetime, timedelta
from fastapi.responses import HTMLResponse

class LeaveCreateSchema(BaseModel):
    start_date: str
    end_date: str
    reason: str

class PaymentSchema(BaseModel):
    payment_method: str

@router.get("/billing")
def get_parent_billing(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.student_id:
        raise HTTPException(status_code=404, detail="No student linked to this account.")
        
    bills = db.query(models.ParentBill).filter(models.ParentBill.student_id == current_user.student_id).all()
    total_due = sum(b.amount for b in bills if b.status == "Unpaid")
    
    bills_list = []
    for b in bills:
        bills_list.append({
            "id": b.id,
            "title": b.title,
            "amount": float(b.amount),
            "due_date": b.due_date,
            "status": b.status,
            "paid_date": b.paid_date.isoformat() if b.paid_date else None,
            "payment_method": b.payment_method,
            "receipt_no": b.receipt_no
        })
        
    return {
        "bills": bills_list,
        "total_due": float(total_due)
    }

@router.post("/billing/{bill_id}/pay")
def pay_parent_bill(
    bill_id: int,
    req: PaymentSchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.student_id:
        raise HTTPException(status_code=404, detail="No student linked to this account.")
        
    bill = db.query(models.ParentBill).filter(
        models.ParentBill.id == bill_id,
        models.ParentBill.student_id == current_user.student_id
    ).first()
    
    if not bill:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    if bill.status == "Paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid.")
        
    bill.status = "Paid"
    bill.paid_date = datetime.utcnow()
    bill.payment_method = req.payment_method
    bill.receipt_no = f"REC-2026-{random.randint(1000, 9999)}"
    
    db.commit()
    db.refresh(bill)
    
    return {
        "message": "Payment successful!",
        "bill": {
            "id": bill.id,
            "title": bill.title,
            "amount": float(bill.amount),
            "status": bill.status,
            "receipt_no": bill.receipt_no
        }
    }

@router.get("/billing/{bill_id}/receipt", response_class=HTMLResponse)
def get_bill_receipt_html(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.student_id:
        raise HTTPException(status_code=404, detail="No student linked to this account.")
        
    bill = db.query(models.ParentBill).filter(
        models.ParentBill.id == bill_id,
        models.ParentBill.student_id == current_user.student_id
    ).first()
    
    if not bill or bill.status != "Paid":
        raise HTTPException(status_code=404, detail="Receipt not found or invoice is unpaid.")
        
    student = db.query(models.Student).filter(models.Student.id == current_user.student_id).first()
    
    # Generate receipt page
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Fee Receipt - {bill.receipt_no}</title>
        <style>
            body {{ font-family: 'Outfit', sans-serif; padding: 40px; color: #1E293B; max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 8px; }}
            .header {{ text-align: center; border-bottom: 2px solid #EE5A24; padding-bottom: 20px; }}
            .header h1 {{ color: #EE5A24; margin: 0; font-size: 24px; }}
            .header p {{ color: #64748B; margin: 5px 0 0 0; font-size: 14px; }}
            .details-table {{ width: 100%; border-collapse: collapse; margin-top: 30px; }}
            .details-table td {{ padding: 10px; border-bottom: 1px solid #F1F5F9; font-size: 14px; }}
            .label {{ font-weight: 700; color: #475569; width: 40%; }}
            .total-row {{ font-weight: 800; font-size: 18px; color: #EE5A24; }}
            .footer {{ text-align: center; margin-top: 40px; font-size: 12px; color: #94A3B8; border-top: 1px dashed #E2E8F0; padding-top: 20px; }}
            .print-btn {{ display: block; width: 100%; text-align: center; background: #EE5A24; color: white; padding: 12px; border-radius: 6px; text-decoration: none; font-weight: 700; margin-top: 30px; cursor: pointer; border: none; }}
            @media print {{
                .print-btn {{ display: none; }}
                body {{ border: none; padding: 0; }}
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>KANGAROO KIDS PRE-SCHOOL</h1>
            <p>108, Outer Ring Road, Bangalore, Karnataka</p>
            <p><strong>OFFICIAL TRANSACTION RECEIPT</strong></p>
        </div>
        
        <table class="details-table">
            <tr>
                <td class="label">Receipt Number</td>
                <td><strong>{bill.receipt_no}</strong></td>
            </tr>
            <tr>
                <td class="label">Payment Date</td>
                <td>{bill.paid_date.strftime("%Y-%m-%d %H:%M:%S") if bill.paid_date else "--"}</td>
            </tr>
            <tr>
                <td class="label">Student Name</td>
                <td>{student.name if student else "N/A"}</td>
            </tr>
            <tr>
                <td class="label">Parent Name</td>
                <td>{current_user.full_name}</td>
            </tr>
            <tr>
                <td class="label">Payment Method</td>
                <td>{bill.payment_method}</td>
            </tr>
            <tr>
                <td class="label">Item Description</td>
                <td>{bill.title}</td>
            </tr>
            <tr class="total-row">
                <td class="label">Total Paid</td>
                <td>₹{bill.amount}</td>
            </tr>
        </table>
        
        <button class="print-btn" onclick="window.print()">🖨️ Print Receipt</button>
        
        <div class="footer">
            Thank you for your payment. This is a computer-generated invoice and requires no physical signature.
        </div>
    </body>
    </html>
    """
    return html_content

@router.get("/milestones")
def get_parent_milestones(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.student_id:
        raise HTTPException(status_code=404, detail="No student linked to this account.")
        
    milestones = db.query(models.ParentMilestone).filter(models.ParentMilestone.student_id == current_user.student_id).all()
    
    grouped = {
        "Cognitive": [],
        "Physical": [],
        "Emotional": []
    }
    
    for m in milestones:
        cat = m.category or "Cognitive"
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append({
            "id": m.id,
            "milestone_name": m.milestone_name,
            "status": m.status,
            "completed_date": m.completed_date,
            "teacher_comments": m.teacher_comments
        })
        
    return grouped

@router.get("/leaves")
def get_parent_leaves(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.student_id:
        raise HTTPException(status_code=404, detail="No student linked to this account.")
        
    leaves = db.query(models.LeaveRequest).filter(models.LeaveRequest.student_id == current_user.student_id).order_by(models.LeaveRequest.created_at.desc()).all()
    
    leaves_list = []
    for l in leaves:
        leaves_list.append({
            "id": l.id,
            "start_date": l.start_date,
            "end_date": l.end_date,
            "reason": l.reason,
            "status": l.status,
            "admin_comment": l.admin_comment,
            "created_at": l.created_at.isoformat()
        })
        
    return leaves_list

@router.post("/leaves")
def submit_parent_leave(
    req: LeaveCreateSchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not current_user.student_id:
        raise HTTPException(status_code=404, detail="No student linked to this account.")
        
    # Create leave request
    leave = models.LeaveRequest(
        student_id=current_user.student_id,
        start_date=req.start_date,
        end_date=req.end_date,
        reason=req.reason,
        status="Pending"
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    
    return {
        "message": "Leave request submitted successfully. Pending approval by administrator/principal.",
        "leave": {
            "id": leave.id,
            "start_date": leave.start_date,
            "end_date": leave.end_date,
            "reason": leave.reason,
            "status": leave.status
        }
    }

@router.post("/billing/{bill_id}/razorpay-order")
def create_parent_razorpay_order(
    bill_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "PARENT":
        raise HTTPException(status_code=403, detail="Permission denied.")
        
    bill = db.query(models.ParentBill).filter(
        models.ParentBill.id == bill_id,
        models.ParentBill.student_id == current_user.student_id
    ).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found.")
        
    if bill.status == "Paid":
        raise HTTPException(status_code=400, detail="Bill is already paid.")
        
    # Check if credentials exist
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        # Fall back to secure mock mode
        return {
            "is_mock": True,
            "amount": float(bill.amount) * 100,  # in paise
            "currency": "INR",
            "bill_id": bill_id,
            "title": bill.title
        }
        
    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        order_payload = {
            "amount": int(float(bill.amount) * 100),  # amount in paise
            "currency": "INR",
            "receipt": f"RCPT_{bill_id}",
            "payment_capture": 1
        }
        
        # Add random salt to receipt to prevent collision on retry
        import time
        order_payload["receipt"] = f"RCPT_{bill_id}_{int(time.time())}"
        
        order = client.order.create(data=order_payload)
        return {
            "is_mock": False,
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": settings.RAZORPAY_KEY_ID,
            "title": bill.title
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay order generation failed: {str(e)}")

@router.post("/billing/{bill_id}/razorpay-verify")
def verify_parent_razorpay_payment(
    bill_id: int,
    data: RazorpayVerifySchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "PARENT":
        raise HTTPException(status_code=403, detail="Permission denied.")
        
    bill = db.query(models.ParentBill).filter(
        models.ParentBill.id == bill_id,
        models.ParentBill.student_id == current_user.student_id
    ).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found.")
        
    if bill.status == "Paid":
        raise HTTPException(status_code=400, detail="Bill is already paid.")
        
    from datetime import datetime
    import time
    if data.is_mock:
        # Mock payment verification
        bill.status = "Paid"
        bill.paid_date = datetime.utcnow()
        bill.payment_method = "Razorpay (Simulated)"
        bill.receipt_no = f"REC-MOCK-PAY-{bill_id}-{int(time.time())}"
        db.commit()
        return {"status": "success", "message": "Simulated payment captured successfully."}
        
    # Real signature verification
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=400, detail="Razorpay credentials not configured.")
        
    try:
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        # Verify payment signature
        params_dict = {
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        }
        client.utility.verify_payment_signature(params_dict)
        
        # Payment is verified
        bill.status = "Paid"
        bill.paid_date = datetime.utcnow()
        bill.payment_method = "Razorpay"
        bill.receipt_no = f"REC-RZP-{data.razorpay_payment_id}"
        db.commit()
        return {"status": "success", "message": "Razorpay payment verified and processed successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Signature verification failed: {str(e)}")

