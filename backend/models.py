from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from pydantic import BaseModel

Base = declarative_base()

# SQLAlchemy models
class Course(Base):
    __tablename__ = "courses"
    course_id = Column(Integer, primary_key=True, index=True)
    course_name = Column(String)
    title = Column(String)
    overview = Column(Text)
    outcomes = Column(Text)

class Module(Base):
    __tablename__ = "modules"
    module_id = Column(Integer, primary_key=True, index=True)
    module_name = Column(String)
    course_id = Column(Integer, ForeignKey("courses.course_id"))

class Lesson(Base):
    __tablename__ = "lessons"
    lesson_id = Column(Integer, primary_key=True, index=True)
    lesson_name = Column(String)
    module_id = Column(Integer, ForeignKey("modules.module_id"))

class LessonContent(Base):
    __tablename__ = "lesson_content"
    content_id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.lesson_id"))
    course_id = Column(Integer, ForeignKey("courses.course_id"))
    content = Column(Text)

class Quiz(Base):
    __tablename__ = "quizzes"
    quiz_id = Column(Integer, primary_key=True, index=True)
    lesson_id = Column(Integer, ForeignKey("lessons.lesson_id"))
    questions = Column(Text)
