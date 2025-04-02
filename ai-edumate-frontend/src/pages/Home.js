import React from 'react';
import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="home-description">
      <h1>Welcome to AI‑Edumate!</h1>
      <p>
        AI‑Edumate is an innovative platform that leverages AI to automate the creation of educational courses.
        Generate comprehensive course outlines, detailed lesson content, interactive quizzes, and dynamic flashcards.
      </p>
      <Link to="/generate-course" className="button">
        Create Course Outline
      </Link>
    </div>
  );
}

export default Home;
