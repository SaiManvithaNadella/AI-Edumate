from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend import models

router = APIRouter(prefix="/lesson-content", tags=["Lesson Content"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/")
def get_lesson_content(lesson_id: int, db: Session = Depends(get_db)):
    return db.query(models.LessonContent).filter(models.LessonContent.lesson_id == lesson_id).first()
