# backend/app/database/schemas.py

from sqlalchemy import Column, Integer, String
from app.database.connection import Base
from sqlalchemy.orm import Session

# ------------------
# Existing User model
# ------------------
class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, email: str, hashed_password: str):
    new_user = User(email=email, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


class CourseOutline(Base):
    __tablename__ = "course_outlines"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True, nullable=False)  # For simplicity, using email
    topic = Column(String, nullable=False)
    outline = Column(String, nullable=False)

def create_course_outline(db: Session, user_email: str, topic: str, outline: str):
    new_outline = CourseOutline(user_email=user_email, topic=topic, outline=outline)
    db.add(new_outline)
    db.commit()
    db.refresh(new_outline)
    return new_outline

class CourseContent(Base):
    __tablename__ = "course_contents"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True, nullable=False)
    course_name = Column(String, nullable=False)
    module_name = Column(String, nullable=False)
    lesson_name = Column(String, nullable=False)
    content = Column(String, nullable=False)

def create_course_content(db: Session, user_email: str, course_name: str, module_name: str, lesson_name: str, content: str):
    new_content = CourseContent(
        user_email=user_email,
        course_name=course_name,
        module_name=module_name,
        lesson_name=lesson_name,
        content=content
    )
    db.add(new_content)
    db.commit()
    db.refresh(new_content)
    return new_content

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, index=True, nullable=False)
    module_content = Column(String, nullable=False)
    quiz = Column(String, nullable=False)

def create_quiz(db: Session, user_email: str, module_content: str, quiz: str):
    new_quiz = Quiz(
        user_email=user_email,
        module_content=module_content,
        quiz=quiz
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)
    return new_quiz
