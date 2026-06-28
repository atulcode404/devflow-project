import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending/receiving cookies (JWT)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
