import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, Eye, EyeOff, RefreshCw, Copy, CheckCircle, AlertTriangle, Lock } from 'lucide-react';
import { keysAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function KeysPage() {
  const { user, updateKeyStatus } = useAuth();
  const [keyInfo, setKeyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [keyPassword, setKeyPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRegenConfirm, setShowRegenConfirm] = useState(false);

  useEffect(() => {
    keysAPI.getInfo()
      .then(r => setKeyInfo(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (keyPassword.length < 8) return toast.error('Key password must be at least 8 characters');
    if (keyPassword !== confirmPassword) return toast.error('Passwords do not match');
    setGenerating(true);
    try {
      const res = await keysAPI.generate(keyPassword);
      setKeyInfo(res.data.data);
      updateKeyStatus(true);
      toast.success('RSA-2048 key pair generated successfully!');
      setKeyPassword('');
      setConfirmPassword('');
      setShowRegenConfirm(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Key generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const copyPublicKey = () => {
    navigator.clipboard.writeText(keyInfo?.publicKey || '');
    setCopied(true);
    toast.success('Public key copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
      <div className="spinner spinner-violet" style={{ width: 32, height: 32 }} />
    </div>
  );

  const hasKeys = keyInfo?.keyGenerated;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Key Management</h1>
        <p className="page-subtitle">Manage your RSA-2048 cryptographic key pair</p>
      </div>

      {/* Status banner */}
      <div className={`alert ${hasKeys ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 28 }}>
        {hasKeys ? <CheckCircle size={16} style={{ flexShrink: 0 }} /> : <AlertTriangle size={16} style={{ flexShrink: 0 }} />}
        <div>
          <strong>{hasKeys ? 'Key pair active' : 'No key pair generated'}</strong>
          {' — '}
          {hasKeys
            ? 'Your RSA-2048 key pair is active. You can send and receive encrypted files.'
            : 'Generate your RSA-2048 key pair to start using SecureVault.'}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Left: how it works */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 className="card-title">How Hybrid Encryption Works</h3>
            <p className="card-subtitle" style={{ marginBottom: 16 }}>Your key pair is central to the security model</p>
            {[
              { step: '1', title: 'RSA Key Pair', desc: 'You have a public key (shareable) and a private key (secret). The private key is encrypted with your key password using PBKDF2+AES before being stored.' },
              { step: '2', title: 'Sending a File', desc: 'A random AES-256 key is generated per file. The file is encrypted with AES-GCM. Then the AES key is encrypted with the recipient\'s RSA public key. Your private key signs the file hash.' },
              { step: '3', title: 'Receiving a File', desc: 'Your RSA private key (unlocked with your key password) decrypts the AES key. The AES key decrypts the file. SHA-256 integrity + digital signature are verified.' },
            ].map(({ step, title, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 800, fontSize: '0.78rem', flexShrink: 0
                }}>{step}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 3 }}>{title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#7c6fa0', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Algorithms card */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 12 }}>Cryptographic Algorithms</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Key Pair', value: 'RSA-2048' },
                { label: 'Encryption Padding', value: 'OAEP + SHA-256' },
                { label: 'File Encryption', value: 'AES-256-GCM' },
                { label: 'Key Derivation', value: 'PBKDF2-HMAC-SHA256' },
                { label: 'Digital Signature', value: 'SHA256withRSA' },
                { label: 'Integrity Check', value: 'SHA-256' },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f5f3ff', fontSize: '0.82rem' }}>
                  <span style={{ color: '#7c6fa0' }}>{label}</span>
                  <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.78rem', fontWeight: 600, color: '#5b21b6' }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: generate / view key */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Generate form */}
          {(!hasKeys || showRegenConfirm) && (
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={20} color="#7c3aed" />
                </div>
                <div>
                  <h3 className="card-title" style={{ marginBottom: 0 }}>{hasKeys ? 'Regenerate Keys' : 'Generate Key Pair'}</h3>
                  <p className="card-subtitle">RSA-2048 + OAEP padding</p>
                </div>
              </div>

              {hasKeys && (
                <div className="alert alert-danger" style={{ marginBottom: 16 }}>
                  <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                  Warning: Regenerating keys means existing encrypted files sent to you cannot be decrypted anymore.
                </div>
              )}

              <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Key password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="form-input"
                      type={showPass ? 'text' : 'password'}
                      placeholder="Min. 8 characters — remember this!"
                      value={keyPassword}
                      onChange={e => setKeyPassword(e.target.value)}
                      style={{ paddingRight: 44 }}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: '#7c6fa0'
                    }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <span className="form-hint">This password encrypts your private key. It cannot be recovered if forgotten.</span>
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm key password</label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Repeat key password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" type="submit" disabled={generating} style={{ flex: 1 }}>
                    {generating ? <><span className="spinner" /> Generating...</> : <><Key size={15} /> Generate Keys</>}
                  </button>
                  {hasKeys && (
                    <button type="button" className="btn btn-ghost" onClick={() => setShowRegenConfirm(false)}>Cancel</button>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* View public key */}
          {hasKeys && !showRegenConfirm && (
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheck size={20} color="#059669" />
                  </div>
                  <div>
                    <h3 className="card-title" style={{ marginBottom: 0 }}>Your Public Key</h3>
                    <p className="card-subtitle">RSA-2048 — safe to share</p>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={copyPublicKey}>
                  {copied ? <CheckCircle size={14} color="#059669" /> : <Copy size={14} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="key-box">{keyInfo?.publicKey}</div>

              <div className="divider" />

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#faf5ff', borderRadius: 8, border: '1px solid #e9d5ff', marginBottom: 12 }}>
                <Lock size={14} color="#7c3aed" />
                <span style={{ fontSize: '0.78rem', color: '#5b21b6' }}>
                  Your private key is stored encrypted using your key password. Never stored in plaintext.
                </span>
              </div>

              <button className="btn btn-ghost btn-sm" onClick={() => setShowRegenConfirm(true)}>
                <RefreshCw size={14} /> Regenerate key pair
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}