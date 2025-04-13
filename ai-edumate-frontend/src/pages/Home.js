import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { Doughnut, Bar, Radar } from 'react-chartjs-2';
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

// ProgressDashboard component renders five different visualizations.
function ProgressDashboard({ progressData }) {
  // Define target values (adjust as needed)
  const targetCourses = 10;
  const targetLessons = 500;
  const targetQuizPoints = 100;

  // Chart for Courses Created (Doughnut)
  const coursesData = {
    labels: ['Courses Created', 'Remaining'],
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
    labels: ['Lessons Studied'],
    datasets: [
      {
        label: 'Lessons',
        data: [progressData.lessonsStudied],
        backgroundColor: '#9c27b0',
      },
    ],
  };

  // Chart for Quiz Points (Radar)
  const quizPointsData = {
    labels: ['Quiz Points', 'Remaining'],
    datasets: [
      {
        label: 'Quiz Points',
        data: [
          progressData.quizPoints,
          Math.max(targetQuizPoints - progressData.quizPoints, 0),
        ],
        backgroundColor: ['#03a9f4', '#555'],
      },
    ],
  };

  // Chart for Lesson Content Generated (Doughnut)
  const lessonContentData = {
    labels: ['Lesson Content Generated', 'Remaining'],
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
    labels: ['Quizzes Taken'],
    datasets: [
      {
        label: 'Quizzes',
        data: [progressData.quizzesTaken],
        backgroundColor: '#4caf50',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: 'Progress Overview', color: '#e91e63', font: { size: 18 } },
    },
    scales: {
      x: { ticks: { color: '#ccc' } },
      y: { beginAtZero: true, ticks: { color: '#ccc' } },
    },
  };

  // Generate insight message based on progress data
  let insights = '';
  if (progressData.coursesCreated >= targetCourses && progressData.lessonsStudied >= targetLessons) {
    insights = "Great job! You’re well on your way to mastering your courses.";
  } else {
    insights = "Keep up the progress—more courses, lesson content, and quizzes will boost your learning!";
  }

  return (
    <div className="progress-dashboard">
      <h2>Your Progress Dashboard</h2>
      <div className="progress-charts">
        {/* Courses Created */}
        <div className="progress-chart">
          <Doughnut data={coursesData} options={options} />
          <p>Courses Generated!: {progressData.coursesCreated} / {targetCourses}</p>
        </div>
        {/* Lessons Studied */}
        <div className="progress-chart">
          <Bar data={lessonsData} options={options} />
          <p>Lessons in the Bag!: {progressData.lessonsStudied} / {targetLessons}</p>
        </div>
        {/* Quiz Points */}
        <div className="progress-chart">
          <Radar data={quizPointsData} options={options} />
          <p>Quiz Points: {progressData.quizPoints} / {targetQuizPoints}</p>
        </div>
        {/* Lesson Content Generated */}
        <div className="progress-chart">
          <Doughnut data={lessonContentData} options={options} />
          <p>Lesson Content: {progressData.lessonContentGenerated} / {targetLessons}</p>
        </div>
        {/* Quizzes Taken */}
        <div className="progress-chart">
          <Bar data={quizCountData} options={options} />
          <p>Quizzes Taken: {progressData.quizzesTaken}</p>
        </div>
      </div>
      <p>{insights}</p>
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
    quizPoints: 0,
  });

  useEffect(() => {
    async function fetchProgress() {
      try {
        // Fetch courses and compute coursesCreated and lessonsStudied.
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
        // Fetch lesson content count.
        const lessonContentRes = await api.get('/lesson-content/count');
        const lessonContentCount = lessonContentRes.data.count;
        // Fetch quiz count.
        const quizRes = await api.get('/quiz/count');
        const quizCount = quizRes.data.count;
        // Assume quizPoints is calculated as, for example, quizCount * 10.
        const quizPoints = quizCount * 10;
        setProgressData({
          coursesCreated,
          lessonsStudied: totalLessons,
          lessonContentGenerated: lessonContentCount,
          quizzesTaken: quizCount,
          quizPoints,
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
    <div className="home-description">
      <h1>What is AI‑Edumate?</h1>
      <p>
        AI‑Edumate is an innovative platform that leverages AI to automate the creation of educational courses.
        Generate comprehensive course outlines, detailed lesson content, interactive quizzes, and dynamic flashcards.
      </p>
      <Link to="/generate-course" className="button">
        Let's Get Started!
      </Link>
      
      {/* Progress Dashboard */}
      <ProgressDashboard progressData={progressData} />
      
      <hr className="divider" />
      <h2>AI Tutor Chatbot</h2>
      <p>
        Ask your question, share your confidence level, and mention the topic.
        Your Personal Teacher will provide a clear, empathetic explanation to help you understand.
      </p>
      <div className="chat-input-section">
        <input
          type="text"
          placeholder="Enter your question..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          className="chat-input"
        />
        <input
          type="text"
          placeholder="Your confidence (e.g., low, medium, high)"
          value={confidence}
          onChange={(e) => setConfidence(e.target.value)}
          className="chat-input"
        />
        <input
          type="text"
          placeholder="Topic (optional)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="chat-input"
        />
        <button onClick={handleAsk} className="chat-button">
          Ask
        </button>
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
  );
}

export default Home;
