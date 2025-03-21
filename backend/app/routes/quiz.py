# backend/app/routes/quiz.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services import quiz_generator
from app.utils.token_manager import verify_token
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database import schemas  # Import our CRUD function

router = APIRouter()

class QuizRequest(BaseModel):
    module_content: str  # Module content provided for quiz generation

class QuizResponse(BaseModel):
    quiz: str

@router.post("/", response_model=QuizResponse)
def generate_quiz(request: QuizRequest, token: str = Depends(verify_token), db: Session = Depends(get_db)):
    quiz_text = quiz_generator.generate_quiz(request.module_content)
    if not quiz_text:
        raise HTTPException(status_code=500, detail="Error generating quiz")
    
    # Store the generated quiz in the database
    schemas.create_quiz(db, token, request.module_content, quiz_text)
    return {"quiz": quiz_text}
