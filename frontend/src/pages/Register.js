// src/pages/Register.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    school: '',
    grade_level: '',
    subjects: []
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubjectChange = (e) => {
    const { value, checked } = e.target;
    
    if (checked) {
      setFormData({
        ...formData,
        subjects: [...formData.subjects, value]
      });
    } else {
      setFormData({
        ...formData,
        subjects: formData.subjects.filter(subject => subject !== value)
      });
    }
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      // Remove confirmPassword before sending to API
      const { confirmPassword, ...userData } = formData;
      
      await register(userData);
      navigate('/login');
    } catch (error) {
      console.error('Registration error:', error);
      
      if (error.response && error.response.data) {
        setError(error.response.data.detail || 'Registration failed.');
      } else {
        setError('Registration failed. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h2>Create Account</h2>
          <p>Sign up for AI-Edumate</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="school">School Name (Optional)</label>
            <input
              type="text"
              id="school"
              name="school"
              value={formData.school}
              onChange={handleChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="grade_level">Primary Grade Level (Optional)</label>
            <select
              id="grade_level"
              name="grade_level"
              value={formData.grade_level}
              onChange={handleChange}
            >
              <option value="">Select Grade Level</option>
              <option value="K">Kindergarten</option>
              <option value="1">1st Grade</option>
              <option value="2">2nd Grade</option>
              <option value="3">3rd Grade</option>
              <option value="4">4th Grade</option>
              <option value="5">5th Grade</option>
              <option value="6">6th Grade</option>
              <option value="7">7th Grade</option>
              <option value="8">8th Grade</option>
              <option value="9">9th Grade</option>
              <option value="10">10th Grade</option>
              <option value="11">11th Grade</option>
              <option value="12">12th Grade</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Subjects You Want to Learn/Teach</label>
            <div className="subjects-checkboxes">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="subjects"
                  value="Math"
                  checked={formData.subjects.includes('Math')}
                  onChange={handleSubjectChange}
                />
                Math
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="subjects"
                  value="Science"
                  checked={formData.subjects.includes('Science')}
                  onChange={handleSubjectChange}
                />
                Science
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="subjects"
                  value="Social Studies"
                  checked={formData.subjects.includes('Social Studies')}
                  onChange={handleSubjectChange}
                />
                Social Studies
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="subjects"
                  value="English"
                  checked={formData.subjects.includes('English')}
                  onChange={handleSubjectChange}
                />
                English
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="subjects"
                  value="Art"
                  checked={formData.subjects.includes('Art')}
                  onChange={handleSubjectChange}
                />
                Art
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="subjects"
                  value="Music"
                  checked={formData.subjects.includes('Music')}
                  onChange={handleSubjectChange}
                />
                Music
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="subjects"
                  value="Physical Education"
                  checked={formData.subjects.includes('Physical Education')}
                  onChange={handleSubjectChange}
                />
                Physical Education
              </label>
              
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="subjects"
                  value="Computer Science"
                  checked={formData.subjects.includes('Computer Science')}
                  onChange={handleSubjectChange}
                />
                Computer Science
              </label>
            </div>
          </div>
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Register'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Log In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;