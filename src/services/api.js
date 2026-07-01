import axios from 'axios';

// Dynamically resolve the backend API base URL
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Helper to resolve the root backend host (removes /api suffix if present)
const getBackendBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api$/, '');
  }
  return '';
};

// Recursively walks the response payload to rewrite relative uploads paths to absolute URL
const rewriteUploadUrls = (obj, baseUrl) => {
  if (!obj || !baseUrl) return obj;
  if (typeof obj === 'string') {
    if (obj.startsWith('/uploads/')) {
      return `${baseUrl}${obj}`;
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => rewriteUploadUrls(item, baseUrl));
  }
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        newObj[key] = rewriteUploadUrls(obj[key], baseUrl);
      }
    }
    return newObj;
  }
  return obj;
};

// Add request interceptor to attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle global errors and rewrite asset URLs in production
api.interceptors.response.use(
  (response) => {
    const baseUrl = getBackendBaseUrl();
    if (response.data && baseUrl) {
      response.data = rewriteUploadUrls(response.data, baseUrl);
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // If we are not already on the login page, redirect to it
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
