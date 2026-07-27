from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

import pyodbc

# Setup engine with dynamic ODBC driver fallback for Ubuntu 24.04 / Hostinger VPS
db_url = settings.DATABASE_URL
try:
    available_drivers = pyodbc.drivers()
    if available_drivers:
        # If Driver 17 is specified in URL but not installed on host, fallback to Driver 18
        if "ODBC Driver 17 for SQL Server" in db_url and "ODBC Driver 17 for SQL Server" not in available_drivers:
            for drv in ["ODBC Driver 18 for SQL Server", "ODBC Driver 17 for SQL Server", "SQL Server"]:
                if drv in available_drivers:
                    print(f"[Database] Replacing requested ODBC Driver 17 with available host driver '{drv}'")
                    db_url = db_url.replace("ODBC Driver+17+for+SQL+Server", drv.replace(" ", "+"))
                    db_url = db_url.replace("ODBC Driver 17 for SQL Server", drv)
                    break
except Exception as e:
    print(f"[Database] Driver check notice: {e}")

engine = create_engine(
    db_url,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
