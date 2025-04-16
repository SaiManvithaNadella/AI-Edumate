import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  PointElement,
  LineElement
);

// Existing parser that extracts course title and lessons from the course overview.
function parseOutline(outline) {
  if (typeof outline !== "string") {
    console.log("DEBUG: Outline is not a string:", outline);
    return { course_name: "", lessons: [] };
  }
  const lines = outline.split("\n").map(line => line.trim()).filter(Boolean);
  let course_name = "";
  const lessons = [];
  let currentModule = "";
  
  lines.forEach(line => {
    if (line.toLowerCase().startsWith("course title:")) {
      const parts = line.split(":");
      if (parts.length > 1) {
        course_name = parts.slice(1).join(":").trim();
      }
    } else if (line.toLowerCase().startsWith("module")) {
      // Normalize module name if needed, e.g. "Module1" → "Module 1"
      currentModule = line.replace(/module(\d)/i, "Module $1").trim();
    } else if (line.toLowerCase().startsWith("- lesson:")) {
      let lessonName = line.replace(/^- lesson:/i, "").trim();
      // Optionally remove an extra "Lesson:" prefix if present.
      lessonName = lessonName.replace(/^lesson[:\s]*/i, "").trim();
      lessons.push({ module: currentModule, lessonName });
    }
  });
  return { course_name, lessons };
}

function ProgressDashboard({ progressData }) {
  // Define target values (adjust as needed)
  const targetCourses = 10;
  const targetLessons = 500;

  // Chart for Courses Created (Doughnut)
  const coursesData = {
    labels: ['Courses Generated', 'Remaining Courses'],
    datasets: [
      {
        data: [
          progressData.coursesCreated,
          Math.max(targetCourses - progressData.coursesCreated, 0),
        ],
        backgroundColor: ['#e91e63', '#555'],
      },
    ],
  };

  // Chart for Lessons Studied (Bar)
  const lessonsData = {
    labels: ['Lessons Completed'],
    datasets: [
      {
        label: 'Lessons in the Bag!',
        data: [progressData.lessonsStudied],
        backgroundColor: '#9c27b0',
      },
    ],
  };

  // Chart for Lesson Content Generated (Doughnut)
  const lessonContentData = {
    labels: ['Content Generated', 'Remaining Content'],
    datasets: [
      {
        data: [
          progressData.lessonContentGenerated,
          Math.max(targetLessons - progressData.lessonContentGenerated, 0),
        ],
        backgroundColor: ['#ff9800', '#555'],
      },
    ],
  };

  // Chart for Quizzes Taken (Bar)
  const quizCountData = {
    labels: ['Quizzes Completed'],
    datasets: [
      {
        label: 'Quizzes Taken',
        data: [progressData.quizzesTaken],
        backgroundColor: '#4caf50',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          color: '#ccc',
          font: {
            size: 10
          }
        }
      },
      title: { display: false },
    },
    scales: {
      x: { ticks: { color: '#ccc', display: false } },
      y: { beginAtZero: true, ticks: { color: '#ccc', display: false } },
    },
  };

  // Generate insight message based on progress data
  let insights = '';
  if (progressData.coursesCreated >= targetCourses && progressData.lessonsStudied >= targetLessons) {
    insights = "Great job! You're well on your way to mastering your courses.";
  } else {
    insights = "Keep up the progress—more courses, lesson content, and quizzes will boost your learning!";
  }

  return (
    <div className="progress-dashboard">
      <h2>Your Progress Dashboard</h2>
      <p className="insights-text">{insights}</p>
      <div className="progress-charts">
        <div className="progress-chart">
          <p className="chart-title">Courses Generated!</p>
          <Doughnut data={coursesData} options={options} />
          <p className="chart-stats">{progressData.coursesCreated}/{targetCourses}</p>
        </div>
        <div className="progress-chart">
          <p className="chart-title">Lessons in the Bag!</p>
          <Bar data={lessonsData} options={options} />
          <p className="chart-stats">{progressData.lessonsStudied}/{targetLessons}</p>
        </div>
        <div className="progress-chart">
          <p className="chart-title">Lesson Content</p>
          <Doughnut data={lessonContentData} options={options} />
          <p className="chart-stats">{progressData.lessonContentGenerated}/{targetLessons}</p>
        </div>
        <div className="progress-chart">
          <p className="chart-title">Quizzes Taken</p>
          <Bar data={quizCountData} options={options} />
          <p className="chart-stats">{progressData.quizzesTaken}</p>
        </div>
      </div>
    </div>
  );
}

function Home() {
  const [chatInput, setChatInput] = useState('');
  const [confidence, setConfidence] = useState('');
  const [topic, setTopic] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatHistoryRef = useRef(null);

  // For progress data, we'll compute metrics by fetching from various backend endpoints.
  const [progressData, setProgressData] = useState({
    coursesCreated: 0,
    lessonsStudied: 0,
    lessonContentGenerated: 0,
    quizzesTaken: 0,
  });

  useEffect(() => {
    async function fetchProgress() {
      try {
        // Fetch courses from /course/list
        const courseRes = await api.get('/course/list');
        const courses = courseRes.data;
        const coursesCreated = courses.length;
        let totalLessons = 0;
        courses.forEach(course => {
          if (course.overview) {
            const { lessons } = parseOutline(course.overview);
            totalLessons += lessons.length;
          }
        });
        
        // Fetch the count of records in the lesson_content table (if needed)
        const lessonContentRes = await api.get('/lesson-content/count');
        const lessonContentCount = lessonContentRes.data.count;
  
        setProgressData({
          coursesCreated,
          lessonsStudied: totalLessons,
          lessonContentGenerated: lessonContentCount,
          quizzesTaken: courses.length,
        });
      } catch (error) {
        console.error("Error fetching progress data:", error);
      }
    }
    fetchProgress();
  }, []);

  const handleAsk = async () => {
    if (!chatInput.trim()) {
      alert("Please type a question.");
      return;
    }
    try {
      const res = await api.post('/tutor/chat', null, {
        params: {
          question: chatInput,
          confidence,
          topic,
        },
      });
      const responseText = res.data.response;
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { sender: "user", text: chatInput },
        { sender: "tutor", text: responseText },
      ]);
      setChatInput('');
      setConfidence('');
      setTopic('');
      
      // Ensure scrolling to bottom after new message
      setTimeout(() => {
        if (chatHistoryRef.current) {
          chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
        }
      }, 100);
    } catch (error) {
      console.error("Error in tutor chat:", error);
      alert("Error communicating with AI Tutor.");
    }
  };

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>AI-Edumate</h1>
        <p>
          AI‑Edumate leverages AI to automate the creation of educational courses.
          Generate course outlines, lesson content, quizzes, and flashcards.
        </p>
        <Link to="/generate-course" className="button">
          Let's Get Started!
        </Link>
      </div>
      
      <div className="home-content">
        <div className="dashboard-section">
          <ProgressDashboard progressData={progressData} />
        </div>
        
        <div className="chat-section">
          <h2>AI Tutor Chatbot</h2>
          <p className="chat-description">
            Ask your question, share your confidence level, and mention the topic.
          </p>
          <div className="chat-controls">
            <div className="chat-inputs">
              <input
                type="text"
                placeholder="Enter your question..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="chat-input"
              />
              <div className="chat-secondary-inputs">
                <input
                  type="text"
                  placeholder="Your Confidence level"
                  value={confidence}
                  onChange={(e) => setConfidence(e.target.value)}
                  className="chat-input-small"
                />
                <input
                  type="text"
                  placeholder="Subject (optional)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="chat-input-small"
                />
                <button onClick={handleAsk} className="chat-button">
                  Ask
                </button>
              </div>
            </div>
            <div className="chat-history" ref={chatHistoryRef}>
              {chatHistory.length === 0 ? (
                <p className="chat-placeholder">No chats yet. Ask your question to get started!</p>
              ) : (
                chatHistory.map((msg, index) => (
                  <div key={index} className={`chat-bubble ${msg.sender === "user" ? "user-bubble" : "tutor-bubble"}`}>
                    {msg.text}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;