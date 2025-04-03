import axios from 'axios';

const baseURL = process.env.REACT_APP_BACKEND_URL || 'http://0.0.0.0:10000';

const api = axios.create({
  baseURL,
});

export default api;
