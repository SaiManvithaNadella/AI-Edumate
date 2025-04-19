// src/pages/Assessments.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './Assessments.css';

const Assessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    type: '',
    subject: '',
    gradeLevel: ''
  });

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/assessments');
        setAssessments(response.data);
        setFilteredAssessments(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching assessments:', error);
        setError('Failed to load assessments. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchAssessments();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = assessments;
    
    // Apply assessment type filter
    if (filters.type) {
      result = result.filter(assessment => assessment.assessment_type === filters.type);
    }
    
    // Apply subject filter
    if (filters.subject) {
      result = result.filter(assessment => assessment.subject === filters.subject);
    }
    
    // Apply grade level filter
    if (filters.gradeLevel) {
      result = result.filter(assessment => assessment.grade_level === filters.gradeLevel);
    }
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(assessment => 
        assessment.title.toLowerCase().includes(searchLower) ||
        assessment.subject.toLowerCase().includes(searchLower) ||
        assessment.content.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredAssessments(result);
  }, [search, filters, assessments]);

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
      type: '',
      subject: '',
      gradeLevel: ''
    });
  };

  const deleteAssessment = async (id) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      try {
        await api.delete(`/assessments/${id}`);
        setAssessments(assessments.filter(assessment => assessment.id !== id));
      } catch (error) {
        console.error('Error deleting assessment:', error);
        alert('Error deleting assessment. Please try again.');
      }
    }
  };

  // Get unique assessment types for filter dropdown
  const assessmentTypes = [...new Set(assessments.map(a => a.assessment_type))];
  
  // Get unique subjects for filter dropdown
  const subjects = [...new Set(assessments.map(a => a.subject))];
  
  // Get unique grade levels for filter dropdown
  const gradeLevels = [...new Set(assessments.map(a => a.grade_level))];

  // Helper function to get a readable assessment type label
  const getAssessmentTypeLabel = (type) => {
    const labels = {
      'quiz': 'Quiz',
      'test': 'Test',
      'exam': 'Exam',
      'rubric': 'Rubric',
      'project': 'Project',
      'performance': 'Performance',
      'formative': 'Formative',
      'summative': 'Summative'
    };
    return labels[type] || type.charAt(0).toUpperCase() + type.slice(1);
  };

  if (isLoading) {
    return <div className="loading">Loading assessments...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="assessments-page">
      <header className="page-header">
        <h2>Assessments</h2>
        <Link to="/assessments/create" className="create-btn">
          <i className="fas fa-plus"></i> Create Assessment
        </Link>
      </header>
      
      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search assessments..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filters">
          <select 
            name="type" 
            value={filters.type} 
            onChange={handleFilterChange}
          >
            <option value="">All Types</option>
            {assessmentTypes.map(type => (
              <option key={type} value={type}>{getAssessmentTypeLabel(type)}</option>
            ))}
          </select>
          
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
      
      {filteredAssessments.length > 0 ? (
        <div className="assessments-grid">
          {filteredAssessments.map(assessment => (
            <div key={assessment.id} className="assessment-card">
              <div className="card-header">
                <h3>{assessment.title}</h3>
                <span className={`assessment-type-badge ${assessment.assessment_type}`}>
                  {getAssessmentTypeLabel(assessment.assessment_type)}
                </span>
              </div>
              
              <div className="card-body">
                <div className="assessment-details">
                  <p>
                    <strong>Subject:</strong> {assessment.subject}
                  </p>
                  <p>
                    <strong>Grade:</strong> {assessment.grade_level === 'K' ? 'Kindergarten' : `Grade ${assessment.grade_level}`}
                  </p>
                </div>
                
                <div className="assessment-preview">
                  <p>{assessment.content.substring(0, 120)}...</p>
                </div>
              </div>
              
              <div className="card-footer">
                <span className="date">
                  Created: {new Date(assessment.created_at).toLocaleDateString()}
                </span>
                
                <div className="actions">
                  <Link to={`/assessments/${assessment.id}`} className="action-btn view-btn">
                    <i className="fas fa-eye"></i>
                  </Link>
                  <Link to={`/assessments/edit/${assessment.id}`} className="action-btn edit-btn">
                    <i className="fas fa-edit"></i>
                  </Link>
                  <button 
                    className="action-btn delete-btn"
                    onClick={() => deleteAssessment(assessment.id)}
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
          <i className="fas fa-clipboard-check"></i>
          <h3>No Assessments Found</h3>
          <p>
            {assessments.length === 0
              ? "You haven't created any assessments yet."
              : "No assessments match your current filters."}
          </p>
          {assessments.length === 0 ? (
            <Link to="/assessments/create" className="btn">
              Create Your First Assessment
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

export default Assessments;