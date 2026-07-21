from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from app.core.config import settings

from app.core.database import get_db
from app.api.v1.auth import get_current_user, require_permission
from app import models, schemas

router = APIRouter(prefix="/stationary", tags=["Stationery"])

# --- ITEMS CRUD ---

@router.get("/items", response_model=List[schemas.StationaryItemResponse])
def get_items(db: Session = Depends(get_db)):
    return db.query(models.StationaryItem).filter(models.StationaryItem.is_active == True).all()

@router.post("/items", response_model=schemas.StationaryItemResponse)
def create_item(
    request: schemas.StationaryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("stationary"))
):
    new_item = models.StationaryItem(**request.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

@router.put("/items/{item_id}", response_model=schemas.StationaryItemResponse)
def update_item(
    item_id: int,
    request: schemas.StationaryItemCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("stationary"))
):
    item = db.query(models.StationaryItem).filter(models.StationaryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Stationery item not found.")
        
    for k, v in request.model_dump().items():
        setattr(item, k, v)
        
    db.commit()
    db.refresh(item)
    return item

@router.delete("/items/{item_id}")
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("stationary"))
):
    item = db.query(models.StationaryItem).filter(models.StationaryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Stationery item not found.")
        
    item.is_active = False
    db.commit()
    return {"message": "Stationery item deleted successfully."}

# --- ORDERS ---

@router.get("/orders", response_model=List[schemas.StationaryOrderResponse])
def get_orders(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() in ["ADMIN", "SUPERADMIN", "PRINCIPAL", "TEACHER"]:
        return db.query(models.StationaryOrder).order_by(models.StationaryOrder.order_date.desc()).all()
    else:
        return db.query(models.StationaryOrder).filter(
            models.StationaryOrder.created_by_id == current_user.id
        ).order_by(models.StationaryOrder.order_date.desc()).all()

@router.post("/orders", response_model=schemas.StationaryOrderResponse)
def place_order(
    request: schemas.StationaryOrderCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not request.items:
        raise HTTPException(status_code=400, detail="Cannot place an order with empty items.")
        
    total_price = 0
    order_items_to_create = []
    
    for order_item in request.items:
        item = db.query(models.StationaryItem).filter(
            models.StationaryItem.id == order_item.item_id,
            models.StationaryItem.is_active == True
        ).first()
        
        if not item:
            raise HTTPException(status_code=404, detail=f"Stationery item ID {order_item.item_id} not found or inactive.")
            
        if item.stock < order_item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{item.name}'. Available: {item.stock}, Requested: {order_item.quantity}"
            )
            
        item.stock -= order_item.quantity
        item_total = item.price * order_item.quantity
        total_price += item_total
        
        order_items_to_create.append(
            models.StationaryOrderItem(
                item_id=item.id,
                quantity=order_item.quantity,
                unit_price=item.price
            )
        )
        
    order = models.StationaryOrder(
        student_name=request.student_name,
        class_name=request.class_name,
        total_price=total_price,
        status="Pending",
        created_by_id=current_user.id
    )
    db.add(order)
    db.commit()
    
    for oi in order_items_to_create:
        oi.order_id = order.id
        db.add(oi)
        
    db.commit()
    db.refresh(order)
    return order

@router.put("/orders/{order_id}/status", response_model=schemas.StationaryOrderResponse)
def update_order_status(
    order_id: int,
    request: schemas.StationaryOrderStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "SUPERADMIN", "PRINCIPAL", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Not authorized to update order status.")
        
    order = db.query(models.StationaryOrder).filter(models.StationaryOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    valid_statuses = ["Pending", "Dispatched", "Delivered", "Rejected"]
    if request.status not in valid_statuses:
      raise HTTPException(
        status_code=400,
        detail=f"Invalid status '{request.status}'. Must be one of: {', '.join(valid_statuses)}"
      )
        
    # If transitioning to Rejected, restore the stock of items
    if request.status == "Rejected" and order.status != "Rejected":
      for item in order.items:
        db_item = db.query(models.StationaryItem).filter(models.StationaryItem.id == item.item_id).first()
        if db_item:
          db_item.stock += item.quantity
                
    order.status = request.status
    db.commit()
    db.refresh(order)
    return order

@router.put("/orders/{order_id}/pay", response_model=schemas.StationaryOrderResponse)
def pay_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    order = db.query(models.StationaryOrder).filter(models.StationaryOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    if order.created_by_id != current_user.id and current_user.role.upper() not in ["ADMIN", "SUPERADMIN", "PRINCIPAL", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Not authorized to pay for this order.")
        
    if order.status not in ["Dispatched", "Delivered"]:
        raise HTTPException(status_code=400, detail="Order must be approved (dispatched/delivered) by a teacher or admin before payment.")
        
    order.payment_status = "Paid"
    db.commit()
    db.refresh(order)
    return order

class RazorpayVerifySchema(BaseModel):
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    razorpay_signature: Optional[str] = None
    is_mock: bool = False

def send_order_email(order, db: Session):
    on_behalf_of = "School"
    purpose = "School Supplies"
    
    if order.items:
        # Resolve item to inspect type
        first_item = db.query(models.StationaryItem).filter(models.StationaryItem.id == order.items[0].item_id).first()
        if first_item:
            if first_item.stationery_type == "teacher":
                on_behalf_of = f"Teacher ({order.created_by.full_name if order.created_by else 'Staff'})"
                purpose = "Teacher Classroom Supplies"
            elif first_item.stationery_type == "student":
                on_behalf_of = f"Student ({order.student_name or 'N/A'})"
                purpose = f"Student Stationery for Class {order.class_name or 'N/A'}"
                
    items_detail = ""
    for item in order.items:
        db_item = db.query(models.StationaryItem).filter(models.StationaryItem.id == item.item_id).first()
        item_name = db_item.name if db_item else "Stationery Item"
        items_detail += f"- {item_name} (Qty: {item.quantity}) at ₹{item.unit_price} each\n"
        
    email_body = f"""
============================================================
📧 AUTOMATED EMAIL DISPATCHED TO: malvan22nddec@gmail.com
============================================================
Subject: Stationery Order Payment Confirmation - Order #{order.id}

Dear Administrator,

We are pleased to inform you that a stationery order payment was completed successfully via Razorpay.

--- ORDER DETAILS ---
Order ID: #{order.id}
Order Date: {order.order_date}
Payment Status: Paid
Total Amount Paid: ₹{order.total_price}

--- RECIPIENT & PURPOSE ---
On Behalf Of: {on_behalf_of}
Purpose: {purpose}

--- ITEMS ORDERED ---
{items_detail}

Placed By: {order.created_by.full_name if order.created_by else 'Staff'}
============================================================
"""
    print(email_body)
    
    # Also attempt real sending via SMTP if SMTP configuration is present
    try:
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        
        smtp_host = getattr(settings, "SMTP_HOST", None)
        smtp_port = getattr(settings, "SMTP_PORT", None)
        smtp_user = getattr(settings, "SMTP_USER", None)
        smtp_pass = getattr(settings, "SMTP_PASS", None)
        
        if smtp_host and smtp_port and smtp_user and smtp_pass:
            msg = MIMEMultipart()
            msg['From'] = smtp_user
            msg['To'] = "malvan22nddec@gmail.com"
            msg['Subject'] = f"Stationery Order Payment Confirmation - Order #{order.id}"
            msg.attach(MIMEText(email_body, 'plain'))
            
            with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
                server.starttls()
                server.login(smtp_user, smtp_pass)
                server.sendmail(smtp_user, ["malvan22nddec@gmail.com"], msg.as_string())
            print("[Email] Real confirmation email sent successfully.")
    except Exception as e:
        print(f"[Email] Failed to send real email: {str(e)}")

@router.post("/orders/{order_id}/razorpay-order")
def create_stationary_order_razorpay_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    order = db.query(models.StationaryOrder).filter(models.StationaryOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    if order.payment_status == "Paid":
        raise HTTPException(status_code=400, detail="Order is already paid.")
        
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        return {
            "is_mock": True,
            "amount": float(order.total_price) * 100,  # in paise
            "currency": "INR",
            "bill_id": order_id,
            "title": f"Stationery Order #{order_id}"
        }
        
    try:
        import razorpay
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        order_payload = {
            "amount": int(float(order.total_price) * 100),
            "currency": "INR",
            "receipt": f"ORD_RCPT_{order_id}",
            "payment_capture": 1
        }
        
        import time
        order_payload["receipt"] = f"ORD_RCPT_{order_id}_{int(time.time())}"
        
        rzp_order = client.order.create(data=order_payload)
        return {
            "is_mock": False,
            "order_id": rzp_order["id"],
            "amount": rzp_order["amount"],
            "currency": rzp_order["currency"],
            "key_id": settings.RAZORPAY_KEY_ID,
            "title": f"Stationery Order #{order_id}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay order generation failed: {str(e)}")

@router.post("/orders/{order_id}/razorpay-verify")
def verify_stationary_order_razorpay_payment(
    order_id: int,
    data: RazorpayVerifySchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    order = db.query(models.StationaryOrder).filter(models.StationaryOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    if order.payment_status == "Paid":
        raise HTTPException(status_code=400, detail="Order is already paid.")
        
    if data.is_mock:
        order.payment_status = "Paid"
        db.commit()
        db.refresh(order)
        # Send automated email
        send_order_email(order, db)
        return {"status": "success", "message": "Simulated payment captured successfully."}
        
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=400, detail="Razorpay credentials not configured.")
        
    try:
        import razorpay
        client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
        params_dict = {
            'razorpay_order_id': data.razorpay_order_id,
            'razorpay_payment_id': data.razorpay_payment_id,
            'razorpay_signature': data.razorpay_signature
        }
        client.utility.verify_payment_signature(params_dict)
        
        order.payment_status = "Paid"
        db.commit()
        db.refresh(order)
        # Send automated email
        send_order_email(order, db)
        return {"status": "success", "message": "Razorpay payment verified and processed successfully."}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Signature verification failed: {str(e)}")

@router.post("/orders/{order_id}/reimburse")
def request_reimbursement(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    order = db.query(models.StationaryOrder).filter(models.StationaryOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    if order.payment_status != "Paid":
        raise HTTPException(status_code=400, detail="Reimbursement can only be requested for paid orders.")
        
    # Check if category of order belongs to Teacher or School
    # First item type determines category
    category_type = "school"
    if order.items:
        first_item = db.query(models.StationaryItem).filter(models.StationaryItem.id == order.items[0].item_id).first()
        if first_item:
            category_type = first_item.stationery_type
            
    if category_type not in ["school", "teacher"]:
        raise HTTPException(status_code=400, detail="Reimbursement is only available for School or Teacher stationery orders.")
        
    if current_user.role.upper() not in ["TEACHER", "ADMIN", "SUPERADMIN", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Only Teachers or School staff can request reimbursement.")
        
    order.reimbursement_status = "Pending"
    db.commit()
    db.refresh(order)
    return {"message": "Reimbursement ticket raised successfully.", "order": order}

@router.post("/orders/{order_id}/reimburse-approve")
def approve_reimbursement(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("stationary"))
):
    order = db.query(models.StationaryOrder).filter(models.StationaryOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    if order.reimbursement_status != "Pending":
        raise HTTPException(status_code=400, detail="No pending reimbursement request found for this order.")
        
    order.reimbursement_status = "Approved"
    db.commit()
    db.refresh(order)
    return {"message": "Reimbursement request approved successfully.", "order": order}

@router.post("/orders/{order_id}/reimburse-reject")
def reject_reimbursement(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permission("stationary"))
):
    order = db.query(models.StationaryOrder).filter(models.StationaryOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    if order.reimbursement_status != "Pending":
        raise HTTPException(status_code=400, detail="No pending reimbursement request found for this order.")
        
    order.reimbursement_status = "Rejected"
    db.commit()
    db.refresh(order)
    return {"message": "Reimbursement request rejected.", "order": order}

@router.delete("/orders/{order_id}")
def delete_stationary_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    order = db.query(models.StationaryOrder).filter(models.StationaryOrder.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    is_authorized = current_user.role.upper() in ["ADMIN", "SUPERADMIN", "PRINCIPAL"] or (
        current_user.role.upper() == "PARENT" and order.created_by_id == current_user.id
    )
    if not is_authorized:
        raise HTTPException(status_code=403, detail="Not authorized to delete this stationery order.")
        
    # Restore stock when deleted
    for item in order.items:
        db_item = db.query(models.StationaryItem).filter(models.StationaryItem.id == item.item_id).first()
        if db_item:
            db_item.stock += item.quantity
            
    db.delete(order)
    db.commit()
    return {"message": "Stationery order deleted successfully."}
