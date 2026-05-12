import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getAccessToken, setTokens, clearTokens } from '../utils/auth.js';
import { login as apiLogin, logout as apiLogout, fetchProfile, signup as apiSignup } from '../services/auth.js';
import { startTokenAutoRefresh, stopTokenAutoRefresh, initializeAuth } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // ✅ First try to refresh token (sets access token in memory)
        const refreshSuccess = await initializeAuth();
        
        if (refreshSuccess) {
          // ✅ Then fetch user profile if token refresh succeeded
          const response = await fetchProfile();
          setUser(response.data);
        } else {
          // Token refresh failed, user is not authenticated
          setUser(null);
        }
      } catch (error) {
        // Profile fetch failed even after successful refresh
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    
    // ✅ Cleanup: stop auto-refresh on unmount
    return () => {
      stopTokenAutoRefresh();
    };
  }, []);

  const login = async (identifier, password) => {
    const response = await apiLogin(identifier, password);
    const profile = await fetchProfile();
    setUser(profile.data);
    startTokenAutoRefresh();  // ✅ Start auto-refresh after successful login
    return profile.data;
  };

  const signup = async (name, email, mobileNumber, password) => {
    const response = await apiSignup(name, email, password, mobileNumber || null);
    return response.data;
  };

  const logout = () => {
    apiLogout();
    stopTokenAutoRefresh();  // ✅ Stop auto-refresh on logout
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, logout, signup, isAuthenticated: Boolean(user) }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
