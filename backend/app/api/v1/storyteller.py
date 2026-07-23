from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models, schemas
from pydantic import BaseModel

router = APIRouter(prefix="/storyteller", tags=["AI Storyteller & Comic Strip"])

class GenerateStoryRequest(BaseModel):
    theme: Optional[str] = "space"  # space, jungle, superhero, magic
    teacher_note: Optional[str] = None

THEME_CONFIGS = {
    "space": {
        "name": "Cosmic Space Explorer",
        "title_icon": "\U0001F680",
        "panel1_icon": "\U0001F680",
        "panel2_icon": "\U0001F6F8",
        "panel3_icon": "\U0001F31F",
        "panel1_title": "Morning Rocket Launch & Discovery",
        "panel2_title": "Interstellar Teamwork & Galaxy Badges",
        "panel3_title": "Mission Accomplished & Starry Triumph"
    },
    "jungle": {
        "name": "Wild Jungle Safari",
        "title_icon": "\U0001F981",
        "panel1_icon": "\U0001F981",
        "panel2_icon": "\U0001F334",
        "panel3_icon": "\U0001F451",
        "panel1_title": "Safari Expedition Begins",
        "panel2_title": "Jungle Friends & Hero Badge",
        "panel3_title": "King of the Classroom Jungle"
    },
    "superhero": {
        "name": "Super Hero League",
        "title_icon": "\u26A1",
        "panel1_icon": "\u26A1",
        "panel2_icon": "\U0001F6E1",
        "panel3_icon": "\U0001F3C6",
        "panel1_title": "Super Powers Activated",
        "panel2_title": "League of Classroom Heroes",
        "panel3_title": "Super Champion Victory"
    },
    "magic": {
        "name": "Enchanted Kingdom",
        "title_icon": "\U0001F3F0",
        "panel1_icon": "\U0001F3F0",
        "panel2_icon": "\U0001FA84",
        "panel3_icon": "\U0001F308",
        "panel1_title": "Enchanted Spellbook Opened",
        "panel2_title": "Magical Kindness & Badges",
        "panel3_title": "Royal Graduation Milestone"
    }
}

def format_story_dict(s: models.StudentWeeklyStory, student: models.Student) -> dict:
    theme_key = s.theme if s.theme in THEME_CONFIGS else "space"
    t_cfg = THEME_CONFIGS[theme_key]
    
    # Strip any stored '??' or leading question marks
    raw_title = (s.story_title or "").lstrip("? ").strip()
    if not raw_title.startswith(t_cfg["title_icon"]):
        formatted_title = f"{t_cfg['title_icon']} {raw_title}"
    else:
        formatted_title = raw_title

    return {
        "id": s.id,
        "student_id": s.student_id,
        "student_name": student.name,
        "program_title": student.program.title if student.program else "Classroom",
        "week_label": s.week_label,
        "story_title": formatted_title,
        "theme": s.theme,
        "panel1_title": s.panel1_title,
        "panel1_text": s.panel1_text,
        "panel1_icon": t_cfg["panel1_icon"],
        "panel2_title": s.panel2_title,
        "panel2_text": s.panel2_text,
        "panel2_icon": t_cfg["panel2_icon"],
        "panel3_title": s.panel3_title,
        "panel3_text": s.panel3_text,
        "panel3_icon": t_cfg["panel3_icon"],
        "teacher_note": s.teacher_note,
        "created_at": s.created_at.isoformat()
    }

@router.get("/student/{student_id}")
def get_student_stories(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    stories = db.query(models.StudentWeeklyStory).filter(
        models.StudentWeeklyStory.student_id == student_id
    ).order_by(models.StudentWeeklyStory.created_at.desc()).all()
    
    return [format_story_dict(s, student) for s in stories]

@router.post("/generate/{student_id}")
def generate_student_story(
    student_id: int,
    req: GenerateStoryRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
        
    theme_key = req.theme if req.theme in THEME_CONFIGS else "space"
    theme = THEME_CONFIGS[theme_key]

    # Fetch pupil's recent milestones, kudos & moments
    milestones = db.query(models.ParentMilestone).filter(
        models.ParentMilestone.student_id == student_id,
        models.ParentMilestone.status == "Completed"
    ).all()
    
    kudos = db.query(models.StudentKudos).filter(
        models.StudentKudos.student_id == student_id
    ).order_by(models.StudentKudos.created_at.desc()).all()

    milestone_text = ", ".join([m.milestone_name for m in milestones[:2]]) if milestones else "building blocks, pattern matching, and creative storytelling"
    kudos_text = f"the '{kudos[0].badge_title}' badge ({kudos[0].badge_type})" if kudos else "the 'Star Explorer' behavior badge"

    program_title = student.program.title if student.program else "Classroom"
    first_name = student.name.split()[0] if student.name else "Pupil"

    # AI Story Generation Logic (Title stored clean without emojis)
    if theme_key == "space":
        story_title = f"{first_name}'s Cosmic Expedition in {program_title}!"
        panel1_text = f"Commander {first_name} boarded the {program_title} Space Shuttle and discovered amazing new skills in {milestone_text}."
        panel2_text = f"Joining forces with cosmic classmates, {first_name} demonstrated stellar teamwork and earned {kudos_text}!"
        panel3_text = f"Mission Accomplished! {first_name} safely landed back at base with shining achievements and glowing star ratings."
    elif theme_key == "jungle":
        story_title = f"{first_name}'s Wild Safari Quest in {program_title}!"
        panel1_text = f"Explorer {first_name} ventured deep into the {program_title} learning safari, unlocking achievements in {milestone_text}."
        panel2_text = f"Sharing jungle trail snacks with friends, {first_name} earned {kudos_text} for leadership and warmth."
        panel3_text = f"Roar of Victory! {first_name} earned the Golden Safari Crown and celebrated another wonderful week!"
    elif theme_key == "superhero":
        story_title = f"Super {first_name} & The {program_title} League!"
        panel1_text = f"Super {first_name} activated classroom powers, zooming through challenges in {milestone_text}."
        panel2_text = f"Using super-kindness and focus, {first_name} unlocked {kudos_text} alongside fellow league heroes!"
        panel3_text = f"Victory Day! {first_name} saved the day with high-fives, bright smiles, and heroic progress."
    else:  # magic
        story_title = f"{first_name}'s Magical Academy Adventures!"
        panel1_text = f"Wizard {first_name} opened the enchanted spellbook of {program_title}, mastering magical skills in {milestone_text}."
        panel2_text = f"Casting a spell of friendship, {first_name} was awarded {kudos_text} by the grand wizard teacher."
        panel3_text = f"Enchanted Triumph! {first_name} completed the weekly quest with magic dust and joyful laughter."

    now = datetime.datetime.utcnow()
    week_label = f"Week of {now.strftime('%b %d, %Y')}"

    story = models.StudentWeeklyStory(
        student_id=student_id,
        teacher_id=current_user.id,
        week_label=week_label,
        story_title=story_title,
        theme=theme_key,
        panel1_title=theme["panel1_title"],
        panel1_text=panel1_text,
        panel1_icon=theme["panel1_icon"],
        panel2_title=theme["panel2_title"],
        panel2_text=panel2_text,
        panel2_icon=theme["panel2_icon"],
        panel3_title=theme["panel3_title"],
        panel3_text=panel3_text,
        panel3_icon=theme["panel3_icon"],
        teacher_note=req.teacher_note or f"Great work this week, {first_name}! Keep soaring high!",
        created_at=now
    )
    db.add(story)
    db.commit()
    db.refresh(story)

    return {
        "message": "Weekly comic storybook generated successfully!",
        "story": format_story_dict(story, student)
    }

@router.delete("/{story_id}")
def delete_story(
    story_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    story = db.query(models.StudentWeeklyStory).filter(models.StudentWeeklyStory.id == story_id).first()
    if not story:
        raise HTTPException(status_code=404, detail="Storybook not found.")
    db.delete(story)
    db.commit()
    return {"message": "Storybook deleted successfully."}
