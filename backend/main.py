# main.py
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

load_dotenv()

# Set up OpenAI API client
openai.api_key = os.getenv("OPENAI_API_KEY")  # Set in environment variables for security

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

@app.post("/ai/generate")
async def generate_with_ai(
    request: AIRequest,
    current_user: User = Depends(get_current_user)
):
    # Map the tool type to specific prompts and processing
    try:
        if request.tool_type == "lesson_plan":
            system_message = """You are an expert educational consultant with extensive experience in curriculum development and instructional design. You specialize in creating comprehensive, standards-aligned lesson plans that incorporate differentiated instruction, formative assessments, and research-based teaching strategies. Your lesson plans are detailed enough for any teacher to implement while being flexible enough to adapt to diverse learning needs."""
            
            user_message = f"""
    Create an exceptionally detailed, week-by-week lesson plan with comprehensive daily breakdowns and instructional materials for:

    Subject: {request.parameters.get('subject')}
    Grade Level: {request.parameters.get('grade_level')}
    Topic: {request.parameters.get('topic')}
    Duration: {request.parameters.get('duration')} weeks

    UNIT FRAMEWORK AND FOUNDATIONAL ELEMENTS:
    1. Provide a comprehensive unit overview including:
       - Big Ideas and Enduring Understandings
       - Backwards Design approach showing desired results, assessment evidence, and learning plan
       - Concept map showing relationships between topics across weeks
       - Vertical alignment (how this unit builds on prior learning and prepares for future learning)

    2. Pre-Assessment and Background Knowledge:
       - Diagnostic assessment to determine students' prior knowledge and misconceptions
       - Differentiation strategies based on pre-assessment results
       - Cultural connections to leverage students' backgrounds and experiences

    FOR EACH WEEK, PROVIDE:
    
    1. Detailed Learning Objectives Framework:
       - Content Standards (with specific standard numbers and full descriptions)
       - 21st Century Skills Integration
       - Bloom's Taxonomy Level for each objective
       - Webb's Depth of Knowledge level
       - Language Objectives (for ELL support)
       - Social-Emotional Learning Objectives

    2. Comprehensive Materials List:
       - Physical materials with exact specifications
       - Digital resources with specific URLs and usage instructions
       - Printable materials attached with page counts and copy requirements
       - Alternative materials for resource-limited environments
       - Accessibility aids (screen readers, assistive technology considerations)
       - Material preparation timeline and teacher prep instructions

    3. Daily Minute-by-Minute Lesson Plans:
       Provide a detailed breakdown for each day, including:
       
       a. Pre-Class Setup (10 minutes before):
          - Physical environment arrangement
          - Technology preparation and troubleshooting
          - Material distribution plans
          - Grouping arrangements

       b. Morning Meeting/Bell Work (8-12 minutes):
          - Student entry procedures
          - Engagement activity with clear instructions and expected outputs
          - Visual display of daily learning targets and agenda
          - Social-emotional check-in strategies
          - Connection to real-world applications

       c. Knowledge Activation/Review (10-15 minutes):
          - Multiple ways to activate prior knowledge
          - Interactive review activities (think-pair-share, Kahoot, etc.)
          - Misconception identification and addressing strategies
          - Graphic organizers for knowledge mapping

       d. Direct Instruction with Modeling (18-25 minutes):
          - Step-by-step teacher script with key questions
          - Multiple representation formats (visual, auditory, kinesthetic)
          - Check for understanding questions embedded every 5-7 minutes
          - Error analysis examples with correction strategies
          - Technology integration opportunities
          - Note-taking scaffolds for students

       e. Guided Practice with Gradual Release (25-30 minutes):
          - Detailed cooperative learning structures (roles, rotations, accountability)
          - Differentiated practice activities (3-5 levels)
          - Teacher monitoring checklist
          - Common mistake anticipation guide
          - Real-time assessment strategies
          - Extension activities for early finishers

       f. Independent Practice/Application (20-25 minutes):
          - Choice boards with varying difficulty levels
          - Project-based learning opportunities
          - Digital and analog options
          - Self-assessment rubrics for students
          - Creativity and innovation integration

       g. Comprehensive Formative Assessment:
          - Multiple assessment methods (written, verbal, performance-based)
          - Digital assessment tools (Quizizz, Padlet, etc.)
          - Observation protocols
          - Student conferencing questions
          - Data collection templates
          - Immediate intervention strategies based on assessment results

       h. Powerful Closure (10-12 minutes):
          - Student-led summary strategies
          - Connection to next lesson
          - Reflection protocols (3-2-1, exit tickets, etc.)
          - Homework preview and purpose explanation
          - Clean-up procedures and time management

    4. Research-Based Differentiation Matrix:
       For each activity, provide specific modifications for:
       - Below-grade level learners (scaffolds, modified tasks, visual supports)
       - At-grade level learners (on-level challenges)
       - Above-grade level learners (extensions, leadership roles)
       - English Language Learners (WIDA levels 1-5 supports)
       - Special Education (IEP/504 accommodations catalog)
       - Gifted learners (depth and complexity strategies)
       - Students with attention difficulties (movement breaks, fidgets)
       - Students with processing speed issues (extended time, chunking)

    5. Multi-Faceted Assessment System:
       - Pre-assessment instruments and analysis guides
       - Formative assessment techniques (hourly, daily, weekly)
       - Performance tasks with detailed rubrics
       - Self and peer assessment protocols
       - Portfolio components
       - Data analysis protocols for adjustment
       - Reteaching decision flowchart

    6. Comprehensive Home-School Partnership:
       - Daily communication templates (emails, apps)
       - Weekly newsletter content
       - Parent resource guides in multiple languages
       - Home extension activities aligned to standards
       - Family engagement events and projects
       - Technology support resources for families

    7. Deep Integration Opportunities:
       - Cross-curricular projects with detailed implementation plans
       - Community partnership activities and contact information
       - Field trip or virtual field trip connections
       - Guest speaker suggestions with preparation guides
       - Technology integration with tutorials
       - Cultural competency integration
       - Social justice and equity connections

    8. Reflection, Data Analysis, and Continuous Improvement:
       - Daily teacher reflection templates
       - Student feedback collection methods
       - Data tracking spreadsheets
       - Reteaching plans based on common misconceptions
       - Long-term tracking of student progress
       - Professional development needs identification

    9. Supplementary Materials Section:
       - All worksheets with answer keys
       - PowerPoint/Google Slides presentations
       - Video links with time stamps for relevant segments
       - Interactive digital resources
       - Manipulatives templates
       - Assessment templates and rubrics
       - Parent communication templates

    Format Requirements:
    - Use clear headings and subheadings for easy navigation
    - Include timing breakdowns to the minute
    - Provide both digital and printed format options
    - Include hyperlinks to all digital resources
    - Create copy-and-paste ready sections for communications
    - Ensure all materials are accessible and ADA compliant
    - Include bibliography of educational research supporting methodologies

    The final lesson plan should be comprehensive enough that any substitute teacher could successfully implement it with minimal additional preparation, while also providing enough depth for experienced teachers to adapt and enhance based on their classroom needs.
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

class FlashcardBase(BaseModel):
    title: str
    course_id: Optional[int] = None
    cards: List[Dict[str, str]]

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

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: datetime = datetime.utcnow()

# New endpoints
@app.post("/courses", response_model=CourseResponse)
def create_course(
    course: CourseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Generate personalized course content using AI
    system_message = f"""You are an expert curriculum designer. Create a personalized course 
    on the subject "{course.subject}" tailored for {course.learning_style} learners at 
    {course.difficulty_level} level with a {course.pace} pace."""
    
    user_message = f"""
    Create a comprehensive course structure with modules, lessons, and interactive elements.
    Format the response as a JSON structure with:
    - modules (array of modules)
      - title
      - lessons (array of lessons)
        - title
        - content (primary content)
        - interactive_elements (quizzes, exercises)
        - knowledge_checks (comprehension questions)
    """
    
    try:
        # Check if OpenAI API key is set
        if not openai.api_key:
            raise HTTPException(
                status_code=500,
                detail="OpenAI API key not configured"
            )
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7
        )
        
        course_content = response.choices[0].message.content
        
        # Validate that the response is valid JSON
        try:
            content_json = json.loads(course_content)
        except json.JSONDecodeError:
            # Fallback content if JSON parsing fails
            content_json = {
                "modules": [
                    {
                        "title": f"Introduction to {course.subject}",
                        "lessons": [
                            {
                                "title": "Getting Started",
                                "content": "Welcome to the course!",
                                "interactive_elements": [],
                                "knowledge_checks": []
                            }
                        ]
                    }
                ]
            }
        
        # Convert content to string for database storage
        content_string = json.dumps(content_json)
        
        db_course = models.Course(
            title=course.title,
            subject=course.subject,
            difficulty_level=course.difficulty_level,
            learning_style=course.learning_style,
            pace=course.pace,
            content=content_string,  # Store as string in database
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
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error creating course: {str(e)}"
        )

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
    Create a quiz for the following specifications:
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

@app.post("/tutor/chat")
async def chat_with_tutor(
    message: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Interactive AI tutor endpoint"""
    conversation_id = message.get('conversation_id')
    course_id = message.get('course_id')
    user_message = message.get('content')
    
    # Get or create conversation
    if conversation_id:
        conversation = db.query(models.ChatConversation).filter(
            models.ChatConversation.id == conversation_id,
            models.ChatConversation.user_id == current_user.id
        ).first()
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        messages = json.loads(conversation.messages)
    else:
        messages = []
        conversation = models.ChatConversation(
            user_id=current_user.id,
            course_id=course_id,
            messages=json.dumps(messages)
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)
    
    # Add user message to history
    messages.append({"role": "user", "content": user_message})
    
    # Create system message for AI tutor
    system_message = """You are an empathetic AI tutor. Your role is to:
    1. Answer questions clearly and patiently
    2. Provide encouragement and positive reinforcement
    3. Break down complex concepts into simpler parts
    4. Offer examples and analogies
    5. Guide students to discover answers rather than just giving answers
    Always maintain a friendly, supportive, and teacher-like tone."""
    
    try:
        # Get AI response
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_message},
                *messages  # Include conversation history
            ],
            temperature=0.7
        )
        
        ai_response = response.choices[0].message.content
        
        # Add AI response to history
        messages.append({"role": "assistant", "content": ai_response})
        
        # Update conversation
        conversation.messages = json.dumps(messages)
        db.commit()
        
        return {
            "conversation_id": conversation.id,
            "response": ai_response
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    

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

# Run the application with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)