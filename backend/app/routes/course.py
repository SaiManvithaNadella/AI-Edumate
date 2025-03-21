# backend/app/routes/course.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services import course_outline_gen, content_generator
from app.utils.token_manager import verify_token
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database import schemas  # Import our CRUD functions

router = APIRouter()

class CourseRequest(BaseModel):
    topic: str

class CourseOutlineResponse(BaseModel):
    course_outline: str

@router.post("/outline", response_model=CourseOutlineResponse)
def generate_outline(request: CourseRequest, token: str = Depends(verify_token), db: Session = Depends(get_db)):
    outline = course_outline_gen.generate_course_outline(request.topic)
    if not outline:
        raise HTTPException(status_code=500, detail="Error generating course outline")
    
    # Store the generated course outline in the database using the token (user's email)
    schemas.create_course_outline(db, token, request.topic, outline)
    return {"course_outline": outline}

class ContentRequest(BaseModel):
    course_name: str
    module_name: str
    lesson_name: str

class ContentResponse(BaseModel):
    content: str

@router.post("/content", response_model=ContentResponse)
def generate_content(request: ContentRequest, token: str = Depends(verify_token), db: Session = Depends(get_db)):
    content = content_generator.generate_course_content(request.lesson_name, request.module_name, request.course_name)
    if not content:
        raise HTTPException(status_code=500, detail="Error generating course content")
    
    # Store generated course content in the database
    schemas.create_course_content(db, token, request.course_name, request.module_name, request.lesson_name, content)
    return {"content": content}
