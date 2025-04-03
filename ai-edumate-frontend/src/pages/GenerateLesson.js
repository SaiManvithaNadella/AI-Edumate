import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api';

// A simple parser function to extract course title, modules, and lessons (unchanged)
function parseOutline(outline) {
  if (typeof outline !== "string") {
    console.log("DEBUG: Outline is not a string:", outline);
    return { course_name: "", modules: [] };
  }

  const lines = outline.split("\n").map(line => line.trim()).filter(Boolean);
  let course_name = "";
  const modules = [];
  let currentModule = null;
  
  lines.forEach(line => {
    if (line.toLowerCase().startsWith("course title:")) {
      const parts = line.split(":");
      if (parts.length > 1) {
        course_name = parts.slice(1).join(":").trim();
      }
    } else if (line.toLowerCase().startsWith("module")) {
      if (currentModule) {
        modules.push(currentModule);
      }
      currentModule = { module_name: line, lessons: [] };
    } else if (line.toLowerCase().startsWith("- lesson:")) {
      if (currentModule) {
        const lessonName = line.replace(/^- lesson:/i, "").trim();
        currentModule.lessons.push(lessonName);
      }
    }
  });
  if (currentModule) {
    modules.push(currentModule);
  }
  return { course_name, modules };
}

// A helper function to transform the AI-generated text into styled HTML
function formatLessonContent(rawContent) {
  if (typeof rawContent !== "string") {
    return "<p>No content available.</p>";
  }

  const lines = rawContent.split("\n");
  const htmlLines = lines.map((line) => {
    const trimmed = line.trim();

    // ### => <h3>
    if (trimmed.startsWith("### ")) {
      return `<h3>${trimmed.slice(4)}</h3>`;
    }
    // ## => <h2>
    else if (trimmed.startsWith("## ")) {
      return `<h2>${trimmed.slice(3)}</h2>`;
    }
    // - or * bullet => <li>
    else if (trimmed.match(/^[-*]\s/)) {
      return `<li>${trimmed.slice(2)}</li>`;
    }
    // Otherwise wrap in <p>
    else {
      return `<p>${trimmed}</p>`;
    }
  });

  // If you detect <li> lines, you may want to wrap them in <ul> or <ol>:
  const finalHtml = htmlLines.join("\n");
  return finalHtml;
}

function GenerateLesson() {
  const location = useLocation();
  console.log("DEBUG: location.state =>", location.state); 
  const { outline = "" } = location.state || {};

  const [parsedData, setParsedData] = useState({ course_name: "", modules: [] });
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedLesson, setSelectedLesson] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (outline) {
      const data = parseOutline(outline);
      console.log("DEBUG: Parsed data:", data);
      setParsedData(data);
      // Default: if modules exist, select the first module and its first lesson
      if (data.modules.length > 0) {
        setSelectedModule(data.modules[0].module_name);
        if (data.modules[0].lessons.length > 0) {
          setSelectedLesson(data.modules[0].lessons[0]);
        }
      }
    }
  }, [outline]);

  // Retrieve lessons for the selected module
  const getLessonsForModule = (moduleName) => {
    const mod = parsedData.modules.find((m) => m.module_name === moduleName);
    return mod ? mod.lessons : [];
  };

  // Generate the lesson content from the AI
  const handleGenerateContent = async () => {
    if (!parsedData.course_name || !selectedModule || !selectedLesson) {
      alert("Please select valid options.");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/lesson/generate', null, {
        params: {
          course_name: parsedData.course_name,
          module_name: selectedModule,
          lesson_name: selectedLesson,
        },
      });
      const rawContent = res.data.generated_content || "No content returned.";
      setLessonContent(rawContent);
      setLoading(false);
    } catch (error) {
      console.error("Error generating lesson content:", error);
      setLessonContent("Error generating lesson content.");
      setLoading(false);
    }
  };

  // Format the lesson content for display
  const formattedLessonContent = formatLessonContent(lessonContent);

  return (
    <div>
      <h2 style={{ color: "#e91e63" }}>Generate what you want to learn</h2>
      <div className="lesson-screen">
        {/* Left Side: Display the generated course outline */}
        <div className="lesson-outline">
          <h2>Course Outline</h2>
          <pre style={{ whiteSpace: "pre-wrap", color: "#ccc" }}>{outline}</pre>
        </div>
        {/* Right Side: Lesson Content Generation */}
        <div className="lesson-generator">
          <h2>Lesson Content</h2>
          <div className="select-dropdown">
            <label htmlFor="module-select">Select Module:</label><br />
            <select
              id="module-select"
              value={selectedModule}
              onChange={(e) => {
                setSelectedModule(e.target.value);
                // When module changes, reset lesson selection
                const lessons = getLessonsForModule(e.target.value);
                setSelectedLesson(lessons.length > 0 ? lessons[0] : "");
              }}
            >
              {parsedData.modules.map((mod, index) => (
                <option key={index} value={mod.module_name}>
                  {mod.module_name}
                </option>
              ))}
            </select>
          </div>
          <div className="select-dropdown">
            <label htmlFor="lesson-select">Select Lesson:</label><br />
            <select
              id="lesson-select"
              value={selectedLesson}
              onChange={(e) => setSelectedLesson(e.target.value)}
            >
              {getLessonsForModule(selectedModule).map((les, idx) => (
                <option key={idx} value={les}>
                  {les}
                </option>
              ))}
            </select>
          </div>
          <button onClick={handleGenerateContent} className="button">
            {loading ? "Generating..." : "Generate Lesson Content"}
          </button>
          {lessonContent && (
            <div className="lesson-content" 
                 dangerouslySetInnerHTML={{ __html: formattedLessonContent }}>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerateLesson;
