"""
=======================================================================
  ⚙️  CENTRALIZED AI VISION CONFIGURATION
  File: backend/app/core/ai_vision_config.py
=======================================================================

  THIS IS THE SINGLE PLACE TO CHANGE YOUR AI MODEL & API KEY.

  Supported Providers (set AI_VISION_PROVIDER env var):
  ─────────────────────────────────────────────────────
  1. "google_gemini"  ★ RECOMMENDED FREE — Google Gemini 1.5 Flash
                         Multimodal Vision API (extremely detailed)
                         → Requires GEMINI_API_KEY in environment
                         → Free tier: 15 RPM / 1 million tokens/day
                         → Set AI_VISION_MODEL_NAME = "gemini-1.5-flash"

  2. "local_blip"     → 100% offline Salesforce BLIP model (CPU)
                         No API key needed. ~900MB download on first run.
                         Set AI_VISION_MODEL_NAME = "Salesforce/blip-image-captioning-base"

  ─────────────────────────────────────────────────────
  HOW TO SET ENVIRONMENT VARIABLES:
  Add these to your .env or system environment:

      AI_VISION_PROVIDER=google_gemini
      AI_VISION_MODEL_NAME=gemini-1.5-flash
      GEMINI_API_KEY=<your-free-google-gemini-api-key>

  Get your FREE Gemini API Key here:
  → https://aistudio.google.com/app/apikey
=======================================================================
"""

import os
import io
from typing import Optional
from PIL import Image

# Load .env file explicitly so keys are always available
try:
    from dotenv import load_dotenv
    _env_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", ".env")
    load_dotenv(dotenv_path=os.path.abspath(_env_path), override=True)
except Exception:
    pass  # dotenv not installed — rely on system env vars

# ─────────────────────────────────────────────────────────────────────
# SINGLE PLACE TO CHANGE MODEL & KEY
# ─────────────────────────────────────────────────────────────────────
AI_VISION_PROVIDER: str = os.getenv("AI_VISION_PROVIDER", "google_gemini")
AI_VISION_MODEL_NAME: str = os.getenv("AI_VISION_MODEL_NAME", "gemini-2.5-flash")
AI_VISION_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
# ─────────────────────────────────────────────────────────────────────


# Local BLIP model cache (used as fallback)
_blip_processor = None
_blip_model = None


def _load_local_blip():
    """Lazy-load the offline Salesforce BLIP vision model."""
    global _blip_processor, _blip_model
    if _blip_processor is None or _blip_model is None:
        try:
            print(f"[AI Vision] Loading local BLIP model: Salesforce/blip-image-captioning-base ...")
            from transformers import BlipProcessor, BlipForConditionalGeneration
            _blip_processor = BlipProcessor.from_pretrained("Salesforce/blip-image-captioning-base")
            _blip_model = BlipForConditionalGeneration.from_pretrained("Salesforce/blip-image-captioning-base")
            print("[AI Vision] Local BLIP model ready.")
        except Exception as e:
            raise RuntimeError(f"Failed to load local BLIP model: {e}")
    return _blip_processor, _blip_model


def _analyze_with_gemini(image_bytes: bytes) -> Optional[str]:
    """Use Google Gemini multimodal vision for deep image understanding."""
    try:
        from dotenv import load_dotenv
        load_dotenv(override=True)
    except Exception:
        pass

    api_key = os.getenv("GEMINI_API_KEY") or AI_VISION_API_KEY
    if not api_key:
        print("[AI Vision] GEMINI_API_KEY not set. Falling back to local BLIP.")
        return None

    candidate_models = [
        os.getenv("AI_VISION_MODEL_NAME", "gemini-2.5-flash"),
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-flash-latest",
        "gemini-2.5-pro"
    ]

    # Deduplicate candidate list preserving order
    seen = set()
    models_to_try = [m for m in candidate_models if m and not (m in seen or seen.add(m))]

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        prompt = (
            "You are an expert art educator and storyteller. "
            "Look at this child's drawing or artwork carefully and provide:\n"
            "1. The main subject(s) and characters you see\n"
            "2. The theme, setting, or story portrayed\n"
            "3. Colors, mood, and artistic style\n"
            "4. What educational topic or real-world subject this artwork relates to\n"
            "Respond in 3-5 natural, engaging sentences as if narrating to a child audience."
        )

        for model_name in models_to_try:
            try:
                print(f"[AI Vision - Gemini] Trying model '{model_name}'...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([prompt, pil_image])
                if response and response.text:
                    caption = response.text.strip().replace("\n", " ")
                    print(f"[AI Vision - Gemini ({model_name})] Success: '{caption[:120]}...'")
                    return caption
            except Exception as model_err:
                print(f"[AI Vision - Gemini ({model_name}) Failed]: {model_err}")
                continue

    except Exception as e:
        print(f"[AI Vision - Gemini Global Error]: {e}")
    return None


def _analyze_with_local_blip(image_bytes: bytes) -> str:
    """Use offline local BLIP model as fallback."""
    try:
        processor, model = _load_local_blip()
        raw_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        inputs = processor(raw_image, return_tensors="pt")
        out = model.generate(**inputs, max_new_tokens=60)
        caption = processor.decode(out[0], skip_special_tokens=True).strip()
        print(f"[AI Vision - Local BLIP] Result: '{caption}'")
        return caption
    except Exception as e:
        print(f"[AI Vision - Local BLIP Error]: {e}")
        return "a beautiful creative drawing full of imagination"


def analyze_image_with_ai(image_bytes: bytes) -> str:
    """
    ════════════════════════════════════════════════════════════════
    MAIN ENTRY POINT — Call this function everywhere in the app.

    Automatically uses the configured provider (AI_VISION_PROVIDER).
    Falls back gracefully from Gemini → local BLIP → default string.
    ════════════════════════════════════════════════════════════════
    """
    print(f"[AI Vision] Provider={AI_VISION_PROVIDER}, Model={AI_VISION_MODEL_NAME}")

    if AI_VISION_PROVIDER.lower() == "google_gemini":
        result = _analyze_with_gemini(image_bytes)
        if result:
            return result
        # Fallback to local BLIP if Gemini fails or key missing
        return _analyze_with_local_blip(image_bytes)

    # Default: local_blip
    return _analyze_with_local_blip(image_bytes)
