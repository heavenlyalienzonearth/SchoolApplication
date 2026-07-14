import sys
import os
from sqlalchemy import create_engine, text
from datetime import datetime, timedelta

# Append the absolute path of the backend directory
backend_path = r"e:\AI_Applications\SchoolApplication\backend"
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.core.config import settings

def migrate():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Checking if library tables exist...")
        books_exists = conn.execute(text("""
            SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'library_books'
        """)).fetchone()
        
        if not books_exists:
            print("Creating 'library_books' table...")
            conn.execute(text("""
                CREATE TABLE library_books (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    title VARCHAR(255) NOT NULL,
                    author VARCHAR(255) NOT NULL,
                    isbn VARCHAR(100) NULL,
                    category VARCHAR(100) NOT NULL,
                    total_copies INT NOT NULL DEFAULT 1,
                    available_copies INT NOT NULL DEFAULT 1,
                    created_at DATETIME NOT NULL DEFAULT GETDATE()
                );
            """))
            conn.commit()
            print("Table 'library_books' created successfully.")
            
            print("Creating 'library_borrows' table...")
            conn.execute(text("""
                CREATE TABLE library_borrows (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    book_id INT NOT NULL FOREIGN KEY REFERENCES library_books(id) ON DELETE CASCADE,
                    student_id INT NOT NULL FOREIGN KEY REFERENCES students(id) ON DELETE CASCADE,
                    borrow_date VARCHAR(50) NOT NULL,
                    due_date VARCHAR(50) NOT NULL,
                    return_date VARCHAR(50) NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'Borrowed',
                    created_at DATETIME NOT NULL DEFAULT GETDATE()
                );
            """))
            conn.commit()
            print("Table 'library_borrows' created successfully.")
            
            # Seed sample library books
            print("Seeding sample books...")
            conn.execute(text("""
                INSERT INTO library_books (title, author, isbn, category, total_copies, available_copies)
                VALUES 
                ('The Very Hungry Caterpillar', 'Eric Carle', '9780241003008', 'Picture Book', 5, 4),
                ('Green Eggs and Ham', 'Dr. Seuss', '9780394800165', 'Beginner Reader', 3, 3),
                ('Where the Wild Things Are', 'Maurice Sendak', '9780060254926', 'Fiction', 4, 4),
                ('Charlotte''s Web', 'E.B. White', '9780064400558', 'Chapter Book', 2, 2);
            """))
            conn.commit()
            print("Sample books seeded successfully.")
            
            # Find a student ID to seed a sample borrow record
            student = conn.execute(text("SELECT TOP 1 id FROM students WHERE is_active = 1")).fetchone()
            book = conn.execute(text("SELECT TOP 1 id FROM library_books WHERE title = 'The Very Hungry Caterpillar'")).fetchone()
            
            if student and book:
                student_id = student[0]
                book_id = book[0]
                print(f"Seeding sample borrow record (Student ID: {student_id}, Book ID: {book_id})...")
                borrow_dt = datetime.now() - timedelta(days=3)
                due_dt = borrow_dt + timedelta(days=7)
                
                conn.execute(text(f"""
                    INSERT INTO library_borrows (book_id, student_id, borrow_date, due_date, status)
                    VALUES ({book_id}, {student_id}, '{borrow_dt.strftime('%Y-%m-%d')}', '{due_dt.strftime('%Y-%m-%d')}', 'Borrowed');
                """))
                conn.commit()
                print("Sample borrow record seeded successfully.")
        else:
            print("Library tables already exist.")
            
        print("Migration complete!")

if __name__ == "__main__":
    migrate()
