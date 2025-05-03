# main.py
import re
from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import validator
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, timedelta
import os
import shutil
import jwt
import bcrypt
from pydantic import BaseModel
import models
from database import SessionLocal, engine, Base
from dotenv import load_dotenv
import openai
import json
import traceback
from transformers import pipeline
from textblob import TextBlob

load_dotenv()

# Set up OpenAI API client
openai.api_key = os.getenv("OPENAI_API_KEY")  # Set in environment variables for security

emotion_classifier = pipeline("text-classification", model="bhadresh-savani/distilbert-base-uncased-emotion")

# Initialize database
Base.metadata.create_all(bind=engine)

# Initialize FastAPI
app = FastAPI(title="AI-Edumate API", 
              description="API for AI-powered teaching assistant platform")

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Update for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# JWT Settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")  # Set in env vars for production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# OAuth2 scheme for authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

@app.on_event("startup")
async def startup_event():
    """Create database tables if they don't exist"""
    Base.metadata.create_all(bind=engine)

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ----- Pydantic Models -----

class UserBase(BaseModel):
    email: str
    name: str
    school: Optional[str] = None
    grade_level: Optional[str] = None
    subjects: Optional[List[str]] = []

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @validator('subjects', pre=True)
    def parse_subjects(cls, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return []
        return value

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LessonPlanBase(BaseModel):
    title: str
    subject: str
    grade_level: str
    duration: str
    objectives: List[str]
    materials: List[str]
    content: str
    
class LessonPlanCreate(LessonPlanBase):
    pass

class LessonPlan(LessonPlanBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        fom_attributes = True
    
    @validator('objectives', 'materials', pre=True)
    def parse_json_lists(cls, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return []
        return value

class AssessmentBase(BaseModel):
    title: str
    assessment_type: str  # quiz, test, project, rubric
    subject: str
    grade_level: str
    content: str

class AssessmentCreate(AssessmentBase):
    pass

class Assessment(AssessmentBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class AIRequest(BaseModel):
    tool_type: str  # lesson_plan, assessment, activity, etc.
    parameters: Dict[str, Any]

# New Pydantic models for ORM entities
class ClassBase(BaseModel):
    name: str
    subject: str
    grade_level: str
    academic_year: str
    description: Optional[str] = None

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: int
    teacher_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class StudentRecordBase(BaseModel):
    student_name: str
    student_id: Optional[str] = None
    notes: Optional[str] = None
    performance_data: Optional[str] = None
    class_id: int

class StudentRecordCreate(StudentRecordBase):
    pass

class StudentRecordResponse(StudentRecordBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ActivityBase(BaseModel):
    title: str
    activity_type: str
    description: Optional[str] = None
    duration: Optional[str] = None
    materials: Optional[str] = None
    instructions: Optional[str] = None
    lesson_plan_id: Optional[int] = None

class ActivityCreate(ActivityBase):
    pass

class ActivityResponse(ActivityBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class ResourceBase(BaseModel):
    filename: str
    file_path: str
    resource_type: str
    description: Optional[str] = None

class ResourceCreate(ResourceBase):
    pass

class ResourceResponse(ResourceBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# ----- Authentication Functions -----

def get_password_hash(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

# ----- API Routes -----

@app.post("/register", response_model=User)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    db_user = models.User(
        email=user.email,
        name=user.name,
        password=hashed_password,
        school=user.school,
        grade_level=user.grade_level,
        subjects=json.dumps(user.subjects) if user.subjects else json.dumps([])
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=User)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/lesson-plans", response_model=LessonPlan)
def create_lesson_plan(
    lesson_plan: LessonPlanCreate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_lesson_plan = models.LessonPlan(
        title=lesson_plan.title,
        subject=lesson_plan.subject,
        grade_level=lesson_plan.grade_level,
        duration=lesson_plan.duration,
        objectives=json.dumps(lesson_plan.objectives),
        materials=json.dumps(lesson_plan.materials),
        content=lesson_plan.content,
        user_id=current_user.id
    )
    db.add(db_lesson_plan)
    db.commit()
    db.refresh(db_lesson_plan)
    return db_lesson_plan

@app.get("/lesson-plans", response_model=List[LessonPlan])
def get_lesson_plans(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    lesson_plans = db.query(models.LessonPlan).filter(
        models.LessonPlan.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return lesson_plans

@app.get("/lesson-plans/{lesson_plan_id}", response_model=LessonPlan)
def get_lesson_plan(
    lesson_plan_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    lesson_plan = db.query(models.LessonPlan).filter(
        models.LessonPlan.id == lesson_plan_id,
        models.LessonPlan.user_id == current_user.id
    ).first()
    if not lesson_plan:
        raise HTTPException(status_code=404, detail="Lesson plan not found")
    return lesson_plan

@app.post("/assessments", response_model=Assessment)
def create_assessment(
    assessment: AssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_assessment = models.Assessment(
        title=assessment.title,
        assessment_type=assessment.assessment_type,
        subject=assessment.subject,
        grade_level=assessment.grade_level,
        content=assessment.content,
        user_id=current_user.id
    )
    db.add(db_assessment)
    db.commit()
    db.refresh(db_assessment)
    return db_assessment

@app.get("/assessments", response_model=List[Assessment])
def get_assessments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    assessments = db.query(models.Assessment).filter(
        models.Assessment.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return assessments

@app.get("/assessments/{assessment_id}", response_model=Assessment)
def get_assessment(
    assessment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    assessment = db.query(models.Assessment).filter(
        models.Assessment.id == assessment_id,
        models.Assessment.user_id == current_user.id
    ).first()
    
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    return assessment

@app.post("/ai/generate")
async def generate_with_ai(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    # Map the tool type to specific prompts and processing
    try:
        if request.tool_type == "lesson_plan":
            system_message = """You are a world-class educational consultant with deep expertise in curriculum design, neurodiversity inclusion, differentiated instruction, and research-based pedagogy. Your mission is to create hour-by-hour lesson plans that maximize learning for ALL students, regardless of background, ability, or learning profile. Your designs are detailed enough for any substitute teacher to deliver flawlessly, yet sophisticated enough for master teachers to expand upon."""
            
            user_message = f"""
   Create an exceptionally detailed **hour-by-hour instructional plan** for:

- **Subject**: {request.parameters.get('subject')}
- **Grade Level**: {request.parameters.get('grade_level')}
- **Topic**: {request.parameters.get('topic')}
- **Total Duration**: {request.parameters.get('duration')} hours

The plan must be **comprehensive, actionable, and inclusive**. Address the following requirements:

---

## 1. Unit Overview:
- **Big Ideas and Enduring Understandings**
- **Essential Questions**
- **Learning Outcomes/Goals**
- **Prior Knowledge Needed**
- **Pre-Assessment Tools** (with sample questions)
- **Vertical Alignment** (how prior and future learning connect)
- **Concept Map** of the flow of topics hour-by-hour

---

## 2. Master List of Topics:
- List ALL major subtopics and concepts to be taught.
- For each topic, specify:
  - Key Knowledge (facts, theories)
  - Key Skills (what students should be able to do)
  - Academic Language/Vocabulary terms to master

---

## 3. Teaching Methodologies and Techniques:
For the entire unit, specify:
- Direct Instruction techniques
- Inquiry-based learning opportunities
- Cooperative learning structures
- Technology integration methods
- Universal Design for Learning (UDL) principles
- Culturally Responsive Teaching strategies
- Specific neurodivergent-friendly approaches (for ADHD, Autism Spectrum, Dyslexia, Dysgraphia)

---

## 4. Hour-by-Hour Lesson Plans:
For EACH HOUR, provide:

- **Learning Objectives**
  - Standard codes (if applicable)
  - Bloom’s Taxonomy and Webb’s DOK level
  - Language objectives (for ELLs)
  - Social-Emotional Learning (SEL) objectives
- **Materials Needed** (physical, digital, printable)
- **Minute-by-Minute Schedule**:
  - Pre-Class Setup (5 minutes)
  - Engagement/Bell Work (5 minutes)
  - Prior Knowledge Activation (10 minutes)
  - Direct Instruction (20 minutes)
  - Guided Practice (10 minutes)
  - Independent Practice (10 minutes)
  - Formative Assessment (5 minutes)
  - Closure/Reflection (5 minutes)

---

## 5. Detailed Differentiation and Neurodivergent Strategies:
For each HOUR, provide:

### a) Activities for:
- **All students**
- **Below-grade level students**
- **On-grade level students**
- **Above-grade level students**
- **English Language Learners** (differentiate by WIDA level if possible)
- **Special Education students** (consider IEP/504 accommodations)
- **Gifted and Talented students**
- **Neurodivergent students**:
  - **ADHD**: Focus breaks, movement integration
  - **Autism Spectrum Disorder**: Visual schedules, clear routines, sensory supports
  - **Dyslexia**: Text-to-speech options, visual organizers
  - **Dysgraphia**: Alternative assignments (oral responses, typing)

### b) For Each Learner Group, Specify:
- Recommended instructional strategies
- Suggested activities
- Scaffolds and supports
- Specific accommodations and modifications

---

## 6. Assessment Systems:
- Diagnostic (pre-assessment)
- Hourly formative assessments
- Summative assessments
- Alternative assessments for neurodivergent students
- Student self-assessments and peer-assessments
- Rubrics for all major performance tasks

---

## 7. Home-School Partnership:
- Sample homework/extension ideas
- Weekly family newsletters (sample content)
- Home-based projects
- Parent communication templates (emails, app messages)

---

## 8. Supplementary Resources Section:
- Worksheets (with answer keys)
- Slide decks
- Interactive simulations/videos (with links)
- Digital accessibility considerations (ADA compliance)
- Bibliography of instructional strategies used

---

## FORMAT REQUIREMENTS:
- Clear headings for each section
- Bullet points for clarity
- Timings broken down minute-by-minute
- Hyperlinks to digital tools
- Ready-to-print or ready-to-copy communication templates
- Substitute-ready design: assumes no prior knowledge needed
- Inclusive language throughout

---

The final lesson plan must reflect:
- Equity
- Accessibility
- Differentiation
- Cultural responsiveness
- Evidence-based best practices
- Student empowerment

Create a plan that is BOTH deeply **structured** and **adaptable** for maximum impact in a real-world classroom.
    """
            
        elif request.tool_type == "assessment":
            system_message = """You are an expert in educational assessment design. 
            Create a comprehensive assessment based on the parameters provided."""
            
            assessment_type = request.parameters.get('assessment_type', 'quiz')
            user_message = f"""
            Create a detailed {assessment_type} with the following specifications:
            Subject: {request.parameters.get('subject')}
            Grade Level: {request.parameters.get('grade_level')}
            Topic: {request.parameters.get('topic')}
            
            Include a variety of question types appropriate for the assessment format and subject.
            Provide an answer key or rubric as applicable.
            Format the assessment in a clear, organized manner.
            """
            
        elif request.tool_type == "activity":
            system_message = """You are an expert in designing engaging classroom activities.
            Create an interactive learning activity based on the parameters provided."""
            
            user_message = f"""
            Create a detailed classroom activity with the following specifications:
            Activity Type: {request.parameters.get('activity_type')}
            Subject: {request.parameters.get('subject')}
            Grade Level: {request.parameters.get('grade_level')}
            Topic: {request.parameters.get('topic')}
            Duration: {request.parameters.get('duration')}
            
            Include:
            1. Clear objective
            2. Materials needed
            3. Step-by-step instructions
            4. Discussion questions or follow-up
            5. Variations or extensions
            
            Format the activity in a clear, organized manner that a teacher can easily follow.
            """
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Tool type '{request.tool_type}' not supported"
            )
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # Use appropriate model
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=2000
        )
        
        # Extract and return the generated content
        return {"content": response.choices[0].message.content}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/upload-resource", response_model=ResourceResponse)
async def upload_resource(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Create directory if it doesn't exist
    user_dir = f"uploads/{current_user.id}"
    os.makedirs(user_dir, exist_ok=True)
    
    # Save file
    file_path = f"{user_dir}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Save resource metadata to database
    db_resource = models.Resource(
        filename=file.filename,
        file_path=file_path,
        resource_type=file.filename.split(".")[-1],
        user_id=current_user.id
    )
    db.add(db_resource)
    db.commit()
    db.refresh(db_resource)
    
    return db_resource

# ----- Class and Student Record Endpoints -----

@app.get("/classes", response_model=List[ClassResponse])
def get_classes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    classes = db.query(models.Class).filter(
        models.Class.teacher_id == current_user.id
    ).offset(skip).limit(limit).all()
    return classes

@app.post("/classes", response_model=ClassResponse)
def create_class(
    class_data: ClassCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_class = models.Class(
        name=class_data.name,
        subject=class_data.subject,
        grade_level=class_data.grade_level,
        academic_year=class_data.academic_year,
        description=class_data.description,
        teacher_id=current_user.id
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@app.get("/classes/{class_id}", response_model=ClassResponse)
def get_class(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_class = db.query(models.Class).filter(
        models.Class.id == class_id,
        models.Class.teacher_id == current_user.id
    ).first()
    
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    return db_class

@app.put("/classes/{class_id}", response_model=ClassResponse)
def update_class(
    class_id: int,
    class_data: ClassBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_class = db.query(models.Class).filter(
        models.Class.id == class_id,
        models.Class.teacher_id == current_user.id
    ).first()
    
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Update fields
    for field, value in class_data.dict().items():
        setattr(db_class, field, value)
    
    db.commit()
    db.refresh(db_class)
    return db_class

@app.delete("/classes/{class_id}")
def delete_class(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_class = db.query(models.Class).filter(
        models.Class.id == class_id,
        models.Class.teacher_id == current_user.id
    ).first()
    
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # First delete all students in this class
    db.query(models.StudentRecord).filter(
        models.StudentRecord.class_id == class_id
    ).delete()
    
    # Then delete the class
    db.delete(db_class)
    db.commit()
    
    return {"message": "Class deleted successfully"}

@app.get("/classes/{class_id}/students", response_model=List[StudentRecordResponse])
def get_class_students(
    class_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    # First verify class belongs to current user
    db_class = db.query(models.Class).filter(
        models.Class.id == class_id,
        models.Class.teacher_id == current_user.id
    ).first()
    
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    students = db.query(models.StudentRecord).filter(
        models.StudentRecord.class_id == class_id
    ).offset(skip).limit(limit).all()
    
    return students

@app.post("/student-records", response_model=StudentRecordResponse)
def create_student_record(
    student_data: StudentRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # First verify class belongs to current user
    db_class = db.query(models.Class).filter(
        models.Class.id == student_data.class_id,
        models.Class.teacher_id == current_user.id
    ).first()
    
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db_student = models.StudentRecord(
        student_name=student_data.student_name,
        student_id=student_data.student_id,
        notes=student_data.notes,
        performance_data=student_data.performance_data,
        class_id=student_data.class_id,
        user_id=current_user.id
    )
    
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@app.get("/student-records/{student_id}", response_model=StudentRecordResponse)
def get_student_record(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(models.StudentRecord).filter(
        models.StudentRecord.id == student_id,
        models.StudentRecord.user_id == current_user.id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
    
    return student

@app.put("/student-records/{student_id}", response_model=StudentRecordResponse)
def update_student_record(
    student_id: int,
    student_data: StudentRecordBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(models.StudentRecord).filter(
        models.StudentRecord.id == student_id,
        models.StudentRecord.user_id == current_user.id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
    
    # If class_id is being updated, verify new class belongs to current user
    if student_data.class_id != student.class_id:
        db_class = db.query(models.Class).filter(
            models.Class.id == student_data.class_id,
            models.Class.teacher_id == current_user.id
        ).first()
        
        if not db_class:
            raise HTTPException(status_code=404, detail="Class not found")
    
    # Update fields
    for field, value in student_data.dict().items():
        setattr(student, field, value)
    
    db.commit()
    db.refresh(student)
    return student

@app.delete("/student-records/{student_id}")
def delete_student_record(
    student_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    student = db.query(models.StudentRecord).filter(
        models.StudentRecord.id == student_id,
        models.StudentRecord.user_id == current_user.id
    ).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student record not found")
    
    db.delete(student)
    db.commit()
    
    return {"message": "Student record deleted successfully"}

# ----- User Profile Endpoints -----

@app.put("/users/{user_id}", response_model=User)
def update_user(
    user_id: int,
    user_data: UserBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Users can only update their own profile
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    update_data = user_data.dict(exclude_unset=True)
    
    # Handle subjects list
    if "subjects" in update_data and isinstance(update_data["subjects"], list):
        # Store as JSON string in database
        update_data["subjects"] = json.dumps(update_data["subjects"])
    
    # Update fields
    for key, value in update_data.items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.put("/users/{user_id}/change-password")
def change_password(
    user_id: int,
    password_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Users can only change their own password
    if user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to change this password")
    
    # Verify current password
    if not verify_password(password_data["current_password"], current_user.password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    hashed_password = get_password_hash(password_data["new_password"])
    
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    db_user.password = hashed_password
    
    db.commit()
    
    return {"message": "Password changed successfully"}

# ----- Activity Endpoints -----

@app.get("/activities", response_model=List[ActivityResponse])
def get_activities(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    activities = db.query(models.Activity).filter(
        models.Activity.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return activities

@app.post("/activities", response_model=ActivityResponse)
def create_activity(
    activity_data: ActivityCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if associated with a lesson plan, and verify it belongs to user
    if activity_data.lesson_plan_id:
        lesson_plan = db.query(models.LessonPlan).filter(
            models.LessonPlan.id == activity_data.lesson_plan_id,
            models.LessonPlan.user_id == current_user.id
        ).first()
        
        if not lesson_plan:
            raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    # Handle materials list if it's a JSON string
    materials = activity_data.materials
    if isinstance(activity_data.materials, list):
        materials = json.dumps(activity_data.materials)
    
    db_activity = models.Activity(
        title=activity_data.title,
        activity_type=activity_data.activity_type,
        description=activity_data.description,
        duration=activity_data.duration,
        materials=materials,
        instructions=activity_data.instructions,
        lesson_plan_id=activity_data.lesson_plan_id,
        user_id=current_user.id
    )
    
    db.add(db_activity)
    db.commit()
    db.refresh(db_activity)
    return db_activity

@app.get("/activities/{activity_id}", response_model=ActivityResponse)
def get_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    activity = db.query(models.Activity).filter(
        models.Activity.id == activity_id,
        models.Activity.user_id == current_user.id
    ).first()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    return activity

@app.put("/activities/{activity_id}", response_model=ActivityResponse)
def update_activity(
    activity_id: int,
    activity_data: ActivityBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    activity = db.query(models.Activity).filter(
        models.Activity.id == activity_id,
        models.Activity.user_id == current_user.id
    ).first()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Check if associated with a lesson plan, and verify it belongs to user
    if activity_data.lesson_plan_id:
        lesson_plan = db.query(models.LessonPlan).filter(
            models.LessonPlan.id == activity_data.lesson_plan_id,
            models.LessonPlan.user_id == current_user.id
        ).first()
        
        if not lesson_plan:
            raise HTTPException(status_code=404, detail="Lesson plan not found")
    
    # Update fields
    update_data = activity_data.dict(exclude_unset=True)
    
    # Handle materials list if it's a list
    if "materials" in update_data and isinstance(update_data["materials"], list):
        update_data["materials"] = json.dumps(update_data["materials"])
    
    for key, value in update_data.items():
        setattr(activity, key, value)
    
    db.commit()
    db.refresh(activity)
    return activity

@app.delete("/activities/{activity_id}")
def delete_activity(
    activity_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    activity = db.query(models.Activity).filter(
        models.Activity.id == activity_id,
        models.Activity.user_id == current_user.id
    ).first()
    
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    db.delete(activity)
    db.commit()
    
    return {"message": "Activity deleted successfully"}

# ----- Resource Management Endpoints -----

@app.get("/resources", response_model=List[ResourceResponse])
def get_resources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100
):
    resources = db.query(models.Resource).filter(
        models.Resource.user_id == current_user.id
    ).offset(skip).limit(limit).all()
    return resources

@app.get("/resources/{resource_id}", response_model=ResourceResponse)
def get_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(models.Resource).filter(
        models.Resource.id == resource_id,
        models.Resource.user_id == current_user.id
    ).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    return resource

@app.put("/resources/{resource_id}", response_model=ResourceResponse)
def update_resource(
    resource_id: int,
    resource_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(models.Resource).filter(
        models.Resource.id == resource_id,
        models.Resource.user_id == current_user.id
    ).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Update fields (only description is meant to be updated)
    if "description" in resource_data:
        resource.description = resource_data["description"]
    
    db.commit()
    db.refresh(resource)
    return resource

@app.delete("/resources/{resource_id}")
def delete_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(models.Resource).filter(
        models.Resource.id == resource_id,
        models.Resource.user_id == current_user.id
    ).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    # Delete the file from the file system
    try:
        os.remove(resource.file_path)
    except OSError:
        # Log the error but continue with deletion from database
        print(f"Error: Could not delete file {resource.file_path}")
    
    # Delete from database
    db.delete(resource)
    db.commit()
    
    return {"message": "Resource deleted successfully"}

# Add these Pydantic models and endpoints to your existing main.py

# Pydantic Models for new features
class CourseBase(BaseModel):
    title: str
    subject: str
    difficulty_level: str
    learning_style: str
    pace: str
    content: Optional[str] = None

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
    

class QuizBase(BaseModel):
    title: str
    course_id: Optional[int] = None
    questions: List[Dict[str, Any]]
    difficulty_level: str
    target_knowledge_gaps: Optional[List[str]] = []

class QuizCreate(QuizBase):
    pass

class QuizResponse(QuizBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @validator('questions', 'target_knowledge_gaps', pre=True)
    def parse_json_fields(cls, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except:
                return []
        return value
    
class Card(BaseModel):
    front: str
    back: str
    tags: List[str]
    difficulty: str

class FlashcardBase(BaseModel):
    title: str
    course_id: Optional[int] = None
    cards: List[Card]

class FlashcardCreate(FlashcardBase):
    pass

class FlashcardResponse(FlashcardBase):
    id: int
    user_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True
    
    @validator('cards', pre=True)
    def parse_cards(cls, value):
        if isinstance(value, str):
            try:
                return json.loads(value)
            except:
                return []
        return value

class ChatRequest(BaseModel):
    user_input: str

class ChatResponse(BaseModel):
    sentiment: str
    response: str


@app.post("/courses", response_model=CourseResponse)
def create_course(
    course: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Check if OpenAI API key is set
        if not openai.api_key:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured"
            )
        
        # Enhanced system message with detailed instructions
        system_message = f"""You are an expert curriculum designer with expertise in creating engaging, structured learning experiences.

Your task is to create a comprehensive, well-structured course on "{course.subject}" tailored specifically for {course.learning_style} learners at a {course.difficulty_level} level with a {course.pace} pace.

The course content must be detailed, informative, and include clear explanations, relevant examples, and engaging interactive elements. Each lesson should have a logical flow and build upon previous knowledge.

The content must be formatted with proper HTML tags for rich rendering. Use <h3>, <p>, <ul>, <li>, <code>, <pre>, <em>, <strong> tags appropriately to enhance readability and visual structure.

Your response must be in valid JSON format with the exact structure specified in the user's message.
"""
        
        # Enhanced user message with specific guidance and examples
        user_message = f"""
Create a comprehensive course titled "{course.title}" with the following specifications:
- Subject: {course.subject}
- Difficulty Level: {course.difficulty_level}
- Learning Style: {course.learning_style}
- Pace: {course.pace}

Return ONLY a valid JSON object with the following structure:

{{
  "modules": [
    {{
      "title": "Module Title",
      "lessons": [
        {{
          "title": "Lesson Title",
          "content": "<p>Detailed HTML-formatted lesson content with rich explanations, examples, and visuals.</p><h3>Section Heading</h3><p>More detailed content...</p>",
          "interactive_elements": "<div class='interactive-exercise'><p>Instructions for the interactive exercise...</p></div>",
          "knowledge_checks": [
            {{
              "type": "multiple_choice",
              "question": "Detailed question text?",
              "options": ["Option A", "Option B", "Option C", "Option D"],
              "correct_answer": "Option A"
            }}
          ]
        }}
      ]
    }}
  ]
}}

Key requirements:

1. Create 10 modules that follow a logical progression
2. Each module should have 5 lessons
3. Each lesson must include:
   - Detailed HTML-formatted content (800+ words) with proper section headings
   - At least one interactive element for practice
   - 3 multiple-choice knowledge check questions

For example, a lesson on "Introduction to Python" might include:
- Content with sections on "What is Python", "Key Features", "Installation Guide"
- Interactive elements with a simple code exercise
- Knowledge checks about Python's features and use cases

DO NOT include any explanatory text before or after the JSON. Return ONLY valid JSON.
"""
        
        # Make the API call with increased max_tokens and adjusted temperature
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # Using a model with larger context
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.5,  # Lower temperature for more structured output
            max_tokens=4000,  # Increased for larger course content
            top_p=0.95,
            frequency_penalty=0,
            presence_penalty=0
        )
        
        # Extract the response content
        course_content = response.choices[0].message.content
        print(f"AI Response: {course_content[:500]}...")  # Log first part of response
        
        # Clean up the response to extract valid JSON
        # First, try direct JSON parsing
        try:
            content_json = json.loads(course_content)
        except json.JSONDecodeError as e:
            print(f"JSON parse error: {e}")
            
            # Try to extract JSON if wrapped in code blocks
            match = re.search(r'```json\s*([\s\S]*?)\s*```', course_content)
            if match:
                try:
                    content_json = json.loads(match.group(1))
                except json.JSONDecodeError as inner_e:
                    print(f"Failed to parse JSON from code block: {inner_e}")
                    # Try to clean up the JSON and retry
                    cleaned_json = match.group(1).strip().replace('\n', '')
                    try:
                        content_json = json.loads(cleaned_json)
                    except json.JSONDecodeError:
                        # Fall back to default structure
                        content_json = create_fallback_content(course)
            else:
                # If no code block, try to find JSON-like content with braces
                try:
                    # Find content between first { and last }
                    json_match = re.search(r'({[\s\S]*})', course_content)
                    if json_match:
                        potential_json = json_match.group(1)
                        content_json = json.loads(potential_json)
                    else:
                        content_json = create_fallback_content(course)
                except:
                    content_json = create_fallback_content(course)
        
        # Validate and enrich the structure if needed
        content_json = validate_course_structure(content_json, course)
        
        # Convert content to string for database storage
        content_string = json.dumps(content_json)
        
        # Create the course in the database
        db_course = models.Course(
            title=course.title,
            subject=course.subject,
            difficulty_level=course.difficulty_level,
            learning_style=course.learning_style,
            pace=course.pace,
            content=content_string,
            user_id=current_user.id
        )
        
        db.add(db_course)
        db.commit()
        db.refresh(db_course)
        
        return db_course
        
    except openai.error.OpenAIError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to generate course content: {str(e)}"
        )
    except Exception as e:
        print(f"Error in course creation: {str(e)}")
        traceback.print_exc()
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating course: {str(e)}"
        )

def create_fallback_content(course):
    """Create a minimal course structure if AI generation fails"""
    return {
        "modules": [
            {
                "title": f"Introduction to {course.subject}",
                "lessons": [
                    {
                        "title": "Getting Started",
                        "content": f"<h3>Welcome to {course.title}</h3><p>This course will introduce you to the fundamentals of {course.subject}. We'll explore key concepts, practical applications, and build your skills progressively.</p><p>This is a placeholder content that will be expanded with more detailed information.</p>",
                        "interactive_elements": "<div class='interactive-exercise'><p>Think about how you might apply {course.subject} in your work or studies. What specific problems could you solve?</p></div>",
                        "knowledge_checks": [
                            {
                                "type": "multiple_choice",
                                "question": f"What is your primary goal for learning {course.subject}?",
                                "options": ["Professional development", "Academic requirement", "Personal interest", "Specific project needs"],
                                "correct_answer": "Personal interest"
                            }
                        ]
                    }
                ]
            }
        ]
    }

def validate_course_structure(content, course):
    """Validate and ensure the course content meets minimum requirements"""
    # Set default if structure is completely wrong
    if not isinstance(content, dict) or "modules" not in content or not isinstance(content["modules"], list):
        return create_fallback_content(course)
    
    # Ensure each module has required fields
    for i, module in enumerate(content["modules"]):
        if "title" not in module or not module["title"]:
            module["title"] = f"Module {i+1}: {course.subject} Topics"
        
        if "lessons" not in module or not isinstance(module["lessons"], list):
            module["lessons"] = [{
                "title": "Introduction",
                "content": f"<h3>Introduction to {module['title']}</h3><p>This is a placeholder lesson for {module['title']}.</p>",
                "interactive_elements": "",
                "knowledge_checks": []
            }]
        
        # Ensure each lesson has required fields
        for j, lesson in enumerate(module["lessons"]):
            if "title" not in lesson or not lesson["title"]:
                lesson["title"] = f"Lesson {j+1}"
            
            if "content" not in lesson or not lesson["content"]:
                lesson["content"] = f"<h3>{lesson['title']}</h3><p>This is placeholder content for {lesson['title']}.</p>"
            
            if "interactive_elements" not in lesson:
                lesson["interactive_elements"] = ""
            
            if "knowledge_checks" not in lesson or not isinstance(lesson["knowledge_checks"], list):
                lesson["knowledge_checks"] = []
    
    return content

# Update your get_courses endpoint to handle JSON parsing if needed
@app.get("/courses/{course_id}", response_model=CourseResponse)
def get_course(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.user_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    return course

@app.post("/quizzes/generate", response_model=QuizResponse)
def generate_quiz(
    quiz_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a quiz based on specific topics or to address knowledge gaps"""
    system_message = """You are an expert in creating educational assessments. 
    Create a quiz that targets specific knowledge gaps and reinforces understanding."""
    
    user_message = f"""
    Create a quiz with 10 questions for the following specifications:
    Subject: {quiz_data.get('subject')}
    Difficulty: {quiz_data.get('difficulty_level')}
    Topics to focus on: {json.dumps(quiz_data.get('topics', []))}
    Knowledge gaps to address: {json.dumps(quiz_data.get('knowledge_gaps', []))}
    
    Return JSON with the following structure:
    {{
        "questions": [
            {{
                "type": "multiple_choice", 
                "question": "...",
                "options": [...],
                "correct_answer": "...",
                "explanation": "..."
            }}
        ]
    }}
    """
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7
        )
        
        quiz_content = json.loads(response.choices[0].message.content)
        
        db_quiz = models.Quiz(
            title=quiz_data.get('title', 'Generated Quiz'),
            course_id=quiz_data.get('course_id'),
            questions=json.dumps(quiz_content['questions']),
            difficulty_level=quiz_data.get('difficulty_level', 'medium'),
            target_knowledge_gaps=json.dumps(quiz_data.get('knowledge_gaps', [])),
            user_id=current_user.id
        )
        db.add(db_quiz)
        db.commit()
        db.refresh(db_quiz)
        return db_quiz
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/flashcards/generate", response_model=FlashcardResponse)
def generate_flashcards(
    data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate flashcards from content or for specific topics"""
    system_message = """You are an expert in creating educational flashcards. 
    Create clear, concise flashcards that help with memorization and understanding."""
    
    content = data.get('content', '')
    topics = data.get('topics', [])
    
    user_message = f"""
    Create flashcards for the following:
    {f"Content: {content}" if content else ""}
    {f"Topics: {json.dumps(topics)}" if topics else ""}
    
    Return JSON with:
    {{
        "cards": [
            {{
                "front": "Question or term",
                "back": "Answer or definition",
                "tags": ["topic1", "topic2"],
                "difficulty": "easy/medium/hard"
            }}
        ]
    }}
    """
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7
        )
        
        flashcard_content = json.loads(response.choices[0].message.content)
        
        db_flashcard_set = models.FlashcardSet(
            title=data.get('title', 'Generated Flashcards'),
            course_id=data.get('course_id'),
            cards=json.dumps(flashcard_content['cards']),
            user_id=current_user.id
        )
        db.add(db_flashcard_set)
        db.commit()
        db.refresh(db_flashcard_set)
        return db_flashcard_set
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def analyze_emotion(text: str) -> str:
    try:
        transformer_result = emotion_classifier(text)[0]
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity

        if transformer_result['score'] > 0.6:
            return transformer_result['label'].lower()
        elif polarity < -0.3:
            return "stressed"
        elif polarity > 0.3:
            return "confident"
        else:
            return "neutral"
    except Exception as e:
        print("Emotion detection error:", e)
        raise HTTPException(status_code=500, detail=f"Emotion detection failed: {e}")

PROMPT_TEMPLATES = {
    "stressed": "You are a kind and patient tutor. Explain slowly, offer encouragement, and make sure the student feels supported. Question: {question}",
    "confident": "You are a challenging tutor. Ask deeper follow-up questions and encourage critical thinking. Question: {question}",
    "disengaged": "You are a fun and energetic tutor. Use analogies, humor, or games to re-engage the student. Question: {question}",
    "curious": "You are an inspiring tutor. Connect the topic to real-world ideas and exploration. Question: {question}",
    "neutral": "You are a helpful tutor. Provide a clear and concise explanation. Question: {question}",
}

async def generate_response(user_input: str, emotion: str) -> str:
    prompt = PROMPT_TEMPLATES.get(emotion, PROMPT_TEMPLATES['neutral']).format(question=user_input)
    try:
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful educational assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        return completion.choices[0].message["content"].strip()
    except Exception as e:
        print("GPT generation error:", e)
        raise HTTPException(status_code=500, detail=f"GPT generation failed: {e}")

# Add these endpoints to your main.py

@app.get("/courses", response_model=List[CourseResponse])
def get_courses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    courses = db.query(models.Course).filter(
        models.Course.user_id == current_user.id
    ).all()
    return courses

@app.get("/quizzes", response_model=List[QuizResponse])
def get_quizzes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    quizzes = db.query(models.Quiz).filter(
        models.Quiz.user_id == current_user.id
    ).all()
    return quizzes

@app.get("/flashcards", response_model=List[FlashcardResponse])
def get_flashcards(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    flashcards = db.query(models.FlashcardSet).filter(
        models.FlashcardSet.user_id == current_user.id
    ).all()
    return flashcards

@app.get("/courses/{course_id}/progress", response_model=Dict)
def get_course_progress(
    course_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if course exists and belongs to user
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.user_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get or create progress record
    progress = db.query(models.CourseProgress).filter(
        models.CourseProgress.course_id == course_id,
        models.CourseProgress.user_id == current_user.id
    ).first()
    
    if not progress:
        # Initialize with empty progress
        progress = models.CourseProgress(
            user_id=current_user.id,
            course_id=course_id,
            progress_percentage=0,
            completed_modules=json.dumps([]),
            current_module="0"
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
    
    # Convert JSON string to list if needed
    completed_modules = progress.completed_modules
    if isinstance(completed_modules, str):
        try:
            completed_modules = json.loads(completed_modules)
        except:
            completed_modules = []
    
    return {
        "completed_modules": completed_modules,
        "current_module": progress.current_module,
        "progress_percentage": progress.progress_percentage
    }
@app.post("/courses/{course_id}/progress", response_model=Dict)
def update_course_progress(
    course_id: int,
    progress_data: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if course exists and belongs to user
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.user_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Get or create progress record
    progress = db.query(models.CourseProgress).filter(
        models.CourseProgress.course_id == course_id,
        models.CourseProgress.user_id == current_user.id
    ).first()
    
    if not progress:
        progress = models.CourseProgress(
            user_id=current_user.id,
            course_id=course_id
        )
        db.add(progress)
    
    # Update progress fields
    if "completed_modules" in progress_data:
        completed_modules = progress_data["completed_modules"]
        progress.completed_modules = json.dumps(completed_modules) if isinstance(completed_modules, list) else completed_modules
    
    if "current_module" in progress_data:
        progress.current_module = str(progress_data["current_module"])
    
    if "progress_percentage" in progress_data:
        progress.progress_percentage = float(progress_data["progress_percentage"])
    
    progress.last_accessed = datetime.utcnow()
    
    db.commit()
    db.refresh(progress)
    
    # Return updated progress
    return {
        "completed_modules": json.loads(progress.completed_modules) if isinstance(progress.completed_modules, str) else progress.completed_modules,
        "current_module": progress.current_module,
        "progress_percentage": progress.progress_percentage
    }
# Run the application with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


from transformers import pipeline
from textblob import TextBlob
from pydantic import BaseModel
from fastapi import HTTPException

# Load OpenAI key from environment
import openai, os
openai.api_key = os.getenv("OPENAI_API_KEY")

# Load HuggingFace model for emotion classification
emotion_classifier = pipeline("text-classification", model="bhadresh-savani/distilbert-base-uncased-emotion")

# Pydantic request/response models
class ChatRequest(BaseModel):
    user_input: str

class ChatResponse(BaseModel):
    sentiment: str
    response: str

# Emotion analysis function
def analyze_emotion(text: str) -> str:
    try:
        transformer_result = emotion_classifier(text)[0]
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity

        if transformer_result['score'] > 0.6:
            return transformer_result['label'].lower()
        elif polarity < -0.3:
            return "stressed"
        elif polarity > 0.3:
            return "confident"
        else:
            return "neutral"
    except Exception as e:
        print("Emotion detection error:", e)
        raise HTTPException(status_code=500, detail=f"Emotion detection failed: {e}")

# Prompt templates
PROMPT_TEMPLATES = {
    "stressed": "You are a kind and patient tutor. Explain slowly, offer encouragement, and make sure the student feels supported. Question: {question}",
    "confident": "You are a challenging tutor. Ask deeper follow-up questions and encourage critical thinking. Question: {question}",
    "disengaged": "You are a fun and energetic tutor. Use analogies, humor, or games to re-engage the student. Question: {question}",
    "curious": "You are an inspiring tutor. Connect the topic to real-world ideas and exploration. Question: {question}",
    "neutral": "You are a helpful tutor. Provide a clear and concise explanation. Question: {question}",
}

# GPT response generator
async def generate_response(user_input: str, emotion: str) -> str:
    prompt = PROMPT_TEMPLATES.get(emotion, PROMPT_TEMPLATES['neutral']).format(question=user_input)
    try:
        completion = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful educational assistant."},
                {"role": "user", "content": prompt}
            ]
        )
        return completion.choices[0].message["content"].strip()
    except Exception as e:
        print("GPT generation error:", e)
        raise HTTPException(status_code=500, detail=f"GPT generation failed: {e}")

# FastAPI endpoint
@app.post("/chat/emotion-aware", response_model=ChatResponse)
async def emotion_aware_chat(req: ChatRequest):
    print(f"Received input: {req.user_input}")
    sentiment = analyze_emotion(req.user_input)
    print(f"Detected sentiment: {sentiment}")
    gpt_response = await generate_response(req.user_input, sentiment)
    print(f"GPT response: {gpt_response}")
    return ChatResponse(sentiment=sentiment, response=gpt_response)

# Run the application with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)