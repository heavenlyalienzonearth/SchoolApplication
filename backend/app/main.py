from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import auth, settings as api_settings, content, submissions, chatbot, attendance, admissions, holidays, stationary, parent, finance, moments, circulars, library, meals, traffic, permissions, assignments, teacher
from app.middleware.traffic import TrafficLoggingMiddleware
from app.middleware.security import SecurityHeadersMiddleware

from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(
    title="School Application API",
    description="Backend services for dynamic and configurable school application",
    version="1.0.0"
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# HTTP Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# Traffic Logging Middleware (must be added AFTER CORS)
app.add_middleware(TrafficLoggingMiddleware)

# Include Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(api_settings.router, prefix="/api/v1")
app.include_router(content.router, prefix="/api/v1")
app.include_router(submissions.router, prefix="/api/v1")
app.include_router(attendance.router, prefix="/api/v1")
app.include_router(admissions.router, prefix="/api/v1")
app.include_router(chatbot.router, prefix="/api/v1/chatbot", tags=["Chatbot"])
app.include_router(holidays.router, prefix="/api/v1/holidays", tags=["Holidays"])
app.include_router(circulars.router, prefix="/api/v1/circulars", tags=["School Circulars"])
app.include_router(library.router, prefix="/api/v1/library", tags=["School Library"])
app.include_router(stationary.router, prefix="/api/v1")
app.include_router(parent.router, prefix="/api/v1")
app.include_router(finance.router, prefix="/api/v1")
app.include_router(moments.router, prefix="/api/v1")
app.include_router(meals.router, prefix="/api/v1")
app.include_router(traffic.router, prefix="/api/v1")
app.include_router(permissions.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(teacher.router, prefix="/api/v1")


@app.on_event("startup")
def startup_event():
    from app.core.database import engine, Base
    from app.core.database import SessionLocal
    import app.models as models
    from app.core.security import get_password_hash
    
    # 1. Automatically create all tables (if not already existing)
    Base.metadata.create_all(bind=engine)
    
    # Check/Add payment_status column in stationary_orders table
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    if inspector.has_table("stationary_orders"):
        columns = [c['name'] for c in inspector.get_columns("stationary_orders")]
        if "payment_status" not in columns:
            print("[Startup] Adding column 'payment_status' to 'stationary_orders'...")
            with engine.connect() as conn:
                conn.execute(text("ALTER TABLE [stationary_orders] ADD [payment_status] VARCHAR(50) DEFAULT 'Unpaid' NOT NULL"))
                conn.commit()
    
    # 2. Seed Super Admin and default Feature Permissions
    db = SessionLocal()
    try:
        # Check if SuperAdmin exists
        super_admin = db.query(models.User).filter(models.User.role == "SuperAdmin").first()
        if not super_admin:
            print("[Startup] Seeding SuperAdmin user...")
            hashed_pw = get_password_hash("superadmin@123")
            new_super = models.User(
                email="superadmin@school.com",
                full_name="Super Administrator",
                hashed_password=hashed_pw,
                role="SuperAdmin",
                is_active=True
            )
            db.add(new_super)
            db.commit()
            print("[Startup] SuperAdmin user seeded successfully!")
        
        # Check if permissions exist
        perm_count = db.query(models.FeaturePermission).count()
        if perm_count == 0:
            print("[Startup] Seeding default feature permissions...")
            default_features = [
                "analytics", "settings", "hero", "programs", "holidays", "gallery", 
                "inquiries", "users", "circulars", "library", "admissions", "milestones", 
                "testimonials", "attendance", "finance-structures", "finance-ledger", 
                "stationary", "moments", "leaves", "traffic", "permissions"
            ]
            
            permissions_map = {
                "SuperAdmin": {f: True for f in default_features},
                
                "Admin": {
                    "settings": False,
                    "traffic": False,
                    "permissions": False,
                    **{f: True for f in default_features if f not in ["settings", "traffic", "permissions"]}
                },
                
                "Principal": {
                    "finance-structures": False,
                    "finance-ledger": False,
                    "permissions": False,
                    "settings": False,
                    "traffic": False,
                    **{f: True for f in default_features if f not in ["finance-structures", "finance-ledger", "permissions", "settings", "traffic"]}
                },
                
                "Teacher": {
                    "settings": False,
                    "traffic": False,
                    "permissions": False,
                    "finance-structures": False,
                    "finance-ledger": False,
                    "programs": False,
                    "gallery": False,
                    "inquiries": False,
                    "admissions": False,
                    "users": False,
                    "stationary": False,
                    **{f: True for f in default_features if f not in [
                        "settings", "traffic", "permissions", "finance-structures", 
                        "finance-ledger", "programs", "gallery", "inquiries", "admissions", "users",
                        "stationary"
                    ]}
                },
                
                "Parent": {
                    "settings": False,
                    "traffic": False,
                    "permissions": False,
                    "finance-structures": False,
                    "finance-ledger": False,
                    "programs": False,
                    "gallery": False,
                    "inquiries": False,
                    "admissions": False,
                    "users": False,
                    "circulars": True,
                    "library": True,
                    "attendance": True,
                    "milestones": True,
                    "leaves": True,
                    "moments": True,
                    "stationary": True,
                    "meals": True,
                    "analytics": False,
                    "hero": False,
                    "holidays": True,
                    "testimonials": False
                }
            }
            
            for role, features in permissions_map.items():
                for feature, is_enabled in features.items():
                    db.add(models.FeaturePermission(
                        role=role,
                        feature=feature,
                        is_enabled=is_enabled
                    ))
            db.commit()
        # 3. Safety Check: Reset 2FA to disabled for all users on startup to prevent lockout.
        # All users must have their 2FA configured manually via Super Admin user setting scan.
        active_2fa_users = db.query(models.User).filter(models.User.two_factor_enabled == True).all()
        if active_2fa_users:
            print(f"[Startup] Safety check: Resetting 2FA to disabled for {len(active_2fa_users)} users to prevent system lockout...")
            for user in active_2fa_users:
                user.two_factor_enabled = False
                user.two_factor_secret = None
            db.commit()
            print("[Startup] Safety 2FA reset complete!")
            
        # 4. CORS & DB Security configurations checks
        is_prod_db = "200.97.168.156" in settings.DATABASE_URL
        cors_origins = settings.cors_origins_list
        print(f"[Security] Active CORS Whitelist: {cors_origins}", flush=True)
        if is_prod_db:
            if "*" in cors_origins:
                print("[WARNING] SECURITY HAZARD: CORS origin is set to wildcard '*' while connected to a production database!", flush=True)
            elif all("localhost" in origin or "127.0.0.1" in origin for origin in cors_origins):
                print("[WARNING] DEPLOYMENT WARNING: Active database is Production, but CORS origins only allow localhost/dev access. The production frontend will be BLOCKED from accessing this API!", flush=True)
            
    except Exception as e:
        print(f"[Startup] Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()


# Create and mount static directory
static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "static"))
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

photos_dir = os.path.join(static_dir, "photos")
os.makedirs(photos_dir, exist_ok=True)
app.mount("/photos", StaticFiles(directory=photos_dir), name="photos")

# Mount static assets folder
assets_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "public", "assets"))
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
else:
    print(f"Warning: assets directory not found at {assets_dir}")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "name": "School Application Core API",
        "version": "1.0.0"
    }
