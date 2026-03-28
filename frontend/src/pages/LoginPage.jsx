import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, ShieldCheck, Zap, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div style={{ maxWidth: 460, color: 'white' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: 999, padding: '6px 16px', marginBottom: 32,
            fontSize: '0.8rem', fontWeight: 600, color: '#c4b5fd'
          }}>
            <ShieldCheck size={14} /> Military-grade encryption
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 20, color: 'white' }}>
            Secure File Transfer with Hybrid Cryptography
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#a78bfa', lineHeight: 1.7, marginBottom: 40 }}>
            AES-256-GCM file encryption + RSA-2048 key transport + SHA-256 digital signatures.
            Your files stay private — always.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon: Lock, label: 'AES-256-GCM', desc: 'Files encrypted with symmetric keys' },
              { icon: Key, label: 'RSA-2048 Key Transport', desc: 'Keys wrapped with your public key' },
              { icon: Zap, label: 'Digital Signatures', desc: 'SHA-256 integrity verification' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon size={18} color="#a78bfa" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white' }}>{label}</div>
                  <div style={{ fontSize: '0.78rem', color: '#7c6fa0' }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Lock size={20} color="white" />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e1b2e' }}>SecureVault</div>
              <div style={{ fontSize: '0.72rem', color: '#7c6fa0' }}>Sign in to your account</div>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger" style={{ marginBottom: 20 }}>
              <Lock size={14} /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-input"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  style={{ paddingRight: 44 }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={{
                    position: 'absolute', right: 12, top: '50%',
                    transform: 'translateY(-50%)', background: 'none',
                    border: 'none', cursor: 'pointer', color: '#7c6fa0'
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
              {loading ? <span className="spinner" /> : <Lock size={16} />}
              {loading ? 'Signing in...' : 'Sign in securely'}
            </button>
          </form>

          <div className="divider" />
          <p style={{ textAlign: 'center', fontSize: '0.85rem', color: '#7c6fa0' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#7c3aed', fontWeight: 700, textDecoration: 'none' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}