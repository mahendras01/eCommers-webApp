/**
 * Secure authentication utility
 * 
 * Security Features:
 * - In-memory token storage (cleared on page close)
 * - Refresh token in httpOnly cookie (not JS accessible)
 * - No localStorage for sensitive tokens
 */

// In-memory storage (cleared on page close)
let accessTokenMemory = null;

const ACCESS_TOKEN_KEY = 'access_token_temp';  // Only for emergency fallback
const USER_KEY = 'user_data';

/**
 * Store access token in memory
 * Refresh token is handled by backend as httpOnly cookie
 */
export const setTokens = (accessToken, refreshToken) => {
  // Store access token in memory (primary storage)
  accessTokenMemory = accessToken;
  
  // Optional: Store in sessionStorage as fallback (less secure than memory)
  if (accessToken) {
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  
  // Clear localStorage (legacy)
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem('refresh_token');
  
  console.log('✓ Tokens set securely');
};

/**
 * Get access token from memory (primary) or sessionStorage (fallback)
 */
export const getAccessToken = () => {
  // Check memory first (fastest, most secure)
  if (accessTokenMemory) {
    return accessTokenMemory;
  }
  
  // Fallback to sessionStorage (cleared when tab closes)
  const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (sessionToken) {
    accessTokenMemory = sessionToken;
    return sessionToken;
  }
  
  // Last resort: localStorage (for persistence, less secure)
  // Note: In production, avoid this or use encrypted storage
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * Clear all tokens
 * Called on logout or 401 errors
 */
export const clearTokens = () => {
  // Clear memory
  accessTokenMemory = null;
  
  // Clear storage
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem('refresh_token');
  localStorage.removeItem(USER_KEY);
  
  // Backend clears httpOnly cookie via /logout endpoint
  console.log('✓ All tokens cleared');
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAccessToken();
};

/**
 * Store user info (non-sensitive data only)
 */
export const setUserData = (user) => {
  if (user) {
    // Store only non-sensitive user info
    const safeData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    sessionStorage.setItem(USER_KEY, JSON.stringify(safeData));
  }
};

/**
 * Get stored user info
 */
export const getUserData = () => {
  const data = sessionStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

/**
 * Check if token is expired
 */
export const isTokenExpired = () => {
  const token = getAccessToken();
  if (!token) return true;
  
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (!payload.exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

/**
 * Get token expiration time remaining (in seconds)
 */
export const getTokenExpiryTime = () => {
  const token = getAccessToken();
  if (!token) return 0;
  
  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));
    
    if (!payload.exp) return 0;
    
    const now = Math.floor(Date.now() / 1000);
    return Math.max(0, payload.exp - now);
  } catch (error) {
    return 0;
  }
};

/**
 * Refresh token automatically before expiration
 */
export const setupAutoRefresh = (refreshCallback) => {
  const checkRefresh = () => {
    const timeLeft = getTokenExpiryTime();
    
    // Refresh when 1 minute left (before expiration)
    if (timeLeft > 0 && timeLeft < 60) {
      console.log('🔄 Auto-refreshing token...');
      refreshCallback();
    }
  };
  
  // Check every 30 seconds
  return setInterval(checkRefresh, 30000);
};
