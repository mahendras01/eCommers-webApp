/**
 * Secure API client with CSRF protection and security headers
 */

import axios from 'axios';
import { getAccessToken, setTokens, clearTokens, isTokenExpired, setupAutoRefresh } from '../utils/auth_FIXED.js';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Include cookies in requests (for httpOnly refresh token)
  withCredentials: true
});

let autoRefreshInterval = null;

/**
 * Request interceptor
 * - Adds access token to Authorization header
 * - Adds CSRF token for state-changing requests
 */
api.interceptors.request.use(
  (config) => {
    // Add authorization header
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add CSRF token for state-changing methods
    if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    // Add security headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handles token refresh on 401
 * - Clears tokens on authentication failure
 * - Generic error messages to user
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to refresh token
        const refreshResponse = await axios.post(
          `${baseURL}/auth/refresh`,
          {},
          { withCredentials: true }  // Include cookies
        );

        const { access_token } = refreshResponse.data;
        
        // Store new access token
        setTokens(access_token, null);

        // Update authorization header
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        // Retry original request
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed - logout user
        console.error('Token refresh failed, logging out');
        clearTokens();
        
        // Redirect to login
        window.location.href = '/login?reason=session-expired';
        
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status === 403) {
      console.error('Access forbidden');
      clearTokens();
      window.location.href = '/login?reason=forbidden';
    }

    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
      // Don't expose detailed error to user
    }

    return Promise.reject(error);
  }
);

/**
 * Setup automatic token refresh before expiration
 */
export const setupTokenAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  autoRefreshInterval = setupAutoRefresh(async () => {
    try {
      const refreshResponse = await axios.post(
        `${baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      );
      
      const { access_token } = refreshResponse.data;
      setTokens(access_token, null);
      console.log('✓ Token refreshed automatically');
    } catch (error) {
      console.error('Auto-refresh failed');
      clearTokens();
    }
  });
};

/**
 * Stop automatic token refresh
 */
export const stopTokenAutoRefresh = () => {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
  }
};

export default api;
