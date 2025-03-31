import axios from 'axios';

// If you prefer .env usage, do:
// const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

const baseURL = 'http://localhost:8000';

const api = axios.create({
  baseURL,
});

export default api;
