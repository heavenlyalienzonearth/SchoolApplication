import json
from fastapi import APIRouter, Depends
from sqlalchemy import create_engine, or_
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app import models
from app.core.database import get_db

router = APIRouter()

class ChatQuery(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str
    quick_replies: List[str]

@router.post("/query", response_model=ChatResponse)
def query_chatbot(query: ChatQuery, db: Session = Depends(get_db)):
    msg = query.message.lower().strip()
    
    # Fetch Settings for contact info
    settings_list = db.query(models.SiteSetting).all()
    settings_dict = {s.config_key: s.config_value for s in settings_list}
    phone = settings_dict.get("contact_phone", "1800-210-6868")
    email = settings_dict.get("contact_email", "admissions@school.com")
    school_name = settings_dict.get("site_name", "Kangaroo Club")

    # 1. Admissions matching
    if any(k in msg for k in ["admiss", "enquir", "register", "apply", "join", "enroll", "admission"]):
        return ChatResponse(
            response=(
                f"Admissions are currently open at {school_name} for the Academic Year 2026-27! "
                "We welcome children into our Playgroup, Nursery, Junior KG, and Senior KG programs. "
                "You can submit a formal inquiry online, and our counselor will call you to schedule a school tour. "
                "Please fill the form here: [Apply Now](/admissions)."
            ),
            quick_replies=["Preferred centers", "What are the fees?", "List of Programs"]
        )

    # 2. Programs matching
    if any(k in msg for k in ["program", "class", "grade", "age", "toddler", "playgroup", "nursery", "kindergarten", "kg"]):
        # Fetch active programs from DB
        programs = db.query(models.Program).filter(models.Program.is_active == True).all()
        if programs:
            prog_list = "\n".join([f"• **{p.title}**: {p.age_group} - {p.description[:80]}..." for p in programs])
            response_text = f"We offer premium development programs structured by age groups:\n\n{prog_list}\n\nWould you like details on admissions?"
        else:
            response_text = "We offer Playgroup, Nursery, and Kindergarten programs tailored to early childhood developmental wiggles. Let us know which age group you are inquiring about!"
        
        return ChatResponse(
            response=response_text,
            quick_replies=["Admissions Process", "What are the fees?", "Contact School"]
        )

    # 3. Fees matching
    if any(k in msg for k in ["fee", "cost", "charge", "price", "pay"]):
        return ChatResponse(
            response=(
                "Our tuition fees vary slightly based on the center branch and program level. "
                f"For the detailed breakdown of the AY 2026-27 fee structure, you can contact our counselor at {phone} "
                "or submit an admissions inquiry form so we can email you the package: [Admissions Page](/admissions)."
            ),
            quick_replies=["Submit Admissions Form", "Contact Info", "Our Programs"]
        )

    # 4. Location / Contact / Centers matching
    if any(k in msg for k in ["contact", "phone", "email", "call", "address", "location", "where", "center", "branch", "campus"]):
        return ChatResponse(
            response=(
                f"You can reach out to {school_name} customer care at:\n"
                f"📞 **Phone**: {phone}\n"
                f"✉️ **Email**: {email}\n\n"
                "Our active centers include:\n"
                "📍 **Main Campus Center** (Corporate HQ)\n"
                "📍 **North Valley Hub**\n"
                "📍 **East Sunshine Annex**\n\n"
                "We are open Mon-Sat from 8:30 AM to 5:30 PM. Drop by or call us anytime!"
            ),
            quick_replies=["Schedule a tour", "Admissions Info", "Why choose us?"]
        )

    # 5. FAQ Search
    # Split the message into words and search active FAQs for any matching question or answer
    words = [w for w in msg.split() if len(w) > 3]
    if words:
        filters = []
        for w in words:
            filters.append(models.FAQ.question.ilike(f"%{w}%"))
            filters.append(models.FAQ.answer.ilike(f"%{w}%"))
        
        if filters:
            faq_match = db.query(models.FAQ).filter(
                models.FAQ.is_active == True,
                or_(*filters)
            ).first()
            
            if faq_match:
                return ChatResponse(
                    response=f"Here is what I found:\n\n**Q: {faq_match.question}**\n{faq_match.answer}",
                    quick_replies=["Ask another question", "School Contact Info", "Programs list"]
                )

    # 6. Fallback Response
    return ChatResponse(
        response=(
            f"Hello! I am the {school_name} Assistant. I can answer questions about our programs, admissions, fees, "
            "center locations, and school contacts. \n\n"
            "I couldn't find a specific answer for your query, but would you like to speak to our team or look at our programs?"
        ),
        quick_replies=["Our Programs", "Admissions Info", "School Contact Info"]
    )
