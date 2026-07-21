import sys
import os
from sqlalchemy import create_engine, text

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

DB_URL = "mssql+pyodbc://sa:M0_tre_141@200.97.168.156/SchoolDB?driver=ODBC+Driver+17+for+SQL+Server&TrustServerCertificate=yes"

def migrate():
    print("Connecting to production MS SQL Server database...")
    try:
        engine = create_engine(DB_URL, connect_args={"timeout": 15})
        with engine.connect() as conn:
            check_query = text("""
                SELECT COUNT(*) 
                FROM sys.tables 
                WHERE name = 'teacher_achievements'
            """)
            result = conn.execute(check_query).scalar()
            if result == 0:
                print("Creating 'teacher_achievements' table...")
                create_table_query = text("""
                    CREATE TABLE teacher_achievements (
                        id INT IDENTITY(1,1) PRIMARY KEY,
                        teacher_id INT NOT NULL,
                        title VARCHAR(255) NOT NULL,
                        description TEXT NULL,
                        date VARCHAR(50) NOT NULL,
                        certificate_url VARCHAR(500) NULL,
                        created_at DATETIME DEFAULT GETDATE() NOT NULL,
                        CONSTRAINT FK_teacher_achievements_users FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
                    );
                """)
                conn.execute(create_table_query)
                conn.commit()
                print("Table 'teacher_achievements' created successfully!")
            else:
                print("Table 'teacher_achievements' already exists.")
    except Exception as e:
        print(f"Error during migration: {str(e)}")

if __name__ == "__main__":
    migrate()
