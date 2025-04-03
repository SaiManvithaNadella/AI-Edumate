from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.openai_utils import generate_openai_response
from backend.prompts import course_outline_prompt
from backend import crud, models
from backend.parsers import parse_outline 
import re

router = APIRouter(prefix="/course", tags=["Course"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def parse_outline(raw_outline: str):
    modules = []
    course_name = "Untitled"
    current_module = None

    lines = raw_outline.splitlines()
    for line in lines:
        line = line.strip()

        # Detect course title
        if line.lower().startswith("course title:"):
            course_name = line.split(":", 1)[1].strip()

        # Detect module start
        elif re.match(r"^Module \d+:", line, re.IGNORECASE):
            if current_module:
                modules.append(current_module)
            current_module = {
                "module_name": line,
                "lessons": []
            }

        # Detect lesson with standard identifier
        elif line.startswith("- Lesson:"):
            lesson_name = line.replace("- Lesson:", "").strip()
            if current_module:
                current_module["lessons"].append(lesson_name)

    if current_module:
        modules.append(current_module)

    return course_name, modules

@router.post("/generate-outline")
def generate_outline(topic: str, num_modules: int, db: Session = Depends(get_db)):
    # Generate the course outline using OpenAI
    prompt = course_outline_prompt.format(topic=topic, num_modules=num_modules)
    outline = generate_openai_response(prompt)
    
    # Parse the generated outline (course title, modules and lessons)
    course_name, parsed_modules = parse_outline(outline)
    
    # Store the course and associate it with the logged-in user
    course_obj = crud.create_course(db, {
        "course_name": course_name,
        "title": course_name,
        "overview": outline,
        "outcomes": "Auto-generated",
    })
    
    # Iterate through modules and lessons to store them
    for module in parsed_modules:
        module_obj = crud.create_module(db, {
            "course_id": course_obj.course_id,
            "module_name": module["module_name"]
        })
        for lesson in module["lessons"]:
            crud.create_lesson(db, {
                "module_id": module_obj.module_id,
                "lesson_name": lesson
            })
    
    return {
        "message": "Course outline generated and stored.",
        "course_id": course_obj.course_id,
        "course_name": course_name,
        "outline_text": outline,
        "parsed_modules": parsed_modules
    }

@router.get("/list")
def get_courses(db: Session = Depends(get_db)):
    # Return only the courses created by the logged-in user
    return db.query(models.Course).all()