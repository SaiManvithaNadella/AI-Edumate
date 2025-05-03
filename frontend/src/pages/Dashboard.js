// src/pages/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    lessonPlans: 0,
    assessments: 0,
    activities: 0,
    resources: 0,
    courses: 0,
    quizzes: 0,
    flashcardSets: 0,
    studentProgress: 0
  });
  const [recentItems, setRecentItems] = useState([]);
  const [activityData, setActivityData] = useState({
    weeklyActivity: [],
    popularSubjects: [],
    engagementRate: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to determine item type
  const getItemType = (item) => {
    if ('objectives' in item && 'materials' in item) return 'Lesson Plan';
    if ('assessment_type' in item) return 'Assessment';
    if ('difficulty_level' in item && 'learning_style' in item) return 'Course';
    if ('questions' in item) return 'Quiz';
    if ('cards' in item) return 'Flashcards';
    if ('activity_type' in item) return 'Activity';
    if ('filename' in item) return 'Resource';
    return 'Unknown';
  };

  // Helper function to get item path
  const getItemPath = useCallback((item) => {
    const type = getItemType(item);
    switch (type) {
      case 'Lesson Plan': return `/lesson-plans/${item.id}`;
      case 'Assessment': return `/assessments/${item.id}`;
      case 'Course': return `/courses/${item.id}`;
      case 'Quiz': return `/quizzes/${item.id}`;
      case 'Flashcards': return `/flashcards/${item.id}`;
      case 'Activity': return `/activities/${item.id}`;
      case 'Resource': return `/resources/${item.id}`;
      default: return '#';
    }
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [
          lessonPlansResponse,
          assessmentsResponse,
          activitiesResponse,
          resourcesResponse
        ] = await Promise.all([
          api.get('/lesson-plans').catch(() => ({ data: [] })),
          api.get('/assessments').catch(() => ({ data: [] })),
          api.get('/activities').catch(() => ({ data: [] })),
          api.get('/resources').catch(() => ({ data: [] }))
        ]);
        
        // Try to fetch courses, quizzes, and flashcards with error handling
        let coursesResponse = { data: [] };
        let quizzesResponse = { data: [] };
        let flashcardsResponse = { data: [] };
        
        try {
          coursesResponse = await api.get('/courses');
        } catch (error) {
          console.log('Courses endpoint not available');
        }
        
        try {
          quizzesResponse = await api.get('/quizzes');
        } catch (error) {
          console.log('Quizzes endpoint not available');
        }
        
        try {
          flashcardsResponse = await api.get('/flashcards');
        } catch (error) {
          console.log('Flashcards endpoint not available');
        }
        
        // Set actual counts
        setStats({
          lessonPlans: lessonPlansResponse.data.length,
          assessments: assessmentsResponse.data.length,
          activities: activitiesResponse.data.length,
          resources: resourcesResponse.data.length,
          courses: coursesResponse.data.length,
          quizzes: quizzesResponse.data.length,
          flashcardSets: flashcardsResponse.data.length,
          studentProgress: calculateAverageProgress(coursesResponse.data)
        });
        
        // Calculate activity data
        const allItems = [
          ...lessonPlansResponse.data,
          ...assessmentsResponse.data,
          ...coursesResponse.data,
          ...quizzesResponse.data,
          ...flashcardsResponse.data,
          ...activitiesResponse.data
        ];
        
        const activityAnalytics = processActivityData(allItems);
        setActivityData(activityAnalytics);
        
        // Get recent items (last 5)
        const sortedItems = allItems
          .filter(item => item.created_at)
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5)
          .map(item => ({
            id: item.id,
            title: item.title,
            type: getItemType(item),
            date: new Date(item.created_at),
            path: getItemPath(item)
          }));
        
        setRecentItems(sortedItems);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [getItemPath]);

  // Calculate average progress across all courses
  const calculateAverageProgress = (courses) => {
    if (!courses || courses.length === 0) return 0;
    const totalProgress = courses.reduce((sum, course) => {
      return sum + (course.progress_percentage || 0);
    }, 0);
    return Math.round(totalProgress / courses.length);
  };

  // Process activity data for insights
  const processActivityData = (allItems) => {
    const now = new Date();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    
    // Calculate weekly activity
    const weeklyItems = allItems.filter(item => 
      item.created_at && new Date(item.created_at) >= weekAgo
    );
    const dailyActivity = Array(7).fill(0);
    
    weeklyItems.forEach(item => {
      const dayIndex = new Date(item.created_at).getDay();
      dailyActivity[dayIndex]++;
    });
    
    // Calculate popular subjects
    const subjectCounts = {};
    allItems.forEach(item => {
      if (item.subject) {
        subjectCounts[item.subject] = (subjectCounts[item.subject] || 0) + 1;
      }
    });
    
    const popularSubjects = Object.entries(subjectCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([subject, count]) => ({ subject, count }));
    
    // Calculate engagement rate (items created in last 30 days vs total)
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const recentItems = allItems.filter(item => 
      item.created_at && new Date(item.created_at) >= monthAgo
    );
    const engagementRate = allItems.length ? (recentItems.length / allItems.length) * 100 : 0;
    
    return {
      weeklyActivity: dailyActivity,
      popularSubjects,
      engagementRate: Math.round(engagementRate)
    };
  };

  // AI tool suggestions based on teacher's profile
  const aiToolSuggestions = [
    {
      id: 1,
      title: "5E Lesson Plan Generator",
      description: "Generate inquiry-based lesson plans following the 5E model",
      path: "/lesson-plans/create",
      icon: "fas fa-lightbulb"
    },
    {
      id: 2,
      title: "Differentiated Assessment Creator",
      description: "Create multi-level assessments for diverse learners",
      path: "/assessments/create",
      icon: "fas fa-chart-bar"
    },
    {
      id: 3,
      title: "AI Course Builder",
      description: "Create personalized learning courses with AI",
      path: "/courses/create",
      icon: "fas fa-graduation-cap"
    },
    {
      id: 4,
      title: "Smart Quiz Generator",
      description: "Generate quizzes targeting specific learning gaps",
      path: "/quizzes/create",
      icon: "fas fa-question-circle"
    }
  ];

  if (isLoading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h2>Welcome, {user.name}!</h2>
        <p>Here's what's happening with your learning/teaching adventure!</p>
      </header>
      
      <section className="stats-section">
        <div className="stats-card">
          <div className="stats-icon"><i className="fas fa-book"></i></div>
          <div className="stats-info">
            <h3>{stats.lessonPlans}</h3>
            <p>Lesson Plans</p>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon"><i className="fas fa-clipboard-check"></i></div>
          <div className="stats-info">
            <h3>{stats.assessments}</h3>
            <p>Assessments</p>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon"><i className="fas fa-graduation-cap"></i></div>
          <div className="stats-info">
            <h3>{stats.courses}</h3>
            <p>Courses</p>
          </div>
        </div>
        
        <div className="stats-card">
          <div className="stats-icon"><i className="fas fa-question-circle"></i></div>
          <div className="stats-info">
            <h3>{stats.quizzes}</h3>
            <p>Quizzes</p>
          </div>
        </div>
      </section>
      
      <div className="data-insights-section">
        <h3>Data Insights</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <h4>Weekly Activity</h4>
            <div className="activity-chart">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                <div key={day} className="activity-bar">
                  <div 
                    className="bar-fill" 
                    style={{ height: `${Math.max((activityData.weeklyActivity[index] / Math.max(...activityData.weeklyActivity, 1)) * 100, 5)}%` }}
                  ></div>
                  <span className="bar-label">{day}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="insight-card">
            <h4>Popular Subjects</h4>
            <div className="subject-list">
              {activityData.popularSubjects.length > 0 ? (
                activityData.popularSubjects.map(({ subject, count }) => (
                  <div key={subject} className="subject-item">
                    <span className="subject-name">{subject}</span>
                    <span className="subject-count">{count} items</span>
                  </div>
                ))
              ) : (
                <p>No subject data available</p>
              )}
            </div>
          </div>
          
          <div className="insight-card">
            <h4>Engagement Rate</h4>
            <div className="engagement-metric">
              <div className="engagement-circle">
                <span className="engagement-percentage">
                  {activityData.engagementRate}%
                </span>
              </div>
              <p>Active in the last 30 days</p>
            </div>
          </div>
          
          <div className="insight-card">
            <h4>Student Progress</h4>
            <div className="progress-metric">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${stats.studentProgress}%` }}
                ></div>
              </div>
              <span>{stats.studentProgress}% Average Course Completion</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="dashboard-content">
        <section className="recent-items">
          <div className="section-header">
            <h3>Recent Items</h3>
            <button className="view-all-btn">View All</button>
          </div>
          
          {recentItems.length > 0 ? (
            <div className="items-list">
              {recentItems.map(item => (
                <Link to={item.path} key={`${item.type}-${item.id}`} className="item-card">
                  <div className="item-type">{item.type}</div>
                  <h4>{item.title}</h4>
                  <div className="item-date">
                    {item.date.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>You haven't created any content yet.</p>
              <div className="empty-actions">
                <Link to="/lesson-plans/create" className="btn">Create Lesson Plan</Link>
                <Link to="/assessments/create" className="btn">Create Assessment</Link>
              </div>
            </div>
          )}
        </section>
        
        <section className="ai-tools">
          <div className="section-header">
            <h3>AI Tools for You</h3>
          </div>
          
          <div className="tools-grid">
            {aiToolSuggestions.map(tool => (
              <Link to={tool.path} key={tool.id} className="tool-card">
                <div className="tool-icon">
                  <i className={tool.icon}></i>
                </div>
                <h4>{tool.title}</h4>
                <p>{tool.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
      
      <section className="quick-create">
        <h3>Quick Create</h3>
        <div className="quick-actions">
          <Link to="/lesson-plans/create" className="action-btn">
            <i className="fas fa-plus"></i> Lesson Plan
          </Link>
          <Link to="/assessments/create" className="action-btn">
            <i className="fas fa-plus"></i> Assessment
          </Link>
          <Link to="/courses/create" className="action-btn">
            <i className="fas fa-plus"></i> Course
          </Link>
          <Link to="/flashcards/create" className="action-btn">
            <i className="fas fa-plus"></i> Flashcards
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;