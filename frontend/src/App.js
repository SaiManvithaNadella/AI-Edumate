// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import LessonPlans from './pages/LessonPlans';
import CreateLessonPlan from './pages/CreateLessonPlan';
import Assessments from './pages/Assessments';
import CreateAssessment from './pages/CreateAssessment';
import Activities from './pages/Activities';
import CreateActivity from './pages/CreateActivity';
import Resources from './pages/Resources';
import StudentRecords from './pages/StudentRecords';
import Profile from './pages/Profile';
import Courses from './pages/Courses';
import CreateCourse from './pages/CreateCourse';
import CourseDetail from './pages/CourseDetail';
import Quiz from './pages/Quiz';
import Flashcards from './pages/Flashcards';
import AiTutor from './pages/AiTutor';
import LessonPlanDetail from './pages/LessonPlanDetail';
import AssessmentDetail from './pages/AssessmentDetail';
import './App.css';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="app-container">
                    <Navbar />
                    <div className="content-container">
                      <Sidebar />
                      <main className="main-content">
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/lesson-plans" element={<LessonPlans />} />
                          <Route path="/lesson-plans/create" element={<CreateLessonPlan />} />
                          <Route path="/lesson-plans/:id" element={<LessonPlanDetail />} />
                          <Route path="/assessments" element={<Assessments />} />
                          <Route path="/assessments/create" element={<CreateAssessment />} />
                          <Route path="/assessments/:id" element={<AssessmentDetail />} />
                          <Route path="/activities" element={<Activities />} />
                          <Route path="/activities/create" element={<CreateActivity />} />
                          <Route path="/resources" element={<Resources />} />
                          <Route path="/students" element={<StudentRecords />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/courses" element={<Courses />} />
                          <Route path="/courses/create" element={<CreateCourse />} />
                          <Route path="/courses/:id" element={<CourseDetail />} />
                          <Route path="/quizzes" element={<Quiz />} />
                          <Route path="/flashcards" element={<Flashcards />} />
                          <Route path="/ai-tutor" element={<AiTutor />} />
                        </Routes>
                      </main>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;