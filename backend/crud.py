from sqlalchemy.orm import Session
from backend import models

def create_course(db: Session, course: dict):
    db_course = models.Course(**course)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def create_module(db: Session, module: dict):
    db_module = models.Module(**module)
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module

def create_lesson(db: Session, lesson: dict):
    db_lesson = models.Lesson(**lesson)
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    return db_lesson

def create_content(db: Session, content: dict):
    db_content = models.LessonContent(**content)
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

def create_quiz(db: Session, quiz_data: dict):
    from backend.models import Quiz
    quiz = Quiz(**quiz_data)
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return quiz


def get_courses(db: Session):
    return db.query(models.Course).all()

def get_modules_by_course(db: Session, course_id: int):
    return db.query(models.Module).filter(models.Module.course_id == course_id).all()

def get_lessons_by_module(db: Session, module_id: int):
    return db.query(models.Lesson).filter(models.Lesson.module_id == module_id).all()

def get_lesson_content(db: Session, lesson_id: int):
    return db.query(models.LessonContent).filter(models.LessonContent.lesson_id == lesson_id).first()
