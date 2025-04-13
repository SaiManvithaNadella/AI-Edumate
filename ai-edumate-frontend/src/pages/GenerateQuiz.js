import React, { useState, useEffect } from 'react';
import api from '../api';

// Helper function to parse quiz text into structured questions
function parseQuizOutput(quizText) {
  const blocks = quizText.split(/Question\s*\d+:/i).filter(b => b.trim() !== '');
  const questions = [];

  blocks.forEach((block, index) => {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const questionText = lines[0] || `Question ${index + 1}`;
    let options = [];
    let answer = '';
    lines.slice(1).forEach(line => {
      if (/^[ABCD]\./i.test(line)) {
        options.push(line.replace(/^[ABCD]\.\s*/, ''));
      } else if (line.toLowerCase().startsWith("answer:")) {
        answer = line.split(":")[1].trim();
      }
    });
    questions.push({
      question: questionText,
      options,
      correctAnswer: answer.toUpperCase(),
    });
  });

  return questions;
}

function GenerateQuiz() {
  const [lessonContents, setLessonContents] = useState([]);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [quizError, setQuizError] = useState('');

  useEffect(() => {
    async function fetchContents() {
      try {
        const res = await api.get('/quiz/contents');
        setLessonContents(res.data);
      } catch (error) {
        console.error('Error fetching lesson contents:', error);
      }
    }
    fetchContents();
  }, []);

  const handleGenerateQuiz = async (e) => {
    e.preventDefault();
    if (!selectedContentId) {
      alert("Please select a lesson content.");
      return;
    }
    try {
      const res = await api.post('/quiz/generate', null, {
        params: { content_id: Number(selectedContentId) }
      });
      if (res.data.error) {
        setQuizError(res.data.error);
        setQuizQuestions([]);
        return;
      }
      const quizText = res.data.quiz || "";
      if (!quizText.trim()) {
        setQuizError("No quiz content returned.");
        setQuizQuestions([]);
        return;
      }
      const parsedQuestions = parseQuizOutput(quizText);
      if (parsedQuestions.length === 0) {
        setQuizError("Could not parse quiz content.");
      } else {
        setQuizError("");
      }
      setQuizQuestions(parsedQuestions);
      setCurrentQuestionIndex(0);
      setUserAnswer('');
      setFeedback('');
    } catch (error) {
      console.error('Error generating quiz:', error);
      setQuizError("Error generating quiz.");
      setQuizQuestions([]);
    }
  };

  const handleOptionChange = (e) => {
    setUserAnswer(e.target.value);
    setFeedback('');
  };

  const handleCheckAnswer = () => {
    const currentQ = quizQuestions[currentQuestionIndex];
    if (!currentQ) return;
    if (!userAnswer) {
      setFeedback('Please select an answer.');
      return;
    }
    if (userAnswer === currentQ.correctAnswer) {
      setFeedback('Correct!');
    } else {
      setFeedback(`Wrong answer. The correct answer is ${currentQ.correctAnswer}.`);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setUserAnswer('');
      setFeedback('');
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setUserAnswer('');
      setFeedback('');
    }
  };

  const currentQuestion = quizQuestions[currentQuestionIndex];

  return (
    <div className="quiz-container">
      <h2>Generate Quiz</h2>
      <form onSubmit={handleGenerateQuiz}>
        <label>Select Lesson:</label>
        <select
          value={selectedContentId}
          onChange={(e) => setSelectedContentId(e.target.value)}
          required
        >
          <option value="">-- Select a Lesson you wish to take a quiz on..! --</option>
          {lessonContents.map(item => (
            <option key={item.content_id} value={item.content_id}>
              {item.course_name} - {item.lesson_name}
            </option>
          ))}
        </select>
        <button type="submit">Generate Quiz</button>
      </form>
      {quizError && <div className="quiz-error">{quizError}</div>}
      {quizQuestions.length > 0 && !quizError && (
        <div className="quiz-question-container">
          <div className="quiz-question">
            <p>Question {currentQuestionIndex + 1} of {quizQuestions.length}</p>
            <p>{currentQuestion.question}</p>
          </div>
          <div className="quiz-options">
            {currentQuestion.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              return (
                <div key={idx}>
                  <label>
                    <input
                      type="radio"
                      name="quizOption"
                      value={letter}
                      checked={userAnswer === letter}
                      onChange={handleOptionChange}
                    />
                    {letter}. {opt}
                  </label>
                </div>
              );
            })}
          </div>
          <button onClick={handleCheckAnswer}>Check Answer</button>
          {feedback && <div className="quiz-feedback">{feedback}</div>}
          <div className="quiz-navigation">
            <button onClick={handlePrevious} disabled={currentQuestionIndex === 0}>Previous</button>
            <button onClick={handleNext} disabled={currentQuestionIndex === quizQuestions.length - 1}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerateQuiz;
