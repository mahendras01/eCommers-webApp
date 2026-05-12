import api from './api.js';
import { setTokens, clearTokens } from '../utils/auth.js';

export function signup(name, email, password, mobileNumber = null) {
  return api.post('/auth/signup', { name, email, password, mobile_number: mobileNumber });
}

export function login(identifier, password) {
  return api.post('/auth/login', { identifier, password }).then((response) => {
    const { access_token } = response.data;
    setTokens(access_token);  // Only set access token - refresh token is in httpOnly cookie
    return response;
  });
}

export function logout() {
  return api.post('/auth/logout').finally(() => {
    clearTokens();  // Clear local tokens regardless of API response
  });
}

export function fetchProfile() {
  return api.get('/auth/profile');
}
