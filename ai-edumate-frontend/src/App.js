import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import GenerateCourse from './pages/GenerateCourse';
import GenerateLesson from './pages/GenerateLesson';
import GenerateQuiz from './pages/GenerateQuiz';
import Flashcards from './pages/Flashcards';

function App() {
  return (
    <Router>
      <header className="header">
        <div className="logo">
          <img src="/ai-edumate-logo.png" alt="AI‑Edumate Logo" />
          <div className="name">AI‑Edumate</div>
        </div>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/generate-course">Course</Link>
          <Link to="/generate-lesson">Lesson</Link>
          <Link to="/generate-quiz">Quiz</Link>
          <Link to="/flashcards">Flashcards</Link>
        </nav>
      </header>
      <div className="container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate-course" element={<GenerateCourse />} />
          <Route path="/generate-lesson" element={<GenerateLesson />} />
          <Route path="/generate-quiz" element={<GenerateQuiz />} />
          <Route path="/flashcards" element={<Flashcards />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
