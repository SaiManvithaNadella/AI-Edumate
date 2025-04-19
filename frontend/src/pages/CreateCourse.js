// src/pages/CreateCourse.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './CreateCourse.css';

const CreateCourse = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    difficulty_level: 'beginner',
    learning_style: 'visual',
    pace: 'medium'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/courses', formData);
      navigate('/courses');
    } catch (error) {
      console.error('Error creating course:', error);
      setError('Failed to create course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="create-course">
      <header className="page-header">
        <h2>Create Personalized Course</h2>
      </header>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Course Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="subject">Subject</label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            placeholder="e.g., Mathematics, Physics, Computer Science"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="difficulty_level">Difficulty Level</label>
            <select
              id="difficulty_level"
              name="difficulty_level"
              value={formData.difficulty_level}
              onChange={handleChange}
              required
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="learning_style">Learning Style</label>
            <select
              id="learning_style"
              name="learning_style"
              value={formData.learning_style}
              onChange={handleChange}
              required
            >
              <option value="visual">Visual</option>
              <option value="auditory">Auditory</option>
              <option value="kinesthetic">Kinesthetic</option>
              <option value="reading">Reading/Writing</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pace">Learning Pace</label>
            <select
              id="pace"
              name="pace"
              value={formData.pace}
              onChange={handleChange}
              required
            >
              <option value="slow">Slow</option>
              <option value="medium">Medium</option>
              <option value="fast">Fast</option>
            </select>
          </div>
        </div>

        <div className="form-info">
          <h3>How will this course be created?</h3>
          <p>Based on your preferences, our AI will generate a comprehensive course structure with:</p>
          <ul>
            <li>Customized modules and lessons tailored to your learning style</li>
            <li>Interactive elements appropriate for your difficulty level</li>
            <li>Knowledge checks and assessments based on your pace</li>
            <li>Dynamic content that adapts as you progress</li>
          </ul>
        </div>

        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/courses')}>
            Cancel
          </button>
          <button type="submit" className="save-btn" disabled={isLoading}>
            {isLoading ? 'Creating Course...' : 'Create Course'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateCourse;