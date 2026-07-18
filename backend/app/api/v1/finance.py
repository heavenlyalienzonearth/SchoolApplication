import random
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_permission
from app import models

router = APIRouter(tags=["Finance"])

# --- PYDANTIC SCHEMAS ---
class FeeStructureCreate(BaseModel):
    name: str
    category: str
    amount: float
    frequency: str
    program_id: Optional[int] = None

class InvoicesGenerate(BaseModel):
    term_name: str
    program_id: Optional[int] = None
    due_date: str

class ManualPayment(BaseModel):
    payment_method: str

class WaiverIssue(BaseModel):
    waiver_amount: float
    reason: str

# --- ROUTE HANDLERS ---

@router.get("/finance/fee-structures")
def get_fee_structures(db: Session = Depends(get_db), current_user: models.User = Depends(require_permission("finance-structures"))):
    structures = db.query(models.FeeStructure).all()
    return [
        {
            "id": s.id,
            "name": s.name,
            "category": s.category,
            "amount": float(s.amount),
            "frequency": s.frequency,
            "program_id": s.program_id,
            "program_title": s.program.title if s.program else "All Programs",
            "is_active": s.is_active
        }
        for s in structures
    ]

@router.post("/finance/fee-structures")
def create_fee_structure(
    data: FeeStructureCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("finance-structures"))
):
    structure = models.FeeStructure(
        name=data.name,
        category=data.category,
        amount=data.amount,
        frequency=data.frequency,
        program_id=data.program_id,
        is_active=True
    )
    db.add(structure)
    db.commit()
    return {"message": "Fee structure defined successfully."}

@router.delete("/finance/fee-structures/{structure_id}")
def delete_fee_structure(
    structure_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("finance-structures"))
):
    structure = db.query(models.FeeStructure).filter(models.FeeStructure.id == structure_id).first()
    if not structure:
        raise HTTPException(status_code=404, detail="Structure not found.")
    db.delete(structure)
    db.commit()
    return {"message": "Structure deleted successfully."}

@router.get("/finance/invoices")
def get_invoices(
    status: Optional[str] = None,
    program_id: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("finance-ledger"))
):
    query = db.query(models.ParentBill).join(models.Student)
    
    if status:
        query = query.filter(models.ParentBill.status == status)
    if program_id:
        query = query.filter(models.Student.program_id == program_id)
    if search:
        query = query.filter(models.Student.name.like(f"%{search}%"))
        
    bills = query.order_by(models.ParentBill.created_at.desc()).all()
    
    # Calculate outstanding collections total across all unpaid invoices matching program filter
    unpaid_query = db.query(models.ParentBill)
    unpaid_query = unpaid_query.filter(models.ParentBill.status == "Unpaid")
    if program_id:
        unpaid_query = unpaid_query.join(models.Student).filter(models.Student.program_id == program_id)
    
    total_outstanding = sum(float(b.amount) for b in unpaid_query.all())
    
    invoices_list = []
    for b in bills:
        parent = db.query(models.User).filter(models.User.student_id == b.student_id).first()
        invoices_list.append({
            "id": b.id,
            "student_id": b.student_id,
            "student_name": b.student.name,
            "program_title": b.student.program.title if b.student.program else "N/A",
            "parent_email": parent.email if parent else "N/A",
            "title": b.title,
            "amount": float(b.amount),
            "waiver_amount": float(b.waiver_amount),
            "due_date": b.due_date,
            "status": b.status,
            "paid_date": b.paid_date.isoformat() if b.paid_date else None,
            "payment_method": b.payment_method,
            "receipt_no": b.receipt_no,
            "notes": b.notes,
            "created_at": b.created_at.isoformat()
        })
        
    return {
        "invoices": invoices_list,
        "outstanding_total": total_outstanding
    }

@router.post("/finance/invoices/generate")
def generate_term_invoices(
    data: InvoicesGenerate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("finance-ledger"))
):
    std_query = db.query(models.Student).filter(models.Student.status == "Approved")
    if data.program_id:
        std_query = std_query.filter(models.Student.program_id == data.program_id)
    students = std_query.all()
    
    if not students:
        raise HTTPException(status_code=400, detail="No active students found matching criteria.")
        
    structures = db.query(models.FeeStructure).filter(models.FeeStructure.is_active == True).all()
    
    invoice_count = 0
    for student in students:
        applicable = [
            s for s in structures 
            if s.program_id is None or s.program_id == student.program_id
        ]
        
        for struct in applicable:
            bill_title = f"{data.term_name} - {struct.name}"
            exists = db.query(models.ParentBill).filter(
                models.ParentBill.student_id == student.id,
                models.ParentBill.title == bill_title
            ).first()
            
            if not exists:
                bill = models.ParentBill(
                    student_id=student.id,
                    title=bill_title,
                    amount=struct.amount,
                    due_date=data.due_date,
                    status="Unpaid",
                    waiver_amount=0.00
                )
                db.add(bill)
                invoice_count += 1
    
    if invoice_count > 0:
        db.commit()
        
    return {"message": f"Successfully generated {invoice_count} invoices for {data.term_name}."}

@router.post("/finance/invoices/{invoice_id}/pay")
def record_manual_payment(
    invoice_id: int,
    data: ManualPayment,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("finance-ledger"))
):
    bill = db.query(models.ParentBill).filter(models.ParentBill.id == invoice_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    if bill.status == "Paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid.")
        
    bill.status = "Paid"
    bill.paid_date = datetime.utcnow()
    bill.payment_method = data.payment_method
    bill.receipt_no = f"REC-MAN-{invoice_id}-{random.randint(1000, 9999)}"
    
    db.commit()
    return {"message": "Payment recorded successfully.", "receipt_no": bill.receipt_no}

@router.post("/finance/invoices/{invoice_id}/waiver")
def issue_waiver(
    invoice_id: int,
    data: WaiverIssue,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("finance-ledger"))
):
    bill = db.query(models.ParentBill).filter(models.ParentBill.id == invoice_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    if bill.status == "Paid":
        raise HTTPException(status_code=400, detail="Cannot issue waiver on a fully paid invoice.")
        
    if data.waiver_amount <= 0 or data.waiver_amount > float(bill.amount):
        raise HTTPException(status_code=400, detail="Invalid waiver amount. Must be positive and cannot exceed bill due amount.")
        
    bill.waiver_amount = float(bill.waiver_amount) + data.waiver_amount
    bill.amount = float(bill.amount) - data.waiver_amount
    
    waiver_note = f"Waiver of {data.waiver_amount:.2f} issued: {data.reason}. "
    bill.notes = waiver_note + (bill.notes or "")
    
    if float(bill.amount) <= 0:
        bill.status = "Paid"
        bill.paid_date = datetime.utcnow()
        bill.payment_method = "Waiver/Discount"
        bill.receipt_no = f"REC-WAIV-{invoice_id}"
        
    db.commit()
    return {"message": f"Waiver of {data.waiver_amount:.2f} recorded successfully."}

@router.post("/finance/invoices/{invoice_id}/remind")
def send_payment_reminder(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("finance-ledger"))
):
    bill = db.query(models.ParentBill).filter(models.ParentBill.id == invoice_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    if bill.status == "Paid":
        raise HTTPException(status_code=400, detail="Invoice is already paid.")
        
    parent = db.query(models.User).filter(models.User.student_id == bill.student_id).first()
    parent_email = parent.email if parent else "parent@school.com"
    parent_name = parent.full_name if parent else bill.student.parent_name
    
    print("="*60)
    print(f"EMAIL OUTBOX REMINDER (OVERDUE FEE)")
    print(f"Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"To: {parent_email} ({parent_name})")
    print(f"Subject: OVERDUE FEE REMINDER: {bill.title} - Kangaroo Kids")
    print(f"Body:")
    print(f"Dear {parent_name},")
    print(f"This is a reminder that the outstanding fee payment of {float(bill.amount):.2f} for {bill.title}")
    print(f"assigned to your child {bill.student.name} was due on {bill.due_date}.")
    print(f"Please log in to the Parent Portal at your earliest convenience to complete payment.")
    print(f"If you have already paid, please ignore this reminder.")
    print(f"Regards,")
    print(f"Finance Office, Kangaroo Kids Pre-School")
    print("="*60)
    
    return {"message": f"Overdue reminder email simulated to {parent_email} successfully."}

@router.post("/finance/invoices/remind-all")
def send_bulk_payment_reminders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("finance-ledger"))
):
    overdue_bills = db.query(models.ParentBill).filter(models.ParentBill.status == "Unpaid").all()
    
    reminded_count = 0
    for bill in overdue_bills:
        parent = db.query(models.User).filter(models.User.student_id == bill.student_id).first()
        parent_email = parent.email if parent else "parent@school.com"
        parent_name = parent.full_name if parent else bill.student.parent_name
        
        print("="*60)
        print(f"EMAIL OUTBOX REMINDER (BULK OVERDUE FEE)")
        print(f"Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"To: {parent_email} ({parent_name})")
        print(f"Subject: OVERDUE FEE REMINDER: {bill.title} - Kangaroo Kids")
        print(f"Body:")
        print(f"Dear {parent_name},")
        print(f"This is an urgent reminder that the outstanding fee payment of {float(bill.amount):.2f} for {bill.title}")
        print(f"assigned to your child {bill.student.name} is currently overdue (Due date: {bill.due_date}).")
        print(f"Please pay through the Fees & Billing ledger in the Parent Portal immediately.")
        print(f"Regards,")
        print(f"Finance Office, Kangaroo Kids Pre-School")
        print("="*60)
        reminded_count += 1
        
    return {"message": f"Sent {reminded_count} bulk email reminders to parents."}
