from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

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
        
    valid_statuses = ["Pending", "Dispatched", "Delivered"]
    if request.status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{request.status}'. Must be one of: {', '.join(valid_statuses)}"
        )
        
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
