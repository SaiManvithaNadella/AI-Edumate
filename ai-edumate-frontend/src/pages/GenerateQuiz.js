import React, { useState, useEffect } from 'react';
import api from '../api';

// Helper function to parse the quiz text into structured questions
function parseQuizOutput(quizText) {
  const blocks = quizText.split(/Question\s*\d+:/i).filter(b => b.trim() !== '');
  const questions = [];

  blocks.forEach((block, index) => {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(Boolean);
    const questionText = lines[0] || `Question ${index + 1}`;
    let options = [];
    let answer = '';
    let optionLines = [];
    let answerLine = '';

    lines.slice(1).forEach(line => {
      if (line.match(/^[ABCD]\.\s/i)) {
        optionLines.push(line);
      } else if (line.toLowerCase().startsWith("answer:")) {
        answerLine = line;
      }
    });

    options = optionLines.map(optLine => optLine.replace(/^[ABCD]\.\s*/i, '').trim());
    if (answerLine) {
      answer = answerLine.split(':')[1]?.trim() || '';
    }

    questions.push({
      question: questionText,
      options,
      correctAnswer: answer.toUpperCase(),
    });
  });

  return questions;
}

function GenerateQuiz() {
  // State for lesson contents (flashcard style dropdown)
  const [lessonContents, setLessonContents] = useState([]);
  const [selectedContentId, setSelectedContentId] = useState('');
  
  // Quiz data state
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [quizError, setQuizError] = useState('');

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const res = await api.get('/quiz/contents');
        setLessonContents(res.data);
      } catch (error) {
        console.error('Error fetching lesson contents:', error);
      }
    };
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
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Generate Quiz</h2>
      <form onSubmit={handleGenerateQuiz} className="mb-6">
        <div>
          <label className="block font-medium">Select Lesson Content:</label>
          <select
            value={selectedContentId}
            onChange={(e) => setSelectedContentId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">-- Select a Lesson --</option>
            {lessonContents.map(item => (
              <option key={item.content_id} value={item.content_id}>
                {item.course_name} - {item.lesson_name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="mt-4 bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition">
          Generate Quiz
        </button>
      </form>
      
      {quizError && (
        <div className="text-red-600 font-semibold mb-4">
          {quizError}
        </div>
      )}

      {quizQuestions.length > 0 && !quizError && (
        <div className="border p-6 rounded">
          <h3 className="text-xl font-bold mb-2">
            Question {currentQuestionIndex + 1} of {quizQuestions.length}
          </h3>
          <p className="mb-4">{currentQuestion.question}</p>
          <div className="space-y-2">
            {currentQuestion.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              return (
                <div key={idx}>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="quizOption"
                      value={letter}
                      checked={userAnswer === letter}
                      onChange={handleOptionChange}
                      className="mr-2"
                    />
                    <span>{letter}. {opt}</span>
                  </label>
                </div>
              );
            })}
          </div>
          <div className="mt-4">
            <button onClick={handleCheckAnswer} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
              Check Answer
            </button>
          </div>
          {feedback && (
            <div className="mt-3 font-semibold">
              {feedback}
            </div>
          )}
          <div className="mt-4 flex justify-between">
            <button onClick={handlePrevious} disabled={currentQuestionIndex === 0} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition">
              Previous
            </button>
            <button onClick={handleNext} disabled={currentQuestionIndex === quizQuestions.length - 1} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default GenerateQuiz;
