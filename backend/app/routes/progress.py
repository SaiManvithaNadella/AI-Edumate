# backend/app/routes/progress.py

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from app.services import progress_tracker
from app.utils.token_manager import verify_token

router = APIRouter()

class ProgressUpdateRequest(BaseModel):
    user_email: str
    course_id: int
    module_id: int
    lesson_id: int
    progress: float  # progress as percentage

@router.post("/update")
def update_progress(request: ProgressUpdateRequest, token: str = Depends(verify_token)):
    success = progress_tracker.update_progress(request.user_email, request.course_id, request.module_id, request.lesson_id, request.progress)
    if not success:
        raise HTTPException(status_code=500, detail="Error updating progress")
    return {"message": "Progress updated successfully"}

class ProgressGetRequest(BaseModel):
    user_email: str
    course_id: int

class ProgressResponse(BaseModel):
    progress_data: dict

@router.post("/get", response_model=ProgressResponse)
def get_progress(request: ProgressGetRequest, token: str = Depends(verify_token)):
    progress_data = progress_tracker.get_progress(request.user_email, request.course_id)
    if progress_data is None:
        raise HTTPException(status_code=404, detail="Progress data not found")
    return {"progress_data": progress_data}
