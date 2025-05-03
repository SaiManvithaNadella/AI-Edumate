// src/pages/CourseCreate.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './CreateCourse.css';

const CourseCreate = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [courseData, setCourseData] = useState({
    title: '',
    subject: '',
    difficulty_level: 'intermediate',
    learning_style: 'visual',
    pace: 'moderate'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCourseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!courseData.title || !courseData.subject) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/courses', courseData);
      
      // Navigate to the new course detail page
      navigate(`/courses/${response.data.id}`);
    } catch (error) {
      console.error('Error creating course:', error);
      setError(error.response?.data?.detail || 'Failed to create course. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="course-create-page">
      <header className="page-header">
        <h2>Create New Course</h2>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="course-create-form-container">
        <form className="course-create-form" onSubmit={handleSubmit}>
          <div className="form-section">
            <h3>Course Details</h3>
            
            <div className="form-group">
              <label htmlFor="title">Course Title*</label>
              <input
                type="text"
                id="title"
                name="title"
                value={courseData.title}
                onChange={handleChange}
                placeholder="Enter a descriptive title for your course"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="subject">Subject*</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={courseData.subject}
                onChange={handleChange}
                placeholder="E.g., Mathematics, Programming, History, etc."
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h3>Learning Preferences</h3>
            
            <div className="form-group">
              <label htmlFor="difficulty_level">Difficulty Level</label>
              <select
                id="difficulty_level"
                name="difficulty_level"
                value={courseData.difficulty_level}
                onChange={handleChange}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
              <div className="form-helper-text">
                Select the appropriate difficulty level for your target audience
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="learning_style">Learning Style</label>
              <select
                id="learning_style"
                name="learning_style"
                value={courseData.learning_style}
                onChange={handleChange}
              >
                <option value="visual">Visual</option>
                <option value="auditory">Auditory</option>
                <option value="reading">Reading/Writing</option>
                <option value="kinesthetic">Kinesthetic</option>
                <option value="multimodal">Multimodal</option>
              </select>
              <div className="form-helper-text">
                Choose the primary learning style this course will cater to
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="pace">Learning Pace</label>
              <select
                id="pace"
                name="pace"
                value={courseData.pace}
                onChange={handleChange}
              >
                <option value="slow">Slow (In-depth)</option>
                <option value="moderate">Moderate</option>
                <option value="fast">Fast (Accelerated)</option>
              </select>
              <div className="form-helper-text">
                Determine how quickly the course progresses through topics
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate('/courses')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> 
                  Generating Course...
                </>
              ) : (
                'Create Course'
              )}
            </button>
          </div>
          
          {isLoading && (
            <div className="generation-notice">
              <i className="fas fa-info-circle"></i>
              <p>We're using AI to generate a personalized course based on your specifications. This may take a minute or two. Please be patient.</p>
            </div>
          )}
        </form>
      </div>
      
      <div className="course-create-info">
        <div className="info-panel">
          <h3>About AI-Generated Courses</h3>
          <p>
            Our platform uses advanced AI to create personalized courses tailored to your specifications.
            The course will include:
          </p>
          <ul>
            <li>Multiple modules with a logical learning progression</li>
            <li>Detailed lesson content formatted for easy reading</li>
            <li>Interactive elements to reinforce learning</li>
            <li>Knowledge checks to test understanding</li>
          </ul>
          <p>
            After creation, you can further customize any aspect of the course through the editor.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CourseCreate;