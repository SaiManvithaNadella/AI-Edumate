from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
from backend.database import SessionLocal
from backend.openai_utils import generate_openai_response
from backend.models import ChatHistory

router = APIRouter(prefix="/tutor", tags=["Tutor"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/chat")
def chat(question: str, confidence: str = "", topic: str = "", db: Session = Depends(get_db)):
    """
    Accepts a question from the student along with their confidence and topic (optional), 
    and returns an empathetic, detailed answer.
    Also stores the chat in the database for history.
    """
    # Build the prompt for the tutor:
    prompt = (
        f"You are an empathetic and knowledgeable teacher specialized in {topic or 'this subject'}. "
        f"A student with a confidence level of '{confidence}' asks: \"{question}\". "
        "Provide a detailed, clear, and supportive explanation to help the student understand the concept. "
        "Ensure that your answer is patient, uses simple language, and encourages further inquiry."
    )
    response_text = generate_openai_response(prompt)
    
    # Save the chat in the database
    chat_entry = ChatHistory(
        message=question,
        response=response_text,
        timestamp=datetime.utcnow()
    )
    db.add(chat_entry)
    db.commit()
    db.refresh(chat_entry)
    
    return {"response": response_text, "chat_id": chat_entry.id}
