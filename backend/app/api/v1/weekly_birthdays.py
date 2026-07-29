import os
import re
import asyncio
from datetime import datetime, timedelta, date
from typing import List, Optional, Tuple
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app import models
from app.core.config import settings

router = APIRouter(prefix="/content", tags=["Weekly Birthdays"])


def parse_month_day(dob_str: Optional[str]) -> Optional[Tuple[int, int]]:
    """Parse month and day from various date string formats."""
    if not dob_str:
        return None
    dob_str = dob_str.strip()
    
    # Try YYYY-MM-DD or YYYY/MM/DD
    match = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$", dob_str)
    if match:
        try:
            m, d = int(match.group(2)), int(match.group(3))
            if 1 <= m <= 12 and 1 <= d <= 31:
                return m, d
        except ValueError:
            pass
            
    # Try MM/DD/YYYY or MM-DD-YYYY
    match = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$", dob_str)
    if match:
        try:
            m, d = int(match.group(1)), int(match.group(2))
            if 1 <= m <= 12 and 1 <= d <= 31:
                return m, d
        except ValueError:
            pass
            
    return None


@router.get("/weekly-birthdays")
def get_weekly_birthdays(db: Session = Depends(get_db)):
    """
    Returns active students whose birthdays fall in the current week (Monday-Sunday).
    If no birthdays fall in the current week, returns an empty list [].
    """
    today = datetime.utcnow().date()
    # Monday of current week
    start_of_week = today - timedelta(days=today.weekday())
    # Sunday of current week
    end_of_week = start_of_week + timedelta(days=6)

    # Fetch all active students
    students = db.query(models.Student).filter(models.Student.is_active == True).all()

    results = []
    candidate_years = [today.year - 1, today.year, today.year + 1]

    for student in students:
        if not student.date_of_birth:
            continue
            
        md = parse_month_day(student.date_of_birth)
        if not md:
            continue
            
        month, day = md
        matching_date: Optional[date] = None

        for yr in candidate_years:
            try:
                c_date = date(yr, month, day)
                if start_of_week <= c_date <= end_of_week:
                    matching_date = c_date
                    break
            except ValueError:
                # Handle Feb 29 on non-leap years (fallback to Feb 28)
                if month == 2 and day == 29:
                    try:
                        c_date = date(yr, 2, 28)
                        if start_of_week <= c_date <= end_of_week:
                            matching_date = c_date
                            break
                    except ValueError:
                        pass

        if matching_date:
            program_name = student.program.title if student.program else "Pre-School"
            day_str = matching_date.strftime("%A, %b %d")
            is_today = (matching_date == today)

            results.append({
                "id": student.id,
                "name": student.name,
                "parent_name": student.parent_name,
                "program_name": program_name,
                "photo_url": student.photo_url or "",
                "gender": getattr(student, "gender", "Boy") or "Boy",
                "date_of_birth": student.date_of_birth,
                "birthday_date": matching_date.isoformat(),
                "birthday_day_str": day_str,
                "is_today": is_today
            })

    # Sort results so today's birthdays appear first, then by date
    results.sort(key=lambda x: (not x["is_today"], x["birthday_date"]))
    return results
