// src/pages/AssessmentDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './AssessmentDetail.css';

const AssessmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await api.get(`/assessments/${id}`);
        setAssessment(response.data);
      } catch (error) {
        console.error('Error fetching assessment:', error);
        navigate('/assessments'); // Go back to main assessments page if error
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssessment();
  }, [id, navigate]);

  if (isLoading) return <div className="loading">Loading assessment...</div>;
  if (!assessment) return <div className="error">Assessment not found.</div>;
  

  return (
    <div className="assessment-detail">
      <h2>{assessment.title}</h2>

      <div className="meta">
        <p><strong>Type:</strong> {assessment.assessment_type}</p>
        <p><strong>Subject:</strong> {assessment.subject}</p>
        <p><strong>Grade:</strong> {assessment.grade_level === 'K' ? 'Kindergarten' : `Grade ${assessment.grade_level}`}</p>
      </div>

      <div className="content">
        <h3>Assessment Content</h3>
        <div
          className="content-body"
          dangerouslySetInnerHTML={{ __html: assessment.content.replace(/\n/g, '<br/>') }}
        ></div>
      </div>
    </div>
  );
};

export default AssessmentDetail;
