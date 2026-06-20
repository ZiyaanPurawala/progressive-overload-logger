import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate   = useNavigate();
  const [form, setForm]   = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) navigate('/');
    else setError(result.error);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-mark">
            <svg viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" width="22" height="22">
              <path d="M6 12h3l2-7 2 14 2-7h3"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.125rem' }}>
            Over<span style={{ color: 'var(--accent)' }}>load</span>
          </span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-sub">Log in to track your gains</p>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem',
            fontSize: '0.875rem', color: 'var(--danger)', marginBottom: '1.25rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email" required
              className="form-input"
              placeholder="you@gym.com"
              value={form.email}
              onChange={set('email')}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password" required
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full" style={{ marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="auth-footer">
          No account? <Link to="/register">Create one free</Link>
        </p>
      </div>
    </div>
  );
}
