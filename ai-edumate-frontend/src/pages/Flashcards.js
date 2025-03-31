import React, { useState, useEffect } from 'react';
import api from '../api';

function Flashcards() {
  const [lessonContents, setLessonContents] = useState([]);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchContents = async () => {
      try {
        const res = await api.get('/flashcards/contents');
        setLessonContents(res.data);
      } catch (err) {
        console.error('Error fetching lesson contents:', err);
      }
    };
    fetchContents();
  }, []);

  const handleGenerateFlashcards = async (e) => {
    e.preventDefault();
    if (!selectedContentId) {
      alert("Please select a lesson.");
      return;
    }
    try {
      const res = await api.post('/flashcards/generate', null, {
        params: { content_id: Number(selectedContentId) }
      });
      if (res.data.error) {
        setError(res.data.error);
        setFlashcards([]);
        return;
      }
      const flashcardText = res.data.flashcards || "";
      if (!flashcardText.trim()) {
        setError("No flashcards returned.");
        setFlashcards([]);
        return;
      }
      const cards = flashcardText.split('\n').filter(card => card.trim() !== '');
      setFlashcards(cards);
      setCurrentCard(0);
      setError('');
    } catch (err) {
      console.error("Error generating flashcards:", err);
      setError("Error generating flashcards.");
      setFlashcards([]);
    }
  };

  const handleNext = () => {
    if (currentCard < flashcards.length - 1) {
      setCurrentCard(currentCard + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow rounded">
      <h2 className="text-2xl font-bold mb-4">Flashcards Generator</h2>
      <form onSubmit={handleGenerateFlashcards} className="space-y-4">
        <div>
          <label className="block font-medium">Select Lesson:</label>
          <select 
            value={selectedContentId} 
            onChange={(e) => setSelectedContentId(e.target.value)}
            required
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">-- Select a Lesson --</option>
            {lessonContents.map((item) => (
              <option key={item.content_id} value={item.content_id}>
                {item.course_name} - {item.lesson_name}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition">
          Generate Flashcards
        </button>
      </form>

      {error && (
        <div className="text-red-600 font-semibold mt-4">
          {error}
        </div>
      )}

      {flashcards.length > 0 && (
        <div className="mt-6">
          <div className="bg-gray-100 p-4 rounded shadow">
            {flashcards[currentCard]}
          </div>
          <div className="mt-4 flex justify-between">
            <button onClick={handlePrevious} disabled={currentCard === 0} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition">
              Previous
            </button>
            <button onClick={handleNext} disabled={currentCard === flashcards.length - 1} className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Flashcards;
