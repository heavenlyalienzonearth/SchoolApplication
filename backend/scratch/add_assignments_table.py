import sys
import os
from sqlalchemy import create_engine, text

# Add parent directory to path to import backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Production database URL
DB_URL = "mssql+pyodbc://sa:M0_tre_141@200.97.168.156/SchoolDB?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes"

def migrate():
    print("Connecting to production MS SQL Server database...")
    try:
        engine = create_engine(DB_URL, connect_args={"timeout": 15})
        with engine.connect() as conn:
            # Check if table already exists
            check_query = text("""
                SELECT COUNT(*) 
                FROM sys.tables 
                WHERE name = 'class_assignments'
            """)
            result = conn.execute(check_query).scalar()
            if result == 0:
                print("Creating 'class_assignments' table...")
                create_table_query = text("""
                    CREATE TABLE class_assignments (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        program_id INT NOT NULL,
                        teacher_id INT NULL,
                        title VARCHAR(255) NOT NULL,
                        description TEXT NULL,
                        files_json TEXT NOT NULL,
                        date VARCHAR(50) NOT NULL,
                        created_at DATETIME DEFAULT GETDATE() NOT NULL,
                        CONSTRAINT FK_class_assignments_programs FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
                        CONSTRAINT FK_class_assignments_users FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
                    );
                """)
                conn.execute(create_table_query)
                conn.commit()
                print("Table 'class_assignments' created successfully!")
            else:
                print("Table 'class_assignments' already exists.")
    except Exception as e:
        print(f"Error during migration: {str(e)}")

if __name__ == "__main__":
    migrate()
