import sys
from sqlalchemy import create_engine, text
from app.core.config import settings

def test_database():
    try:
        print(f"Testing connection to: {settings.DATABASE_URL}")
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            # Query tables
            result = conn.execute(text("SELECT COUNT(*) FROM sys.tables")).fetchone()
            print(f"Connection Successful! Total tables in SchoolDB: {result[0]}")
            
            # Fetch site settings
            res = conn.execute(text("SELECT config_value FROM site_settings WHERE config_key = 'site_name'")).fetchone()
            if res:
                print(f"School Name from site_settings: {res[0]}")
            else:
                print("Warning: site_name setting not found.")
                
            # Fetch users
            user_res = conn.execute(text("SELECT email FROM users WHERE role = 'ADMIN'")).fetchone()
            if user_res:
                print(f"Admin User exists: {user_res[0]}")
            else:
                print("Warning: Admin user not found.")
                
        print("Database Verification: PASSED")
    except Exception as e:
        print(f"Database Verification: FAILED - {e}")
        sys.exit(1)

if __name__ == "__main__":
    test_database()
