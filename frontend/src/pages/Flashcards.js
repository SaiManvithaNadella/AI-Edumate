// src/pages/Flashcards.jsx
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './Flashcards.css';

const Flashcards = () => {
  const [flashcardSets, setFlashcardSets] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    topics: ''
  });

  useEffect(() => {
    fetchFlashcardSets();
  }, []);

  const fetchFlashcardSets = async () => {
    try {
      const response = await api.get('/flashcards');
      setFlashcardSets(response.data);
    } catch (error) {
      console.error('Error fetching flashcard sets:', error);
      setError('Failed to load flashcard sets');
    }
  };

  const handleGenerateFlashcards = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = {
        title: formData.title,
        content: formData.content,
        topics: formData.topics ? formData.topics.split(',').map(topic => topic.trim()) : []
      };

      await api.post('/flashcards/generate', data);
      await fetchFlashcardSets();
      setShowCreateForm(false);
      resetForm();
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setError('Failed to generate flashcards');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      topics: ''
    });
  };

  const selectSet = (set) => {
    setSelectedSet(set);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  const nextCard = () => {
    if (currentCardIndex < selectedSet.cards.length - 1) {
      setCurrentCardIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const previousCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const flipCard = () => {
    setIsFlipped(prev => !prev);
  };

  return (
    <div className="flashcards-page">
      <header className="page-header">
        <h2>Flashcards</h2>
        <button className="create-btn" onClick={() => setShowCreateForm(true)}>
          <i className="fas fa-plus"></i> Generate Flashcards
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="flashcard-form-container">
          <form onSubmit={handleGenerateFlashcards}>
            <h3>Generate Flashcards</h3>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content (optional)</label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Paste content here to generate flashcards from it"
                rows="5"
              />
            </div>

            <div className="form-group">
              <label htmlFor="topics">Topics (comma-separated)</label>
              <input
                type="text"
                id="topics"
                value={formData.topics}
                onChange={(e) => setFormData(prev => ({ ...prev, topics: e.target.value }))}
                placeholder="e.g., Linear Algebra, Calculus, Statistics"
              />
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={isLoading}>
                {isLoading ? 'Generating...' : 'Generate Flashcards'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flashcards-content">
        <div className="flashcard-sets">
          <h3>Your Flashcard Sets</h3>
          {flashcardSets.length > 0 ? (
            <div className="sets-list">
              {flashcardSets.map(set => (
                <div
                  key={set.id}
                  className={`set-item ${selectedSet?.id === set.id ? 'active' : ''}`}
                  onClick={() => selectSet(set)}
                >
                  <h4>{set.title}</h4>
                  <p>{set.cards.length} cards</p>
                  <span className="date">
                    Created: {new Date(set.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No flashcard sets yet</p>
            </div>
          )}
        </div>

        <div className="flashcard-viewer">
          {selectedSet ? (
            <>
              <div className="card-container" onClick={flipCard}>
                <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
                  <div className="card-front">
                    <span className="card-number">
                      Card {currentCardIndex + 1} of {selectedSet.cards.length}
                    </span>
                    <div className="card-content">
                      {selectedSet.cards[currentCardIndex].front}
                    </div>
                    <span className="flip-hint">Click to flip</span>
                  </div>
                  <div className="card-back">
                    <span className="card-number">
                      Card {currentCardIndex + 1} of {selectedSet.cards.length}
                    </span>
                    <div className="card-content">
                      {selectedSet.cards[currentCardIndex].back}
                    </div>
                    <span className="flip-hint">Click to flip</span>
                  </div>
                </div>
              </div>

              <div className="card-controls">
                <button onClick={previousCard} disabled={currentCardIndex === 0}>
                  <i className="fas fa-chevron-left"></i> Previous
                </button>
                <button onClick={nextCard} disabled={currentCardIndex === selectedSet.cards.length - 1}>
                  Next <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <i className="fas fa-clone"></i>
              <h3>Select a Flashcard Set</h3>
              <p>Choose a flashcard set from the left to start studying</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Flashcards;