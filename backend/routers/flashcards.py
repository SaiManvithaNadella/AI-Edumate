from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.openai_utils import generate_openai_response
from backend.prompts import flashcard_prompt
from backend import crud, models

router = APIRouter(prefix="/flashcards", tags=["Flashcards"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# GET endpoint to list lesson contents along with course/module/lesson details
@router.get("/contents")
def get_lesson_contents(db: Session = Depends(get_db)):
    """
    Returns a list of lesson content entries joined with their corresponding
    course, module, and lesson details.
    """
    results = (
        db.query(
            models.LessonContent.content_id,
            models.LessonContent.lesson_id,
            models.LessonContent.course_id,
            models.LessonContent.content,
            models.Lesson.lesson_name,
            models.Module.module_name,
            models.Course.course_name
        )
        .join(models.Lesson, models.LessonContent.lesson_id == models.Lesson.lesson_id)
        .join(models.Module, models.Lesson.module_id == models.Module.module_id)
        .join(models.Course, models.Module.course_id == models.Course.course_id)
        .all()
    )

    data = []
    for row in results:
        data.append({
            "content_id": row[0],
            "lesson_id": row[1],
            "course_id": row[2],
            "content": row[3],
            "lesson_name": row[4],
            "module_name": row[5],
            "course_name": row[6]
        })
    return data

# POST endpoint to generate flashcards based on a lesson content id
@router.post("/generate")
def generate_flashcards(content_id: int, db: Session = Depends(get_db)):
    # 1. Get the lesson content row using content_id
    lesson_content_obj = db.query(models.LessonContent).filter(models.LessonContent.content_id == content_id).first()
    if not lesson_content_obj:
        return {"error": "No lesson content found with that ID."}
    
    # 2. Lookup the corresponding lesson
    lesson = db.query(models.Lesson).filter(models.Lesson.lesson_id == lesson_content_obj.lesson_id).first()
    if not lesson:
        return {"error": "Lesson not found for this content."}
    
    # 3. Lookup the module for the lesson
    module = db.query(models.Module).filter(models.Module.module_id == lesson.module_id).first()
    if not module:
        return {"error": "Module not found for this lesson."}
    
    # 4. Lookup the course for the module
    course = db.query(models.Course).filter(models.Course.course_id == module.course_id).first()
    if not course:
        return {"error": "Course not found for this module."}
    
    # 5. Build the flashcard prompt using course/module/lesson details
    prompt = flashcard_prompt.format(
        course_name=course.course_name,
        module_name=module.module_name,
        lesson_name=lesson.lesson_name
    )
    print("DEBUG: Flashcard prompt:", prompt)

    # 6. Generate flashcard content using OpenAI
    flashcard_output = generate_openai_response(prompt)
    print("DEBUG: Flashcard output:", flashcard_output)
    
    if not flashcard_output.strip():
        return {"error": "Flashcard generation returned empty content. Please try again."}
    
    # Optionally: Save flashcards to the database if desired.
    # For now, we return the generated flashcards.
    return {
        "message": "Flashcards generated.",
        "flashcards": flashcard_output
    }
