// src/pages/Resources.jsx
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import './Resources.css';

const Resources = () => {
  const [resources, setResources] = useState([]);
  const [filteredResources, setFilteredResources] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({
    resourceType: ''
  });
  const [uploadStatus, setUploadStatus] = useState({
    isUploading: false,
    progress: 0,
    error: null,
    success: false
  });
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/resources');
      setResources(response.data);
      setFilteredResources(response.data);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setError('Failed to load resources. Please try again later.');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Apply filters and search
    let result = resources;
    
    // Apply resource type filter
    if (filters.resourceType) {
      result = result.filter(resource => resource.resource_type === filters.resourceType);
    }
    
    // Apply search
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(resource => 
        resource.filename.toLowerCase().includes(searchLower) ||
        (resource.description && resource.description.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredResources(result);
  }, [search, filters, resources]);

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
      resourceType: ''
    });
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadStatus({
        isUploading: true,
        progress: 0,
        error: null,
        success: false
      });

      const formData = new FormData();
      formData.append('file', files[0]);

      // Simulating upload progress
      const progressInterval = setInterval(() => {
        setUploadStatus(prev => ({
          ...prev,
          progress: Math.min(prev.progress + 10, 90)
        }));
      }, 300);

      // Upload the file
      const response = await api.post('/upload-resource', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      clearInterval(progressInterval);
      
      setUploadStatus({
        isUploading: false,
        progress: 100,
        error: null,
        success: true
      });

      // Refresh the resources list
      setTimeout(() => {
        fetchResources();
        setUploadStatus(prev => ({
          ...prev,
          progress: 0,
          success: false
        }));
      }, 1500);

    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus({
        isUploading: false,
        progress: 0,
        error: 'Failed to upload file. Please try again.',
        success: false
      });
    }
  };

  const deleteResource = async (id) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      try {
        await api.delete(`/resources/${id}`);
        setResources(resources.filter(resource => resource.id !== id));
      } catch (error) {
        console.error('Error deleting resource:', error);
        alert('Error deleting resource. Please try again.');
      }
    }
  };

  // Get unique resource types for filter dropdown
  const resourceTypes = [...new Set(resources.map(resource => resource.resource_type))];

  // Helper function to get an icon for the resource type
  const getResourceIcon = (type) => {
    const icons = {
      'pdf': 'fa-file-pdf',
      'doc': 'fa-file-word',
      'docx': 'fa-file-word',
      'ppt': 'fa-file-powerpoint',
      'pptx': 'fa-file-powerpoint',
      'xls': 'fa-file-excel',
      'xlsx': 'fa-file-excel',
      'jpg': 'fa-file-image',
      'jpeg': 'fa-file-image',
      'png': 'fa-file-image',
      'gif': 'fa-file-image',
      'mp3': 'fa-file-audio',
      'mp4': 'fa-file-video',
      'zip': 'fa-file-archive',
      'txt': 'fa-file-alt',
      'csv': 'fa-file-csv'
    };
    return icons[type] || 'fa-file';
  };

  // Helper function to format file size
  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown';
    
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  if (isLoading && !uploadStatus.isUploading) {
    return <div className="loading">Loading resources...</div>;
  }

  return (
    <div className="resources-page">
      <header className="page-header">
        <h2>Resources Library</h2>
        <button className="upload-btn" onClick={handleUploadClick}>
          <i className="fas fa-upload"></i> Upload Resource
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }}
          />
        </button>
      </header>
      
      {error && <div className="error-message">{error}</div>}
      
      {uploadStatus.isUploading && (
        <div className="upload-progress">
          <div className="upload-status">
            <span>Uploading file...</span>
            <span>{uploadStatus.progress}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${uploadStatus.progress}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {uploadStatus.error && (
        <div className="error-message">{uploadStatus.error}</div>
      )}
      
      {uploadStatus.success && (
        <div className="success-message">
          <i className="fas fa-check-circle"></i> File uploaded successfully!
        </div>
      )}
      
      <div className="filters-bar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="filters">
          <select 
            name="resourceType" 
            value={filters.resourceType} 
            onChange={handleFilterChange}
          >
            <option value="">All File Types</option>
            {resourceTypes.map(type => (
              <option key={type} value={type}>
                {type.toUpperCase()}
              </option>
            ))}
          </select>
          
          <button className="clear-filters" onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      </div>
      
      {filteredResources.length > 0 ? (
        <div className="resources-table">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResources.map(resource => (
                <tr key={resource.id}>
                  <td className="resource-name">
                    <i className={`fas ${getResourceIcon(resource.resource_type)}`}></i>
                    <span>{resource.filename}</span>
                  </td>
                  <td className="resource-type">
                    {resource.resource_type.toUpperCase()}
                  </td>
                  <td className="resource-size">
                    {formatSize(resource.size)}
                  </td>
                  <td className="resource-date">
                    {new Date(resource.created_at).toLocaleDateString()}
                  </td>
                  <td className="resource-actions">
                    <a href="#" className="action-btn download-btn" title="Download">
                      <i className="fas fa-download"></i>
                    </a>
                    <button 
                      className="action-btn delete-btn" 
                      onClick={() => deleteResource(resource.id)}
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <i className="fas fa-file-alt"></i>
          <h3>No Resources Found</h3>
          <p>
            {resources.length === 0
              ? "You haven't uploaded any resources yet."
              : "No resources match your current filters."}
          </p>
          {resources.length === 0 ? (
            <button className="btn" onClick={handleUploadClick}>
              Upload Your First Resource
            </button>
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

export default Resources;