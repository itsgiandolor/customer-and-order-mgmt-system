import axios from 'axios';

// Create a customized axios instance
const apiClient = axios.create({
  // This looks for your environment variable, defaulting to localhost if not found
  baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// We can add interceptors here later to automatically attach Google OAuth tokens!
apiClient.interceptors.request.use((config) => {
  // Example: 
  // const token = localStorage.getItem('token');
  // if (token) {
  //   config.headers.Authorization = `Bearer ${token}`;
  // }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;