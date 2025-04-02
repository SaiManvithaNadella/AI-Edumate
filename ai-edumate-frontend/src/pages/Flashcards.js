import React, { useState, useEffect } from 'react';
import api from '../api';

function Flashcards() {
  const [lessonContents, setLessonContents] = useState([]);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [flashcards, setFlashcards] = useState([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchContents() {
      try {
        const res = await api.get('/flashcards/contents');
        setLessonContents(res.data);
      } catch (err) {
        console.error('Error fetching lesson contents:', err);
      }
    }
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
    <div className="flashcards-container">
      <h2>Generate Flashcards</h2>
      <form onSubmit={handleGenerateFlashcards}>
        <label>Select Lesson:</label>
        <select 
          value={selectedContentId} 
          onChange={(e) => setSelectedContentId(e.target.value)}
          required
        >
          <option value="">-- Select a Lesson --</option>
          {lessonContents.map(item => (
            <option key={item.content_id} value={item.content_id}>
              {item.course_name} - {item.lesson_name}
            </option>
          ))}
        </select>
        <button type="submit">Generate Flashcards</button>
      </form>
      {error && <div className="flashcards-error">{error}</div>}
      {flashcards.length > 0 && (
        <div className="flashcards-content">
          <div className="flashcard">{flashcards[currentCard]}</div>
          <div className="flashcards-nav">
            <button onClick={handlePrevious} disabled={currentCard === 0}>Previous</button>
            <button onClick={handleNext} disabled={currentCard === flashcards.length - 1}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Flashcards;
