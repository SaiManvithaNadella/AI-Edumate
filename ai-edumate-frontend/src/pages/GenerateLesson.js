import React, { useState, useEffect } from 'react';
import api from '../api';

function GenerateLesson() {
  const [courses, setCourses] = useState([]);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);

  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedLesson, setSelectedLesson] = useState('');
  const [lessonContent, setLessonContent] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get('/course/list');
        setCourses(res.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
      setModules([]);
      setLessons([]);
      setSelectedModule('');
      setSelectedLesson('');
      return;
    }
    const fetchModules = async () => {
      try {
        const res = await api.get('/modules', {
          params: { course_id: Number(selectedCourse) }
        });
        setModules(res.data);
        setLessons([]);
        setSelectedModule('');
        setSelectedLesson('');
      } catch (error) {
        console.error('Error fetching modules:', error);
      }
    };
    fetchModules();
  }, [selectedCourse]);

  useEffect(() => {
    if (!selectedModule) {
      setLessons([]);
      setSelectedLesson('');
      return;
    }
    const fetchLessons = async () => {
      try {
        const res = await api.get('/lesson/list', {
          params: { module_id: Number(selectedModule) }
        });
        setLessons(res.data);
        setSelectedLesson('');
      } catch (error) {
        console.error('Error fetching lessons:', error);
      }
    };
    fetchLessons();
  }, [selectedModule]);

  const handleGenerateLesson = async (e) => {
    e.preventDefault();
    const courseObj = courses.find(c => c.course_id === Number(selectedCourse));
    const moduleObj = modules.find(m => m.module_id === Number(selectedModule));
    const lessonObj = lessons.find(l => l.lesson_id === Number(selectedLesson));

    if (!courseObj || !moduleObj || !lessonObj) {
      alert('Please select a valid course, module, and lesson.');
      return;
    }

    try {
      const res = await api.post('/lesson/generate', null, {
        params: {
          course_name: courseObj.course_name,
          module_name: moduleObj.module_name,
          lesson_name: lessonObj.lesson_name
        }
      });
      setLessonContent(res.data.generated_content || 'No content returned.');
    } catch (error) {
      console.error('Error generating lesson content:', error);
      setLessonContent('Error generating lesson content.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Generate Lesson Content</h2>
      <form onSubmit={handleGenerateLesson} className="space-y-4">
        <div>
          <label className="block font-medium">Course:</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Select Course</option>
            {courses.map(course => (
              <option key={course.course_id} value={course.course_id}>
                {course.course_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Module:</label>
          <select
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Select Module</option>
            {modules.map(mod => (
              <option key={mod.module_id} value={mod.module_id}>
                {mod.module_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-medium">Lesson:</label>
          <select
            value={selectedLesson}
            onChange={(e) => setSelectedLesson(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">Select Lesson</option>
            {lessons.map(les => (
              <option key={les.lesson_id} value={les.lesson_id}>
                {les.lesson_name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
          Generate Lesson
        </button>
      </form>
      {lessonContent && (
        <div className="mt-6">
          <h3 className="font-bold text-lg">Lesson Content:</h3>
          <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">{lessonContent}</div>
        </div>
      )}
    </div>
  );
}

export default GenerateLesson;
