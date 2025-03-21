# backend/app/routes/tutor.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services import ai_tutor
from app.utils.token_manager import verify_token

router = APIRouter()

class TutorRequest(BaseModel):
    query: str

class TutorResponse(BaseModel):
    answer: str

@router.post("/ask", response_model=TutorResponse)
def ask_tutor(request: TutorRequest, token: str = Depends(verify_token)):
    # Call the AI tutor service
    answer = ai_tutor.get_answer(request.query)
    if not answer:
        raise HTTPException(status_code=500, detail="Error generating answer")
    return {"answer": answer}
