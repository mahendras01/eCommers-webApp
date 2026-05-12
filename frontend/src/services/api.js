import axios from 'axios';
import { getAccessToken, setTokens, clearTokens } from '../utils/auth.js';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL,
  withCredentials: true,  // ✅ Include httpOnly cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// Store token expiry time
let tokenExpiryTime = null;
let autoRefreshTimeout = null;

// ✅ Get CSRF token from meta tag (if available)
const getCsrfToken = () => {
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return token || null;
};

// ✅ Set up auto-refresh before token expires
const setupAutoRefresh = (expiresIn = 15) => {
  // Clear previous timeout
  if (autoRefreshTimeout) {
    clearTimeout(autoRefreshTimeout);
  }
  
  // Refresh after (expiresIn - 2) minutes to avoid expiry mid-request
  const refreshAfter = (expiresIn - 2) * 60 * 1000;
  
  autoRefreshTimeout = setTimeout(() => {
    refreshAccessToken();
  }, refreshAfter);
};

// Global flag to prevent concurrent refresh attempts
let isRefreshing = false;
let failedQueue = [];

// ✅ Manually refresh access token (now uses httpOnly cookie)
const refreshAccessToken = async () => {
  try {
    // No need to send refresh token - it's in httpOnly cookie
    const response = await axios.post(`${baseURL}/auth/refresh`, {}, {
      withCredentials: true
    });

    const { access_token } = response.data;
    setTokens(access_token);  // Only set access token
    setupAutoRefresh(15);  // Restart auto-refresh timer
    return access_token;
  } catch (error) {
    // Refresh failed - DO NOT redirect here, let caller handle it
    clearTokens();
    throw error;
  }
};

// Request interceptor to add access token & CSRF protection
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ Add CSRF token for POST/PUT/DELETE requests
    const csrfToken = getCsrfToken();
    if (csrfToken && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method?.toUpperCase())) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh & errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // ✅ Do NOT retry refresh endpoint itself
    if (originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If refresh is already in progress, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await refreshAccessToken();
        
        // Process queued requests
        const newToken = getAccessToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          // Retry queued requests
          failedQueue.forEach(({ resolve }) => {
            resolve(api(originalRequest));
          });
          
          failedQueue = [];
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - reject all queued requests
        failedQueue.forEach(({ reject }) => {
          reject(refreshError);
        });
        failedQueue = [];
        
        // Only redirect to login if not already on login page
        if (!window.location.pathname.includes('/login')) {
          clearTokens();
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden (permission denied)
    if (error.response?.status === 403) {
      console.error('Access denied');
      // Optional: redirect to unauthorized page
    }

    return Promise.reject(error);
  }
);

// ✅ Export function to start auto-refresh when app loads
export const startTokenAutoRefresh = () => {
  const token = getAccessToken();
  if (token) {
    setupAutoRefresh(15);  // 15 minute expiry
  }
};

// ✅ Export function to stop auto-refresh on logout
export const stopTokenAutoRefresh = () => {
  if (autoRefreshTimeout) {
    clearTimeout(autoRefreshTimeout);
  }
};

// ✅ Initialize auth on app load (call this in AuthContext)
export const initializeAuth = async () => {
  try {
    // Try to refresh token on app load
    await refreshAccessToken();
    startTokenAutoRefresh();  // Start auto-refresh if successful
    return true; // Indicate success
  } catch (error) {
    // Refresh failed - check if we have a valid access token
    const existingToken = getAccessToken();
    if (existingToken) {
      // Try to validate the existing token by making a test request
      try {
        await api.get('/auth/profile');
        // Token is still valid, start auto-refresh
        startTokenAutoRefresh();
        return true; // User is still authenticated
      } catch (profileError) {
        // Token is also invalid, clear everything
        clearTokens();
        return false;
      }
    } else {
      // No token at all
      clearTokens();
      return false;
    }
  }
};

export default api;
