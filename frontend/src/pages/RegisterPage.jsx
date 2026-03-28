import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, UserPlus, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', fullName: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    try {
      await register(form.email, form.fullName, form.password);
      navigate('/keys');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ maxWidth: 460, color: 'white' }}>
          <h1 style={{ fontSize: '2.8rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 20, color: 'white' }}>
            Get started with encrypted file sharing
          </h1>
          <p style={{ fontSize: '1rem', color: '#a78bfa', lineHeight: 1.7 }}>
            Create your account and generate your personal RSA-2048 key pair.
            Your private key never leaves your device unencrypted.
          </p>
          <div style={{
            marginTop: 40, padding: '20px 24px', borderRadius: 16,
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.25)'
          }}>
            <div style={{ fontWeight: 700, color: '#c4b5fd', marginBottom: 10, fontSize: '0.9rem' }}>
              After registration, you'll:
            </div>
            {[
              '1. Generate your RSA-2048 key pair',
              '2. Set a key password (encrypts your private key)',
              '3. Start sending & receiving encrypted files',
            ].map(s => (
              <div key={s} style={{ fontSize: '0.82rem', color: '#7c6fa0', marginBottom: 6 }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <UserPlus size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e1b2e' }}>Create Account</div>
              <div style={{ fontSize: '0.72rem', color: '#7c6fa0' }}>Free forever, no ads</div>
            </div>
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" type="text" placeholder="Alice Johnson"
                value={form.fullName} onChange={set('fullName')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" placeholder="alice@example.com"
                value={form.email} onChange={set('email')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters" value={form.password}
                  onChange={set('password')} style={{ paddingRight: 44 }} required />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#7c6fa0'
                }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm password</label>
              <input className="form-input" type="password" placeholder="Repeat password"
                value={form.confirm} onChange={set('confirm')} required />
            </div>

            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              padding: '10px 12px', borderRadius: 8,
              background: '#f5f3ff', border: '1px solid #ddd6fe', fontSize: '0.78rem', color: '#5b21b6'
            }}>
              <ShieldCheck size={14} style={{ marginTop: 1, flexShrink: 0 }} />
              Your password encrypts your private key locally. If you forget it, your private key cannot be recovered.
            </div>

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <UserPlus size={16} />}
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#7c6fa0' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}