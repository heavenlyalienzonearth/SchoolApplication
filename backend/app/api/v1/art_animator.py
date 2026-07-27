import os
import uuid
import math
import io
import random
import wave
import struct
import subprocess
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageOps, ImageFilter, ImageFont
import numpy as np

try:
    import imageio
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
except ImportError:
    imageio = None
    FFMPEG_EXE = None

from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app import models
from app.core.ai_vision_config import analyze_image_with_ai, AI_VISION_PROVIDER, AI_VISION_MODEL_NAME
from app.core.config import settings

AUDIO_DIR = os.path.join(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")), "static", "art_audio")
os.makedirs(AUDIO_DIR, exist_ok=True)



router = APIRouter(prefix="/art", tags=["Art Animator"])

# Directories for assets and output videos
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
STATIC_DIR = os.path.join(BASE_DIR, "static")
ART_DIR = os.path.join(STATIC_DIR, "art_animations")
BG_DIR = os.path.join(STATIC_DIR, "art_backgrounds")

os.makedirs(ART_DIR, exist_ok=True)
os.makedirs(BG_DIR, exist_ok=True)


# --- DEFAULT BACKGROUND GENERATOR ---
def draw_star_shape(draw, cx, cy, radius, color):
    pts = []
    for i in range(8):
        r = radius if i % 2 == 0 else radius * 0.4
        angle = i * math.pi / 4
        pts.append((cx + r * math.cos(angle), cy + r * math.sin(angle)))
    draw.polygon(pts, fill=color)

def ensure_default_backgrounds():
    """Generate high-resolution artistic background images."""
    configs = ["space_bg.jpg", "stage_bg.jpg", "jungle_bg.jpg", "cloud_bg.jpg"]
    # 1. Space Nebula
    p_space = os.path.join(BG_DIR, "space_bg.jpg")
    img_space = Image.new("RGBA", (1280, 720), (11, 15, 25, 255))
    draw = ImageDraw.Draw(img_space)
    for y in range(720):
        ratio = y / 720.0
        draw.line([(0, y), (1280, y)], fill=(int(11*(1-ratio)+59*ratio), int(15*(1-ratio)+7*ratio), int(25*(1-ratio)+100*ratio), 255))
    nebula = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
    n_draw = ImageDraw.Draw(nebula)
    n_draw.ellipse([800, -100, 1400, 500], fill=(147, 51, 234, 90))
    n_draw.ellipse([100, 300, 700, 800], fill=(236, 72, 153, 80))
    n_draw.ellipse([-200, -100, 400, 400], fill=(14, 165, 233, 85))
    img_space = Image.alpha_composite(img_space, nebula.filter(ImageFilter.GaussianBlur(80)))
    draw = ImageDraw.Draw(img_space)
    rnd = random.Random(42)
    for _ in range(120):
        sx, sy, sz = rnd.randint(0, 1280), rnd.randint(0, 720), rnd.randint(1, 4)
        draw.ellipse([sx, sy, sx+sz, sy+sz], fill=(255, 255, 230, rnd.randint(180, 255)))
        if sz >= 3:
            draw_star_shape(draw, sx+sz//2, sy+sz//2, sz*3, (255, 255, 255, 200))
    px, py = 1050, 180
    draw.ellipse([px-70, py-70, px+70, py+70], fill=(245, 158, 11))
    draw.ellipse([px-60, py-60, px+60, py+60], fill=(251, 191, 36))
    rings = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
    ImageDraw.Draw(rings).ellipse([px-140, py-30, px+140, py+30], outline=(253, 230, 138, 180), width=12)
    Image.alpha_composite(img_space, rings).convert("RGB").save(p_space, quality=95)

    # 2. Stage
    p_stage = os.path.join(BG_DIR, "stage_bg.jpg")
    img_stage = Image.new("RGBA", (1280, 720), (30, 10, 60, 255))
    draw = ImageDraw.Draw(img_stage)
    for y in range(720):
        ratio = y / 720.0
        draw.line([(0, y), (1280, y)], fill=(int(30*(1-ratio)+88*ratio), int(10*(1-ratio)+28*ratio), int(60*(1-ratio)+135*ratio), 255))
    spots = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
    sp_draw = ImageDraw.Draw(spots)
    sp_draw.polygon([(0, 0), (300, 720), (600, 720)], fill=(236, 72, 153, 70))
    sp_draw.polygon([(1280, 0), (980, 720), (680, 720)], fill=(14, 165, 233, 70))
    sp_draw.polygon([(640, 0), (300, 720), (980, 720)], fill=(250, 204, 21, 60))
    img_stage = Image.alpha_composite(img_stage, spots.filter(ImageFilter.GaussianBlur(30)))
    draw = ImageDraw.Draw(img_stage)
    draw.polygon([(0, 520), (1280, 520), (1280, 720), (0, 720)], fill=(20, 10, 40))
    for i in range(10):
        fx = i * 140
        draw.line([(fx, 520), (fx*1.2 - 100, 720)], fill=(139, 92, 246, 120), width=2)
    draw.line([(0, 520), (1280, 520)], fill=(236, 72, 153), width=4)
    img_stage.convert("RGB").save(p_stage, quality=95)

    # 3. Jungle
    p_jungle = os.path.join(BG_DIR, "jungle_bg.jpg")
    img_jungle = Image.new("RGBA", (1280, 720), (4, 47, 46, 255))
    draw = ImageDraw.Draw(img_jungle)
    for y in range(720):
        ratio = y / 720.0
        draw.line([(0, y), (1280, y)], fill=(int(4*(1-ratio)+6*ratio), int(47*(1-ratio)+95*ratio), int(46*(1-ratio)+70*ratio), 255))
    rays = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
    ry_draw = ImageDraw.Draw(rays)
    for i in range(5):
        ry_draw.polygon([(1100, 0), (i*250, 720), (i*250 + 120, 720)], fill=(253, 224, 71, 40))
    img_jungle = Image.alpha_composite(img_jungle, rays.filter(ImageFilter.GaussianBlur(20)))
    draw = ImageDraw.Draw(img_jungle)
    draw.ellipse([-100, 580, 1380, 800], fill=(16, 185, 129))
    draw.ellipse([-50, 620, 1330, 820], fill=(5, 150, 105))
    draw.ellipse([-100, -150, 400, 250], fill=(4, 120, 87))
    draw.ellipse([900, -150, 1400, 250], fill=(4, 120, 87))
    img_jungle.convert("RGB").save(p_jungle, quality=95)

    # 4. Cloud Castle
    p_cloud = os.path.join(BG_DIR, "cloud_bg.jpg")
    img_cloud = Image.new("RGBA", (1280, 720), (254, 242, 242, 255))
    draw = ImageDraw.Draw(img_cloud)
    for y in range(720):
        ratio = y / 720.0
        draw.line([(0, y), (1280, y)], fill=(int(253*(1-ratio)+186*ratio), int(164*(1-ratio)+230*ratio), int(175*(1-ratio)+253*ratio), 255))
    rb = Image.new("RGBA", (1280, 720), (0, 0, 0, 0))
    rb_draw = ImageDraw.Draw(rb)
    rb_colors = [(239, 68, 68), (249, 115, 22), (234, 179, 8), (34, 197, 94), (59, 130, 246), (168, 85, 247)]
    for idx, col in enumerate(rb_colors):
        rad = 500 - idx * 14
        rb_draw.ellipse([640 - rad, 100 - rad//2, 640 + rad, 100 + rad*1.5], outline=col + (160,), width=14)
    img_cloud = Image.alpha_composite(img_cloud, rb.filter(ImageFilter.GaussianBlur(12)))
    draw = ImageDraw.Draw(img_cloud)
    for cx in range(0, 1400, 140):
        cy = 580 + (cx % 3) * 20
        draw.ellipse([cx-100, cy-60, cx+100, cy+100], fill=(255, 255, 255, 230))
    img_cloud.convert("RGB").save(p_cloud, quality=95)

ensure_default_backgrounds()



# --- SEED DEFAULT MOTION STYLES ---
def seed_default_motion_styles(db: Session):
    styles = db.query(models.ArtMotionStyle).all()
    if not styles:
        defaults = [
            models.ArtMotionStyle(
                title="\U0001F680 15s Cosmic Rocket Journey",
                key_name="rocket_launch_15s",
                background_image_url="/static/art_backgrounds/space_bg.jpg",
                motion_preset="rocket_launch",
                duration_seconds=15,
                is_active=True
            ),
            models.ArtMotionStyle(
                title="\U0001F483 15s Happy Dance Party",
                key_name="happy_dance_15s",
                background_image_url="/static/art_backgrounds/stage_bg.jpg",
                motion_preset="dance_loop",
                duration_seconds=15,
                is_active=True
            ),
            models.ArtMotionStyle(
                title="\U0001F996 15s Dino Safari Walk",
                key_name="walk_across_15s",
                background_image_url="/static/art_backgrounds/jungle_bg.jpg",
                motion_preset="walk_across",
                duration_seconds=15,
                is_active=True
            ),
            models.ArtMotionStyle(
                title="\U0001F388 15s Rainbow Cloud Bounce",
                key_name="bounce_float_15s",
                background_image_url="/static/art_backgrounds/cloud_bg.jpg",
                motion_preset="bounce_float",
                duration_seconds=15,
                is_active=True
            )
        ]
        db.add_all(defaults)
        db.commit()
    else:
        # Repair any corrupt title starting with ??
        repaired = False
        for s in styles:
            if s.title.startswith("??"):
                if s.key_name == "rocket_launch_15s" or "Rocket" in s.title:
                    s.title = "\U0001F680 15s Cosmic Rocket Journey"
                elif s.key_name == "happy_dance_15s" or "Dance" in s.title:
                    s.title = "\U0001F483 15s Happy Dance Party"
                elif s.key_name == "walk_across_15s" or "Dino" in s.title:
                    s.title = "\U0001F996 15s Dino Safari Walk"
                elif s.key_name == "bounce_float_15s" or "Cloud" in s.title:
                    s.title = "\U0001F388 15s Rainbow Cloud Bounce"
                else:
                    s.title = s.title.replace("??", "\U0001F3A8")
                repaired = True
        if repaired:
            db.commit()



# --- SCHEMAS ---
class MotionStyleCreateSchema(BaseModel):
    title: str
    motion_preset: str  # rocket_launch, dance_loop, bounce_float, walk_across, spin_fly
    background_image_url: str
    sound_effect_url: Optional[str] = None
    duration_seconds: int = 15

class MotionStyleUpdateSchema(BaseModel):
    title: Optional[str] = None
    motion_preset: Optional[str] = None
    background_image_url: Optional[str] = None
    sound_effect_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    is_active: Optional[bool] = None


# --- MOTION STYLE MANAGEMENT ENDPOINTS (CRUD) ---

@router.get("/motion-styles")
def get_motion_styles(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    seed_default_motion_styles(db)
    styles = db.query(models.ArtMotionStyle).filter(models.ArtMotionStyle.is_active == True).order_by(models.ArtMotionStyle.created_at.asc()).all()
    return styles


@router.post("/motion-styles")
def create_motion_style(
    payload: MotionStyleCreateSchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["TEACHER", "ADMIN", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Only teachers or admins can manage motion styles.")

    key_name = f"{payload.motion_preset}_{uuid.uuid4().hex[:6]}"
    new_style = models.ArtMotionStyle(
        title=payload.title,
        key_name=key_name,
        background_image_url=payload.background_image_url,
        motion_preset=payload.motion_preset,
        sound_effect_url=payload.sound_effect_url,
        duration_seconds=payload.duration_seconds or 15,
        is_active=True
    )
    db.add(new_style)
    db.commit()
    db.refresh(new_style)
    return new_style


@router.put("/motion-styles/{style_id}")
def update_motion_style(
    style_id: int,
    payload: MotionStyleUpdateSchema,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["TEACHER", "ADMIN", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Only teachers or admins can update motion styles.")

    style = db.query(models.ArtMotionStyle).filter(models.ArtMotionStyle.id == style_id).first()
    if not style:
        raise HTTPException(status_code=404, detail="Motion style not found.")

    if payload.title is not None:
        style.title = payload.title
    if payload.motion_preset is not None:
        style.motion_preset = payload.motion_preset
    if payload.background_image_url is not None:
        style.background_image_url = payload.background_image_url
    if payload.sound_effect_url is not None:
        style.sound_effect_url = payload.sound_effect_url
    if payload.duration_seconds is not None:
        style.duration_seconds = payload.duration_seconds
    if payload.is_active is not None:
        style.is_active = payload.is_active

    db.commit()
    db.refresh(style)
    return style


@router.delete("/motion-styles/{style_id}")
def delete_motion_style(
    style_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["TEACHER", "ADMIN", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Only teachers or admins can delete motion styles.")

    style = db.query(models.ArtMotionStyle).filter(models.ArtMotionStyle.id == style_id).first()
    if not style:
        raise HTTPException(status_code=404, detail="Motion style not found.")

    db.delete(style)
    db.commit()
    return {"message": "Motion style deleted successfully."}


@router.post("/upload-background")
def upload_background_image(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["TEACHER", "ADMIN", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Only staff can upload backgrounds.")

    ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
    filename = f"bg_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(BG_DIR, filename)

    with open(filepath, "wb") as f:
        f.write(file.file.read())

    return {"url": f"/static/art_backgrounds/{filename}"}


# --- BACKGROUND REMOVAL & 15-SECOND ANIMATION PIPELINE ---

def remove_drawing_paper_background(image_bytes: bytes) -> Image.Image:
    """Extract drawn character by converting bright paper pixels to transparent."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGBA")
    
    # Auto-orient if EXIF orientation tag exists
    img = ImageOps.exif_transpose(img)
    
    # Downscale for performance if larger than 1200px
    img.thumbnail((800, 800), Image.Resampling.LANCZOS)
    
    datas = img.getdata()
    new_data = []
    for item in datas:
        r, g, b, a = item
        # Calculate brightness threshold
        brightness = (r + g + b) / 3.0
        # If paper background (very light / off-white), set alpha to 0
        if brightness > 195 and abs(r - g) < 25 and abs(g - b) < 25:
            new_data.append((255, 255, 255, 0))
        else:
            # Enhance color opacity
            new_data.append((r, g, b, 255))
            
    img.putdata(new_data)
    
    # Crop bounding box of drawn figure
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    return img


def generate_direct_gemini_vision_story(image_bytes: bytes, title: str) -> Optional[str]:
    """
    Sends the drawing image bytes directly to Google Gemini 2.5 Flash Multimodal Vision.
    Gemini looks at the actual image, identifies exact figures (e.g., Goddess Cuttack Chandi, Durga, Lakshmi, Saraswati, Ganesha, Krishna, Shiva, animals, space, etc.),
    and generates a specific 2-minute children's narration story.
    """
    try:
        from dotenv import load_dotenv
        load_dotenv(override=True)
    except Exception:
        pass

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or api_key == "YOUR_GEMINI_API_KEY_HERE":
        print("[Gemini Vision Storyteller] GEMINI_API_KEY missing or default!")
        return None

    candidate_models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-flash-latest"]

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        prompt = (
            "You are a warm Indian children's storyteller and art educator. Look closely at this image.\n"
            "DO NOT rely on any title text or textbox labels — identify the exact subject solely from what is visible in this picture.\n"
            "If it shows a sacred Indian deity or idol (such as Maa Cuttack Chandi, Goddess Lakshmi, Durga, Kali, Saraswati, Ganesha, Krishna, Lord Shiva, Lord Jagannath, etc.), identify the deity, garlands, lotus flowers, crown, or shrine decorations.\n"
            "If it shows animals, space, nature, or a child's drawing, describe the exact visual scene.\n\n"
            "CRITICAL NARRATION RULES:\n"
            "1. DO NOT waste time in the introduction! Start DIRECTLY with the subject of the picture (for example: 'Namaste! Look at this divine Darshan of Maa Cuttack Chandi adorned with beautiful marigold garlands...').\n"
            "2. Write in clear, natural Indian English using simple phrasing that every Indian child (ages 4-12) can easily understand.\n"
            "3. Keep the length concise (around 180 to 220 words) so it speaks for 1.5 to 2 minutes smoothly.\n"
            "4. Share 1-2 interesting fun facts or cultural stories about the subject, and end with a warm blessing/moral lesson.\n"
            "5. Do NOT mention 'AI', 'computer vision', 'drawing title', 'textbox', or 'uploaded file'."
        )

        for model_name in candidate_models:
            try:
                print(f"[Gemini Vision Storyteller] Inspecting drawing directly with '{model_name}'...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([prompt, pil_image])
                if response and response.text:
                    story = response.text.strip()
                    print(f"[Gemini Vision Storyteller ({model_name})] Success! Generated {len(story)} chars")
                    return story
            except Exception as model_err:
                print(f"[Gemini Vision Storyteller ({model_name}) Failed]: {model_err}")
                continue

    except Exception as e:
        print(f"[Gemini Vision Storyteller Global Error]: {e}")
    return None


def generate_computer_vision_semantic_analysis(image_bytes: bytes) -> str:
    """
    Delegates image analysis to the centralized AI Vision Config.
    Switch between Google Gemini or Local BLIP by editing ai_vision_config.py.
    """
    return analyze_image_with_ai(image_bytes)


def generate_child_story_from_caption(caption: str, title: str) -> str:
    """
    Generates a rich 2-minute child-centric narration story from vision caption.
    Priority:
      1. Google Gemini 1.5 Flash (configured in ai_vision_config.py) — rich, personalised
      2. Rule-based fallback — good quality keyword-matched story
    Returns a plain text string ready for gTTS speech synthesis.
    """
    from app.core.ai_vision_config import AI_VISION_API_KEY

    # --- 1. Try Gemini Generative AI ---
    api_key = os.getenv("GEMINI_API_KEY") or AI_VISION_API_KEY
    if api_key and api_key != "YOUR_GEMINI_API_KEY_HERE":
        candidate_models = [
            os.getenv("AI_VISION_MODEL_NAME", "gemini-2.5-flash"),
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest"
        ]
        seen = set()
        models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            prompt = (
                f"You are a warm, enthusiastic children's storyteller. "
                f"A child has drawn a picture. The AI vision model has analysed it and sees: '{caption}'. "
                f"The drawing is called: '{title}'.\n\n"
                f"Write a wonderful 2-minute children's story narration (around 250-300 words) that:\n"
                f"1. Opens with excitement about what is in the drawing\n"
                f"2. Tells a fun short story connecting the drawing subject to real-world facts a child would love\n"
                f"3. Includes 1-2 amazing fun facts related to the subject (space, animals, nature, culture etc.)\n"
                f"4. Ends with a warm, positive moral message or blessing\n"
                f"Use simple, joyful, encouraging language a 4-10 year old child would love. "
                f"Do NOT mention the child's name. Do NOT say 'computer vision model'. "
                f"Speak as if you are the character or subject in the drawing, coming alive to tell the child a story."
            )

            for model_name in models_to_try:
                try:
                    print(f"[Story Generator - Gemini] Trying model '{model_name}'...")
                    model = genai.GenerativeModel(model_name)
                    response = model.generate_content(prompt)
                    if response and response.text:
                        story = response.text.strip()
                        print(f"[Story Generator - Gemini ({model_name})] Success: {len(story)} chars")
                        return story
                except Exception as model_err:
                    print(f"[Story Generator - Gemini ({model_name}) Failed]: {model_err}")
                    continue

        except Exception as e:
            print(f"[Story Generator - Gemini Error]: {e}. Using fallback story.")

    # --- 2. Rule-based fallback story (rich, 2 minutes) ---
    c_lower = caption.lower()
    t_lower = title.lower()

    if any(k in c_lower or k in t_lower for k in ["goddess", "devi", "god", "ganesha", "krishna", "shiva", "divine", "angel", "temple", "laxmi", "saraswati", "durga", "sacred", "blessing"]):
        return (
            f"Oh hello, little one! I am the divine spirit inside this beautiful picture, and I have woken up just for you today! "
            f"I see you are looking at a sacred drawing — one filled with light, love, and blessings. "
            f"In ancient stories from long, long ago, the divine beings you see in paintings like this one were known as the protectors of wisdom and happiness. "
            f"The lotus flower you might see here is very special — it grows in muddy water but always rises clean and bright! "
            f"Just like that, no matter how hard things get, you can always rise up and shine. "
            f"Did you know that in India, for thousands of years, children just like you have learned about kindness, courage, and honesty from these sacred stories? "
            f"The goddess Saraswati loves children who study hard and are curious about the world. "
            f"Goddess Laxmi smiles upon those who are generous and kind to others. "
            f"And great Ganesha, the remover of obstacles, always blesses those who begin new things with a good heart! "
            f"So today, as you look at this beautiful drawing, I want to give you a special blessing. "
            f"May your mind always be curious and open. "
            f"May your hands always create beautiful things. "
            f"May your heart always be full of love, for your family, your friends, and for all living beings. "
            f"Remember — just like the stars in the sky never stop shining, your light inside you will never go out. "
            f"Keep drawing, keep learning, keep smiling — because the world becomes a better place with wonderful, creative children like you in it!"
        )

    elif any(k in c_lower or k in t_lower for k in ["space", "rocket", "astronaut", "star", "galaxy", "planet", "moon", "sun", "superhero"]):
        return (
            f"Three, two, one — BLAST OFF! Hello, young space explorer! "
            f"I am your rocket, and I have come alive from this wonderful drawing just to take you on an adventure today! "
            f"Look at the stars around us — did you know that there are more stars in the universe than there are grains of sand on ALL the beaches on Earth? "
            f"Wow — that is a LOT of stars! "
            f"Far away from us is a giant red planet called Mars. Scientists are working every day to one day send astronauts there! "
            f"Maybe YOU will be one of those astronauts one day. How exciting would that be! "
            f"The moon you might see in this picture is about three hundred and eighty four thousand kilometres away from Earth — but brave astronauts have already walked on its dusty surface! "
            f"Neil Armstrong was the first human to ever walk on the moon, back in 1969, and do you know what he said? "
            f"He said it was 'one small step for man, one giant leap for mankind.' "
            f"Even India's very own ISRO sent a rocket to the moon — the Chandrayaan mission — and landed near the South Pole of the Moon for the very first time in the whole world! "
            f"So you see, space belongs to curious, brave, and clever people — and that is exactly what you are! "
            f"Every scientist, every astronaut, every inventor — they all started just like you. "
            f"They looked at the sky, asked 'Why?' and 'How?' — and then they went and found the answer. "
            f"So keep looking up at the night sky, keep dreaming big, and never stop exploring! "
            f"The universe is waiting for you!"
        )

    elif any(k in c_lower or k in t_lower for k in ["dinosaur", "dino", "jungle", "animal", "lion", "tiger", "elephant", "safari", "forest", "creature"]):
        return (
            f"ROAARRR! Hello there, brave explorer! "
            f"I am the magnificent creature you drew, and I have stomped right out of this picture just to tell you a story! "
            f"Did you know that dinosaurs walked on this very same Earth — millions and millions of years before any human was born? "
            f"The mighty T-Rex was as tall as a two storey building and had teeth as sharp as kitchen knives! "
            f"And yet, some dinosaurs — like the giant Brachiosaurus — only ate plants! "
            f"Paleontologists are the amazing scientists who dig up dinosaur bones from the ground and piece them together like a giant jigsaw puzzle. "
            f"They have found dinosaur fossils on EVERY continent — even under the ice in Antarctica! "
            f"Today, animals like lions, elephants, tigers, and wolves carry the spirit of those ancient wild creatures. "
            f"A lion can roar so loud it can be heard five kilometres away! "
            f"An elephant never forgets — their memories are so strong that they remember friends and family for decades. "
            f"Every creature on Earth, big or small, has an important role to play in keeping nature balanced and healthy. "
            f"So when you see animals in a picture, remember — they are all part of one big, wonderful family. "
            f"Your drawing shows how much you love the wild, wonderful creatures of our world. "
            f"And that love — that curiosity about nature — could one day make you a great wildlife scientist, a zoologist, or a conservationist who protects animals! "
            f"Stay wild, stay curious, and always be kind to every living being!"
        )

    elif any(k in c_lower or k in t_lower for k in ["flower", "tree", "garden", "butterfly", "nature", "rainbow", "sun", "cloud", "rain", "bird"]):
        return (
            f"Hello, little nature lover! "
            f"I am the garden, the flower, the butterfly — everything bright and beautiful that you have drawn — and I am so happy you are looking at me today! "
            f"Did you know that a single tree produces enough oxygen every day for two human beings to breathe? "
            f"Trees are our best friends on this whole planet! "
            f"Butterflies are some of the most magical creatures in nature. They start their lives as tiny caterpillars, crawl into a cocoon, and then — like magic — emerge as the most beautiful, colourful flying beings you have ever seen! "
            f"This is called metamorphosis, and it is one of nature's most incredible superpowers. "
            f"Flowers use their bright colours and lovely scents to talk to bees and butterflies. "
            f"They are saying — come here, visit me! And when the bees visit, they carry tiny seeds of pollen from one flower to another, helping new flowers grow all over the world. "
            f"A rainbow appears when sunlight shines through tiny drops of water in the sky, splitting into seven glorious colours — red, orange, yellow, green, blue, indigo, and violet. "
            f"Nature is always creating magic like this, all around us. "
            f"Every bird that sings, every breeze that blows, every raindrop that falls — they are all part of a beautiful, living system that keeps our Earth healthy and alive. "
            f"Your drawing tells me that you see the beauty in the world around you. "
            f"That is a very special gift! "
            f"Please always take care of nature — plant a tree, save water, and be kind to all living things. "
            f"The Earth will thank you — and so will all the butterflies!"
        )

    else:
        return (
            f"Hello, wonderful little artist! "
            f"What an incredible, imaginative drawing you have created today! "
            f"Art is one of the most magical things a human being can do. "
            f"Did you know that the earliest drawings ever found were made by children and adults in caves, over forty thousand years ago? "
            f"They used crushed stones, mud, and natural dyes to paint animals and stories on the cave walls! "
            f"Even then, people felt the same excitement you feel when you pick up a pencil or a crayon and create something from your imagination. "
            f"Every great painter — from Leonardo da Vinci who painted the Mona Lisa, to Raja Ravi Varma who painted beautiful Indian goddesses — started just like you. "
            f"They began by drawing simple things and slowly, with practice, they created masterpieces that the whole world admires! "
            f"Art helps you express feelings that are sometimes too big for words. "
            f"When you are happy, excited, curious, or even a little sad — drawing and painting can help you share those feelings with the world. "
            f"Looking at this drawing, I can feel the creativity, energy, and imagination you put into it. "
            f"Every line, every colour, every shape you chose was a creative decision — and that makes you an artist! "
            f"Always keep drawing, always keep creating. "
            f"Practice every day, try new things, and never be afraid to make mistakes — because even mistakes can become masterpieces. "
            f"The world needs your unique vision and your creative heart. "
            f"You are amazing — keep creating, keep shining!"
        )


def detect_character_and_generate_speech(title: str, student_name: str = "pupil") -> tuple:
    """Fallback classifier — kept for compatibility."""
    return "Art Image", f"Hello! What a wonderful drawing!"




def generate_musical_soundscape(preset: str, output_wav_path: str, duration_sec: float = 15.0):
    """Synthesize 15-second upbeat audio soundscape for art reel."""
    sample_rate = 44100
    n_samples = int(sample_rate * duration_sec)
    left = [0.0] * n_samples
    right = [0.0] * n_samples
    notes = {
        'C3': 130.81, 'G3': 196.00, 'A3': 220.00,
        'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'G4': 392.00, 'A4': 440.00,
        'C5': 523.25, 'D5': 587.33, 'E5': 659.25, 'G5': 783.99, 'A5': 880.00, 'C6': 1046.50
    }

    if preset == "rocket_launch":
        scale_notes = ['C3', 'G3', 'C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'C6']
        for i in range(n_samples):
            t = i / float(sample_rate)
            rumble = math.sin(2 * math.pi * 55.0 * t) * 0.15 + (math.sin(2 * math.pi * 110.0 * t) * 0.1)
            note_idx = int((t * 4) % len(scale_notes))
            freq = notes[scale_notes[note_idx]]
            synth = math.sin(2 * math.pi * freq * t) * 0.2 * math.exp(-((t * 4) % 1.0) * 3)
            sparkle = math.sin(2 * math.pi * 1800.0 * t) * 0.05 * (math.sin(t * 10) > 0.8)
            s = rumble + synth + sparkle
            left[i], right[i] = s, s

    elif preset == "dance_loop":
        melody = ['C4', 'E4', 'G4', 'A4', 'C5', 'E5', 'D5', 'C5']
        bpm = 120
        beat_dur = 60.0 / bpm
        for i in range(n_samples):
            t = i / float(sample_rate)
            beat_phase = (t % beat_dur) / beat_dur
            kick_freq = max(40.0, 150.0 * (1.0 - beat_phase * 4))
            kick = math.sin(2 * math.pi * kick_freq * t) * math.exp(-beat_phase * 8) * 0.4
            note_i = int(t / beat_dur) % len(melody)
            freq = notes[melody[note_i]]
            lead = (math.sin(2 * math.pi * freq * t) + 0.5 * math.sin(2 * math.pi * freq * 2 * t)) * 0.15 * math.exp(-beat_phase * 4)
            s = kick + lead
            left[i], right[i] = s, s

    elif preset == "walk_across":
        melody = ['G4', 'C5', 'E5', 'G5', 'E5', 'C5', 'A4', 'G4']
        step_dur = 0.4
        for i in range(n_samples):
            t = i / float(sample_rate)
            step_phase = (t % step_dur) / step_dur
            thump = math.sin(2 * math.pi * 70.0 * t) * math.exp(-step_phase * 12) * 0.3
            note_i = int(t / step_dur) % len(melody)
            freq = notes[melody[note_i]]
            marimba = math.sin(2 * math.pi * freq * t) * math.exp(-step_phase * 5) * 0.25
            s = thump + marimba
            left[i], right[i] = s, s

    elif preset == "divine_blessing":
        # Sacred Flute & Meditative Chime Soundscape
        divine_notes = ['C4', 'E4', 'G4', 'C5', 'G4', 'E4', 'C4', 'G3']
        for i in range(n_samples):
            t = i / float(sample_rate)
            drone = math.sin(2 * math.pi * 130.81 * t) * 0.08  # C3 tanpura drone
            note_i = int(t * 1.5) % len(divine_notes)
            freq = notes[divine_notes[note_i]]
            phase = (t * 1.5) % 1.0
            flute = (math.sin(2 * math.pi * freq * t) + 0.2 * math.sin(2 * math.pi * freq * 2 * t)) * 0.2 * math.exp(-phase * 1.5)
            s = drone + flute
            left[i], right[i] = s, s

    else:
        harp_notes = ['C4', 'E4', 'G4', 'C5', 'E5', 'G5', 'A5', 'C6']
        for i in range(n_samples):
            t = i / float(sample_rate)
            note_i = int(t * 3) % len(harp_notes)
            freq = notes[harp_notes[note_i]]
            note_phase = (t * 3) % 1.0
            glock = (math.sin(2 * math.pi * freq * t) + 0.3 * math.sin(2 * math.pi * freq * 3 * t)) * 0.3 * math.exp(-note_phase * 3)
            left[i], right[i] = glock, glock


    with wave.open(output_wav_path, 'wb') as wav_file:
        wav_file.setnchannels(2)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        frames_bytes = bytearray()
        for l, r in zip(left, right):
            l_int = int(max(-1.0, min(1.0, l)) * 32767)
            r_int = int(max(-1.0, min(1.0, r)) * 32767)
            frames_bytes.extend(struct.pack('<hh', l_int, r_int))
        wav_file.writeframes(frames_bytes)

def draw_sparkle_graphic(draw, cx, cy, size, color):
    pts = [
        (cx, cy - size),
        (cx + size * 0.25, cy - size * 0.25),
        (cx + size, cy),
        (cx + size * 0.25, cy + size * 0.25),
        (cx, cy + size),
        (cx - size * 0.25, cy + size * 0.25),
        (cx - size, cy),
        (cx - size * 0.25, cy - size * 0.25)
    ]
    draw.polygon(pts, fill=color)

def render_15s_animated_gif(cutout: Image.Image, bg_path: str, preset: str, output_path: str, title: str = "Magic Drawing", student_name: str = "Student", image_bytes: Optional[bytes] = None):
    """Render a 15-second 3-Act Deep Learning Vision & AI Storytelling Reel (150 frames @ 10 FPS)."""
    # 1. Computer Vision Semantic Analysis
    if image_bytes:
        vision_caption = generate_computer_vision_semantic_analysis(image_bytes)
    else:
        vision_caption = f"a creative drawing titled {title}"

    # 2. Generative AI 3-Scene Children's Story Engine
    ai_story_data = generate_dynamic_ai_children_story(vision_caption, title, student_name)
    preset = ai_story_data["preset_motion"]
    story_dict = ai_story_data["story"]
    full_narration = story_dict["full_narration"]

    full_bg_path = os.path.abspath(os.path.join(BASE_DIR, bg_path.lstrip("/")))
    if os.path.exists(full_bg_path):
        base_bg = Image.open(full_bg_path).convert("RGBA").resize((800, 450), Image.Resampling.LANCZOS)
    else:
        base_bg = Image.new("RGBA", (800, 450), (15, 23, 42, 255))

    c_w, c_h = cutout.size
    # Fill the frame with the image — large and clearly visible
    max_dim = 400
    ratio = min(max_dim / float(c_w), max_dim / float(c_h))
    new_w, new_h = max(10, int(c_w * ratio)), max(10, int(c_h * ratio))
    base_cutout = cutout.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Soft glow aura around the image
    aura_img = Image.new("RGBA", (new_w + 40, new_h + 40), (0, 0, 0, 0))
    aura_mask = base_cutout.split()[3]
    aura_solid = Image.new("RGBA", (new_w, new_h), (255, 255, 255, 120))
    aura_img.paste(aura_solid, (20, 20), aura_mask)
    aura_img = aura_img.filter(ImageFilter.GaussianBlur(18))


    total_frames = 600
    frames = []
    np_frames = []
    particles = []
    rnd = random.Random(123)

    for i in range(total_frames):
        frame = base_bg.copy()

        # KEEP THE PICTURE COMPLETELY STILL — perfectly centered
        x = 400
        y = 225
        scale = 1.0
        sx = 1.0
        sy = 1.0
        angle = 0

        # --- SOFT DROP SHADOW BELOW IMAGE ---
        shadow_layer = Image.new("RGBA", (800, 450), (0, 0, 0, 0))
        sh_draw = ImageDraw.Draw(shadow_layer)
        sh_draw.ellipse([x - new_w//2, y + new_h//2 - 8, x + new_w//2, y + new_h//2 + 18], fill=(0, 0, 0, 70))
        frame = Image.alpha_composite(frame, shadow_layer.filter(ImageFilter.GaussianBlur(10)))


        # --- CHARACTER PASTE (STILL) ---
        cur_w = max(10, int(new_w * scale * sx))
        cur_h = max(10, int(new_h * scale * sy))
        cur_cutout = base_cutout.resize((cur_w, cur_h), Image.Resampling.LANCZOS)
        cur_aura = aura_img.resize((cur_w + 24, cur_h + 24), Image.Resampling.LANCZOS)

        pos_x = x - cur_cutout.size[0] // 2
        pos_y = y - cur_cutout.size[1] // 2
        aura_x = x - cur_aura.size[0] // 2
        aura_y = y - cur_aura.size[1] // 2

        frame.paste(cur_aura, (aura_x, aura_y), cur_aura)
        frame.paste(cur_cutout, (pos_x, pos_y), cur_cutout)

        # --- SUBTITLE CAPTION BANNER ---
        if 15 <= i <= 580:
            banner_layer = Image.new("RGBA", (800, 450), (0, 0, 0, 0))
            b_draw = ImageDraw.Draw(banner_layer)
            b_alpha = int(210 * min(1.0, (i - 15) / 10.0))
            if i > 570: b_alpha = int(210 * (580 - i) / 10.0)
            
            b_draw.rectangle([40, 380, 760, 435], fill=(15, 23, 42, b_alpha), outline=(255, 215, 0, b_alpha), width=2)
            frame = Image.alpha_composite(frame, banner_layer)

        rgb_frame = frame.convert("RGB")
        frames.append(rgb_frame)
        np_frames.append(np.array(rgb_frame))

    # Save GIF
    frames[0].save(output_path, save_all=True, append_images=frames[1:], duration=100, loop=0)

    # Export MP4 Video with Pure Voice Narration (NO BACKGROUND MUSIC)
    mp4_path = output_path.rsplit(".", 1)[0] + ".mp4"
    temp_silent_path = output_path.rsplit(".", 1)[0] + "_silent.mp4"
    temp_speech_path = os.path.join(AUDIO_DIR, f"speech_{uuid.uuid4().hex[:8]}.mp3")

    if imageio and FFMPEG_EXE:
        try:
            imageio.mimwrite(temp_silent_path, np_frames, fps=10, quality=8)
            
            # Generate TTS Voice Narration directly describing the vision model findings (NO PUPIL NAME SPOKEN)
            try:
                from gtts import gTTS
                tts = gTTS(text=full_narration, lang=settings.TTS_FALLBACK_LANG, tld=settings.TTS_FALLBACK_TLD, slow=False)
                tts.save(temp_speech_path)
                has_speech = True
            except Exception as voice_err:
                print(f"TTS Voice notice: {voice_err}")
                has_speech = False

            # Mux ONLY Spoken Voice Narration (NO BACKGROUND MUSIC) using FFmpeg
            if has_speech and os.path.exists(temp_speech_path):
                cmd = [
                    FFMPEG_EXE,
                    "-y",
                    "-i", temp_silent_path,
                    "-i", temp_speech_path,
                    "-c:v", "copy",
                    "-c:a", "aac",
                    "-b:a", "128k",
                    "-map", "0:v",
                    "-map", "1:a",
                    "-shortest",
                    mp4_path
                ]
            else:
                cmd = [
                    FFMPEG_EXE,
                    "-y",
                    "-i", temp_silent_path,
                    "-c:v", "copy",
                    mp4_path
                ]

            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            if res.returncode != 0:
                os.replace(temp_silent_path, mp4_path)
            else:
                if os.path.exists(temp_silent_path): os.remove(temp_silent_path)
        except Exception as e:
            print(f"MP4 Voice Export notice: {e}")


def create_mp4_reel_from_image_and_audio(image_path: str, audio_path: str) -> Optional[str]:
    """
    Muxes the artwork photo background + MP3 audio narration into a real MP4 video reel.
    When downloaded and played on any media player/phone/PC, the artwork background displays on screen during speech!
    """
    if not os.path.exists(image_path) or not os.path.exists(audio_path):
        return None

    try:
        import subprocess
        import imageio_ffmpeg

        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        video_filename = f"reel_{uuid.uuid4().hex[:8]}.mp4"
        video_path = os.path.join(ART_DIR, video_filename)

        cmd = [
            ffmpeg_exe,
            "-y",
            "-loop", "1",
            "-i", image_path,
            "-i", audio_path,
            "-c:v", "libx264",
            "-tune", "stillimage",
            "-c:a", "aac",
            "-b:a", "192k",
            "-pix_fmt", "yuv420p",
            "-shortest",
            video_path
        ]

        res = subprocess.run(cmd, capture_output=True, text=True, timeout=45)
        if res.returncode == 0 and os.path.exists(video_path):
            print(f"[Art Reel - MP4 Video] Generated video reel successfully: {video_filename}")
            return f"/static/art_animations/{video_filename}"
        else:
            print(f"[Art Reel - MP4 Video Notice] FFmpeg output: {res.stderr[:200]}")
    except Exception as e:
        print(f"[Art Reel - MP4 Video Error]: {e}")
    return None


@router.post("/animate/{student_id}")
def animate_student_artwork(
    student_id: int,
    title: str = Form("My Drawing"),
    motion_style_id: Optional[int] = Form(None),
    drawing: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    ════════════════════════════════════════════════════════════════════
    AI Art Storyteller Pipeline
    ════════════════════════════════════════════════════════════════════
    Step 1: Save the uploaded image as-is (no modification)
    Step 2: Send to Gemini Vision / BLIP → understand the image
    Step 3: Send caption to Gemini / rule-based → generate 2-min story
    Step 4: Convert story text → MP3 via gTTS
    Step 5: Return { original_photo_url, audio_narration_url }
    Frontend: Show still image + Play button for audio narration
    ════════════════════════════════════════════════════════════════════
    """
    if current_user.role.upper() not in ["TEACHER", "ADMIN", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Only teachers or admins can animate student artwork.")

    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    # Fetch style (used only for DB record, not for animation)
    style = None
    if motion_style_id:
        style = db.query(models.ArtMotionStyle).filter(models.ArtMotionStyle.id == motion_style_id).first()
    if not style:
        seed_default_motion_styles(db)
        style = db.query(models.ArtMotionStyle).first()

    # ── Step 1: Read & Save original image ──────────────────────────
    file_bytes = drawing.file.read()
    photo_filename = f"orig_{uuid.uuid4().hex[:8]}.jpg"
    photo_path = os.path.join(ART_DIR, photo_filename)

    # Save as JPEG (convert if needed)
    try:
        pil_img = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        pil_img.save(photo_path, "JPEG", quality=95)
    except Exception:
        with open(photo_path, "wb") as f:
            f.write(file_bytes)

    original_photo_url = f"/static/art_animations/{photo_filename}"
    print(f"[Art Storyteller] Image saved: {photo_filename}")

    # ── Step 2 & 3: Direct Multimodal Gemini Vision Story Generation ─
    story_text = None
    vision_caption = title

    try:
        story_text = generate_direct_gemini_vision_story(file_bytes, title)
    except Exception as gve:
        print(f"[Art Storyteller] Direct Gemini vision error: {gve}")

    if not story_text:
        # Fallback pipeline if direct Gemini vision fails or key is unconfigured
        try:
            vision_caption = generate_computer_vision_semantic_analysis(file_bytes)
            print(f"[Art Storyteller] Fallback Vision caption: {vision_caption}")
        except Exception as ve:
            vision_caption = f"a creative drawing titled {title}"
            print(f"[Art Storyteller] Vision fallback: {ve}")

        try:
            story_text = generate_child_story_from_caption(vision_caption, title)
            print(f"[Art Storyteller] Fallback Story generated: {len(story_text)} chars")
        except Exception as se:
            story_text = (
                f"Hello, wonderful little artist! What an amazing drawing you have made today! "
                f"I can see so many beautiful things in your picture. "
                f"Keep drawing, keep creating, and never stop imagining. "
                f"You are truly a wonderful young artist!"
            )

    # ── Step 4: Convert story to MP3 audio (Neural Expressive Human Voice) ─
    audio_filename = f"story_{uuid.uuid4().hex[:8]}.mp3"
    audio_path = os.path.join(AUDIO_DIR, audio_filename)
    audio_narration_url = f"/static/art_audio/{audio_filename}"

    try:
        import asyncio
        import edge_tts

        async def _synthesize_voice():
            # 'en-IN-NeerjaExpressiveNeural' is an expressive, natural Indian English voice
            communicate = edge_tts.Communicate(story_text, settings.TTS_VOICE_NAME)
            await communicate.save(audio_path)

        asyncio.run(_synthesize_voice())
        print(f"[Art Storyteller - Neural Speech] edge-tts saved: {audio_filename}")
    except Exception as ae:
        print(f"[Art Storyteller - edge-tts Notice]: {ae}. Falling back to gTTS...")
        try:
            from gtts import gTTS
            tts = gTTS(text=story_text, lang=settings.TTS_FALLBACK_LANG, tld=settings.TTS_FALLBACK_TLD, slow=False)
            tts.save(audio_path)
            print(f"[Art Storyteller - gTTS] Audio saved: {audio_filename}")
        except Exception as ge:
            print(f"[Art Storyteller] TTS error: {ge}")
            audio_narration_url = None  # No audio generated



    # ── Step 5: Generate MP4 Video Reel (Photo Background + Audio Narration) ─
    video_reel_url = create_mp4_reel_from_image_and_audio(photo_path, audio_path)
    if not video_reel_url:
        video_reel_url = audio_narration_url or original_photo_url

    # ── Step 6: Save to database ─────────────────────────────────────
    art_record = models.StudentArtAnimation(
        student_id=student.id,
        teacher_id=current_user.id,
        motion_style_id=style.id,
        original_photo_url=original_photo_url,
        extracted_cutout_url=original_photo_url,   # Same as original — no cutout needed
        animated_video_url=video_reel_url,
        duration=120,
        title=f"{student.name}'s {title}" if student.name not in title else title
    )
    db.add(art_record)
    db.commit()
    db.refresh(art_record)

    return {
        "message": f"✨ AI Story Narration created for {student.name}!",
        "art": {
            "id": art_record.id,
            "student_name": student.name,
            "title": art_record.title,
            "original_photo_url": art_record.original_photo_url,
            "audio_narration_url": audio_narration_url,
            "animated_video_url": video_reel_url,
            "vision_caption": vision_caption,
            "motion_style_title": style.title,
            "duration": 120,
            "created_at": art_record.created_at.isoformat()
        }
    }










@router.post("/animate/{student_id}")
def animate_student_artwork(
    student_id: int,
    title: str = Form("Kavi's Magic Drawing"),
    motion_style_id: Optional[int] = Form(None),
    drawing: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["TEACHER", "ADMIN", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Only teachers or admins can animate student artwork.")

    student = db.query(models.Student).filter(models.Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found.")

    # Fetch motion style
    style = None
    if motion_style_id:
        style = db.query(models.ArtMotionStyle).filter(models.ArtMotionStyle.id == motion_style_id).first()
    if not style:
        seed_default_motion_styles(db)
        style = db.query(models.ArtMotionStyle).first()

    # Read uploaded drawing photo
    file_bytes = drawing.file.read()
    
    # Save original photo
    photo_filename = f"orig_{uuid.uuid4().hex[:8]}.jpg"
    photo_path = os.path.join(ART_DIR, photo_filename)
    with open(photo_path, "wb") as f:
        f.write(file_bytes)
        
    original_photo_url = f"/static/art_animations/{photo_filename}"

    # Extract transparent cutout
    cutout_img = remove_drawing_paper_background(file_bytes)
    cutout_filename = f"cutout_{uuid.uuid4().hex[:8]}.png"
    cutout_path = os.path.join(ART_DIR, cutout_filename)
    cutout_img.save(cutout_path, "PNG")
    extracted_cutout_url = f"/static/art_animations/{cutout_filename}"

    # Render 15-second animated story reel
    anim_filename = f"anim15s_{uuid.uuid4().hex[:8]}.gif"
    anim_path = os.path.join(ART_DIR, anim_filename)
    
    render_15s_animated_gif(
        cutout=cutout_img,
        bg_path=style.background_image_url,
        preset=style.motion_preset,
        output_path=anim_path,
        title=title,
        student_name=student.name,
        image_bytes=file_bytes
    )


    
    animated_video_url = f"/static/art_animations/{anim_filename}"

    # Save to database
    art_record = models.StudentArtAnimation(
        student_id=student.id,
        teacher_id=current_user.id,
        motion_style_id=style.id,
        original_photo_url=original_photo_url,
        extracted_cutout_url=extracted_cutout_url,
        animated_video_url=animated_video_url,
        duration=15,
        title=f"{student.name}'s {title}" if student.name not in title else title
    )
    db.add(art_record)
    db.commit()
    db.refresh(art_record)

    return {
        "message": f"✨ Magic 15-second animated story reel created for {student.name}!",
        "art": {
            "id": art_record.id,
            "student_name": student.name,
            "title": art_record.title,
            "original_photo_url": art_record.original_photo_url,
            "animated_video_url": art_record.animated_video_url,
            "motion_style_title": style.title,
            "duration": 15,
            "created_at": art_record.created_at.isoformat()
        }
    }


@router.get("/parent/{student_id}")
def get_parent_art_animations(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    art_records = db.query(models.StudentArtAnimation).filter(
        models.StudentArtAnimation.student_id == student_id
    ).order_by(models.StudentArtAnimation.created_at.desc()).all()

    result = []
    for a in art_records:
        result.append({
            "id": a.id,
            "student_id": a.student_id,
            "student_name": a.student.name if a.student else "Student",
            "title": a.title,
            "original_photo_url": a.original_photo_url,
            "extracted_cutout_url": a.extracted_cutout_url,
            "animated_video_url": a.animated_video_url,
            "motion_style_title": a.motion_style.title if a.motion_style else "Magic Animation",
            "duration": a.duration or 15,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return result


@router.get("/teacher")
def get_teacher_art_animations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.upper() not in ["TEACHER", "ADMIN", "PRINCIPAL"]:
        raise HTTPException(status_code=403, detail="Only staff can access art animations.")

    art_records = db.query(models.StudentArtAnimation).order_by(
        models.StudentArtAnimation.created_at.desc()
    ).all()

    result = []
    for a in art_records:
        result.append({
            "id": a.id,
            "student_id": a.student_id,
            "student_name": a.student.name if a.student else "Student",
            "program_title": a.student.program.title if (a.student and a.student.program) else "N/A",
            "title": a.title,
            "original_photo_url": a.original_photo_url,
            "animated_video_url": a.animated_video_url,
            "motion_style_title": a.motion_style.title if a.motion_style else "Magic Animation",
            "duration": a.duration or 15,
            "created_at": a.created_at.isoformat() if a.created_at else None
        })
    return result



@router.get("/download/{art_id}")
def download_art_animation(
    art_id: int,
    db: Session = Depends(get_db)
):
    art = db.query(models.StudentArtAnimation).filter(models.StudentArtAnimation.id == art_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Art animation record not found.")

    rel_path = art.animated_video_url.lstrip("/")
    full_file_path = os.path.abspath(os.path.join(BASE_DIR, rel_path))
    mp4_path = full_file_path.rsplit(".", 1)[0] + ".mp4"

    # On-the-fly MP4 creation from GIF if MP4 is missing
    if not os.path.exists(mp4_path) and os.path.exists(full_file_path) and imageio:
        try:
            gif_img = Image.open(full_file_path)
            gif_frames = []
            n_frames = getattr(gif_img, 'n_frames', 1)
            for f_idx in range(n_frames):
                gif_img.seek(f_idx)
                gif_frames.append(np.array(gif_img.convert('RGB')))
            if gif_frames:
                imageio.mimwrite(mp4_path, gif_frames, fps=10)
        except Exception as e:
            print(f"On-the-fly MP4 creation error: {e}")

    clean_title = "".join(c for c in art.title if c.isalnum() or c in (" ", "_", "-")).strip().replace(" ", "_") or "drawing_story"

    if os.path.exists(mp4_path):
        target_path = mp4_path
        download_filename = f"{clean_title}_15s_reel.mp4"
    elif os.path.exists(full_file_path):
        target_path = full_file_path
        ext = os.path.splitext(full_file_path)[1].lower()
        download_filename = f"{clean_title}_15s_reel{ext}"
    else:
        raise HTTPException(status_code=404, detail="Video file not found on server.")

    return FileResponse(
        path=target_path,
        media_type="video/mp4",
        filename=download_filename,
        headers={
            "Content-Disposition": f'attachment; filename="{download_filename}"',
            "Content-Type": "video/mp4"
        }
    )



@router.delete("/{art_id}")
def delete_single_art_animation(
    art_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    art = db.query(models.StudentArtAnimation).filter(models.StudentArtAnimation.id == art_id).first()
    if not art:
        raise HTTPException(status_code=404, detail="Art animation record not found.")

    user_role = current_user.role.upper()
    if user_role not in ["TEACHER", "ADMIN", "PRINCIPAL"]:
        if user_role == "PARENT":
            student = db.query(models.Student).filter(models.Student.id == art.student_id).first()
            if not student or student.parent_id != current_user.id:
                raise HTTPException(status_code=403, detail="You do not have permission to delete this video.")
        else:
            raise HTTPException(status_code=403, detail="Permission denied.")

    rel_path = art.animated_video_url.lstrip("/")
    full_file_path = os.path.abspath(os.path.join(BASE_DIR, rel_path))
    mp4_path = full_file_path.rsplit(".", 1)[0] + ".mp4"
    
    for p in [full_file_path, mp4_path]:
        if p and os.path.exists(p):
            try:
                os.remove(p)
            except Exception:
                pass

    db.delete(art)
    db.commit()
    return {"message": "Animated video reel deleted successfully."}


@router.delete("/student/{student_id}/all")
def delete_all_student_art_animations(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    user_role = current_user.role.upper()
    if user_role not in ["TEACHER", "ADMIN", "PRINCIPAL"]:
        if user_role == "PARENT":
            student = db.query(models.Student).filter(models.Student.id == student_id).first()
            if not student or student.parent_id != current_user.id:
                raise HTTPException(status_code=403, detail="You do not have permission to delete these videos.")
        else:
            raise HTTPException(status_code=403, detail="Permission denied.")

    art_records = db.query(models.StudentArtAnimation).filter(
        models.StudentArtAnimation.student_id == student_id
    ).all()

    count = len(art_records)
    for art in art_records:
        rel_path = art.animated_video_url.lstrip("/")
        full_file_path = os.path.abspath(os.path.join(BASE_DIR, rel_path))
        mp4_path = full_file_path.rsplit(".", 1)[0] + ".mp4"
        for p in [full_file_path, mp4_path]:
            if p and os.path.exists(p):
                try:
                    os.remove(p)
                except Exception:
                    pass
        db.delete(art)

    db.commit()
    return {"message": f"Successfully deleted all {count} animated video reels for this student."}


