from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.prompts import lesson_prompt_template
from backend.openai_utils import generate_openai_response
from backend import crud

router = APIRouter(prefix="/lesson", tags=["Lesson"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/generate")
def generate_lesson(course_name: str, module_name: str, lesson_name: str, db: Session = Depends(get_db)):
    # Prepare prompt
    prompt = lesson_prompt_template.format(
        course_name=course_name,
        module_name=module_name,
        lesson_name=lesson_name
    )
    
    # Generate content using OpenAI
    content = generate_openai_response(prompt)
    print("DEBUG: Generated content:", content)  # Debug log

    if not content.strip():
        # If content is empty, return an error message.
        return {"error": "No content returned from OpenAI. Please check your API key, prompt, or try again."}

    # Look up the course
    course = db.query(crud.models.Course).filter(crud.models.Course.course_name == course_name).first()
    if not course:
        return {"error": "Course not found"}

    # Look up the module
    module = db.query(crud.models.Module).filter(
        crud.models.Module.course_id == course.course_id,
        crud.models.Module.module_name == module_name
    ).first()
    if not module:
        return {"error": "Module not found"}

    # Look up the lesson
    lesson = db.query(crud.models.Lesson).filter(
        crud.models.Lesson.module_id == module.module_id,
        crud.models.Lesson.lesson_name == lesson_name
    ).first()
    if not lesson:
        return {"error": "Lesson not found"}

    # Save the generated content into the lesson_content table
    content_data = {
        "lesson_id": lesson.lesson_id,
        "course_id": course.course_id,
        "content": content
    }

    saved_content = crud.create_content(db, content_data)
    print("DEBUG: Saved content:", saved_content)  # Debug log

    return {
        "message": "Lesson content generated and saved.",
        "course_id": course.course_id,
        "lesson_id": lesson.lesson_id,
        "generated_content": content
    }
@router.get("/list")
def get_lessons(module_id: int, db: Session = Depends(get_db)):
    return db.query(crud.models.Lesson).filter(crud.models.Lesson.module_id == module_id).all()
