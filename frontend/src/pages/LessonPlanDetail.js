// src/pages/LessonPlanDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './LessonPlanDetail.css';

const LessonPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lessonPlan, setLessonPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLessonPlan = async () => {
      try {
        const response = await api.get(`/lesson-plans/${id}`);
        setLessonPlan(response.data);
      } catch (error) {
        console.error('Error fetching lesson plan:', error);
        navigate('/lesson-plans'); // Redirect back if error
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonPlan();
  }, [id, navigate]);

  if (isLoading) return <div className="loading">Loading lesson plan...</div>;
  if (!lessonPlan) return <div className="error">Lesson plan not found.</div>;

  return (
    <div className="lesson-plan-detail">
      <h2>{lessonPlan.title}</h2>

      <div className="meta">
        <p><strong>Subject:</strong> {lessonPlan.subject}</p>
        <p><strong>Grade Level:</strong> {lessonPlan.grade_level === 'K' ? 'Kindergarten' : `Grade ${lessonPlan.grade_level}`}</p>
        <p><strong>Duration:</strong> {lessonPlan.duration} hours</p>
      </div>

      <div className="objectives">
        <h3>Objectives</h3>
        <ul>
          {lessonPlan.objectives && lessonPlan.objectives.map((obj, index) => (
            <li key={index}>{obj}</li>
          ))}
        </ul>
      </div>

      <div className="materials">
        <h3>Materials Needed</h3>
        <ul>
          {lessonPlan.materials && lessonPlan.materials.map((mat, index) => (
            <li key={index}>{mat}</li>
          ))}
        </ul>
      </div>

      <div className="content">
        <h3>Lesson Plan Content</h3>
        <div
          className="content-body"
          dangerouslySetInnerHTML={{ __html: lessonPlan.content.replace(/\n/g, '<br/>') }}
        ></div>
      </div>
    </div>
  );
};

export default LessonPlanDetail;
