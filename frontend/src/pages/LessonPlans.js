// src/pages/LessonPlans.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './LessonPlans.css';

const LessonPlans = () => {
  const [lessonPlans, setLessonPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    gradeLevel: ''
  });

  const safeParseJSON = (jsonString) => {
    try {
      return typeof jsonString === 'string' ? JSON.parse(jsonString) : jsonString;
    } catch (e) {
      console.error("Error parsing JSON:", e);
      return [];
    }
  };

  useEffect(() => {
    const fetchLessonPlans = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/lesson-plans');

        const processedPlans = response.data.map(plan => ({
          ...plan,
          objectives: safeParseJSON(plan.objectives),
          materials: safeParseJSON(plan.materials)
        }));

        setLessonPlans(processedPlans);
        setFilteredPlans(processedPlans);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching lesson plans:', error);
        setIsLoading(false);
      }
    };

    fetchLessonPlans();
  }, []);

  useEffect(() => {
    let result = lessonPlans;

    if (filters.subject) {
      result = result.filter(plan => plan.subject === filters.subject);
    }

    if (filters.gradeLevel) {
      result = result.filter(plan => plan.grade_level === filters.gradeLevel);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(plan =>
        plan.title.toLowerCase().includes(searchLower) ||
        plan.subject.toLowerCase().includes(searchLower) ||
        plan.content.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPlans(result);
  }, [search, filters, lessonPlans]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setSearch('');
    setFilters({
      subject: '',
      gradeLevel: ''
    });
  };

  const deleteLessonPlan = async (id) => {
    if (window.confirm('Are you sure you want to delete this lesson plan?')) {
      try {
        await api.delete(`/lesson-plans/${id}`);
        setLessonPlans(lessonPlans.filter(plan => plan.id !== id));
      } catch (error) {
        console.error('Error deleting lesson plan:', error);
        alert('Error deleting lesson plan. Please try again.');
      }
    }
  };

  const subjects = [...new Set(lessonPlans.map(plan => plan.subject))];
  const gradeLevels = [...new Set(lessonPlans.map(plan => plan.grade_level))];

  if (isLoading) {
    return <div className="loading">Loading lesson plans...</div>;
  }

  return (
    <div className="lesson-plans-page">
      <header className="page-header">
        <h2>Lesson Plans</h2>
        <Link to="/lesson-plans/create" className="create-btn">
          <i className="fas fa-plus"></i> Create Lesson Plan
        </Link>
      </header>

      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search lesson plans..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filters">
          <select
            name="subject"
            value={filters.subject}
            onChange={handleFilterChange}
          >
            <option value="">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>

          <select
            name="gradeLevel"
            value={filters.gradeLevel}
            onChange={handleFilterChange}
          >
            <option value="">All Grade Levels</option>
            {gradeLevels.map(level => (
              <option key={level} value={level}>
                {level === 'K' ? 'Kindergarten' : `Grade ${level}`}
              </option>
            ))}
          </select>

          <button className="clear-filters" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>

      {filteredPlans.length > 0 ? (
        <div className="lesson-plans-grid">
          {filteredPlans.map(plan => (
            <div key={plan.id} className="lesson-plan-card">
              <div className="card-header">
                <h3>{plan.title}</h3>
                <span className="subject-badge">{plan.subject}</span>
              </div>

              <div className="card-body">
                <div className="plan-details">
                  <p>
                    <strong>Grade:</strong> {plan.grade_level === 'K' ? 'Kindergarten' : `Grade ${plan.grade_level}`}
                  </p>
                  <p><strong>Duration:</strong> {plan.duration}</p>
                </div>

                <div className="objectives">
                  <strong>Objectives:</strong>
                  <ul>
                    {plan.objectives.slice(0, 2).map((obj, index) => (
                      <li key={index}>{obj}</li>
                    ))}
                    {plan.objectives.length > 2 && <li>...</li>}
                  </ul>
                </div>
              </div>

              <div className="card-footer">
                <span className="date">
                  Created: {new Date(plan.created_at).toLocaleDateString()}
                </span>

                <div className="actions">
                  <Link to={`/lesson-plans/${plan.id}`} className="action-btn view-btn">
                    <i className="fas fa-eye"></i>
                  </Link>
                  <Link to={`/lesson-plans/edit/${plan.id}`} className="action-btn edit-btn">
                    <i className="fas fa-edit"></i>
                  </Link>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => deleteLessonPlan(plan.id)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-book"></i>
          <h3>No Lesson Plans Found</h3>
          <p>
            {lessonPlans.length === 0
              ? "You haven't created any lesson plans yet."
              : "No lesson plans match your current filters."}
          </p>
          {lessonPlans.length === 0 ? (
            <Link to="/lesson-plans/create" className="btn">
              Create Your First Lesson Plan
            </Link>
          ) : (
            <button className="btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonPlans;
