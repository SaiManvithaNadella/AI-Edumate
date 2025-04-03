import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Home() {
  const [chatInput, setChatInput] = useState('');
  const [confidence, setConfidence] = useState('');
  const [topic, setTopic] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const chatHistoryRef = useRef(null);

  const handleAsk = async () => {
    if (!chatInput.trim()) {
      alert("Please type a question.");
      return;
    }
    try {
      // Call the tutor chat endpoint with question, confidence, and topic as query parameters.
      const res = await api.post('/tutor/chat', null, {
        params: {
          question: chatInput,
          confidence,
          topic,
        },
      });
      const responseText = res.data.response;
      // Append the Q/A pair to chat history (each message as an object with sender and text)
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { sender: "user", text: chatInput },
        { sender: "tutor", text: responseText },
      ]);
      // Clear inputs
      setChatInput('');
      setConfidence('');
      setTopic('');
    } catch (error) {
      console.error("Error in tutor chat:", error);
      alert("Error communicating with AI Tutor.");
    }
  };

  // Auto-scroll the chat history to the bottom when new messages arrive
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
          placeholder="Your confidence (low, medium, high)"
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
          Send
        </button>
      </div>
      <div className="chat-history" ref={chatHistoryRef}>
        {chatHistory.length === 0 ? (
          <p className="chat-placeholder">No chats yet. Ask your question to get started!</p>
        ) : (
          chatHistory.map((msg, index) => (
            <div
              key={index}
              className={`chat-bubble ${msg.sender === "user" ? "user-bubble" : "tutor-bubble"}`}
            >
              {msg.text}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Home;
