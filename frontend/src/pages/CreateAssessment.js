// src/pages/CreateAssessment.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './CreateAssessment.css';

const CreateAssessment = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    assessment_type: 'quiz',
    subject: '',
    grade_level: '',
    topic: '',
    useAI: true
  });
  const [generatedContent, setGeneratedContent] = useState('');
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const generateWithAI = async () => {
    try {
      setIsLoading(true);
      const response = await api.post('/ai/generate', {
        tool_type: 'assessment',
        parameters: {
          assessment_type: formData.assessment_type,
          subject: formData.subject,
          grade_level: formData.grade_level,
          topic: formData.topic
        }
      });
      
      setGeneratedContent(response.data.content);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating content:', error);
      setIsLoading(false);
      alert('Error generating content. Please try again.');
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      
      // If AI-generated content is to be used
      let content = generatedContent;
      
      // If manual input is being used or AI hasn't generated yet
      if (!formData.useAI || !content) {
        content = document.getElementById('content-editor').value;
      }
      
      const assessmentData = {
        title: formData.title,
        assessment_type: formData.assessment_type,
        subject: formData.subject,
        grade_level: formData.grade_level,
        content: content
      };
      
      await api.post('/assessments', assessmentData);
      setIsLoading(false);
      navigate('/assessments');
    } catch (error) {
      console.error('Error creating assessment:', error);
      setIsLoading(false);
      alert('Error creating assessment. Please try again.');
    }
  };
  
  return (
    <div className="create-assessment">
      <h2>Create Assessment</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="assessment_type">Assessment Type</label>
            <select
              id="assessment_type"
              name="assessment_type"
              value={formData.assessment_type}
              onChange={handleChange}
              required
            >
              <option value="quiz">Quiz</option>
              <option value="test">Test</option>
              <option value="exam">Exam</option>
              <option value="rubric">Rubric</option>
              <option value="project">Project Assessment</option>
              <option value="performance">Performance Assessment</option>
              <option value="formative">Formative Assessment</option>
              <option value="summative">Summative Assessment</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="subject">Subject</label>
            <select
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
            >
              <option value="">Select Subject</option>
              <option value="Math">Math</option>
              <option value="Science">Science</option>
              <option value="Social Studies">Social Studies</option>
              <option value="English">English</option>
              <option value="Art">Art</option>
              <option value="Music">Music</option>
              <option value="Physical Education">Physical Education</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Foreign Language">Foreign Language</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="grade_level">Grade Level</label>
            <select
              id="grade_level"
              name="grade_level"
              value={formData.grade_level}
              onChange={handleChange}
              required
            >
              <option value="">Select Grade</option>
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
        </div>
        
        <div className="form-group">
          <label htmlFor="topic">Topic/Content Area</label>
          <input
            type="text"
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="ai-section">
          <div className="ai-toggle">
            <label>
              <input
                type="checkbox"
                name="useAI"
                checked={formData.useAI}
                onChange={handleChange}
              />
              Use AI to generate assessment content
            </label>
            
            {formData.useAI && (
              <button 
                type="button" 
                className="generate-btn"
                onClick={generateWithAI}
                disabled={!formData.subject || !formData.grade_level || !formData.topic || isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Assessment'}
              </button>
            )}
          </div>
          
          <div className="content-editor-container">
            <h3>Assessment Content</h3>
            <p className="helper-text">
              {formData.assessment_type === 'quiz' && 'Create a comprehensive quiz with multiple choice, true/false, and short answer questions.'}
              {formData.assessment_type === 'test' && 'Create a complete test with a variety of question types to assess student understanding.'}
              {formData.assessment_type === 'rubric' && 'Create a detailed rubric with categories, criteria, and scoring levels.'}
              {formData.assessment_type === 'project' && 'Create a project assessment with clear guidelines, objectives, and evaluation criteria.'}
            </p>
            
            {formData.useAI && generatedContent ? (
              <div className="ai-generated-content">
                <textarea
                  id="content-editor"
                  defaultValue={generatedContent}
                  rows="20"
                  readOnly={false}
                ></textarea>
              </div>
            ) : (
              <textarea
                id="content-editor"
                rows="20"
                placeholder="Enter your assessment content here or use AI to generate it..."
                disabled={formData.useAI && isLoading}
              ></textarea>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/assessments')}>
            Cancel
          </button>
          <button type="submit" className="save-btn" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Assessment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssessment;