import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { Icons } from '../components/Icons';

const getStrength = (pw) => {
  if (!pw || pw.length < 8) return 'weak';
  const score = [/[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(pw)).length;
  return score <= 1 ? 'weak' : score === 2 ? 'medium' : 'strong';
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', username: '', email: '', password: '', confirmPassword: '' });
  const [show, setShow] = useState({ pw: false, cpw: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getStrength(form.password);
  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setError(''); };

  const validate = () => {
    if (!form.fullName.trim()) return 'Full name is required.';
    if (!form.username.trim() || form.username.length < 3) return 'Username must be at least 3 characters.';
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return 'Username: letters, numbers and underscores only.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email address.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirmPassword) return 'Passwords do not match.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        fullName: form.fullName.trim(),
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
      });
      navigate('/verify-email', {
        state: {
          email: form.email.trim(),
          devCode: res.data?.devVerificationCode || '',
        },
      });
    } catch (err) {
      if (!err.response) {
        setError('Unable to reach backend API. Please verify server status & CORS settings.');
      } else {
        setError(err.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-page-bg" />
      <div className="auth-card">
        <div className="auth-card-logo">
          <Icons.GraduationCap size={24} color="#fff" strokeWidth={2} />
        </div>
        <div className="auth-card-header">
          <h1>Create your account</h1>
          <p>Join thousands of learners on LearnHub</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <Icons.AlertCircle size={16} />
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-fullName">Full Name</label>
            <div className="input-wrapper">
              <span className="input-icon"><Icons.User size={16} /></span>
              <input id="reg-fullName" className="form-input" type="text" name="fullName" placeholder="Enter your full name" value={form.fullName} onChange={handleChange} autoComplete="name" />
            </div>
          </div>

          {/* Username + Email */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-username">Username</label>
              <div className="input-wrapper">
                <span className="input-icon" style={{ fontSize: 13, fontWeight: 700 }}>@</span>
                <input id="reg-username" className="form-input" type="text" name="username" placeholder="Choose a username" value={form.username} onChange={handleChange} autoComplete="username" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email</label>
              <div className="input-wrapper">
                <span className="input-icon"><Icons.Mail size={16} /></span>
                <input id="reg-email" className="form-input" type="email" name="email" placeholder="Enter your email" value={form.email} onChange={handleChange} autoComplete="email" />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><Icons.Lock size={16} /></span>
              <input id="reg-password" className="form-input" type={show.pw ? 'text' : 'password'} name="password" placeholder="Min. 8 characters" value={form.password} onChange={handleChange} autoComplete="new-password" style={{ paddingRight: 44 }} />
              <button type="button" className="input-action" onClick={() => setShow(s => ({ ...s, pw: !s.pw }))}>
                {show.pw ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
            {form.password && (
              <div>
                <div className="strength-bars">
                  {[0,1,2].map(i => (
                    <div key={i} className={`strength-bar ${strength === 'weak' && i === 0 ? 'weak' : strength === 'medium' && i <= 1 ? 'medium' : strength === 'strong' ? 'strong' : ''}`} />
                  ))}
                </div>
                <div className={`strength-label ${strength}`}>
                  {strength === 'weak' ? 'Weak — add uppercase, numbers & symbols' : strength === 'medium' ? 'Medium — getting stronger' : 'Strong password'}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password</label>
            <div className="input-wrapper">
              <span className="input-icon"><Icons.Lock size={16} /></span>
              <input id="reg-confirm" className={`form-input ${form.confirmPassword && form.password !== form.confirmPassword ? 'error' : ''}`} type={show.cpw ? 'text' : 'password'} name="confirmPassword" placeholder="Repeat your password" value={form.confirmPassword} onChange={handleChange} autoComplete="new-password" style={{ paddingRight: 44 }} />
              <button type="button" className="input-action" onClick={() => setShow(s => ({ ...s, cpw: !s.cpw }))}>
                {show.cpw ? <Icons.EyeOff size={16} /> : <Icons.Eye size={16} />}
              </button>
            </div>
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <div className="form-error"><Icons.AlertCircle size={12} /> Passwords do not match</div>
            )}
            {form.confirmPassword && form.password === form.confirmPassword && (
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', fontSize: 12, color: 'var(--success)', fontWeight: 500 }}>
                <Icons.CheckCircle size={12} /> Passwords match
              </div>
            )}
          </div>

          <button id="register-submit-btn" type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><span className="spinner spinner-sm" /> Creating account...</> : <>Create Account <Icons.ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="security-badge">
          <Icons.Shield size={14} />
  
        </div>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Log in here</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
