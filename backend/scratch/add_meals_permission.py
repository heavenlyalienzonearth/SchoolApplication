import sys
from sqlalchemy import create_engine, text

backend_path = r"e:\AI_Applications\SchoolApplication\backend"
if backend_path not in sys.path:
    sys.path.append(backend_path)

from app.core.config import settings

def run():
    print(f"Connecting to database: {settings.DATABASE_URL}")
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        roles = ["SuperAdmin", "Admin", "Principal", "Teacher"]
        for role in roles:
            # Check if record exists
            query = text("SELECT id, is_enabled FROM feature_permissions WHERE role = :r AND feature = 'meals'")
            row = conn.execute(query, {"r": role}).fetchone()
            if row:
                print(f"Record exists for role: {role}. Ensuring is_enabled=1...")
                conn.execute(
                    text("UPDATE feature_permissions SET is_enabled = 1 WHERE id = :id"),
                    {"id": row[0]}
                )
            else:
                print(f"Inserting meals permission for role: {role}...")
                conn.execute(
                    text("INSERT INTO feature_permissions (role, feature, is_enabled) VALUES (:r, 'meals', 1)"),
                    {"r": role}
                )
        conn.commit()
        print("Database permissions seeded successfully for meals feature!")

if __name__ == "__main__":
    run()
