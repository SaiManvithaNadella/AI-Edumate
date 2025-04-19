// src/pages/Courses.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './Courses.css';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    difficulty_level: '',
    subject: ''
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/courses');
      setCourses(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setError('Failed to load courses');
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
                         course.subject.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = !filters.difficulty_level || course.difficulty_level === filters.difficulty_level;
    const matchesSubject = !filters.subject || course.subject.toLowerCase().includes(filters.subject.toLowerCase());
    
    return matchesSearch && matchesDifficulty && matchesSubject;
  });

  return (
    <div className="courses-page">
      <header className="page-header">
        <h2>My Courses</h2>
        <Link to="/courses/create" className="create-btn">
          <i className="fas fa-plus"></i> Create Course
        </Link>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        
        <div className="filters">
          <select 
            value={filters.difficulty_level} 
            onChange={(e) => setFilters(prev => ({ ...prev, difficulty_level: e.target.value }))}
          >
            <option value="">All Difficulty Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
          
          <input
            type="text"
            placeholder="Filter by subject..."
            value={filters.subject}
            onChange={(e) => setFilters(prev => ({ ...prev, subject: e.target.value }))}
          />
          
          <button 
            className="clear-filters" 
            onClick={() => {
              setSearch('');
              setFilters({ difficulty_level: '', subject: '' });
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading courses...</div>
      ) : filteredCourses.length > 0 ? (
        <div className="courses-grid">
          {filteredCourses.map(course => (
            <Link 
              to={`/courses/${course.id}`} 
              key={course.id} 
              className="course-card"
            >
              <div className="course-header">
                <h3>{course.title}</h3>
                <span className={`difficulty-badge ${course.difficulty_level}`}>
                  {course.difficulty_level}
                </span>
              </div>
              
              <div className="course-meta">
                <p><i className="fas fa-book"></i> {course.subject}</p>
                <p><i className="fas fa-eye"></i> {course.learning_style} learning style</p>
                <p><i className="fas fa-clock"></i> {course.pace} pace</p>
              </div>
              
              <div className="course-footer">
                <span className="date">
                  Created: {new Date(course.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-graduation-cap"></i>
          <h3>No Courses Found</h3>
          <p>
            {courses.length === 0
              ? "You haven't created any courses yet."
              : "No courses match your current filters."}
          </p>
          {courses.length === 0 && (
            <Link to="/courses/create" className="btn">
              Create Your First Course
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default Courses;