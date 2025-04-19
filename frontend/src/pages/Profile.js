// src/pages/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import './Profile.css';

const Profile = () => {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    school: user?.school || '',
    grade_level: user?.grade_level || '',
    subjects: []
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      // Safe parsing function
      const safeParseJSON = (jsonString) => {
        if (!jsonString) return [];
        
        // If it's already an array, return it
        if (Array.isArray(jsonString)) return jsonString;
        
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(jsonString);
          return Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          // If it's a comma-separated string, split it
          if (typeof jsonString === 'string' && jsonString.includes(',')) {
            return jsonString.split(',').map(item => item.trim());
          }
          // If it's a simple string, return it as a single-item array
          if (typeof jsonString === 'string' && jsonString.trim()) {
            return [jsonString.trim()];
          }
          return [];
        }
      };
    
      // Update profile data with parsed subjects
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        school: user.school || '',
        grade_level: user.grade_level || '',
        subjects: safeParseJSON(user.subjects)
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value, checked } = e.target;
    
    if (name === 'subjects') {
      // Handle checkboxes for subjects
      if (checked) {
        setProfileData(prev => ({
          ...prev,
          subjects: [...prev.subjects, value]
        }));
      } else {
        setProfileData(prev => ({
          ...prev,
          subjects: prev.subjects.filter(subject => subject !== value)
        }));
      }
    } else {
      // Handle other form fields
      setProfileData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setError(null);
    setSuccess(null);
  };

  const toggleChangePassword = () => {
    setIsChangingPassword(!isChangingPassword);
    setError(null);
    setSuccess(null);
  };

  const validatePasswordForm = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirm password do not match.');
      return false;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    
    return true;
  };

  // Fix the handleUpdateProfile function in Profile.js
const handleUpdateProfile = async (e) => {
  e.preventDefault();
  
  try {
    setIsLoading(true);
    setError(null);
    
    // Prepare the data in the correct format for the backend
    const updateData = {
      name: profileData.name,
      email: profileData.email,
      school: profileData.school || null,
      grade_level: profileData.grade_level || null,
      subjects: profileData.subjects || [] // Send as array, not as JSON string
    };
    
    await api.put(`/users/${user.id}`, updateData);
    
    setSuccess('Profile updated successfully!');
    setIsEditing(false);
    setIsLoading(false);
    
    // Update the user context if you have a method to do so
    // updateUserContext({ ...user, ...updateData });
    
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error.response?.data?.detail) {
      setError(error.response.data.detail);
    } else {
      setError('Failed to update profile. Please try again.');
    }
    setIsLoading(false);
  }
};

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      await api.put(`/users/${user.id}/change-password`, {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      
      setSuccess('Password changed successfully!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setIsLoading(false);
    } catch (error) {
      console.error('Error changing password:', error);
      
      if (error.response && error.response.data && error.response.data.detail) {
        setError(error.response.data.detail);
      } else {
        setError('Failed to change password. Please try again.');
      }
      
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <header className="profile-header">
          <h2>My Profile</h2>
          {!isEditing && !isChangingPassword && (
            <div className="profile-actions">
              <button className="edit-btn" onClick={toggleEdit}>
                <i className="fas fa-edit"></i> Edit Profile
              </button>
              <button className="password-btn" onClick={toggleChangePassword}>
                <i className="fas fa-key"></i> Change Password
              </button>
            </div>
          )}
        </header>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        {isEditing ? (
          <form className="profile-form" onSubmit={handleUpdateProfile}>
            <div className="form-section">
              <h3>Account Information</h3>
              
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-section">
              <h3>Teacher Information</h3>
              
              <div className="form-group">
                <label htmlFor="school">School Name (Optional)</label>
                <input
                  type="text"
                  id="school"
                  name="school"
                  value={profileData.school}
                  onChange={handleProfileChange}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="grade_level">Primary Grade Level (Optional)</label>
                <select
                  id="grade_level"
                  name="grade_level"
                  value={profileData.grade_level}
                  onChange={handleProfileChange}
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
                <label>Subjects You Teach (Optional)</label>
                <div className="subjects-checkboxes">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="subjects"
                      value="Math"
                      checked={profileData.subjects.includes('Math')}
                      onChange={handleProfileChange}
                    />
                    Math
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="subjects"
                      value="Science"
                      checked={profileData.subjects.includes('Science')}
                      onChange={handleProfileChange}
                    />
                    Science
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="subjects"
                      value="Social Studies"
                      checked={profileData.subjects.includes('Social Studies')}
                      onChange={handleProfileChange}
                    />
                    Social Studies
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="subjects"
                      value="English"
                      checked={profileData.subjects.includes('English')}
                      onChange={handleProfileChange}
                    />
                    English
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="subjects"
                      value="Art"
                      checked={profileData.subjects.includes('Art')}
                      onChange={handleProfileChange}
                    />
                    Art
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="subjects"
                      value="Music"
                      checked={profileData.subjects.includes('Music')}
                      onChange={handleProfileChange}
                    />
                    Music
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="subjects"
                      value="Physical Education"
                      checked={profileData.subjects.includes('Physical Education')}
                      onChange={handleProfileChange}
                    />
                    Physical Education
                  </label>
                  
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="subjects"
                      value="Computer Science"
                      checked={profileData.subjects.includes('Computer Science')}
                      onChange={handleProfileChange}
                    />
                    Computer Science
                  </label>
                </div>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={toggleEdit}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : isChangingPassword ? (
          <form className="profile-form" onSubmit={handleChangePassword}>
            <div className="form-section">
              <h3>Change Password</h3>
              
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={toggleChangePassword}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={isLoading}>
                {isLoading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-section">
              <h3>Account Information</h3>
              
              <div className="detail-row">
                <span className="detail-label">Name:</span>
                <span className="detail-value">{profileData.name}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Email:</span>
                <span className="detail-value">{profileData.email}</span>
              </div>
            </div>
            
            <div className="detail-section">
              <h3>Teacher Information</h3>
              
              <div className="detail-row">
                <span className="detail-label">School:</span>
                <span className="detail-value">{profileData.school || 'Not specified'}</span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Grade Level:</span>
                <span className="detail-value">
                  {profileData.grade_level 
                    ? (profileData.grade_level === 'K' 
                        ? 'Kindergarten' 
                        : `Grade ${profileData.grade_level}`)
                    : 'Not specified'}
                </span>
              </div>
              
              <div className="detail-row">
                <span className="detail-label">Subjects:</span>
                <span className="detail-value">
                  {profileData.subjects && profileData.subjects.length > 0
                    ? profileData.subjects.join(', ')
                    : 'None specified'}
                </span>
              </div>
            </div>
            
            <div className="account-actions">
              <button className="logout-btn" onClick={logout}>
                <i className="fas fa-sign-out-alt"></i> Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;