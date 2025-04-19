// src/pages/AiTutor.jsx
import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import './AiTutor.css';

const AiTutor = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const messagesEndRef = useRef(null);
  
  useEffect(() => {
    // Fetch user's courses to provide context to the tutor
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    
    fetchCourses();
  }, []);
  
  useEffect(() => {
    // Scroll to bottom when messages change
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    try {
      const response = await api.post('/tutor/chat', {
        conversation_id: conversationId,
        course_id: selectedCourse?.id,
        content: inputMessage
      });
      
      // Update conversation ID if this is a new chat
      if (!conversationId && response.data.conversation_id) {
        setConversationId(response.data.conversation_id);
      }
      
      // Add AI response to chat
      const aiMessage = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error message to user
      setMessages(prev => [...prev, {
        role: 'error',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const startNewChat = () => {
    setMessages([]);
    setConversationId(null);
  };
  
  return (
    <div className="ai-tutor-page">
      <div className="tutor-container">
        <header className="tutor-header">
          <h2>AI Tutor Assistant</h2>
          <div className="header-actions">
            <select 
              value={selectedCourse?.id || ''} 
              onChange={(e) => {
                const course = courses.find(c => c.id === parseInt(e.target.value));
                setSelectedCourse(course);
              }}
              className="course-select"
            >
              <option value="">Select a course (optional)</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <button onClick={startNewChat} className="new-chat-btn">
              <i className="fas fa-plus"></i> New Chat
            </button>
          </div>
        </header>
        
        <div className="chat-container">
          <div className="messages-area">
            {messages.length === 0 ? (
              <div className="welcome-message">
                <i className="fas fa-robot"></i>
                <h3>Hello! I'm your AI tutor.</h3>
                <p>I'm here to help you with your learning journey. Ask me anything about your courses, assignments, or concepts you're struggling with.</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`message ${message.role}`}
                >
                  <div className="message-content">
                    {message.role === 'assistant' && (
                      <i className="fas fa-robot"></i>
                    )}
                    {message.role === 'user' && (
                      <i className="fas fa-user"></i>
                    )}
                    <div className="message-text">{message.content}</div>
                  </div>
                  <div className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))
            )}
            {isLoading && (
              <div className="message assistant">
                <div className="message-content">
                  <i className="fas fa-robot"></i>
                  <div className="message-text typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={sendMessage} className="message-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
            />
            <button type="submit" disabled={isLoading || !inputMessage.trim()}>
              <i className="fas fa-paper-plane"></i>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AiTutor;