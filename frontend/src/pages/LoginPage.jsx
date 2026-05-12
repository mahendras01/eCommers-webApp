import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { getPendingBuyNow, clearPendingBuyNow } from '../utils/cartStorage.js';

const emailPattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const phonePattern = /^\d{10}$/;

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const validateIdentifier = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return false;
    return emailPattern.test(trimmed) || phonePattern.test(trimmed);
  };

  const getIdentifierError = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Email or mobile number is required.';
    if (!emailPattern.test(trimmed) && !phonePattern.test(trimmed)) {
      return 'Enter a valid email address or 10-digit mobile number.';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const identifierError = getIdentifierError(identifier);
    if (identifierError) {
      setError(identifierError);
      return;
    }

    setLoading(true);
    try {
      await auth.login(identifier, password);
      const pending = getPendingBuyNow();
      if (pending?.redirectTo) {
        clearPendingBuyNow();
        navigate(pending.redirectTo);
      } else if (location.state?.from) {
        navigate(location.state.from);
      } else {
        navigate('/profile');
      }
    } catch (err) {
      const response = err?.response;
      if (response?.status === 401) {
        setError(response.data?.detail || 'Invalid credentials. Please try again.');
      } else if (response?.status) {
        setError(response.data?.detail || `Login failed with status ${response.status}. Please try again.`);
      } else {
        setError('Unable to connect to server. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md rounded-3xl bg-white p-8 shadow-sm">
      <h1 className="text-2xl font-semibold text-slate-900">Login</h1>
      <p className="mt-2 text-slate-600">Secure access to your account and order history.</p>

      {error && <div className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700">Email or Mobile Number</label>
          <input
            type="text"
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
            placeholder="name@example.com or 9876543210"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-slate-900"
            placeholder="Enter your password"
            required
            minLength={8}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
