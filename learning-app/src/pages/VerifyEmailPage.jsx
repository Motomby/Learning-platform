import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const initialEmail = location.state?.email || '';
  const [form, setForm] = useState({ email: initialEmail, code: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.code) {
      setError('Email and verification code are required.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email', {
        email: form.email.trim(),
        code: form.code.trim(),
      });
      login(res.data.user, res.data.token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!form.email) {
      setError('Please enter your email to resend the code.');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/resend-verification', { email: form.email.trim() });
      setMessage('A new code was sent to your email.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to resend code. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card-header">
          <h1>Verify your email</h1>
          <p>Enter the 6-digit code sent to your inbox.</p>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: 24 }}>{error}</div>}
        {message && <div className="alert alert-success" style={{ marginBottom: 24 }}>{message}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="verify-email">Email Address</label>
            <input
              id="verify-email"
              className="form-input"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="verify-code">Verification Code</label>
            <input
              id="verify-code"
              className="form-input"
              type="text"
              name="code"
              placeholder="Enter 6-digit code"
              value={form.code}
              onChange={handleChange}
              maxLength={6}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </button>
        </form>

        <div className="auth-footer" style={{ marginTop: 16 }}>
          Didn’t receive a code? <button type="button" className="btn btn-link" onClick={handleResend} disabled={loading}>Resend code</button>
        </div>

        <div className="auth-footer" style={{ marginTop: 16 }}>
          Already verified? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
