import { API_URL } from '../config';

/**
 * Helper to make authenticated API requests
 * Includes credentials (cookies) and optionally an Authorization header
 */
export const authFetch = async (endpoint, options = {}) => {
  // Get token from localStorage if available (fallback for mobile)
  const token = localStorage.getItem('auth_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add Authorization header if we have a token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Still send cookies when available
  });

  return response;
};

/**
 * Save auth token to localStorage (for mobile compatibility)
 */
export const saveAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  }
};

/**
 * Clear auth token from localStorage
 */
export const clearAuthToken = () => {
  localStorage.removeItem('auth_token');
};

/**
 * Get auth token from localStorage
 */
export const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};
