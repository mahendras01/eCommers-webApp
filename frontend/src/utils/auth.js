// src/utils/auth.js
// ✅ SECURITY: In-memory storage for access token (cleared on page close)
// Refresh token is now handled by httpOnly cookie (backend only)
// NEVER use localStorage for sensitive tokens!

let accessTokenMemory = null;  // In-memory storage
const ACCESS_TOKEN_KEY = 'access_token_session';  // SessionStorage only (fallback)

// Initialize tokens from storage on page load
const initializeTokens = () => {
  if (!accessTokenMemory) {
    accessTokenMemory = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }
};

// Call initialization
initializeTokens();

export const setTokens = (accessToken) => {
  // Access token in memory (cleared when page closes)
  accessTokenMemory = accessToken;
  
  // Fallback: Store in sessionStorage (cleared when tab closes)
  sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  
  // No longer store refresh token - it's in httpOnly cookie
};

export const getAccessToken = () => {
  // Return in-memory token first (fastest)
  if (accessTokenMemory) {
    return accessTokenMemory;
  }
  
  // Fallback to sessionStorage (cleared when tab closes)
  return sessionStorage.getItem(ACCESS_TOKEN_KEY);
};

export const clearTokens = () => {
  // Clear in-memory token
  accessTokenMemory = null;
  
  // Also clear any fallback sessionStorage token
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
};

export const isAuthenticated = () => {
  return !!getAccessToken();
};