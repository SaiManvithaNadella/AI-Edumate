// src/pages/Quiz.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Quiz.css';

const Quiz = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [quizForm, setQuizForm] = useState({
    title: '',
    subject: '',
    difficulty_level: 'medium',
    topics: '',
    knowledge_gaps: ''
  });
  const [showGenerateForm, setShowGenerateForm] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await api.get('/quizzes');
      setQuizzes(response.data);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setError('Failed to load quizzes');
    }
  };

  const generateQuiz = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setError(null);

    try {
      const data = {
        title: quizForm.title,
        subject: quizForm.subject,
        difficulty_level: quizForm.difficulty_level,
        topics: quizForm.topics ? quizForm.topics.split(',').map(t => t.trim()) : [],
        knowledge_gaps: quizForm.knowledge_gaps ? quizForm.knowledge_gaps.split(',').map(t => t.trim()) : []
      };

      await api.post('/quizzes/generate', data);
      await fetchQuizzes();
      setShowGenerateForm(false);
      resetQuizForm();
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError('Failed to generate quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const resetQuizForm = () => {
    setQuizForm({
      title: '',
      subject: '',
      difficulty_level: 'medium',
      topics: '',
      knowledge_gaps: ''
    });
  };

  const startQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleAnswer = (questionIndex, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionIndex]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    if (!selectedQuiz) return 0;
    let correct = 0;
    selectedQuiz.questions.forEach((question, index) => {
      if (answers[index] === question.correct_answer) {
        correct++;
      }
    });
    return (correct / selectedQuiz.questions.length) * 100;
  };

  return (
    <div className="quiz-page">
      <header className="page-header">
        <h2>Quizzes</h2>
        <button className="create-btn" onClick={() => setShowGenerateForm(true)}>
          <i className="fas fa-plus"></i> Generate Quiz
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {showGenerateForm && (
        <div className="quiz-form-container">
          <form onSubmit={generateQuiz}>
            <h3>Generate Quiz</h3>
            
            <div className="form-group">
              <label htmlFor="title">Quiz Title</label>
              <input
                type="text"
                id="title"
                value={quizForm.title}
                onChange={(e) => setQuizForm(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject</label>
              <input
                type="text"
                id="subject"
                value={quizForm.subject}
                onChange={(e) => setQuizForm(prev => ({ ...prev, subject: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="difficulty_level">Difficulty Level</label>
              <select
                id="difficulty_level"
                value={quizForm.difficulty_level}
                onChange={(e) => setQuizForm(prev => ({ ...prev, difficulty_level: e.target.value }))}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="topics">Topics (comma-separated)</label>
              <input
                type="text"
                id="topics"
                value={quizForm.topics}
                onChange={(e) => setQuizForm(prev => ({ ...prev, topics: e.target.value }))}
                placeholder="e.g., Algebra, Trigonometry, Calculus"
              />
            </div>

            <div className="form-group">
              <label htmlFor="knowledge_gaps">Knowledge Gaps to Address (comma-separated)</label>
              <input
                type="text"
                id="knowledge_gaps"
                value={quizForm.knowledge_gaps}
                onChange={(e) => setQuizForm(prev => ({ ...prev, knowledge_gaps: e.target.value }))}
                placeholder="e.g., Quadratic equations, Function graphs"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => {
                setShowGenerateForm(false);
                resetQuizForm();
              }}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Generate Quiz'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedQuiz && !showResults ? (
        <div className="quiz-container">
          <div className="quiz-progress">
            <span>Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}</span>
            <div className="progress-bar">
              <div 
                className="progress" 
                style={{ width: `${(currentQuestionIndex + 1) / selectedQuiz.questions.length * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="question-container">
            <h3>{selectedQuiz.questions[currentQuestionIndex].question}</h3>
            <div className="options">
              {selectedQuiz.questions[currentQuestionIndex].options.map((option, index) => (
                <button
                  key={index}
                  className={`option ${answers[currentQuestionIndex] === option ? 'selected' : ''}`}
                  onClick={() => handleAnswer(currentQuestionIndex, option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-navigation">
            <button 
              className="next-btn" 
              onClick={nextQuestion}
              disabled={!answers[currentQuestionIndex]}
            >
              {currentQuestionIndex === selectedQuiz.questions.length - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      ) : selectedQuiz && showResults ? (
        <div className="quiz-results">
          <h2>Quiz Results</h2>
          <div className="score">
            <span>Your Score:</span>
            <strong>{calculateScore().toFixed(1)}%</strong>
          </div>

          <div className="review">
            {selectedQuiz.questions.map((question, index) => (
              <div 
                key={index} 
                className={`question-review ${answers[index] === question.correct_answer ? 'correct' : 'incorrect'}`}
              >
                <h4>Question {index + 1}</h4>
                <p>{question.question}</p>
                <p>Your answer: <strong>{answers[index]}</strong></p>
                {answers[index] !== question.correct_answer && (
                  <p>Correct answer: <strong>{question.correct_answer}</strong></p>
                )}
                {question.explanation && (
                  <p className="explanation">Explanation: {question.explanation}</p>
                )}
              </div>
            ))}
          </div>

          <button className="retry-btn" onClick={() => startQuiz(selectedQuiz)}>
            Try Again
          </button>
          <button className="back-btn" onClick={() => setSelectedQuiz(null)}>
            Back to Quiz List
          </button>
        </div>
      ) : (
        <div className="quiz-list">
          <h3>Available Quizzes</h3>
          {quizzes.length > 0 ? (
            <div className="quizzes-grid">
              {quizzes.map(quiz => (
                <div key={quiz.id} className="quiz-card">
                  <h4>{quiz.title}</h4>
                  <span className={`difficulty ${quiz.difficulty_level}`}>
                    {quiz.difficulty_level.charAt(0).toUpperCase() + quiz.difficulty_level.slice(1)}
                  </span>
                  <p>{quiz.questions.length} questions</p>
                  <button onClick={() => startQuiz(quiz)}>Start Quiz</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <i className="fas fa-question-circle"></i>
              <p>No quizzes available. Generate one to get started!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Quiz;