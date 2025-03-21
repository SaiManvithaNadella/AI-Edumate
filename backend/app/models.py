# backend/app/models.py

from pydantic import BaseModel, EmailStr

# ---------------------------
# User Authentication Models
# ---------------------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True  # For Pydantic V1 (for V2, use from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str


# ---------------------------
# Course Outline Models
# ---------------------------
class CourseOutlineCreate(BaseModel):
    topic: str
    outline: str

class CourseOutlineOut(BaseModel):
    id: int
    user_email: EmailStr
    topic: str
    outline: str

    class Config:
        from_attributes = True


# ---------------------------
# Course Content Models
# ---------------------------
class CourseContentCreate(BaseModel):
    course_name: str
    module_name: str
    lesson_name: str
    content: str

class CourseContentOut(BaseModel):
    id: int
    user_email: EmailStr
    course_name: str
    module_name: str
    lesson_name: str
    content: str

    class Config:
        from_attributes = True


# ---------------------------
# Quiz Models
# ---------------------------
class QuizCreate(BaseModel):
    module_content: str
    quiz: str

class QuizOut(BaseModel):
    id: int
    user_email: EmailStr
    module_content: str
    quiz: str

    class Config:
        from_attributes = True
