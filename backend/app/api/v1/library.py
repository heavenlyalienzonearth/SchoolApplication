from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas

router = APIRouter(tags=["School Library"])

# --- BOOKS ENDPOINTS ---

@router.get("/books", response_model=List[schemas.BookResponse])
def get_books(db: Session = Depends(get_db)):
    return db.query(models.LibraryBook).order_by(models.LibraryBook.title).all()

@router.post("/books", response_model=schemas.BookResponse, status_code=status.HTTP_201_CREATED)
def create_book(
    book: schemas.BookCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "TEACHER", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Not authorized to manage library books")
        
    db_book = models.LibraryBook(**book.model_dump())
    db.add(db_book)
    db.commit()
    db.refresh(db_book)
    return db_book

@router.put("/books/{book_id}", response_model=schemas.BookResponse)
def update_book(
    book_id: int,
    book_update: schemas.BookCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "TEACHER", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Not authorized to manage library books")
        
    db_book = db.query(models.LibraryBook).filter(models.LibraryBook.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    # We update all fields including available copies calculation
    copies_diff = book_update.total_copies - db_book.total_copies
    db_book.title = book_update.title
    db_book.author = book_update.author
    db_book.isbn = book_update.isbn
    db_book.category = book_update.category
    db_book.total_copies = book_update.total_copies
    
    # Adjust available copies based on total copies change
    db_book.available_copies = max(0, db_book.available_copies + copies_diff)
    
    db.commit()
    db.refresh(db_book)
    return db_book

@router.delete("/books/{book_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_book(
    book_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "TEACHER", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Not authorized to manage library books")
        
    db_book = db.query(models.LibraryBook).filter(models.LibraryBook.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    db.delete(db_book)
    db.commit()
    return None

# --- BORROWS ENDPOINTS ---

@router.get("/borrows", response_model=List[schemas.BorrowResponse])
def get_borrows(db: Session = Depends(get_db)):
    return db.query(models.LibraryBorrow).order_by(models.LibraryBorrow.borrow_date.desc()).all()

@router.post("/borrows", response_model=schemas.BorrowResponse, status_code=status.HTTP_201_CREATED)
def issue_book(
    borrow: schemas.BorrowCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "TEACHER", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Not authorized to issue library books")
        
    db_book = db.query(models.LibraryBook).filter(models.LibraryBook.id == borrow.book_id).first()
    if not db_book:
        raise HTTPException(status_code=404, detail="Book not found")
        
    if db_book.available_copies <= 0:
        raise HTTPException(status_code=400, detail="No copies of this book are currently available")
        
    db_student = db.query(models.Student).filter(models.Student.id == borrow.student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db_borrow = models.LibraryBorrow(**borrow.model_dump())
    db_borrow.status = "Borrowed"
    db_book.available_copies -= 1
    
    db.add(db_borrow)
    db.commit()
    db.refresh(db_borrow)
    return db_borrow

@router.post("/borrows/{borrow_id}/return", response_model=schemas.BorrowResponse)
def return_book(
    borrow_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role not in ["ADMIN", "TEACHER", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Not authorized to return library books")
        
    db_borrow = db.query(models.LibraryBorrow).filter(models.LibraryBorrow.id == borrow_id).first()
    if not db_borrow:
        raise HTTPException(status_code=404, detail="Borrow record not found")
        
    if db_borrow.status == "Returned":
        raise HTTPException(status_code=400, detail="This book has already been returned")
        
    db_book = db.query(models.LibraryBook).filter(models.LibraryBook.id == db_borrow.book_id).first()
    
    db_borrow.status = "Returned"
    db_borrow.return_date = datetime.now().strftime('%Y-%m-%d')
    if db_book:
        db_book.available_copies = min(db_book.total_copies, db_book.available_copies + 1)
        
    db.commit()
    db.refresh(db_borrow)
    return db_borrow
