# backend/app/main.py

from fastapi import FastAPI
from app.routes import auth, tutor, course, quiz, progress
from app.database.connection import engine, Base
from app.database.schemas import User, CourseOutline, CourseContent, Quiz
import uvicorn

# Create all tables (if using SQLAlchemy)
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Integrated Learning System API")

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(tutor.router, prefix="/tutor", tags=["AI Tutor"])
app.include_router(course.router, prefix="/course", tags=["Course Generator"])
app.include_router(quiz.router, prefix="/quiz", tags=["Quiz Generator"])
app.include_router(progress.router, prefix="/progress", tags=["Progress Tracker"])

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
