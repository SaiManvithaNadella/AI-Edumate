from fastapi import APIRouter, Depends, HTTPException
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
def get_lesson_content(
    lesson_id: int = None,
    course_name: str = None,
    module_name: str = None,
    lesson_name: str = None,
    db: Session = Depends(get_db)
):
    from sqlalchemy import func
    # Normalize parameters
    course_name = course_name.strip().lower() if course_name else ""
    module_name = module_name.strip().lower()
    # Insert a space after "module" if missing (for comparison)
    import re
    module_name = re.sub(r"module(\d)", lambda m: "module " + m.group(1), module_name)
    lesson_name = lesson_name.strip().lower() if lesson_name else ""
    
    # If lesson_id is provided, use that.
    if lesson_id is not None:
        content_obj = db.query(models.LessonContent)\
            .filter(models.LessonContent.lesson_id == lesson_id).first()
        return {"content": content_obj.content if content_obj else ""}
    
    # Otherwise, use course_name, module_name, and lesson_name for lookup.
    elif course_name and module_name and lesson_name:
        print("DEBUG: Normalized Query params - course_name:", course_name,
              ", module_name:", module_name, ", lesson_name:", lesson_name)
        lesson = (
            db.query(models.Lesson)
            .join(models.Module, models.Lesson.module_id == models.Module.module_id)
            .join(models.Course, models.Module.course_id == models.Course.course_id)
            .filter(
                func.lower(models.Course.course_name) == course_name,
                func.lower(models.Module.module_name) == module_name,
                func.lower(models.Lesson.lesson_name) == lesson_name
            )
            .first()
        )
        print("DEBUG: Found lesson:", lesson)
        if not lesson:
            return {"content": ""}
        content_obj = db.query(models.LessonContent)\
            .filter(models.LessonContent.lesson_id == lesson.lesson_id).first()
        return {"content": content_obj.content if content_obj else ""}
    
    else:
        raise HTTPException(
            status_code=400,
            detail="Please provide either lesson_id or course_name, module_name, and lesson_name"
        )
@router.get("/count")
def get_lesson_content_count(db: Session = Depends(get_db)):
    """
    Returns the count of records in the lesson_content table.
    Example response: { "count": 42 }
    """
    count = db.query(models.LessonContent).count()
    return {"count": count}