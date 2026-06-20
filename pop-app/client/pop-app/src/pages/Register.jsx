import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', unitPreference: 'kg' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true);
    const result = await register(form.name, form.email, form.password, form.unitPreference);
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

        <h1 className="auth-title">Start tracking</h1>
        <p className="auth-sub">Create your free Overload account</p>

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
            <label className="form-label">Full name</label>
            <input type="text" required className="form-input" placeholder="Your name"
              value={form.name} onChange={set('name')} />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" required className="form-input" placeholder="you@gym.com"
              value={form.email} onChange={set('email')} />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" required className="form-input" placeholder="Min. 6 characters"
              value={form.password} onChange={set('password')} />
          </div>
          <div className="form-group">
            <label className="form-label">Weight unit</label>
            <select className="form-input" value={form.unitPreference} onChange={set('unitPreference')}>
              <option value="kg">Kilograms (kg)</option>
              <option value="lbs">Pounds (lbs)</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary w-full" disabled={loading}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
}
