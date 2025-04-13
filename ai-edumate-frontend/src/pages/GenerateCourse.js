import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

function GenerateCourse() {
  const [topic, setTopic] = useState('');
  const [numModules, setNumModules] = useState(5);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const navigate = useNavigate();

  // Handler to generate a new course outline
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Call backend API to generate course outline
      const res = await api.post('/course/generate-outline', null, {
        params: { topic, num_modules: numModules }
      });
      console.log("DEBUG: response from backend =>", res.data);
      
      // Use the returned outline; adjust the key if necessary (here we expect 'outline_text')
      const generatedOutline = res.data.outline_text || "";
      console.log("DEBUG: generatedOutline =>", generatedOutline);
      
      setLoading(false);
      // Navigate to GenerateLesson page, passing the generated outline in state
      navigate("/generate-lesson", { state: { outline: generatedOutline } });
    } catch (error) {
      console.error("Error generating course outline:", error);
      setLoading(false);
      alert("Error generating course outline. Please try again.");
    }
  };

  // Fetch and display existing courses from the database
  useEffect(() => {
    async function fetchCourses() {
      try {
        const res = await api.get('/course/list');
        setCourses(res.data);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    }
    fetchCourses();
  }, []);

  // When a course is clicked, navigate to the GenerateLesson page with that course's outline (overview)
  const handleCourseClick = (course) => {
    // 'overview' should already be stored in the database as the full outline
    const outline = course.overview || "";
    navigate("/generate-lesson", { state: { outline } });
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
          <label>Number of Weeks:</label><br />
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
      
      <hr style={{ margin: "40px 0" }} />
      <h3>Existing Courses</h3>
      {courses.length === 0 ? (
        <p>No courses generated yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {courses.map((course) => (
            <li
              key={course.course_id}
              style={{
                marginBottom: "15px",
                padding: "10px",
                backgroundColor: "#222",
                borderRadius: "4px",
                cursor: "pointer"
              }}
              onClick={() => handleCourseClick(course)}
            >
              <h4 style={{ color: "#e91e63", margin: "0" }}>
                {course.course_name}
              </h4>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GenerateCourse;
