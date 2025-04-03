from fastapi import FastAPI
from backend.routers import course, lesson, quiz, flashcards, module, tutor
from fastapi.middleware.cors import CORSMiddleware
from backend.database import init_db


app = FastAPI()

init_db()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(course.router)
app.include_router(lesson.router)
app.include_router(module.router)
app.include_router(quiz.router)
app.include_router(flashcards.router)
app.include_router(tutor.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to AI-Edumate API"}
