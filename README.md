# AI‑Edumate

AI‑Edumate is an AI‑powered platform dedicated to automating and enhancing the creation of educational courses. Leveraging advanced AI techniques, our system generates comprehensive course outlines, engaging lesson content, interactive quizzes, and dynamic flashcards. An integrated AI Tutor Chatbot provides additional support for learners and educators.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Usage](#usage)
- [License](#license)
- [Credits](#credits)

## Features

- **Course Outline Generation:**  
  Generate structured course outlines using OpenAI and store them in a database.
  
- **Lesson Content Generation:**  
  Create detailed lesson content based on course topics and store it for later use.
  
- **Interactive Quiz Generation:**  
  Generate multiple-choice quizzes from lesson content and interactively test knowledge.
  
- **Flashcards:**  
  Automatically generate flashcards for rapid review and study.
  
- **AI Tutor Chatbot:**  
  Chat with an integrated AI tutor that answers questions and provides learning support.

## Tech Stack

### Backend
- **Python** with [FastAPI](https://fastapi.tiangolo.com/)
- **Uvicorn** as the ASGI server
- **SQLAlchemy** for ORM and database interactions
- **OpenAI API** for generating outlines, lesson content, quizzes, and flashcards
- **(Optional)** FAISS for vector search (or dynamic generation)

### Frontend
- **React** with [Create React App](https://create-react-app.dev/)
- **Tailwind CSS** for styling
- **Axios** for making API calls
- **React Router** for navigation

## Project Structure

```plaintext
AI-Edumate/
├── backend/
│   ├── main.py                # FastAPI entrypoint
│   ├── models.py              # SQLAlchemy and Pydantic models
│   ├── database.py            # Database engine and session
│   ├── crud.py                # CRUD operations
│   ├── openai_utils.py        # Wrapper for OpenAI API calls
│   ├── prompts.py             # All system prompts (course, lesson, quiz, flashcards)
│   ├── routers/
│   │   ├── course.py          # Endpoints for course outline generation and listing
│   │   ├── lesson.py          # Endpoints for lesson content generation and listing
│   │   ├── quiz.py            # Endpoints for quiz generation and listing lesson contents for quiz
│   │   └── flashcards.py      # Endpoints for flashcards generation and listing lesson contents for flashcards
│   └── data/                  # Folder containing any data (e.g., PDFs for RAG)
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── ai-edumate-logo.png  # Logo image
│   ├── src/
│   │   ├── pages/             # React pages for each feature
│   │   │   ├── Home.js
│   │   │   ├── GenerateCourse.js
│   │   │   ├── GenerateLesson.js
│   │   │   ├── GenerateQuiz.js
│   │   │   └── Flashcards.js
│   │   ├── App.js             # Main app with left-side navigation
│   │   ├── index.css          # Global CSS (with Tailwind directives)
│   │   └── index.js           # React entry point
│   ├── package.json
│   ├── tailwind.config.js     # Tailwind configuration file
│   └── postcss.config.js      # PostCSS configuration file
└── README.md

Installation

Backend Setup

Navigate to the backend directory:
    cd path/to/AI-Edumate/backend

Create and activate a virtual environment (optional but recommended):
    python -m venv venv
    source venv/bin/activate   # On Windows: venv\Scripts\activate

Install dependencies:
    pip install -r requirements.txt

Set up environment variables:
Create a .env file in the backend directory with:
    OPENAI_API_KEY=your-openai-key
    DATABASE_URL=sqlite:///./ai_edumate.db

Initialize the database:
    Ensure that init_db() is called in main.py or run a separate script to create your tables.

Run the backend:
    ./run.sh   # or use: uvicorn backend.main:app --reload

Frontend Setup

Navigate to the frontend directory:
    cd path/to/AI-Edumate/frontend

Install dependencies:
    npm install

Set up Tailwind CSS:
    Make sure you have created tailwind.config.js and postcss.config.js as described in the project configuration above, and that your src/index.css includes the Tailwind directives.

Start the development server:
    npm start
The app will launch on http://localhost:3000.

Usage

Home Page:
    Displays the AI‑Edumate logo, a bold pink headline, a description of the platform, feature buttons for each functionality, and an AI Tutor Chatbot panel.
Generate Course:
    Create and view course outlines using the backend’s AI generation.
Generate Lesson:
    Create detailed lesson content from your provided topics.
Generate Quiz:
    Generate interactive quizzes based on lesson content.
    The quiz interface allows you to navigate through questions, select answers, and receive feedback.
Flashcards:
    Generate and interact with flashcards for quick review and study.
AI Tutor Chatbot:
    Ask questions on the Home page and get placeholder responses from the AI Tutor (this can be integrated with your chatbot backend later).

License

This project is licensed under the MIT License – see the LICENSE file for details.

Credits

Developed by [Your Name or Organization]
Powered by OpenAI, FastAPI, React, and Tailwind CSS