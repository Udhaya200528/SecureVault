import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, Key, ShieldCheck, AlertTriangle, Clock, FileText, ArrowUpRight } from 'lucide-react';
import { filesAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, recvRes, sentRes] = await Promise.all([
        filesAPI.getStats(),
        filesAPI.getReceived(),
        filesAPI.getSent(),
      ]);
      setStats(statsRes.data.data);
      setReceived(recvRes.data.data.slice(0, 5));
      setSent(sentRes.data.data.slice(0, 5));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const statCards = [
    { label: 'Files Sent', value: stats?.filesSent ?? '—', icon: Upload, cls: 'stat-icon-violet' },
    { label: 'Files Received', value: stats?.filesReceived ?? '—', icon: Download, cls: 'stat-icon-green' },
    { label: 'Encryption', value: 'AES-256', icon: ShieldCheck, cls: 'stat-icon-blue' },
    { label: 'Key Algorithm', value: 'RSA-2048', icon: Key, cls: 'stat-icon-orange' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {user?.fullName} — your secure file hub</p>
      </div>

      {/* Key warning */}
      {!user?.keyGenerated && (
        <div className="alert alert-warning" style={{ marginBottom: 24 }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <strong>RSA keys not generated.</strong> You need to generate your key pair before sending or receiving encrypted files.{' '}
            <button onClick={() => navigate('/keys')}
              style={{ background: 'none', border: 'none', color: '#92400e', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Generate keys now →
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        {statCards.map(({ label, value, icon: Icon, cls }) => (
          <div className="stat-card" key={label}>
            <div className={`stat-icon ${cls}`}><Icon size={20} /></div>
            <div>
              <div className="stat-value">{loading ? '—' : value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Security status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>Security Protocol</h3>
            <span className="badge badge-violet">Active</span>
          </div>
          {[
            { label: 'File Encryption', value: 'AES-256-GCM', ok: true },
            { label: 'Key Transport', value: 'RSA-2048 OAEP', ok: true },
            { label: 'Key Signature', value: 'SHA256withRSA', ok: true },
            { label: 'Integrity Check', value: 'SHA-256 Hash', ok: true },
            { label: 'Key Password', value: 'PBKDF2-AES', ok: true },
            { label: 'RSA Key Pair', value: user?.keyGenerated ? 'Generated ✓' : 'Not generated', ok: user?.keyGenerated },
          ].map(({ label, value, ok }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f5f3ff', fontSize: '0.85rem' }}>
              <span style={{ color: '#7c6fa0' }}>{label}</span>
              <span style={{ fontWeight: 600, color: ok ? '#059669' : '#dc2626', fontFamily: 'DM Mono, monospace', fontSize: '0.8rem' }}>{value}</span>
            </div>
          ))}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 className="card-title" style={{ marginBottom: 0 }}>Quick Actions</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-primary btn-full" onClick={() => navigate('/encrypt')}>
              <Upload size={16} /> Encrypt & Send File
            </button>
            <button className="btn btn-secondary btn-full" onClick={() => navigate('/decrypt')}>
              <Download size={16} /> Decrypt & Download
            </button>
            <button className="btn btn-ghost btn-full" onClick={() => navigate('/keys')}>
              <Key size={16} /> {user?.keyGenerated ? 'View Key Info' : 'Generate Keys'}
            </button>
          </div>

          <div className="divider" />
          <div className="security-badge">
            <ShieldCheck size={14} />
            End-to-end encrypted — only recipients can decrypt
          </div>
        </div>
      </div>

      {/* Recent files */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <RecentFilesCard title="Recently Received" files={received} loading={loading} type="received" navigate={navigate} />
        <RecentFilesCard title="Recently Sent" files={sent} loading={loading} type="sent" navigate={navigate} />
      </div>
    </div>
  );
}

function RecentFilesCard({ title, files, loading, type, navigate }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 className="card-title" style={{ marginBottom: 0 }}>{title}</h3>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => navigate(type === 'received' ? '/decrypt' : '/encrypt')}
        >
          View all <ArrowUpRight size={13} />
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#7c6fa0' }}>
          <div className="spinner spinner-violet" style={{ margin: '0 auto 8px' }} />
          Loading...
        </div>
      ) : files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px', color: '#7c6fa0', fontSize: '0.85rem' }}>
          <FileText size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
          No files yet
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {files.map(file => (
            <div key={file.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 0', borderBottom: '1px solid #f5f3ff'
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, background: '#f5f3ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <FileText size={16} color="#7c3aed" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1e1b2e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.originalFileName}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#7c6fa0' }}>
                  {type === 'received' ? `From: ${file.senderName}` : `To: ${file.recipientName}`}
                </div>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#7c6fa0', flexShrink: 0, textAlign: 'right' }}>
                <Clock size={10} style={{ display: 'inline', marginRight: 3 }} />
                {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}