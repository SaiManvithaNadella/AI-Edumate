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

