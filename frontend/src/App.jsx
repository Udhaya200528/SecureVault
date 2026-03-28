import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/shared/Sidebar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import EncryptPage from './pages/EncryptPage';
import DecryptPage from './pages/DecryptPage';
import KeysPage from './pages/KeysPage';
import AuditPage from './pages/AuditPage';
import './styles/globals.css';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}

function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/encrypt" element={<ProtectedRoute><EncryptPage /></ProtectedRoute>} />
      <Route path="/decrypt" element={<ProtectedRoute><DecryptPage /></ProtectedRoute>} />
      <Route path="/keys" element={<ProtectedRoute><KeysPage /></ProtectedRoute>} />
      <Route path="/audit" element={<ProtectedRoute><AuditPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'Plus Jakarta Sans, sans-serif',
              fontSize: '0.875rem',
              borderRadius: '10px',
              border: '1.5px solid #ede9fe',
            },
            success: { iconTheme: { primary: '#7c3aed', secondary: 'white' } },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}