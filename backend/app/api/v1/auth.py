from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core import security
from app import models, schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    token = credentials.credentials
    email = security.verify_token(token, "access")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return user

@router.post("/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not security.verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Generate tokens
    access_token = security.create_access_token(subject=user.email)
    refresh_token_str = security.create_refresh_token(subject=user.email)
    
    # Save refresh token in DB
    db_refresh_token = models.RefreshToken(
        token=refresh_token_str,
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    db.add(db_refresh_token)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token_str,
        "token_type": "bearer",
        "user": user
    }

@router.post("/refresh", response_model=schemas.Token)
def refresh(request: schemas.RefreshRequest, db: Session = Depends(get_db)):
    email = security.verify_token(request.refresh_token, "refresh")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )
    
    # Verify in DB
    db_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token == request.refresh_token,
        models.RefreshToken.is_revoked == False,
        models.RefreshToken.expires_at > datetime.utcnow()
    ).first()
    
    if not db_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token revoked or expired",
        )
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with token is inactive or not found",
        )
    
    # Revoke old token
    db_token.is_revoked = True
    
    # Create new tokens
    access_token = security.create_access_token(subject=user.email)
    new_refresh_token_str = security.create_refresh_token(subject=user.email)
    
    # Save new refresh token in DB
    new_db_token = models.RefreshToken(
        token=new_refresh_token_str,
        user_id=user.id,
        expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    )
    
    db.add(new_db_token)
    db.commit()
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token_str,
        "token_type": "bearer",
        "user": user
    }

@router.post("/logout")
def logout(request: schemas.RefreshRequest, db: Session = Depends(get_db)):
    # Revoke the refresh token
    db_token = db.query(models.RefreshToken).filter(
        models.RefreshToken.token == request.refresh_token
    ).first()
    if db_token:
        db_token.is_revoked = True
        db.commit()
    return {"detail": "Successfully logged out"}

@router.get("/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user
