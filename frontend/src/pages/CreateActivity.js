// src/pages/CreateActivity.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './CreateActivity.css';

const CreateActivity = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    activity_type: 'game',
    description: '',
    duration: '',
    instructions: '',
    useAI: true
  });
  const [materials, setMaterials] = useState(['']);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState(null);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleMaterialChange = (index, value) => {
    const newMaterials = [...materials];
    newMaterials[index] = value;
    setMaterials(newMaterials);
  };
  
  const addMaterial = () => {
    setMaterials([...materials, '']);
  };
  
  const removeMaterial = (index) => {
    const newMaterials = materials.filter((_, i) => i !== index);
    setMaterials(newMaterials);
  };
  
  const generateWithAI = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await api.post('/ai/generate', {
        tool_type: 'activity',
        parameters: {
          activity_type: formData.activity_type,
          subject: formData.subject,
          grade_level: formData.grade_level,
          topic: formData.title,
          duration: formData.duration
        }
      });
      
      setGeneratedContent(response.data.content);
      setIsLoading(false);
    } catch (error) {
      console.error('Error generating content:', error);
      setError('Failed to generate content. Please try again or create manually.');
      setIsLoading(false);
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      setError(null);
      
      // If AI-generated content is to be used
      let instructions = formData.instructions;
      let description = formData.description;
      
      // If AI has generated content and user wants to use it
      if (formData.useAI && generatedContent) {
        // In a real app, we would parse the AI response more intelligently
        // For now, we'll just set it as instructions and keep the user's description
        instructions = generatedContent;
      }
      
      const activityData = {
        title: formData.title,
        activity_type: formData.activity_type,
        description: description,
        duration: formData.duration,
        materials: materials.filter(mat => mat.trim() !== ''),
        instructions: instructions,
        subject: formData.subject,
        grade_level: formData.grade_level
      };
      
      await api.post('/activities', activityData);
      setIsLoading(false);
      navigate('/activities');
    } catch (error) {
      console.error('Error creating activity:', error);
      setError('Failed to save activity. Please try again.');
      setIsLoading(false);
    }
  };
  
  const activityTypes = [
    { value: 'game', label: 'Game' },
    { value: 'discussion', label: 'Discussion' },
    { value: 'group', label: 'Group Work' },
    { value: 'hands-on', label: 'Hands-on' },
    { value: 'interactive', label: 'Interactive' },
    { value: 'outdoor', label: 'Outdoor' },
    { value: 'creative', label: 'Creative' },
    { value: 'reading', label: 'Reading' },
    { value: 'writing', label: 'Writing' },
    { value: 'presentation', label: 'Presentation' },
    { value: 'digital', label: 'Digital' }
  ];
  
  return (
    <div className="create-activity">
      <h2>Create Classroom Activity</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Activity Title</label>
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
            <label htmlFor="activity_type">Activity Type</label>
            <select
              id="activity_type"
              name="activity_type"
              value={formData.activity_type}
              onChange={handleChange}
              required
            >
              {activityTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
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
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="duration">Duration</label>
            <input
              type="text"
              id="duration"
              name="duration"
              placeholder="e.g., 30 minutes, 1 hour"
              value={formData.duration}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="description">Brief Description</label>
          <textarea
            id="description"
            name="description"
            rows="3"
            value={formData.description}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        
        <div className="materials-section">
          <h3>Materials Needed</h3>
          {materials.map((material, index) => (
            <div key={`material-${index}`} className="material-row">
              <input
                type="text"
                value={material}
                onChange={(e) => handleMaterialChange(index, e.target.value)}
                placeholder="Material item"
              />
              <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeMaterial(index)}
                disabled={materials.length === 1}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addMaterial}>
            <i className="fas fa-plus"></i> Add Material
          </button>
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
              Use AI to generate activity instructions
            </label>
            
            {formData.useAI && (
              <button 
                type="button" 
                className="generate-btn"
                onClick={generateWithAI}
                disabled={!formData.title || !formData.activity_type || !formData.duration || isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Activity Instructions'}
              </button>
            )}
          </div>
          
          <div className="content-editor-container">
            <h3>Activity Instructions</h3>
            <p className="helper-text">
              Provide clear, step-by-step instructions for implementing this activity in the classroom.
            </p>
            
            {formData.useAI && generatedContent ? (
              <div className="ai-generated-content">
                <textarea
                  id="instructions"
                  name="instructions"
                  defaultValue={generatedContent}
                  rows="15"
                  onChange={handleChange}
                ></textarea>
              </div>
            ) : (
              <textarea
                id="instructions"
                name="instructions"
                rows="15"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="Enter detailed activity instructions here or use AI to generate them..."
                disabled={formData.useAI && isLoading}
                required
              ></textarea>
            )}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/activities')}>
            Cancel
          </button>
          <button type="submit" className="save-btn" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Activity'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateActivity;