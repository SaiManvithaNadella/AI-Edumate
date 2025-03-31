from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.models import Base
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ai_edumate.db")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def init_db():
    Base.metadata.create_all(bind=engine)
