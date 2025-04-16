import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api';

function Flashcards() {
  const [lessonContents, setLessonContents] = useState([]);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [error, setError] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [view, setView] = useState('courseSelect'); // courseSelect, lessonSelect, flashcards
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const cardRef = useRef(null);
  
  // Group lesson contents by course
  const courses = React.useMemo(() => {
    const courseMap = {};
    
    lessonContents.forEach(content => {
      if (!courseMap[content.course_id]) {
        courseMap[content.course_id] = {
          id: content.course_id,
          name: content.course_name,
          lessons: []
        };
      }
      
      courseMap[content.course_id].lessons.push({
        content_id: content.content_id,
        lesson_id: content.lesson_id,
        lesson_name: content.lesson_name,
        module_name: content.module_name
      });
    });
    
    return Object.values(courseMap);
  }, [lessonContents]);

  useEffect(() => {
    async function fetchContents() {
      try {
        setLoading(true);
        const res = await api.get('/flashcards/contents');
        setLessonContents(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching lesson contents:', err);
        setError('Error loading course content. Please try again later.');
        setLoading(false);
      }
    }
    fetchContents();
  }, []);

  const filteredCourses = courses.filter(course => 
    course.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectCourse = (courseId) => {
    setSelectedCourseId(courseId);
    setView('lessonSelect');
    // Find the selected course
    const selectedCourseData = courses.find(course => course.id === courseId);
    if (selectedCourseData) {
      // If there's only one lesson, select it automatically
      if (selectedCourseData.lessons.length === 1) {
        handleSelectLesson(selectedCourseData.lessons[0].content_id);
      }
    }
  };

  const handleSelectLesson = (contentId) => {
    setSelectedContentId(contentId);
    handleGenerateFlashcards(contentId);
  };

  const handleGenerateFlashcards = async (contentId) => {
    if (!contentId) {
      setError("Please select a lesson.");
      return;
    }
    
    setLoading(true);
    setFlashcards([]);
    
    try {
      const res = await api.post('/flashcards/generate', null, {
        params: { content_id: Number(contentId) }
      });
      
      if (res.data.error) {
        setError(res.data.error);
        setLoading(false);
        return;
      }
      
      const flashcardText = res.data.flashcards || "";
      if (!flashcardText.trim()) {
        setError("No flashcards returned.");
        setLoading(false);
        return;
      }
      
      // Parse the flashcards into question/answer pairs
      const cards = parseFlashcards(flashcardText);
      setFlashcards(cards);
      setCurrentCard(0);
      setFlipped(false);
      setError('');
      setView('flashcards');
    } catch (err) {
      console.error("Error generating flashcards:", err);
      setError("Error generating flashcards.");
    } finally {
      setLoading(false);
    }
  };

  // Helper function to parse flashcards from text
  const parseFlashcards = (text) => {
    // Based on the prompt format, we expect flashcards in the format:
    // Question: <question>
    // Answer: <answer>
    
    // Split the text by "Question:" to get individual flashcards
    const cards = [];
    const cardBlocks = text.split(/Question:/i).filter(block => block.trim() !== '');
    
    cardBlocks.forEach(block => {
      // Split each block by "Answer:" to separate question and answer
      const parts = block.split(/Answer:/i);
      
      if (parts.length >= 2) {
        const question = parts[0].trim();
        const answer = parts.slice(1).join(' ').trim(); // In case there are multiple "Answer:" in the text
        
        cards.push({
          question: question,
          answer: answer
        });
      } else {
        // If no "Answer:" found, use the whole block as question
        cards.push({
          question: block.trim(),
          answer: "No answer provided in the generated content."
        });
      }
    });
    
    return cards;
  };

  // Memoize handler functions to avoid dependency issues
  const handleNext = useCallback(() => {
    if (currentCard < flashcards.length - 1) {
      setFlipped(false);
      setTimeout(() => setCurrentCard(currentCard + 1), 300);
    }
  }, [currentCard, flashcards.length]);

  const handlePrevious = useCallback(() => {
    if (currentCard > 0) {
      setFlipped(false);
      setTimeout(() => setCurrentCard(currentCard - 1), 300);
    }
  }, [currentCard]);

  const handleFlip = useCallback(() => {
    setFlipped(!flipped);
  }, [flipped]);

  const handleBack = () => {
    if (view === 'lessonSelect') {
      setView('courseSelect');
      setSelectedCourseId(null);
    } else if (view === 'flashcards') {
      setView('lessonSelect');
      setFlashcards([]);
    }
  };

  const getLessonsByCourse = (courseId) => {
    return courses.find(course => course.id === courseId)?.lessons || [];
  };

  // Get course name for the current selected content
  const getCourseName = () => {
    const content = lessonContents.find(c => c.content_id === parseInt(selectedContentId));
    return content ? content.course_name : '';
  };

  // Get lesson name for the current selected content
  const getLessonName = () => {
    const content = lessonContents.find(c => c.content_id === parseInt(selectedContentId));
    return content ? content.lesson_name : '';
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentCard, flashcards.length, flipped, view]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Memoize the handleKeyDown function to avoid recreating it on every render
  const handleKeyDown = React.useCallback((e) => {
    if (view === 'flashcards') {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrevious();
      } else if (e.key === ' ') {
        handleFlip();
        e.preventDefault(); // Prevent scrolling with spacebar
      }
    }
  }, [view, handleNext, handlePrevious, handleFlip]);

  const renderCardContent = () => {
    if (flashcards.length === 0) return null;
    
    const card = flashcards[currentCard];
    return flipped ? card.answer : card.question;
  };

  return (
    <div className="flashcards-container">
      <h2>Having a Test?</h2>
      <h2>Prep up with the Flashcards!!</h2>
      {view === 'courseSelect' && (
        <div className="course-selection">
          <div className="search-container">
            <input 
              type="text" 
              placeholder="Search courses..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="course-grid">
            {!loading && filteredCourses.length > 0 ? (
              filteredCourses.map(course => (
                <div 
                  key={course.id} 
                  className="course-card"
                  onClick={() => handleSelectCourse(course.id)}
                >
                  <h3>{course.name}</h3>
                  <p className="course-description">
                    {course.lessons.length} {course.lessons.length === 1 ? 'lesson' : 'lessons'} available
                  </p>
                </div>
              ))
            ) : !loading && (
              <div className="no-results">No courses found. Try a different search term.</div>
            )}
            
            {loading && (
              <div className="loading-spinner">Loading courses...</div>
            )}
          </div>
        </div>
      )}
      
      {view === 'lessonSelect' && (
        <div className="lesson-selection">
          <button onClick={handleBack} className="back-button">
            ← Back to Courses
          </button>
          
          <h3 className="selected-course-title">
            {courses.find(c => c.id === selectedCourseId)?.name || 'Select a Lesson'}
          </h3>
          
          <div className="lesson-grid">
            {!loading && getLessonsByCourse(selectedCourseId).length > 0 ? (
              getLessonsByCourse(selectedCourseId).map(lesson => (
                <div 
                  key={lesson.content_id} 
                  className="lesson-card"
                  onClick={() => handleSelectLesson(lesson.content_id)}
                >
                  <h4>{lesson.lesson_name}</h4>
                  <p className="module-name">{lesson.module_name}</p>
                </div>
              ))
            ) : !loading && (
              <div className="no-results">No lessons available for this course.</div>
            )}
            
            {loading && (
              <div className="loading-spinner">Loading lessons...</div>
            )}
          </div>
        </div>
      )}
      
      {view === 'flashcards' && (
        <div className="flashcards-view">
          <div className="flashcards-header">
            <button onClick={handleBack} className="back-button">
              ← Back to Lessons
            </button>
            <div className="flashcards-info">
              <h3>{getCourseName()}</h3>
              <h4>{getLessonName()}</h4>
              <p>Card {currentCard + 1} of {flashcards.length}</p>
            </div>
            <button 
              className="hint-button" 
              onClick={() => setShowHint(!showHint)}
            >
              {showHint ? 'Hide Hint' : 'Show Hint'}
            </button>
          </div>
          
          {showHint && (
            <div className="hint-box">
              <p>Tip: Use keyboard shortcuts!</p>
              <ul>
                <li>Space - Flip card</li>
                <li>Left arrow - Previous card</li>
                <li>Right arrow - Next card</li>
              </ul>
            </div>
          )}
          
          {loading ? (
            <div className="loading-flashcards">
              <div className="loading-spinner">Generating flashcards...</div>
              <p>This may take a moment as our AI creates custom flashcards for this lesson.</p>
            </div>
          ) : (
            <>
              <div 
                className={`flashcard ${flipped ? 'flipped' : ''}`} 
                onClick={handleFlip}
                ref={cardRef}
              >
                <div className="flashcard-inner">
                  <div className="flashcard-front">
                    <span className="question-label">Question</span>
                    <p>{renderCardContent()}</p>
                    <span className="tap-indicator">Tap to see answer</span>
                  </div>
                  <div className="flashcard-back">
                    <span className="answer-label">Answer</span>
                    <p>{renderCardContent()}</p>
                    <span className="tap-indicator">Tap to return to question</span>
                  </div>
                </div>
              </div>
              
              <div className="flashcards-nav">
                <button 
                  onClick={handlePrevious} 
                  disabled={currentCard === 0}
                  className="nav-button"
                >
                  ← Previous
                </button>
                <div className="progress-dots">
                  {flashcards.map((_, index) => (
                    <span 
                      key={index} 
                      className={`progress-dot ${index === currentCard ? 'active' : ''}`}
                      onClick={() => {
                        setFlipped(false);
                        setTimeout(() => setCurrentCard(index), 300);
                      }}
                    />
                  ))}
                </div>
                <button 
                  onClick={handleNext} 
                  disabled={currentCard === flashcards.length - 1}
                  className="nav-button"
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
      )}
      
      {error && <div className="flashcards-error">{error}</div>}
    </div>
  );
}

export default Flashcards;