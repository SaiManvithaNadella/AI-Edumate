// src/components/layout/Navbar.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <h1>AI-Edumate</h1>
        </Link>
      </div>
      <div className="navbar-menu">
        <div className="navbar-search">
          <input type="text" placeholder="Search..." />
          <button><i className="fas fa-search"></i></button>
        </div>
        <div className="navbar-user">
          <span>Hey, {user?.name || 'There!'}</span>
          <div className="user-dropdown">
            <button className="dropdown-toggle">
              <i className="fas fa-user-circle"></i>
            </button>
            <div className="dropdown-menu">
              <Link to="/profile">Profile</Link>
              <button onClick={logout}>Logout</button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;