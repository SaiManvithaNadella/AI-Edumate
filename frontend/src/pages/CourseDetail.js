// src/pages/CourseDetail.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState({
    completed_modules: [],
    current_module: 0,
    progress_percentage: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedModule, setSelectedModule] = useState(null);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showKnowledgeCheck, setShowKnowledgeCheck] = useState(false);
  const [checkAnswers, setCheckAnswers] = useState({});
  const [activeAccordion, setActiveAccordion] = useState([]);

  const fetchCourse = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/courses/${id}`);
      let courseData = response.data;
      
      // Parse JSON content if it's a string
      if (typeof courseData.content === 'string') {
        courseData = {
          ...courseData,
          content: JSON.parse(courseData.content)
        };
      }
      
      setCourse(courseData);
      setIsLoading(false);
      
      // Set first module and lesson as selected by default
      if (courseData.content && courseData.content.modules && courseData.content.modules.length > 0) {
        setSelectedModule(0);
        setSelectedLesson(0);
        
        // Initialize all module accordions as open
        setActiveAccordion(courseData.content.modules.map((_, index) => index));
      }
    } catch (error) {
      console.error('Error fetching course:', error);
      setError('Failed to load course');
      setIsLoading(false);
    }
  }, [id]);

  const fetchProgress = useCallback(async () => {
    try {
      const response = await api.get(`/courses/${id}/progress`);
      setProgress(response.data || {
        completed_modules: [],
        current_module: 0,
        progress_percentage: 0
      });
    } catch (error) {
      console.error('Error fetching progress:', error);
      // Initialize with empty progress if fetch fails
      setProgress({
        completed_modules: [],
        current_module: 0,
        progress_percentage: 0
      });
    }
  }, [id]);

  useEffect(() => {
    fetchCourse();
    fetchProgress();
  }, [fetchCourse, fetchProgress]);

  const updateProgress = async (moduleIndex, lessonIndex, completed) => {
    try {
      // Calculate total lessons for percentage
      const totalLessons = course?.content?.modules?.reduce(
        (acc, module) => acc + module.lessons.length, 0
      ) || 0;
      
      // Build completed_modules array
      let completedModules = [...progress.completed_modules];
      if (completed && !completedModules.includes(`${moduleIndex}-${lessonIndex}`)) {
        completedModules.push(`${moduleIndex}-${lessonIndex}`);
      }
      
      // Calculate percentage
      const progressPercentage = (completedModules.length / totalLessons) * 100;
      
      const newProgress = {
        completed_modules: completedModules,
        current_module: moduleIndex,
        progress_percentage: progressPercentage
      };
      
      await api.post(`/courses/${id}/progress`, newProgress);
      setProgress(newProgress);
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const startLesson = (moduleIndex, lessonIndex) => {
    setSelectedModule(moduleIndex);
    setSelectedLesson(lessonIndex);
    setShowKnowledgeCheck(false);
    setCheckAnswers({});
  };

  const handleKnowledgeCheck = () => {
    setShowKnowledgeCheck(true);
  };

  const submitKnowledgeCheck = () => {
    const moduleIndex = selectedModule;
    const lessonIndex = selectedLesson;
    
    // Mark lesson as completed
    updateProgress(moduleIndex, lessonIndex, true);
    
    // Move to next lesson or module
    const currentModule = course.content.modules[moduleIndex];
    if (lessonIndex < currentModule.lessons.length - 1) {
      // Next lesson in current module
      startLesson(moduleIndex, lessonIndex + 1);
    } else if (moduleIndex < course.content.modules.length - 1) {
      // First lesson in next module
      startLesson(moduleIndex + 1, 0);
    } else {
      // Course completed
      alert('Congratulations! You have completed the course!');
      navigate('/courses');
    }
  };

  const toggleAccordion = (moduleIndex) => {
    if (activeAccordion.includes(moduleIndex)) {
      setActiveAccordion(activeAccordion.filter(index => index !== moduleIndex));
    } else {
      setActiveAccordion([...activeAccordion, moduleIndex]);
    }
  };

  if (isLoading) {
    return <div className="loading">Loading course...</div>;
  }

  if (error || !course) {
    return <div className="error-message">{error || 'Course not found'}</div>;
  }

  const currentModule = selectedModule !== null ? course.content.modules[selectedModule] : null;
  const currentLesson = selectedLesson !== null && currentModule ? 
    currentModule.lessons[selectedLesson] : null;

  return (
    <div className="course-detail-page">
      <header className="course-header">
        <h1>{course.title}</h1>
        <div className="course-meta">
          <span><i className="fas fa-book"></i> {course.subject}</span>
          <span><i className="fas fa-signal"></i> {course.difficulty_level}</span>
          <span><i className="fas fa-eye"></i> {course.learning_style} learning</span>
          <span><i className="fas fa-clock"></i> {course.pace} pace</span>
        </div>
      </header>

      <div className="course-progress">
        <div className="progress-bar">
          <div 
            className="progress" 
            style={{ width: `${progress.progress_percentage || 0}%` }}
          ></div>
        </div>
        <span>{Math.round(progress.progress_percentage || 0)}% Complete</span>
      </div>

      <div className="course-content">
        <div className="course-sidebar">
          <h3>Course Modules</h3>
          {course.content.modules.map((module, moduleIndex) => (
            <div key={moduleIndex} className="module">
              <h4 
                onClick={() => toggleAccordion(moduleIndex)}
                className={selectedModule === moduleIndex ? "active-module" : ""}
              >
                <span className="module-title">{module.title}</span>
                <span className="accordion-icon">
                  {activeAccordion.includes(moduleIndex) ? '−' : '+'}
                </span>
              </h4>
              {activeAccordion.includes(moduleIndex) && (
                <ul className="lessons">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const isCompleted = progress.completed_modules.includes(
                      `${moduleIndex}-${lessonIndex}`
                    );
                    const isActive = selectedModule === moduleIndex && 
                                  selectedLesson === lessonIndex;
                    
                    return (
                      <li 
                        key={lessonIndex}
                        className={`lesson ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                        onClick={() => startLesson(moduleIndex, lessonIndex)}
                      >
                        {isCompleted && <i className="fas fa-check-circle"></i>}
                        {lesson.title}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="course-main">
          {currentLesson ? (
            <div className="lesson-content">
              <h2>{currentLesson.title}</h2>
              
              <div className="lesson-body" 
                   dangerouslySetInnerHTML={{ __html: currentLesson.content }} 
              />
              
              {currentLesson.interactive_elements && (
                <div className="interactive-elements">
                  <h3>Interactive Exercise</h3>
                  <div dangerouslySetInnerHTML={{ 
                    __html: currentLesson.interactive_elements 
                  }} />
                </div>
              )}

              {currentLesson.knowledge_checks && !showKnowledgeCheck && (
                <button 
                  className="check-knowledge-btn"
                  onClick={handleKnowledgeCheck}
                >
                  Check Your Understanding
                </button>
              )}

              {showKnowledgeCheck && currentLesson.knowledge_checks && (
                <div className="knowledge-check">
                  <h3>Knowledge Check</h3>
                  {currentLesson.knowledge_checks.map((check, index) => (
                    <div key={index} className="check-question">
                      <p>{check.question}</p>
                      {check.type === 'multiple_choice' && (
                        <div className="options">
                          {check.options.map((option, optIndex) => (
                            <label key={optIndex}>
                              <input
                                type="radio"
                                name={`question-${index}`}
                                value={option}
                                onChange={(e) => setCheckAnswers(prev => ({
                                  ...prev,
                                  [index]: e.target.value
                                }))}
                              />
                              {option}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <button 
                    className="submit-check-btn"
                    onClick={submitKnowledgeCheck}
                  >
                    Submit and Continue
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="welcome-content">
              <h2>Welcome to {course.title}</h2>
              <p>Select a lesson from the sidebar to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;