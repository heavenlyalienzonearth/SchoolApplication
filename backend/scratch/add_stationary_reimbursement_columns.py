import sys
import os
from sqlalchemy import create_engine, text

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load database URL from .env via settings
from app.core.config import settings
DB_URL = settings.DATABASE_URL

def migrate():
    print("Connecting to MS SQL Server database (from .env)...")
    try:
        engine = create_engine(DB_URL, connect_args={"timeout": 15})
        with engine.connect() as conn:
            # Check if column already exists
            check_query = text("""
                SELECT COUNT(*) 
                FROM sys.columns 
                WHERE object_id = OBJECT_ID('stationary_orders') 
                AND name = 'reimbursement_status'
            """)
            result = conn.execute(check_query).scalar()
            if result == 0:
                print("Adding 'reimbursement_status' column to 'stationary_orders' table...")
                alter_query = text("ALTER TABLE stationary_orders ADD reimbursement_status VARCHAR(50) NULL;")
                conn.execute(alter_query)
                conn.commit()
                print("Column 'reimbursement_status' added successfully!")
            else:
                print("Column 'reimbursement_status' already exists in 'stationary_orders' table.")
    except Exception as e:
        print(f"Error during migration: {str(e)}")

if __name__ == "__main__":
    migrate()
