from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas
from typing import List

router = APIRouter(prefix="/meals", tags=["Meal Planner"])

@router.get("", response_model=List[schemas.MealPlanResponse])
def get_meal_plans(db: Session = Depends(get_db)):
    return db.query(models.MealPlan).order_by(
        models.MealPlan.day_of_week, 
        models.MealPlan.meal_type
    ).all()

@router.post("", response_model=schemas.MealPlanResponse)
def create_or_update_meal_plan(
    meal_plan: schemas.MealPlanCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "PRINCIPAL"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators and principals can manage the meal planner."
        )
        
    # Check if a meal plan for this day & meal type already exists
    existing = db.query(models.MealPlan).filter(
        models.MealPlan.day_of_week == meal_plan.day_of_week,
        models.MealPlan.meal_type == meal_plan.meal_type
    ).first()
    
    if existing:
        # Update existing
        existing.menu_item = meal_plan.menu_item
        existing.description = meal_plan.description
        existing.allergens = meal_plan.allergens
        existing.calories = meal_plan.calories
        db.commit()
        db.refresh(existing)
        return existing
    else:
        # Create new
        db_meal = models.MealPlan(**meal_plan.dict())
        db.add(db_meal)
        db.commit()
        db.refresh(db_meal)
        return db_meal

@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal_plan(
    meal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "PRINCIPAL"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators and principals can manage the meal planner."
        )
        
    db_meal = db.query(models.MealPlan).filter(models.MealPlan.id == meal_id).first()
    if not db_meal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meal plan not found."
        )
    db.delete(db_meal)
    db.commit()
    return None

@router.get("/suspensions")
def list_meal_suspensions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "PRINCIPAL", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Unauthorized access.")
        
    suspensions = db.query(models.MealSuspensionRequest).join(
        models.Student, models.MealSuspensionRequest.student_id == models.Student.id
    ).order_by(models.MealSuspensionRequest.created_at.desc()).all()
    
    res = []
    for s in suspensions:
        res.append({
            "id": s.id,
            "student_id": s.student_id,
            "student_name": s.student.name,
            "request_date": s.request_date,
            "reason": s.reason,
            "status": s.status,
            "acknowledged_by": s.acknowledged_by,
            "acknowledged_at": s.acknowledged_at.isoformat() if s.acknowledged_at else None,
            "created_at": s.created_at.isoformat()
        })
    return res

@router.post("/suspensions/{suspension_id}/acknowledge")
def acknowledge_meal_suspension(
    suspension_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "PRINCIPAL", "TEACHER"]:
        raise HTTPException(status_code=403, detail="Unauthorized access.")
        
    suspension = db.query(models.MealSuspensionRequest).filter(
        models.MealSuspensionRequest.id == suspension_id
    ).first()
    
    if not suspension:
        raise HTTPException(status_code=404, detail="Meal suspension request not found.")
        
    import datetime
    suspension.status = "Acknowledged"
    suspension.acknowledged_by = current_user.full_name or current_user.email
    suspension.acknowledged_at = datetime.datetime.utcnow()
    
    db.commit()
    db.refresh(suspension)
    return {
        "message": "Meal suspension request acknowledged successfully.",
        "suspension": {
            "id": suspension.id,
            "status": suspension.status,
            "acknowledged_by": suspension.acknowledged_by,
            "acknowledged_at": suspension.acknowledged_at.isoformat()
        }
    }

