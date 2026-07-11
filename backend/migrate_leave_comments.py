import os
from sqlalchemy import create_engine, text
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL
engine = create_engine(DATABASE_URL)

def run_migration():
    print("Running Leave Request admin comments migration...")
    with engine.connect() as conn:
        # Check if admin_comment column exists in leave_requests
        check_query = """
            IF NOT EXISTS (
                SELECT * FROM sys.columns 
                WHERE object_id = OBJECT_ID('leave_requests') AND name = 'admin_comment'
            )
            BEGIN
                ALTER TABLE leave_requests ADD admin_comment VARCHAR(550) NULL;
                PRINT 'Added column admin_comment to leave_requests';
            END
            ELSE
            BEGIN
                PRINT 'Column admin_comment already exists in leave_requests';
            END
        """
        conn.execute(text(check_query))
        conn.commit()
    print("Migration completed successfully.")

if __name__ == "__main__":
    run_migration()
