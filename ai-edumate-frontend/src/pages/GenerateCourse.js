import React, { useState } from 'react';
import api from '../api';

function GenerateCourse() {
  const [topic, setTopic] = useState('');
  const [numModules, setNumModules] = useState(5);
  const [outlineResponse, setOutlineResponse] = useState(null);
  const [courseList, setCourseList] = useState([]);

  const handleGenerateOutline = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/course/generate-outline', null, {
        params: { topic, num_modules: numModules }
      });
      setOutlineResponse(res.data);
    } catch (error) {
      console.error(error);
      setOutlineResponse({ error: 'Error generating course outline.' });
    }
  };

  const handleGetCourses = async () => {
    try {
      const res = await api.get('/course/list');
      setCourseList(res.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Generate Course Outline</h2>
      <form onSubmit={handleGenerateOutline} className="space-y-4">
        <div>
          <label className="block font-medium">Topic:</label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <div>
          <label className="block font-medium">Number of Modules:</label>
          <input
            type="number"
            value={numModules}
            onChange={(e) => setNumModules(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">
          Generate Outline
        </button>
      </form>
      {outlineResponse && (
        <div className="mt-6">
          <h3 className="font-bold text-lg">Outline Response:</h3>
          <pre className="bg-gray-100 p-4 rounded">{JSON.stringify(outlineResponse, null, 2)}</pre>
        </div>
      )}
      <div className="mt-6">
        <button onClick={handleGetCourses} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition">
          Get All Courses
        </button>
        {courseList.length > 0 && (
          <div className="mt-4">
            <h3 className="font-bold text-lg">Existing Courses:</h3>
            <ul className="list-disc pl-5">
              {courseList.map((c) => (
                <li key={c.course_id}>{c.course_name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default GenerateCourse;
