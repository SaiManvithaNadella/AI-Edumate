import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';
import ReactMarkdown from 'react-markdown'; // For rendering markdown

// A parser function to extract the course title, modules, and lessons.
// This version flattens modules into a lessons array with module names.
// If lesson_id is provided in a lesson string (for example, appended in a known format),
// you could extend this parser to extract that; for now, it only parses module name and lessonName.
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
      currentModule = line; // Save the module name
    } else if (line.toLowerCase().startsWith("- lesson:")) {
      const lessonName = line.replace(/^- lesson:/i, "").trim();
      // For now, we don't have lesson_id from the outline parsing.
      lessons.push({ module: currentModule, lessonName });
    }
  });
  return { course_name, lessons };
}

function GenerateLesson() {
  const location = useLocation();
  console.log("DEBUG: location.state =>", location.state);
  // Expect the navigation state to provide at least the full outline.
  const { outline = "", lessons: passedLessons, course_name: passedCourse } = location.state || {};

  // If passedLessons are available (for example, from backend course generation), use them.
  const [parsedData, setParsedData] = useState({ course_name: passedCourse || "", lessons: [] });
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  // Cache the generated content for lessons by index.
  const [generatedLessons, setGeneratedLessons] = useState({});
  const [loading, setLoading] = useState(false);

  // Parse the outline (or use passed lessons if available).
  useEffect(() => {
    if (passedLessons && passedLessons.length > 0) {
      setParsedData({ course_name: passedCourse, lessons: passedLessons });
      setCurrentLessonIndex(0);
    } else if (outline) {
      const data = parseOutline(outline);
      console.log("DEBUG: Parsed data:", data);
      setParsedData(data);
      if (data.lessons.length > 0) {
        setCurrentLessonIndex(0);
      }
    }
  }, [outline, passedLessons, passedCourse]);

  useEffect(() => {
    async function fetchLessonContent() {
      const lesson = parsedData.lessons[currentLessonIndex];
      if (!parsedData.course_name || !lesson) return;
      
      // If the lesson object includes lesson_id, use that.
      let params;
      if (lesson.lesson_id) {
        params = { lesson_id: lesson.lesson_id };
      } else {
        params = {
          course_name: parsedData.course_name,
          module_name: lesson.module,
          lesson_name: lesson.lessonName,
        };
      }
      
      try {
        const res = await api.get('/lesson-content', { params });
        if (res.data && res.data.content && res.data.content.trim().length > 0) {
          setGeneratedLessons(prev => ({
            ...prev,
            [currentLessonIndex]: res.data.content,
          }));
        } else {
          setGeneratedLessons(prev => ({ ...prev, [currentLessonIndex]: "" }));
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          // No content found; set empty string to show generate button
          setGeneratedLessons(prev => ({ ...prev, [currentLessonIndex]: "" }));
        } else {
          console.error("Error fetching lesson content:", error);
        }
      }
    }
    fetchLessonContent();
  }, [parsedData, currentLessonIndex]);

  // Handler to generate lesson content on demand.
  const handleGenerateContent = async () => {
    const lesson = parsedData.lessons[currentLessonIndex];
    if (!parsedData.course_name || !lesson) {
      alert("Invalid course or lesson selection.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/lesson/generate', null, {
        params: {
          course_name: parsedData.course_name,
          module_name: lesson.module,
          lesson_name: lesson.lessonName,
        },
      });
      const content = res.data.generated_content || "No content returned.";
      // Cache the generated content.
      setGeneratedLessons(prev => ({
        ...prev,
        [currentLessonIndex]: content,
      }));
      setLoading(false);
    } catch (error) {
      console.error("Error generating lesson content:", error);
      setLoading(false);
    }
  };

  // Navigation handlers.
  const handleNextLesson = () => {
    if (currentLessonIndex < parsedData.lessons.length - 1) {
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
  };

  const handlePrevLesson = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const currentLesson = parsedData.lessons[currentLessonIndex];
  const currentContent = generatedLessons[currentLessonIndex];
  

  return (
    <div>
      <h2 style={{ color: "#e91e63", textAlign: "center" }}>Lesson Generation</h2>
      <div className="lesson-screen">
        {/* Left Side: Course Outline (display the full outline) */}
        <div className="lesson-outline">
          <h2>Course Outline</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "#ccc" }}>{outline}</pre>
        </div>
        {/* Right Side: Lesson Content Area */}
        <div className="lesson-generator">
          <h2>Lesson Content</h2>
          {currentLesson ? (
            <>
              <p>
                <strong>Module:</strong> {currentLesson.module}<br />
                <strong>Lesson:</strong> {currentLesson.lessonName}
              </p>
              {currentContent && currentContent.trim().length > 0 ? (
                <div className="lesson-content" style={{
                  marginTop: "20px",
                  padding: "5px",
                  border: "1px solid #444",
                  borderRadius: "4px",
                  backgroundColor: "#222",
                  color: "#ccc",
                  whiteSpace: "pre-wrap"
                }}>
                  <ReactMarkdown>{currentContent}</ReactMarkdown>
                </div>
              ) : (
                <div style={{ marginTop: "20px", textAlign: "center" }}>
                  <button onClick={handleGenerateContent} className="button">
                    {loading ? "Generating..." : "Generate Lesson Content"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <p>No lessons found in the outline.</p>
          )}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button onClick={handlePrevLesson} disabled={currentLessonIndex === 0} className="button" style={{ marginRight: "10px" }}>
              Previous Lesson
            </button>
            <button onClick={handleNextLesson} disabled={currentLessonIndex === parsedData.lessons.length - 1} className="button">
              Next Lesson
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GenerateLesson;
