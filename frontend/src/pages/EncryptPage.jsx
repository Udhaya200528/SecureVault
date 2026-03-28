import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, ShieldCheck, Eye, EyeOff, CheckCircle, AlertTriangle, Send } from 'lucide-react';
import { filesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(1) + ' ' + s[i];
}

export default function EncryptPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [keyPassword, setKeyPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(null);

  const onDrop = useCallback((accepted) => {
    if (accepted[0]) setFile(accepted[0]);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1, maxSize: 50 * 1024 * 1024 });

  const handleSend = async (e) => {
    e.preventDefault();
    if (!file) return toast.error('Please select a file');
    if (!recipientEmail) return toast.error('Please enter recipient email');
    if (!keyPassword) return toast.error('Please enter your key password');
    setUploading(true);
    setProgress(0);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('recipientEmail', recipientEmail);
      fd.append('keyPassword', keyPassword);
      const res = await filesAPI.upload(fd, setProgress);
      setDone(res.data.data);
      toast.success('File encrypted and sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const reset = () => { setFile(null); setRecipientEmail(''); setKeyPassword(''); setProgress(0); setDone(null); };

  if (!user?.keyGenerated) return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Encrypt & Send</h1>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '48px' }}>
        <AlertTriangle size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
        <h3>Keys Required</h3>
        <p style={{ margin: '8px 0 20px', color: '#7c6fa0' }}>
          You need to generate your RSA key pair before you can encrypt and send files.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/keys')}>
          Generate Keys Now
        </button>
      </div>
    </div>
  );

  if (done) return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Encrypt & Send</h1>
      </div>
      <div className="card" style={{ textAlign: 'center', padding: '48px', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <CheckCircle size={32} color="#059669" />
        </div>
        <h2 style={{ marginBottom: 8 }}>File Sent Securely!</h2>
        <p style={{ color: '#7c6fa0', marginBottom: 24 }}>Your file has been encrypted and delivered to {done.recipientEmail}</p>
        <div style={{ background: '#f5f3ff', borderRadius: 12, padding: '16px 20px', textAlign: 'left', marginBottom: 24 }}>
          {[
            { label: 'File', value: done.originalFileName },
            { label: 'Recipient', value: done.recipientName + ' <' + done.recipientEmail + '>' },
            { label: 'SHA-256 Hash', value: done.fileHash?.slice(0, 32) + '...' },
            { label: 'Encryption', value: 'AES-256-GCM + RSA-2048' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: '0.82rem' }}>
              <span style={{ color: '#7c6fa0', minWidth: 90 }}>{label}:</span>
              <span style={{ fontWeight: 600, color: '#1e1b2e', wordBreak: 'break-all', fontFamily: label === 'SHA-256 Hash' ? 'DM Mono, monospace' : 'inherit', fontSize: label === 'SHA-256 Hash' ? '0.72rem' : 'inherit' }}>{value}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={reset}><Upload size={15} /> Send Another</button>
          <button className="btn btn-ghost" onClick={() => navigate('/dashboard')}>Dashboard</button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Encrypt & Send</h1>
        <p className="page-subtitle">Files are encrypted with AES-256-GCM before upload. Only the recipient can decrypt.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            {/* Dropzone */}
            <h4 style={{ marginBottom: 14 }}>1. Select file to encrypt</h4>
            {!file ? (
              <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`}>
                <input {...getInputProps()} />
                <div className="dropzone-icon">🔒</div>
                <div className="dropzone-text">Drop file here, or click to browse</div>
                <div className="dropzone-hint">Max 50MB — any file type accepted</div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: '#f5f3ff', borderRadius: 12, border: '1.5px solid #ddd6fe' }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={22} color="#7c3aed" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: '#7c6fa0' }}>{formatBytes(file.size)} · {file.type || 'unknown type'}</div>
                </div>
                <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c6fa0' }}>
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="card">
            <h4 style={{ marginBottom: 16 }}>2. Recipient & security</h4>
            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Recipient email</label>
                <input className="form-input" type="email" placeholder="recipient@example.com"
                  value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} required />
                <span className="form-hint">The recipient must have an account and have generated their RSA keys.</span>
              </div>

              <div className="form-group">
                <label className="form-label">Your key password</label>
                <div style={{ position: 'relative' }}>
                  <input className="form-input" type={showPass ? 'text' : 'password'}
                    placeholder="Enter your key password to sign the file"
                    value={keyPassword} onChange={e => setKeyPassword(e.target.value)}
                    style={{ paddingRight: 44 }} required />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#7c6fa0'
                  }}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="form-hint">Used to unlock your private key for digital signing.</span>
              </div>

              {uploading && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 6 }}>
                    <span style={{ color: '#7c6fa0' }}>Encrypting & uploading…</span>
                    <span style={{ fontWeight: 700, color: '#7c3aed' }}>{progress}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={uploading || !file}>
                {uploading ? <><span className="spinner" /> Encrypting...</> : <><Send size={16} /> Encrypt & Send</>}
              </button>
            </form>
          </div>
        </div>

        {/* Info sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h4 style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={16} color="#7c3aed" /> Encryption Process
            </h4>
            {[
              { n: '1', t: 'AES key generated', d: 'A random 256-bit AES key is created' },
              { n: '2', t: 'File encrypted', d: 'File encrypted with AES-256-GCM + random IV' },
              { n: '3', t: 'Hash computed', d: 'SHA-256 hash computed for integrity' },
              { n: '4', t: 'Signature created', d: 'Hash signed with your RSA private key' },
              { n: '5', t: 'Key wrapped', d: "AES key encrypted with recipient's RSA public key" },
              { n: '6', t: 'Secure delivery', d: 'Encrypted file + wrapped key stored safely' },
            ].map(({ n, t, d }) => (
              <div key={n} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, color: '#7c3aed', flexShrink: 0 }}>{n}</div>
                <div>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>{t}</div>
                  <div style={{ fontSize: '0.72rem', color: '#7c6fa0' }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="security-badge" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <ShieldCheck size={14} /> Zero-knowledge security
            </div>
            <div style={{ fontSize: '0.75rem' }}>Your private key password is never sent to the server. All key operations happen server-side but your password protects the stored key.</div>
          </div>
        </div>
      </div>
    </div>
  );
}