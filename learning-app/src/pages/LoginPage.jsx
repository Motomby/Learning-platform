import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      });
      login(res.data.user, res.data.token);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🎓</div>
          <h1>Welcome back</h1>
          <p>Sign in to continue your learning journey</p>
        </div>

        {/* Show redirect notice if coming from protected route */}
        {location.state?.from && (
          <div className="alert alert-info" style={{ marginBottom: 24 }}>
            <span>🔐</span> Please log in to access that page.
          </div>
        )}

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 24 }}>
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
            <div className="input-icon-wrapper">
              <span className="input-icon">✉️</span>
              <input
                id="login-email"
                className="form-input"
                type="email"
                name="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                autoFocus
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">Password</label>
            </div>
            <div className="input-icon-wrapper">
              <span className="input-icon">🔒</span>
              <input
                id="login-password"
                className="form-input"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{ paddingRight: 16 }}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-full btn-lg"
            disabled={loading}
          >
            {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '24px 0', textAlign: 'center' }}>
          <div style={{
            padding: '16px 20px',
            background: 'rgba(108,99,255,0.07)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            fontSize: 13,
            color: 'var(--text-secondary)',
          }}>
            🔐 Your account is protected with industry-standard JWT tokens and bcrypt password hashing.
          </div>
        </div>

        <div className="auth-footer">
          New to LearnHub?{' '}
          <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 600 }}>
            Create a free account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
