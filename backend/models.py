# models.py
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Table, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    password = Column(String)
    school = Column(String, nullable=True)
    grade_level = Column(String, nullable=True)
    subjects = Column(String, nullable=True)  # JSON string of subjects
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    lesson_plans = relationship("LessonPlan", back_populates="user")
    assessments = relationship("Assessment", back_populates="user")
    resources = relationship("Resource", back_populates="user")
    student_records = relationship("StudentRecord", back_populates="user")
    classes = relationship("Class", back_populates="teacher")
    courses = relationship("Course", back_populates="user")
    chat_conversations = relationship("ChatConversation", back_populates="user")
    course_progress = relationship("CourseProgress", back_populates="user")

class LessonPlan(Base):
    __tablename__ = "lesson_plans"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    subject = Column(String)
    grade_level = Column(String)
    duration = Column(String)
    objectives = Column(String)  # JSON string of objectives
    materials = Column(String)   # JSON string of materials
    content = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="lesson_plans")
    activities = relationship("Activity", back_populates="lesson_plan")

class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    assessment_type = Column(String)  # quiz, test, project, rubric
    subject = Column(String)
    grade_level = Column(String)
    content = Column(Text)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="assessments")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    activity_type = Column(String)  # game, discussion, group work, etc.
    description = Column(Text)
    duration = Column(String)
    materials = Column(String)  # JSON string of materials
    instructions = Column(Text)
    lesson_plan_id = Column(Integer, ForeignKey("lesson_plans.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    lesson_plan = relationship("LessonPlan", back_populates="activities")
    user = relationship("User")

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String)
    file_path = Column(String)
    resource_type = Column(String)  # pdf, doc, image, etc.
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="resources")

class Class(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    subject = Column(String)
    grade_level = Column(String)
    academic_year = Column(String)
    description = Column(Text, nullable=True)
    teacher_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    teacher = relationship("User", back_populates="classes")
    students = relationship("StudentRecord", back_populates="class_")

class StudentRecord(Base):
    __tablename__ = "student_records"

    id = Column(Integer, primary_key=True, index=True)
    student_name = Column(String)
    student_id = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    performance_data = Column(Text, nullable=True)  # JSON string of performance data
    class_id = Column(Integer, ForeignKey("classes.id"))
    user_id = Column(Integer, ForeignKey("users.id"))  # teacher who created the record
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    class_ = relationship("Class", back_populates="students")
    user = relationship("User", back_populates="student_records")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    subject = Column(String)
    difficulty_level = Column(String)
    content = Column(Text)  # JSON string of course structure
    learning_style = Column(String)  # Visual, Auditory, Kinesthetic
    pace = Column(String)  # Fast, Medium, Slow
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="courses")
    quizzes = relationship("Quiz", back_populates="course")
    flashcard_sets = relationship("FlashcardSet", back_populates="course")
    student_progress = relationship("CourseProgress", back_populates="course")

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    course_id = Column(Integer, ForeignKey("courses.id"))
    questions = Column(Text)  # JSON string of questions and answers
    difficulty_level = Column(String)
    target_knowledge_gaps = Column(String)  # JSON string of topics to focus on
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="quizzes")
    attempts = relationship("QuizAttempt", back_populates="quiz")

class FlashcardSet(Base):
    __tablename__ = "flashcard_sets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    cards = Column(Text)  # JSON string of flashcards
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    course = relationship("Course", back_populates="flashcard_sets")
    review_history = relationship("FlashcardReview", back_populates="flashcard_set")

class ChatConversation(Base):
    __tablename__ = "chat_conversations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    messages = Column(Text)  # JSON string of chat messages
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="chat_conversations")
    course = relationship("Course")

class CourseProgress(Base):
    __tablename__ = "course_progress"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    progress_percentage = Column(Float, default=0.0)
    completed_modules = Column(String)  # JSON array of completed module IDs
    current_module = Column(String)
    last_accessed = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="course_progress")
    course = relationship("Course", back_populates="student_progress")

# Adding missing models referenced in relationships
class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    score = Column(Float)
    answers = Column(Text)  # JSON string of answers
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    quiz = relationship("Quiz", back_populates="attempts")
    user = relationship("User")

class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"

    id = Column(Integer, primary_key=True, index=True)
    flashcard_set_id = Column(Integer, ForeignKey("flashcard_sets.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    card_index = Column(Integer)
    difficulty_rating = Column(Integer)  # 1-5 scale
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    flashcard_set = relationship("FlashcardSet", back_populates="review_history")
    user = relationship("User")