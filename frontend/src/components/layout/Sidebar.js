// src/components/layout/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-menu">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-tachometer-alt"></i>
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/lesson-plans" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-book"></i>
          <span>Lesson Plans</span>
        </NavLink>
        <NavLink to="/assessments" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-clipboard-check"></i>
          <span>Assessments</span>
        </NavLink>
        <NavLink to="/activities" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-puzzle-piece"></i>
          <span>Activities</span>
        </NavLink>
        <NavLink to="/resources" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-file-alt"></i>
          <span>Resources</span>
        </NavLink>
        <NavLink to="/students" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-users"></i>
          <span>Students</span>
        </NavLink>
        <NavLink to="/courses" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-graduation-cap"></i>
          <span>Courses</span>
        </NavLink>
        <NavLink to="/quizzes" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-question-circle"></i>
          <span>Quizzes</span>
        </NavLink>
        <NavLink to="/flashcards" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-clone"></i>
          <span>Flashcards</span>
        </NavLink>
        <NavLink to="/ai-tutor" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-robot"></i>
          <span>AI Tutor</span>
        </NavLink>
      </div>
      <div className="sidebar-footer">
        <NavLink to="/profile" className={({ isActive }) => isActive ? 'active' : ''}>
          <i className="fas fa-cog"></i>
          <span>Settings</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;