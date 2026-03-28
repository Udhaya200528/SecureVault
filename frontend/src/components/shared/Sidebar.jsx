import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Upload, Download, Key, ScrollText,
  ShieldCheck, LogOut, Lock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/encrypt', icon: Upload, label: 'Encrypt & Send' },
  { to: '/decrypt', icon: Download, label: 'Decrypt & Download' },
  { to: '/keys', icon: Key, label: 'Key Management' },
  { to: '/audit', icon: ScrollText, label: 'Audit Logs' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.fullName
    ?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Lock size={18} color="white" />
          </div>
          <div>
            <div className="sidebar-logo-text">SecureVault</div>
            <div className="sidebar-logo-sub">Hybrid Cryptography</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Navigation</div>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} className="nav-icon" />
            {label}
          </NavLink>
        ))}

        <div className="nav-section-label" style={{ marginTop: 12 }}>Security</div>
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
          marginBottom: 4
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <ShieldCheck size={14} color="#a78bfa" />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#a78bfa' }}>SECURITY STATUS</span>
          </div>
          <div style={{ fontSize: '0.73rem', color: '#7c6fa0', lineHeight: 1.7 }}>
            <div>🔐 AES-256-GCM</div>
            <div>🔑 RSA-2048 OAEP</div>
            <div>✍️ SHA-256 Signature</div>
            <div style={{ color: user?.keyGenerated ? '#34d399' : '#f87171' }}>
              {user?.keyGenerated ? '✅ Keys active' : '⚠️ No keys yet'}
            </div>
          </div>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName}</div>
            <div className="sidebar-user-email">{user?.email}</div>
          </div>
        </div>
        <button
          className="nav-item"
          onClick={handleLogout}
          style={{ marginTop: 4, color: '#f87171' }}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}