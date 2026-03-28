import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, RefreshCw, ChevronLeft, ChevronRight, Upload, Download, Key, LogIn, UserPlus, Share2, Trash2, ShieldAlert, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { auditAPI } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ACTION_META = {
  LOGIN:               { icon: LogIn,       color: '#3b82f6', bg: '#dbeafe',  label: 'Login' },
  REGISTER:            { icon: UserPlus,    color: '#8b5cf6', bg: '#ede9fe',  label: 'Register' },
  FILE_UPLOAD:         { icon: Upload,      color: '#7c3aed', bg: '#f5f3ff',  label: 'Uploaded' },
  FILE_DOWNLOAD:       { icon: Download,    color: '#059669', bg: '#d1fae5',  label: 'Downloaded' },
  FILE_SHARE:          { icon: Share2,      color: '#0891b2', bg: '#cffafe',  label: 'Shared' },
  FILE_DELETE:         { icon: Trash2,      color: '#dc2626', bg: '#fee2e2',  label: 'Deleted' },
  KEY_GENERATION:      { icon: Key,         color: '#d97706', bg: '#fef3c7',  label: 'Key Gen' },
  UNAUTHORIZED_ACCESS: { icon: ShieldAlert, color: '#dc2626', bg: '#fee2e2',  label: 'Blocked' },
  INTEGRITY_FAILURE:   { icon: ShieldAlert, color: '#dc2626', bg: '#fee2e2',  label: 'Integrity Fail' },
  SIGNATURE_FAILURE:   { icon: ShieldAlert, color: '#dc2626', bg: '#fee2e2',  label: 'Sig Fail' },
};

function StatusBadge({ status }) {
  if (status === 'SUCCESS') return (
    <span className="badge badge-success" style={{ gap: 4 }}>
      <CheckCircle size={11} /> Success
    </span>
  );
  if (status === 'FAILURE') return (
    <span className="badge badge-danger" style={{ gap: 4 }}>
      <XCircle size={11} /> Failed
    </span>
  );
  return (
    <span className="badge badge-warning" style={{ gap: 4 }}>
      <AlertTriangle size={11} /> Warning
    </span>
  );
}

export default function AuditPage() {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (p = 0) => {
    setLoading(true);
    try {
      const res = await auditAPI.getLogs(p, 15);
      const data = res.data.data;
      setLogs(data.content);
      setTotalPages(data.totalPages);
      setTotal(data.totalElements);
      setPage(p);
    } catch (e) {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(0); }, [load]);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Complete security event history for your account</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => load(page)}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Events', value: total, cls: 'badge-violet' },
          { label: 'Page', value: `${page + 1} / ${totalPages || 1}`, cls: 'badge-info' },
        ].map(({ label, value, cls }) => (
          <span key={label} className={`badge ${cls}`} style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
            {label}: <strong style={{ marginLeft: 4 }}>{value}</strong>
          </span>
        ))}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h3 className="card-title" style={{ marginBottom: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
              <ScrollText size={18} color="#7c3aed" /> Security Events
            </h3>
            <p className="card-subtitle">All actions are logged and tamper-evident</p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7c6fa0' }}>
            <div className="spinner spinner-violet" style={{ margin: '0 auto 12px', width: 28, height: 28 }} />
            Loading audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: '#7c6fa0' }}>
            <ScrollText size={48} color="#ddd6fe" style={{ margin: '0 auto 12px' }} />
            <h4 style={{ marginBottom: 6 }}>No audit logs yet</h4>
            <p style={{ fontSize: '0.85rem' }}>Security events will appear here as you use SecureVault</p>
          </div>
        ) : (
          <>
            <div>
              {logs.map((log) => {
                const meta = ACTION_META[log.action] || { icon: ScrollText, color: '#6b7280', bg: '#f3f4f6', label: log.action };
                const Icon = meta.icon;
                return (
                  <div key={log.id} className="audit-row">
                    <div className="audit-icon" style={{ background: meta.bg }}>
                      <Icon size={16} color={meta.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span className="audit-action">{meta.label}</span>
                        <StatusBadge status={log.status} />
                        {log.fileId && (
                          <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>
                            File #{log.fileId}
                          </span>
                        )}
                      </div>
                      <div className="audit-details">{log.details}</div>
                      <div className="audit-time" style={{ display: 'flex', gap: 12 }}>
                        <span>{log.createdAt ? format(new Date(log.createdAt), 'MMM d, yyyy HH:mm:ss') : '—'}</span>
                        {log.ipAddress && (
                          <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.68rem' }}>
                            IP: {log.ipAddress}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid #f5f3ff' }}>
                <button className="btn btn-ghost btn-sm" onClick={() => load(page - 1)} disabled={page === 0}>
                  <ChevronLeft size={14} /> Prev
                </button>
                <span style={{ fontSize: '0.82rem', color: '#7c6fa0' }}>
                  Page {page + 1} of {totalPages}
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => load(page + 1)} disabled={page >= totalPages - 1}>
                  Next <ChevronRight size={14} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}