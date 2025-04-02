import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function GenerateCourse() {
  const [topic, setTopic] = useState('');
  const [numModules, setNumModules] = useState(5);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/course/generate-outline', null, {
        params: { topic, num_modules: numModules }
      });
      console.log("DEBUG: response from backend =>", res.data);

      // Use the field name as returned by the backend
      const generatedOutline = res.data.outline_text || "";
      console.log("DEBUG: generatedOutline =>", generatedOutline);

      setLoading(false);
      // Pass the outline to the GenerateLesson page with state
      navigate("/generate-lesson", { state: { outline: generatedOutline } });
    } catch (error) {
      console.error("Error generating course outline:", error);
      setLoading(false);
      alert("Error generating course outline. Please try again.");
    }
  };

  return (
    <div className="page-placeholder">
      <h2>Generate Course Outline</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Topic:</label><br />
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            style={{ padding: "8px", width: "300px", marginBottom: "10px" }}
          />
        </div>
        <div>
          <label>Number of Modules:</label><br />
          <input
            type="number"
            value={numModules}
            onChange={(e) => setNumModules(e.target.value)}
            required
            style={{ padding: "8px", width: "100px", marginBottom: "10px" }}
          />
        </div>
        <button type="submit" className="button">
          {loading ? "Generating..." : "Generate Outline"}
        </button>
      </form>
    </div>
  );
}

export default GenerateCourse;
