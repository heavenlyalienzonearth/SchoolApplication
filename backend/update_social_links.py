from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app import models

def update_socials():
    engine = create_engine(settings.DATABASE_URL)
    Session = sessionmaker(bind=engine)
    db = Session()

    print("Updating official social media URLs for Kangaroo Kids...")
    
    socials = {
        "facebook_url": "https://www.facebook.com/kangarookidspreschools/",
        "instagram_url": "https://www.instagram.com/kangarookidsindia/",
        "twitter_url": "https://twitter.com/kangarookidsin",
        "youtube_url": "https://www.youtube.com/@KangarooKidsEduLtd"
    }

    for key, val in socials.items():
        setting = db.query(models.SiteSetting).filter(models.SiteSetting.config_key == key).first()
        if setting:
            setting.config_value = val
            print(f"Updated setting: {key} -> {val}")
        else:
            db.add(models.SiteSetting(config_key=key, config_value=val, category="social"))
            print(f"Created setting: {key} -> {val}")

    db.commit()
    db.close()
    print("Database updated successfully!")

if __name__ == "__main__":
    update_socials()
