// src/pages/Activities.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import './Activities.css';

const Activities = () => {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    activityType: '',
    duration: ''
  });

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/activities');
        setActivities(response.data);
        setFilteredActivities(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching activities:', error);
        setError('Failed to load activities. Please try again later.');
        setIsLoading(false);
      }
    };
    
    fetchActivities();
  }, []);

  useEffect(() => {
    // Apply filters and search
    let result = activities;
    
    // Apply activity type filter
    if (filters.activityType) {
      result = result.filter(activity => activity.activity_type === filters.activityType);
    }
    
    // Apply duration filter
    if (filters.duration) {
      result = result.filter(activity => activity.duration === filters.duration);
    }
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(activity => 
        activity.title.toLowerCase().includes(searchLower) ||
        activity.description.toLowerCase().includes(searchLower) ||
        activity.activity_type.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredActivities(result);
  }, [search, filters, activities]);

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
      activityType: '',
      duration: ''
    });
  };

  const deleteActivity = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await api.delete(`/activities/${id}`);
        setActivities(activities.filter(activity => activity.id !== id));
      } catch (error) {
        console.error('Error deleting activity:', error);
        alert('Error deleting activity. Please try again.');
      }
    }
  };

  // Get unique activity types for filter dropdown
  const activityTypes = [...new Set(activities.map(activity => activity.activity_type))];
  
  // Get unique durations for filter dropdown
  const durations = [...new Set(activities.map(activity => activity.duration))];

  // Helper function to get an icon for the activity type
  const getActivityTypeIcon = (type) => {
    const icons = {
      'game': 'fa-gamepad',
      'discussion': 'fa-comments',
      'group': 'fa-users',
      'hands-on': 'fa-hands',
      'interactive': 'fa-mouse-pointer',
      'outdoor': 'fa-tree',
      'creative': 'fa-paint-brush',
      'reading': 'fa-book-open',
      'writing': 'fa-pen',
      'presentation': 'fa-chalkboard-teacher',
      'digital': 'fa-laptop',
      'assessment': 'fa-clipboard-check'
    };
    return icons[type] || 'fa-puzzle-piece';
  };

  if (isLoading) {
    return <div className="loading">Loading activities...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="activities-page">
      <header className="page-header">
        <h2>Classroom Activities</h2>
        <Link to="/activities/create" className="create-btn">
          <i className="fas fa-plus"></i> Create Activity
        </Link>
      </header>
      
      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filters">
          <select 
            name="activityType" 
            value={filters.activityType} 
            onChange={handleFilterChange}
          >
            <option value="">All Activity Types</option>
            {activityTypes.map(type => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
          
          <select 
            name="duration" 
            value={filters.duration} 
            onChange={handleFilterChange}
          >
            <option value="">All Durations</option>
            {durations.map(duration => (
              <option key={duration} value={duration}>{duration}</option>
            ))}
          </select>
          
          <button className="clear-filters" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>
      
      {filteredActivities.length > 0 ? (
        <div className="activities-grid">
          {filteredActivities.map(activity => (
            <div key={activity.id} className="activity-card">
              <div className="activity-icon">
                <i className={`fas ${getActivityTypeIcon(activity.activity_type)}`}></i>
              </div>
              
              <div className="activity-content">
                <h3>{activity.title}</h3>
                <div className="activity-meta">
                  <span className="activity-type">
                    {activity.activity_type.charAt(0).toUpperCase() + activity.activity_type.slice(1)}
                  </span>
                  <span className="activity-duration">{activity.duration}</span>
                </div>
                <p className="activity-description">{activity.description}</p>
                
                <div className="activity-footer">
                  <div className="materials">
                    <strong>Materials:</strong> 
                    <span className="material-count">
                      {JSON.parse(activity.materials).length} items
                    </span>
                  </div>
                  
                  <div className="activity-actions">
                    <Link to={`/activities/${activity.id}`} className="action-btn view-btn">
                      <i className="fas fa-eye"></i>
                    </Link>
                    <Link to={`/activities/edit/${activity.id}`} className="action-btn edit-btn">
                      <i className="fas fa-edit"></i>
                    </Link>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => deleteActivity(activity.id)}
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-puzzle-piece"></i>
          <h3>No Activities Found</h3>
          <p>
            {activities.length === 0
              ? "You haven't created any classroom activities yet."
              : "No activities match your current filters."}
          </p>
          {activities.length === 0 ? (
            <Link to="/activities/create" className="btn">
              Create Your First Activity
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

export default Activities;