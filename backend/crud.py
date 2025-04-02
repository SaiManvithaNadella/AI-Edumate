from sqlalchemy.orm import Session
from backend import models

# Course, Module, Lesson, Content, Quiz CRUD operations

def create_course(db: Session, course_data: dict):
    """
    Create a new course record.
    Expected keys in course_data: course_name, title, overview, outcomes, user_id.
    """
    db_course = models.Course(**course_data)
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    return db_course

def create_module(db: Session, module_data: dict):
    """
    Create a new module record.
    Expected keys in module_data: course_id, module_name.
    """
    db_module = models.Module(**module_data)
    db.add(db_module)
    db.commit()
    db.refresh(db_module)
    return db_module

def create_lesson(db: Session, lesson_data: dict):
    """
    Create a new lesson record.
    Expected keys in lesson_data: module_id, lesson_name.
    """
    db_lesson = models.Lesson(**lesson_data)
    db.add(db_lesson)
    db.commit()
    db.refresh(db_lesson)
    return db_lesson

def create_content(db: Session, content_data: dict):
    """
    Create a new lesson content record.
    Expected keys in content_data: lesson_id, course_id, content.
    """
    db_content = models.LessonContent(**content_data)
    db.add(db_content)
    db.commit()
    db.refresh(db_content)
    return db_content

def create_quiz(db: Session, quiz_data: dict):
    """
    Create a new quiz record.
    Expected keys in quiz_data: lesson_id, questions.
    """
    db_quiz = models.Quiz(**quiz_data)
    db.add(db_quiz)
    db.commit()
    db.refresh(db_quiz)
    return db_quiz

def get_courses(db: Session):
    """
    Return all courses.
    """
    return db.query(models.Course).all()

def get_modules_by_course(db: Session, course_id: int):
    """
    Return all modules for a given course.
    """
    return db.query(models.Module).filter(models.Module.course_id == course_id).all()

def get_lessons_by_module(db: Session, module_id: int):
    """
    Return all lessons for a given module.
    """
    return db.query(models.Lesson).filter(models.Lesson.module_id == module_id).all()

def get_lesson_content(db: Session, lesson_id: int):
    """
    Return the lesson content for a given lesson.
    """
    return db.query(models.LessonContent).filter(models.LessonContent.lesson_id == lesson_id).first()

