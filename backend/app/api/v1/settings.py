from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, List, Any
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=Dict[str, Any])
def get_all_settings(db: Session = Depends(get_db)):
    settings_list = db.query(models.SiteSetting).all()
    return {s.config_key: s.config_value for s in settings_list}

@router.get("/raw", response_model=List[schemas.SiteSettingResponse])
def get_raw_settings(db: Session = Depends(get_db)):
    return db.query(models.SiteSetting).all()

@router.put("", response_model=Dict[str, Any])
def update_settings(
    updates: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    for key, val in updates.items():
        setting = db.query(models.SiteSetting).filter(models.SiteSetting.config_key == key).first()
        if setting:
            setting.config_value = str(val) if val is not None else None
        else:
            # Determine category based on key name or default
            category = "general"
            if "color" in key or "theme" in key:
                category = "theme"
            elif "phone" in key or "email" in key or "address" in key:
                category = "contact"
            elif "social" in key or "facebook" in key or "instagram" in key:
                category = "social"
                
            setting = models.SiteSetting(
                config_key=key,
                config_value=str(val) if val is not None else None,
                category=category
            )
            db.add(setting)
    db.commit()
    
    settings_list = db.query(models.SiteSetting).all()
    return {s.config_key: s.config_value for s in settings_list}
