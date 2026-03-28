import React, { useState, useEffect, useCallback } from 'react';
import { Download, Eye, EyeOff, ShieldCheck, FileText, Clock, Share2, Trash2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { filesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

function formatBytes(b) {
  if (!b) return '0 B';
  const k = 1024, s = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return (b / Math.pow(k, i)).toFixed(1) + ' ' + s[i];
}

export default function DecryptPage() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [keyPassword, setKeyPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [decrypting, setDecrypting] = useState(null);
  const [shareLoading, setShareLoading] = useState(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await filesAPI.getReceived();
      setFiles(res.data.data);
    } catch (e) {
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleDecrypt = async (file) => {
    if (!keyPassword) return toast.error('Enter your key password');
    setDecrypting(file.id);
    try {
      const res = await filesAPI.download(file.id, keyPassword);
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.originalFileName;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('File decrypted and downloaded!');
      setSelected(null);
      setKeyPassword('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Decryption failed — check your key password');
    } finally {
      setDecrypting(null);
    }
  };

  const handleShare = async (fileId) => {
    setShareLoading(fileId);
    try {
      const res = await filesAPI.share(fileId);
      const token = res.data.data;
      const url = `${window.location.origin}/share/${token}`;
      navigator.clipboard.writeText(url);
      toast.success('Share link copied to clipboard!');
      loadFiles();
    } catch (err) {
      toast.error('Failed to create share link');
    } finally {
      setShareLoading(null);
    }
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Decrypt & Download</h1>
          <p className="page-subtitle">Files sent to you — only you can decrypt them with your private key</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={loadFiles}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Decrypt modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={22} color="#7c3aed" />
              </div>
              <div>
                <h3 style={{ marginBottom: 2 }}>Decrypt File</h3>
                <p style={{ fontSize: '0.82rem', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                  {selected.originalFileName}
                </p>
              </div>
            </div>

            <div style={{ background: '#f5f3ff', borderRadius: 10, padding: '12px 14px', marginBottom: 18, fontSize: '0.8rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><span style={{ color: '#7c6fa0' }}>From:</span> <strong>{selected.senderName}</strong></div>
                <div><span style={{ color: '#7c6fa0' }}>Size:</span> <strong>{formatBytes(selected.fileSize)}</strong></div>
                <div style={{ gridColumn: '1 / -1' }}><span style={{ color: '#7c6fa0' }}>Hash: </span><span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.7rem' }}>{selected.fileHash?.slice(0,40)}...</span></div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 18 }}>
              <label className="form-label">Your key password</label>
              <div style={{ position: 'relative' }}>
                <input className="form-input" type={showPass ? 'text' : 'password'}
                  placeholder="Enter your RSA key password"
                  value={keyPassword} onChange={e => setKeyPassword(e.target.value)}
                  style={{ paddingRight: 44 }} autoFocus />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#7c6fa0'
                }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <span className="form-hint">Unlocks your private key to decrypt the AES key, then decrypts the file. Integrity and signature are verified automatically.</span>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={() => handleDecrypt(selected)} disabled={!!decrypting}>
                {decrypting === selected.id ? <><span className="spinner" /> Decrypting...</> : <><Download size={15} /> Decrypt & Download</>}
              </button>
              <button className="btn btn-ghost" onClick={() => { setSelected(null); setKeyPassword(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* File list */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 2 }}>Files Received</h3>
            <p className="card-subtitle">{files.length} encrypted file{files.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="security-badge" style={{ fontSize: '0.72rem' }}>
            <ShieldCheck size={12} /> AES-256-GCM + RSA-2048
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7c6fa0' }}>
            <div className="spinner spinner-violet" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
            Loading encrypted files...
          </div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px' }}>
            <FileText size={48} color="#ddd6fe" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ color: '#7c6fa0', marginBottom: 6 }}>No files received yet</h4>
            <p style={{ color: '#7c6fa0', fontSize: '0.85rem' }}>Ask someone to encrypt and send you a file</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>File</th>
                  <th>From</th>
                  <th>Size</th>
                  <th>Received</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map(file => (
                  <tr key={file.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <FileText size={16} color="#7c3aed" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {file.originalFileName}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: '#7c6fa0', fontFamily: 'DM Mono, monospace' }}>
                            {file.fileHash?.slice(0, 16)}…
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{file.senderName}</div>
                      <div style={{ fontSize: '0.72rem', color: '#7c6fa0' }}>{file.senderEmail}</div>
                    </td>
                    <td style={{ fontSize: '0.82rem' }}>{formatBytes(file.fileSize)}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.78rem', color: '#7c6fa0' }}>
                        <Clock size={11} />
                        {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                      </div>
                    </td>
                    <td>
                      {file.hasShareToken
                        ? <span className="badge badge-violet">Shared</span>
                        : <span className="badge badge-success">Encrypted</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => setSelected(file)}>
                          <Download size={13} /> Decrypt
                        </button>
                        <button className="btn btn-ghost btn-sm"
                          onClick={() => handleShare(file.id)}
                          disabled={shareLoading === file.id}>
                          {shareLoading === file.id ? <span className="spinner spinner-violet" style={{ width: 12, height: 12 }} /> : <Share2 size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}