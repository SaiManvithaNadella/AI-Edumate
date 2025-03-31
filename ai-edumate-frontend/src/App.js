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
      <div className="flex min-h-screen bg-black text-white">
        {/* Left Navigation Bar */}
        <div className="w-64 bg-gray-900 p-6">
          <div className="mb-10">
            <img 
              src="/ai-edumate-logo.png" 
              alt="AI‑Edumate Logo" 
              className="w-full"
            />
          </div>
          <nav>
            <ul className="space-y-6">
              <li>
                <Link to="/" className="block text-lg hover:text-pink-500">Home</Link>
              </li>
              <li>
                <Link to="/generate-course" className="block text-lg hover:text-pink-500">Generate Course</Link>
              </li>
              <li>
                <Link to="/generate-lesson" className="block text-lg hover:text-pink-500">Generate Lesson</Link>
              </li>
              <li>
                <Link to="/generate-quiz" className="block text-lg hover:text-pink-500">Generate Quiz</Link>
              </li>
              <li>
                <Link to="/flashcards" className="block text-lg hover:text-pink-500">Flashcards</Link>
              </li>
            </ul>
          </nav>
        </div>
        {/* Main Content Area */}
        <div className="flex-1 p-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/generate-course" element={<GenerateCourse />} />
            <Route path="/generate-lesson" element={<GenerateLesson />} />
            <Route path="/generate-quiz" element={<GenerateQuiz />} />
            <Route path="/flashcards" element={<Flashcards />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
