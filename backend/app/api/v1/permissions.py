"""
Permissions Management API
Provides endpoints for checking and updating role-based feature permissions.
"""
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas

router = APIRouter(prefix="/permissions", tags=["Permissions"])

def require_super_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role.upper() != "SUPERADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="SuperAdmin privilege required to perform this action."
        )
    return current_user


@router.get("/current", response_model=List[str])
def get_current_permissions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Retrieve enabled feature list for current user's role."""
    user_role = current_user.role
    
    # Query permissions for this role
    perms = db.query(models.FeaturePermission).filter(
        models.FeaturePermission.role == user_role,
        models.FeaturePermission.is_enabled == True
    ).all()
    
    return [p.feature for p in perms]


@router.get("/all", response_model=List[schemas.FeaturePermissionResponse])
def get_all_permissions(
    db: Session = Depends(get_db),
    _: models.User = Depends(require_super_admin)
):
    """Retrieve complete permissions matrix (SuperAdmin only)."""
    return db.query(models.FeaturePermission).all()


@router.put("", response_model=Dict[str, Any])
def update_permissions(
    updates: List[schemas.FeaturePermissionUpdate],
    db: Session = Depends(get_db),
    _: models.User = Depends(require_super_admin)
):
    """Update multiple feature permissions (SuperAdmin only)."""
    updated_count = 0
    for update in updates:
        perm = db.query(models.FeaturePermission).filter(
            models.FeaturePermission.role == update.role,
            models.FeaturePermission.feature == update.feature
        ).first()
        
        if perm:
            if perm.is_enabled != update.is_enabled:
                perm.is_enabled = update.is_enabled
                updated_count += 1
        else:
            # If a feature is new and doesn't exist, create it
            new_perm = models.FeaturePermission(
                role=update.role,
                feature=update.feature,
                is_enabled=update.is_enabled
            )
            db.add(new_perm)
            updated_count += 1
            
    db.commit()
    return {"message": f"Successfully updated {updated_count} permissions in the database."}
