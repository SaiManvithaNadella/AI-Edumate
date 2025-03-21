# backend/app/services/ai_tutor.py

import os
import openai
import numpy as np
import faiss

# Set your OpenAI API key from environment variables
openai.api_key = os.environ.get("OPENAI_API_KEY")

# Dummy data: In production, you would load your document embeddings and texts.
# For demonstration, we'll use two sample documents.
documents = [
    "This document explains the basics of artificial intelligence, including machine learning and deep learning techniques.",
    "This text covers advanced topics in AI such as reinforcement learning, neural networks, and practical applications."
]
# Assume we have precomputed embeddings for our documents (dummy 3-d embeddings here)
document_embeddings = np.array([
    [0.1, 0.2, 0.3],
    [0.4, 0.1, 0.5]
]).astype("float32")

# Create a FAISS index for cosine similarity search (for simplicity, using L2 distance)
d = document_embeddings.shape[1]
index = faiss.IndexFlatL2(d)
index.add(document_embeddings)

def get_query_embedding(query: str) -> np.ndarray:
    """
    Dummy embedding function.
    In a real implementation, use OpenAI's Embedding API to get query embeddings.
    """
    # For demonstration, we return a fixed embedding.
    return np.array([[0.2, 0.2, 0.2]]).astype("float32")

def retrieve_context(query: str, top_k: int = 1) -> str:
    """
    Retrieve top-k related document texts using FAISS.
    """
    query_embedding = get_query_embedding(query)
    distances, indices = index.search(query_embedding, top_k)
    retrieved_texts = [documents[idx] for idx in indices[0]]
    # Combine retrieved texts into one context string.
    context = "\n".join(retrieved_texts)
    return context

def get_answer(query: str) -> str:
    """
    Generate an AI tutor response using RAG.
    """
    context = retrieve_context(query)
    prompt = (
        f"Using the following context:\n{context}\n\n"
        f"Answer the query: {query}\n"
        "Provide a clear, concise, and accurate response."
    )
    response = openai.Completion.create(
         model="text-davinci-003",
         prompt=prompt,
         max_tokens=150,
         temperature=0.7,
    )
    answer = response.choices[0].text.strip()
    return answer
