# AI-Edumate
# AI Integrated Learning System

This project is an AI-powered educational platform that provides an interactive learning experience through various integrated tools. The application includes:

- **AI-Tutor:** An intelligent chatbot that answers user queries and offers PDF download options.
- **Course Outline Generator:** Generates comprehensive course outlines based on user-specified topics and structured according to Bloom's Taxonomy.
- **Course Content Generator:** Creates detailed lesson content from generated course outlines.
- **Quiz Generator:** Produces 30 multiple-choice questions per module to help reinforce learning.
- **Progress Tracker:** Monitors user progress across lessons, quizzes, and courses.

## Project Structure
my_capstone_project/ ├── README.md # Project overview and instructions ├── requirements.txt # Python dependencies for both frontend and backend ├── Dockerfile # Containerization configuration for deployment ├── .env.example # Example environment variables file ├── backend/ # FastAPI backend code with AI services, routes, and database ├── frontend/ # Streamlit frontend for user interface ├── scripts/ # Helper scripts (e.g., database initialization, server startup) └── docs/ # Project documentation

## Setup Instructions

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your_username/my_capstone_project.git
   cd my_capstone_project

2. **Environment Variables:**
Create a .env file in the project root based on the .env.example file.
Set the required environment variables (e.g., SECRET_KEY, DATABASE_URL).

3. **Install Dependencies:**
pip install -r requirements.txt

4. **Initialize the database:**
python scripts/init_db.py

5. **Run the Backend Server:**
uvicorn backend.app.main:app --reload

6. **Run the frontend:**
streamlit run frontend/streamlit_app.py


