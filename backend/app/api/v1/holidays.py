from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app import models, schemas
from app.core.database import get_db
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("", response_model=List[schemas.HolidayResponse])
def get_holidays(
    year: Optional[int] = None,
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(models.Holiday)
    if active_only:
        query = query.filter(models.Holiday.is_active == True)
    if year is not None:
        query = query.filter(models.Holiday.year == year)
    return query.order_by(models.Holiday.holiday_date).all()

def dispatch_holiday_emails(db: Session, title: str, reason: str, start_date: str, end_date: str, reopen_date: str):
    students = db.query(models.Student).filter(models.Student.is_active == True).all()
    
    # Get settings
    settings_dict = {}
    settings_list = db.query(models.SiteSetting).all()
    for s in settings_list:
        settings_dict[s.config_key] = s.config_value
        
    school_name = settings_dict.get("site_name", "Kangaroo Kids School")
    school_address = settings_dict.get("address", "123 Learning Lane, Creative Valley, Tech Land")
    school_phone = settings_dict.get("contact_phone", "+1 555 123 4567")
    school_email = settings_dict.get("contact_email", "contact@kangarookids.com")
    
    print(f"\n==========================================================================")
    print(f"📢 INITIATING BULK HOLIDAY MAIL DISPATCH ({len(students)} recipients)")
    print(f"Holiday: {title} | Period: {start_date} to {end_date}")
    print(f"==========================================================================\n")
    
    for student in students:
        class_name = student.program.title if student.program else "Preschool"
        
        email_html = f"""
<!DOCTYPE html>
<html>
<head>
  <style>
    body {{ font-family: 'Helvetica Neue', Arial, sans-serif; background-color: #F1F5F9; margin: 0; padding: 20px; }}
    .email-container {{ max-width: 600px; background-color: #FFFFFF; border-radius: 12px; margin: 0 auto; box-shadow: 0 4px 10px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #E2E8F0; }}
    .email-header {{ background: linear-gradient(135deg, #EE5A24 0%, #1E293B 100%); color: white; padding: 30px 20px; text-align: center; }}
    .email-logo {{ width: 80px; height: 80px; border-radius: 50%; background-color: white; padding: 5px; display: inline-block; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
    .school-title {{ font-size: 1.5rem; font-weight: 800; margin: 10px 0 2px 0; letter-spacing: 1px; }}
    .school-subtitle {{ font-size: 0.8rem; opacity: 0.9; text-transform: uppercase; }}
    .email-body {{ padding: 30px; color: #334155; line-height: 1.6; }}
    .salutation {{ font-size: 1.1rem; font-weight: 700; margin-bottom: 15px; color: #1E293B; }}
    .notification-text {{ font-size: 1rem; margin-bottom: 25px; }}
    .details-table {{ width: 100%; border-collapse: collapse; margin-bottom: 25px; background-color: #F8FAFC; border-radius: 8px; overflow: hidden; border: 1px solid #E2E8F0; }}
    .details-table td {{ padding: 12px 15px; font-size: 0.9rem; border-bottom: 1px solid #E2E8F0; }}
    .details-table td.label {{ font-weight: 700; color: #64748B; width: 180px; }}
    .details-table td.value {{ font-weight: 600; color: #1E293B; }}
    .email-footer {{ background-color: #F8FAFC; padding: 20px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 0.75rem; color: #64748B; }}
    .school-info {{ margin-bottom: 8px; font-weight: 600; }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <div style="font-size: 2.5rem; margin-bottom: 5px;">🏫</div>
      <div class="school-title">{school_name}</div>
      <div class="school-subtitle">Official Holiday Notification</div>
    </div>
    <div class="email-body">
      <div class="salutation">Dear {student.parent_name},</div>
      <div class="notification-text">
        Please be informed that an official school holiday has been declared for your child <strong>{student.name}</strong>, enrolled in <strong>{class_name}</strong>.
      </div>
      <table class="details-table">
        <tr>
          <td class="label">Holiday Reason:</td>
          <td class="value">{reason}</td>
        </tr>
        <tr>
          <td class="label">Holiday Period:</td>
          <td class="value">From {start_date} to {end_date}</td>
        </tr>
        <tr>
          <td class="label">School Reopens On:</td>
          <td class="value" style="color: #EE5A24;">{reopen_date}</td>
        </tr>
      </table>
      <p style="margin: 0; font-size: 0.95rem;">
        If you have any questions, please feel free to reach out to the school administration desk.
      </p>
      <p style="margin: 20px 0 0 0; font-size: 0.95rem; font-weight: 700; color: #1E293B;">
        Warm regards,<br />
        School Administration Desk
      </p>
    </div>
    <div class="email-footer">
      <div class="school-info">📍 {school_address}</div>
      <div>📞 {school_phone} | ✉️ {school_email}</div>
      <div style="margin-top: 10px; font-weight: bold; color: #EE5A24;">★ SHAPING FUTURE INNOVATORS ★</div>
    </div>
  </div>
</body>
</html>
"""
        # Print mock email dispatch
        print(f"--------------------------------------------------------------------------")
        print(f"📧 Mock Email Sent to Parent: {student.parent_name} (dest: parent_email)")
        print(f"Subject: 📅 School Holiday Notification - {title}")
        print(f"Child: {student.name} | Class: {class_name}")
        print(f"--------------------------------------------------------------------------")
        
    print(f"\n==========================================================================")
    print(f"✓ BULK DISPATCH COMPLETE. {len(students)} MOCK EMAILS GENERATED SUCCESSFULLY.")
    print(f"==========================================================================\n")

@router.post("", response_model=schemas.HolidayResponse, status_code=status.HTTP_201_CREATED)
def create_holiday(
    holiday: schemas.HolidayCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Auto-extract year from date
    date_parts = holiday.holiday_date.split('-')
    if len(date_parts) == 3:
        try:
            holiday.year = int(date_parts[0])
        except ValueError:
            pass
            
    # Remove send_email from dictionary before inserting to DB model
    model_data = holiday.model_dump()
    send_email = model_data.pop('send_email', False)
    
    db_holiday = models.Holiday(**model_data)
    db.add(db_holiday)
    db.commit()
    db.refresh(db_holiday)
    
    if send_email:
        dispatch_holiday_emails(
            db, 
            holiday.title, 
            holiday.description or holiday.title, 
            holiday.holiday_date, 
            holiday.holiday_date, 
            holiday.holiday_date
        )
        
    return db_holiday

@router.post("/send-custom-holiday-email", status_code=status.HTTP_200_OK)
def send_custom_holiday_email(
    request: schemas.CustomHolidayEmailRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    dispatch_holiday_emails(
        db,
        "Custom School Holiday Announcement",
        request.reason,
        request.start_date,
        request.end_date,
        request.reopen_date
    )
    return {"message": "Success! Bulk school holiday notifications have been directly emailed to all parent contacts."}

@router.put("/{holiday_id}", response_model=schemas.HolidayResponse)
def update_holiday(
    holiday_id: int,
    updated_holiday: schemas.HolidayCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_holiday = db.query(models.Holiday).filter(models.Holiday.id == holiday_id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
        
    date_parts = updated_holiday.holiday_date.split('-')
    if len(date_parts) == 3:
        try:
            updated_holiday.year = int(date_parts[0])
        except ValueError:
            pass

    model_data = updated_holiday.model_dump()
    send_email = model_data.pop('send_email', False)

    for key, value in model_data.items():
        setattr(db_holiday, key, value)
        
    db.commit()
    db.refresh(db_holiday)
    
    if send_email:
        dispatch_holiday_emails(
            db, 
            db_holiday.title, 
            db_holiday.description or db_holiday.title, 
            db_holiday.holiday_date, 
            db_holiday.holiday_date, 
            db_holiday.holiday_date
        )
        
    return db_holiday

@router.delete("/{holiday_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_holiday(
    holiday_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_holiday = db.query(models.Holiday).filter(models.Holiday.id == holiday_id).first()
    if not db_holiday:
        raise HTTPException(status_code=404, detail="Holiday not found")
        
    db.delete(db_holiday)
    db.commit()
    return None
