import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Fallback to local SQLite if postgres docker is not physically active
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./phishshield.db")
if "postgres" in DATABASE_URL and os.getenv("FORCE_SQLITE", "true").lower() == "true":
    DATABASE_URL = "sqlite:///./phishshield.db"

# SQLite requires different arguments for threading
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
