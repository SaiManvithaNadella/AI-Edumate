// src/pages/CreateLessonPlan.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './CreateLessonPlan.css';

const CreateLessonPlan = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    grade_level: '',
    duration: '',
    topic: '',
    useAI: true
  });
  const [objectives, setObjectives] = useState(['']);
  const [materials, setMaterials] = useState(['']);
  const [generatedContent, setGeneratedContent] = useState('');
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleObjectiveChange = (index, value) => {
    const newObjectives = [...objectives];
    newObjectives[index] = value;
    setObjectives(newObjectives);
  };
  
  const addObjective = () => {
    setObjectives([...objectives, '']);
  };
  
  const removeObjective = (index) => {
    const newObjectives = objectives.filter((_, i) => i !== index);
    setObjectives(newObjectives);
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
      const response = await api.post('/ai/generate', {
        tool_type: 'lesson_plan',
        parameters: {
          subject: formData.subject,
          grade_level: formData.grade_level,
          topic: formData.topic,
          duration: formData.duration
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
      
      const lessonPlanData = {
        title: formData.title,
        subject: formData.subject,
        grade_level: formData.grade_level,
        duration: formData.duration,
        objectives: objectives.filter(obj => obj.trim() !== ''),
        materials: materials.filter(mat => mat.trim() !== ''),
        content: content
      };
      
      await api.post('/lesson-plans', lessonPlanData);
      setIsLoading(false);
      navigate('/lesson-plans');
    } catch (error) {
      console.error('Error creating lesson plan:', error);
      setIsLoading(false);
      alert('Error creating lesson plan. Please try again.');
    }
  };
  
  return (
    <div className="create-lesson-plan">
      <h2>Create Lesson Plan</h2>
      
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
          
          <div className="form-group">
            <label htmlFor="duration">No. of hours</label>
            <input
              type="text"
              id="duration"
              name="duration"
              placeholder="e.g., 3 hours"
              value={formData.duration}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="topic">Topic/Focus</label>
          <input
            type="text"
            id="topic"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="objectives-section">
          <h3>Learning Objectives</h3>
          {objectives.map((objective, index) => (
            <div key={`objective-${index}`} className="objective-row">
              <input
                type="text"
                value={objective}
                onChange={(e) => handleObjectiveChange(index, e.target.value)}
                placeholder="Students will be able to..."
              />
              <button 
                type="button" 
                className="remove-btn"
                onClick={() => removeObjective(index)}
                disabled={objectives.length === 1}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          ))}
          <button type="button" className="add-btn" onClick={addObjective}>
            <i className="fas fa-plus"></i> Add Objective
          </button>
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
              Use AI to generate lesson plan content
            </label>
            
            {formData.useAI && (
              <button 
                type="button" 
                className="generate-btn"
                onClick={generateWithAI}
                disabled={!formData.subject || !formData.grade_level || !formData.topic || isLoading}
              >
                {isLoading ? 'Generating...' : 'Generate Lesson Plan'}
              </button>
            )}
          </div>
          
          <div className="content-editor-container">
            <h3>Lesson Plan Content</h3>
            {formData.useAI && generatedContent ? (
  <div className="ai-generated-content">
    <div 
      id="content-editor" 
      className="content-preview" 
      dangerouslySetInnerHTML={{ __html: generatedContent.replace(/\n/g, '<br/>') }}
    />
  </div>
) : (
  <textarea
    id="content-editor"
    rows="20"
    placeholder="Enter your lesson plan content here or use AI to generate it..."
    disabled={formData.useAI && isLoading}
  ></textarea>
)}
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" className="cancel-btn" onClick={() => navigate('/lesson-plans')}>
            Cancel
          </button>
          <button type="submit" className="save-btn" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Lesson Plan'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateLessonPlan;