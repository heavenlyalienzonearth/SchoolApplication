from datetime import datetime, timedelta, timezone
import random
import uuid
import os
from typing import Dict, Tuple, List
import pyotp
import urllib.parse
from jose import jwt
from fastapi import APIRouter, Depends, HTTPException, status, Response, File, UploadFile
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.config import settings
from app.core import security
from app import models, schemas

router = APIRouter(prefix="/auth", tags=["Authentication"])
security_scheme = HTTPBearer()

def create_2fa_pending_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=5)
    to_encode = {"exp": expire, "sub": email, "type": "2fa_pending"}
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

# In-memory captcha store: maps captcha_id -> (lower_case_code, creation_datetime)
CAPTCHA_STORE: Dict[str, Tuple[str, datetime]] = {}

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

def check_permission(feature: str, db: Session, current_user: models.User) -> bool:
    # SuperAdmin bypasses all permissions
    if current_user.role.upper() == "SUPERADMIN":
        return True
        
    permission = db.query(models.FeaturePermission).filter(
        models.FeaturePermission.role == current_user.role,
        models.FeaturePermission.feature == feature
    ).first()
    
    if permission:
        return permission.is_enabled
        
    return False

def require_permission(feature: str):
    def dependency(
        db: Session = Depends(get_db),
        current_user: models.User = Depends(get_current_user)
    ):
        if not check_permission(feature, db, current_user):
            raise HTTPException(status_code=403, detail=f"Access denied. Missing permission: {feature}")
        return current_user
    return dependency

def populate_user_permissions(user: models.User, db: Session) -> models.User:
    perms = db.query(models.FeaturePermission).filter(
        models.FeaturePermission.role == user.role,
        models.FeaturePermission.is_enabled == True
    ).all()
    user.permissions = [p.feature for p in perms]
    return user

@router.get("/captcha", response_model=schemas.CaptchaResponse)
def get_captcha(response: Response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    # Clean up expired captchas (> 5 mins)
    now = datetime.utcnow()
    expired = [k for k, v in CAPTCHA_STORE.items() if (now - v[1]).total_seconds() > 300]
    for k in expired:
        CAPTCHA_STORE.pop(k, None)
        
    # Generate a random 5-char alphanumeric string
    chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz"
    captcha_text = "".join(random.choice(chars) for _ in range(5))
    captcha_id = str(uuid.uuid4())
    
    # Store it (lowercase for case-insensitive validation)
    CAPTCHA_STORE[captcha_id] = (captcha_text.lower(), now)
    
    # Generate a beautiful, clean, professional SVG representation
    width = 150
    height = 50
    svg_lines = []
    svg_lines.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" style="border-radius: 6px; user-select: none;">')
    
    # Add gradient definition
    svg_lines.append("""
    <defs>
      <linearGradient id="captchaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#F8FAFC;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#E2E8F0;stop-opacity:1" />
      </linearGradient>
    </defs>
    """)
    
    # Draw background rect with gradient
    svg_lines.append('<rect width="100%" height="100%" fill="url(#captchaGrad)" />')
    
    # Add a professional dot grid background
    for dot_x in range(10, width, 12):
        for dot_y in range(8, height, 10):
            svg_lines.append(f'<circle cx="{dot_x}" cy="{dot_y}" r="1" fill="#CBD5E1" />')
            
    # Add 2 clean curved distortion lines (noise wave)
    for _ in range(2):
        y_start = random.randint(15, 35)
        y_ctrl1 = random.randint(5, 45)
        y_ctrl2 = random.randint(5, 45)
        y_end = random.randint(15, 35)
        svg_lines.append(f'<path d="M 0 {y_start} C {width//3} {y_ctrl1}, {2*width//3} {y_ctrl2}, {width} {y_end}" fill="none" stroke="#94A3B8" stroke-width="1" stroke-dasharray="3 3"/>')
        
    # Add text characters with professional styling, subtle rotations, and cohesive slate color
    for i, char in enumerate(captcha_text):
        x = 18 + i * 24 + random.randint(-2, 2)
        y = 34 + random.randint(-2, 2)
        angle = random.randint(-10, 10)
        font_size = random.randint(23, 26)
        color = random.choice(["#1E293B", "#334155", "#475569"]) # Premium slate navy theme
        svg_lines.append(f'<text x="{x}" y="{y}" transform="rotate({angle} {x} {y})" fill="{color}" font-size="{font_size}" font-weight="800" font-family="system-ui, -apple-system, sans-serif" letter-spacing="1" style="text-shadow: 1px 1px 0px rgba(255,255,255,0.8);">{char}</text>')
        
    svg_lines.append('</svg>')
    svg_content = "".join(svg_lines)
    
    return {"captcha_id": captcha_id, "captcha_svg": svg_content}

@router.post("/login", response_model=schemas.Token)
def login(request: schemas.LoginRequest, db: Session = Depends(get_db)):
    # Validate captcha first
    captcha_record = CAPTCHA_STORE.pop(request.captcha_id, None)
    if not captcha_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captcha has expired. Please reload the captcha and try again."
        )
    
    expected_code, created_time = captcha_record
    if (datetime.utcnow() - created_time).total_seconds() > 300:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Captcha has expired. Please reload the captcha and try again."
        )
        
    if request.captcha_code.strip().lower() != expected_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect captcha code. Please try again."
        )

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
    
    # Check if Two-Factor Authentication is enabled
    if user.two_factor_enabled:
        two_factor_token = create_2fa_pending_token(user.email)
        return {
            "access_token": None,
            "refresh_token": None,
            "token_type": "bearer",
            "user": None,
            "two_factor_required": True,
            "two_factor_token": two_factor_token
        }

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
        "user": populate_user_permissions(user, db),
        "two_factor_required": False,
        "two_factor_token": None
    }

@router.get("/2fa/setup", response_model=schemas.TwoFactorSetupResponse)
def get_2fa_setup(current_user: models.User = Depends(get_current_user)):
    if current_user.role.upper() != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Only SuperAdmin can manage 2FA settings.")
    secret = pyotp.random_base32()
    # Create provisioning URI for Google Authenticator
    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=current_user.email,
        issuer_name="Vidyankuram School"
    )
    # Generate Google Charts / QR Server URL
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={urllib.parse.quote(provisioning_uri)}"
    return {"secret": secret, "qr_code_url": qr_code_url}

@router.post("/2fa/setup/verify", response_model=schemas.UserResponse)
def verify_2fa_setup(
    request: schemas.TwoFactorVerifySetupRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.upper() != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Only SuperAdmin can manage 2FA settings.")
    totp = pyotp.TOTP(request.secret)
    if not totp.verify(request.code.strip(), valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please try again."
        )
    current_user.two_factor_secret = request.secret
    current_user.two_factor_enabled = True
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/2fa/disable", response_model=schemas.UserResponse)
def disable_2fa(
    request: schemas.TwoFactorDisableRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role.upper() != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Only SuperAdmin can manage 2FA settings.")
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Two-factor authentication is not enabled."
        )
    totp = pyotp.TOTP(current_user.two_factor_secret)
    if not totp.verify(request.code.strip(), valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please try again."
        )
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    db.commit()
    db.refresh(current_user)
    return current_user

# --- SUPER ADMIN MASTER USER 2FA MANAGER ENDPOINTS ---

@router.get("/users/{user_id}/2fa/setup", response_model=schemas.TwoFactorSetupResponse)
def get_user_2fa_setup(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Only SuperAdmin can manage user 2FA settings.")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    secret = pyotp.random_base32()
    provisioning_uri = pyotp.totp.TOTP(secret).provisioning_uri(
        name=user.email,
        issuer_name="Vidyankuram School"
    )
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={urllib.parse.quote(provisioning_uri)}"
    return {"secret": secret, "qr_code_url": qr_code_url}

@router.post("/users/{user_id}/2fa/verify", response_model=schemas.UserResponse)
def verify_user_2fa_setup(
    user_id: int,
    request: schemas.TwoFactorVerifySetupRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Only SuperAdmin can manage user 2FA settings.")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    totp = pyotp.TOTP(request.secret)
    if not totp.verify(request.code.strip(), valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification code. Please try again."
        )
    user.two_factor_secret = request.secret
    user.two_factor_enabled = True
    db.commit()
    db.refresh(user)
    return user

@router.post("/users/{user_id}/2fa/disable", response_model=schemas.UserResponse)
def disable_user_2fa(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() != "SUPERADMIN":
        raise HTTPException(status_code=403, detail="Only SuperAdmin can manage user 2FA settings.")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user.two_factor_enabled = False
    user.two_factor_secret = None
    db.commit()
    db.refresh(user)
    return user

@router.post("/2fa/login", response_model=schemas.Token)
def two_factor_login(request: schemas.TwoFactorLoginRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.two_factor_token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "2fa_pending":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 2FA token. Please try logging in again."
            )
        email = payload.get("sub")
        if not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid 2FA token payload. Please try logging in again."
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Expired or invalid 2FA token. Please try logging in again."
        )
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found or inactive."
        )
        
    totp = pyotp.TOTP(user.two_factor_secret)
    if not totp.verify(request.code.strip(), valid_window=1):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect 2FA verification code. Please try again."
        )
        
    # Generate final tokens
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
        "user": populate_user_permissions(user, db),
        "two_factor_required": False,
        "two_factor_token": None
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
        "user": populate_user_permissions(user, db)
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
def get_me(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return populate_user_permissions(current_user, db)

# --- USER MANAGEMENT CRUD (ADMIN ONLY) ---

@router.get("/users", response_model=List[schemas.UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "SUPERADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators have authority to view users."
        )
    return db.query(models.User).filter(models.User.role != "PARENT").order_by(models.User.created_at.desc()).all()

@router.post("/users", response_model=schemas.UserResponse)
def create_user(
    request: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "SUPERADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators have authority to create users."
        )
    
    # Check email duplicate
    existing = db.query(models.User).filter(models.User.email == request.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already in use by another user."
        )
    
    # Validate role is Admin, Principal, Teacher, or SuperAdmin
    role_formatted = request.role.strip()
    valid_roles = ["Admin", "Principal", "Teacher", "SuperAdmin"]
    matched_role = next((r for r in valid_roles if r.lower() == role_formatted.lower()), None)
    if not matched_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role '{role_formatted}'. Must be one of: {', '.join(valid_roles)}"
        )
        
    hashed_pwd = security.get_password_hash(request.password)
    import pyotp
    new_user = models.User(
        email=request.email,
        full_name=request.full_name,
        hashed_password=hashed_pwd,
        role=matched_role,
        is_active=True,
        two_factor_enabled=True,
        two_factor_secret=pyotp.random_base32(),
        cv_url=request.cv_url,
        education=request.education,
        experience=request.experience,
        achievements=request.achievements,
        assigned_program_id=request.assigned_program_id
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/users/{user_id}", response_model=schemas.UserResponse)
def update_user(
    user_id: int,
    request: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "SUPERADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators have authority to modify users."
        )
        
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=404,
            detail="User not found."
        )
        
    # Prevent self-editing of critical fields (like deactivating self)
    if target_user.id == current_user.id:
        if request.is_active is not None and not request.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot deactivate your own administrator account."
            )
            
    if request.full_name is not None:
        target_user.full_name = request.full_name
        
    if request.email is not None:
        # Check duplicate
        dup = db.query(models.User).filter(models.User.email == request.email, models.User.id != user_id).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email address is already in use by another user."
            )
        target_user.email = request.email
        
    if request.role is not None:
        valid_roles = ["Admin", "Principal", "Teacher", "SuperAdmin"]
        matched_role = next((r for r in valid_roles if r.lower() == request.role.strip().lower()), None)
        if not matched_role:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        # Prevent changing own role away from Admin/SuperAdmin
        if target_user.id == current_user.id and matched_role not in ["Admin", "SuperAdmin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You cannot change your own role from Admin/SuperAdmin."
            )
        target_user.role = matched_role
        
    if request.is_active is not None:
        target_user.is_active = request.is_active
        
    if request.password is not None and request.password.strip() != "":
        target_user.hashed_password = security.get_password_hash(request.password)

    if request.cv_url is not None:
        target_user.cv_url = request.cv_url
    if request.education is not None:
        target_user.education = request.education
    if request.experience is not None:
        target_user.experience = request.experience
    if request.achievements is not None:
        target_user.achievements = request.achievements
    if request.assigned_program_id is not None:
        target_user.assigned_program_id = request.assigned_program_id
        
    db.commit()
    db.refresh(target_user)
    return target_user

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "SUPERADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators have authority to delete users."
        )
        
    target_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not target_user:
         raise HTTPException(status_code=404, detail="User not found.")
         
    if target_user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own administrator account."
        )
        
    db.delete(target_user)
    db.commit()
    return {"message": "User deleted successfully."}

# --- FORGOT & RESET PASSWORD FLOW ---

@router.post("/forgot-password")
def forgot_password(request: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user:
        # Prevent user enumeration security risk
        return {"message": "If this email is registered in our portal, a password reset link has been dispatched."}
        
    # Generate token (expires in 15 minutes)
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": user.email, "type": "password_reset"}
    reset_token = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    
    reset_url = f"http://localhost:4200/admin/reset-password?token={reset_token}"
    
    # Print a beautiful mock email template to stdout/console
    print("\n" + "="*80)
    print("📧 MOCK EMAIL NOTIFICATION: PASSWORD RESET REQUEST")
    print(f"Recipient: {user.full_name} ({user.email})")
    print(f"Subject: Reset Your Kangaroo Kids Portal Password")
    print("-"*80)
    print(f"Dear {user.full_name or 'User'},")
    print("We received a request to reset your password for the Kangaroo Kids Admin Portal.")
    print("To choose a new password, click the link below or copy and paste it into your browser:")
    print(f"\n👉 {reset_url}\n")
    print("Note: This reset link is valid for 15 minutes only.")
    print("If you did not request this reset, please ignore this email.")
    print("\nKangaroo Kids Portal Security Desk")
    print("="*80 + "\n")
    
    return {"message": "If this email is registered in our portal, a password reset link has been dispatched."}

@router.post("/reset-password")
def reset_password(request: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(request.token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        if payload.get("type") != "password_reset":
            raise HTTPException(status_code=400, detail="Invalid token type.")
        email: str = payload.get("sub")
        if not email:
            raise HTTPException(status_code=400, detail="Invalid token payload.")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The password reset link is invalid or has expired."
        )
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    user.hashed_password = security.get_password_hash(request.new_password)
    db.commit()
    
    return {"message": "Your password has been successfully reset. You may now log in."}

@router.post("/upload-cv", status_code=status.HTTP_200_OK)
async def upload_teacher_cv(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["ADMIN", "SUPERADMIN"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators have authority to upload CVs."
        )
        
    filename = file.filename.lower()
    if not filename.endswith(('.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png')):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF, Word Document (.doc, .docx), or Image files are allowed."
        )
        
    MAX_SIZE = 100 * 1024 * 1024 # 100 MB
    
    try:
        content = await file.read()
        if len(content) > MAX_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="File size exceeds the maximum limit of 100 MB."
            )
            
        import uuid
        ext = os.path.splitext(filename)[1]
        unique_filename = f"cv_{uuid.uuid4().hex}{ext}"
        
        static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "static"))
        photos_dir = os.path.join(static_dir, "photos")
        os.makedirs(photos_dir, exist_ok=True)
        
        file_path = os.path.join(photos_dir, unique_filename)
        with open(file_path, "wb") as f:
            f.write(content)
            
        cv_url = f"/static/photos/{unique_filename}"
        return {"cv_url": cv_url}
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save CV file: {str(e)}")
