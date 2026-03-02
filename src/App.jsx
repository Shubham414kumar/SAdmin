import React, { useState, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CourseManagement from './pages/Courses';
import UserManagement from './pages/Users';
import VacancyManagement from './pages/Vacancies';
import NotificationManagement from './pages/Notifications';
import AdmitCards from './pages/AdmitCards';
import Results from './pages/Results';
import Payments from './pages/Payments';
import CurrentAffairs from './pages/CurrentAffairs';
import StudyMaterials from './pages/StudyMaterials';
import Quizzes from './pages/Quizzes';

// Simple admin auth context
const AuthContext = createContext(null);

function useAdminAuth() {
  return useContext(AuthContext);
}

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiBase = 'https://saarthiprep-kfkl.onrender.com/api';
      const response = await fetch(`${apiBase}/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Failed to login');
      } else {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        onLogin(data.user);
      }
    } catch (err) {
      setError('Network error. Cannot reach server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: 24,
        padding: 40,
        width: 400,
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🛡️</div>
          <h1 style={{ color: 'white', fontSize: 24, fontWeight: 800, margin: 0 }}>Admin Panel</h1>
          <p style={{ color: '#6B7280', fontSize: 14, marginTop: 4 }}>SaarthiPrep Administration</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="shubhankumarkir@gmail.com"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: 'white',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ color: '#9CA3AF', fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 12,
                color: 'white',
                fontSize: 14,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              backgroundColor: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 16,
              color: '#EF4444',
              fontSize: 12,
              fontWeight: 600,
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#4B5563' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              border: 'none',
              borderRadius: 14,
              color: 'white',
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? '⏳ Signing in...' : '🔐 Sign In'}
          </button>
        </form>

        <p style={{ color: '#4B5563', fontSize: 11, textAlign: 'center', marginTop: 20 }}>
          SaarthiPrep Admin Access Only
        </p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, user }) {
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('adminUser');
    return stored ? JSON.parse(stored) : null;
  });

  const handleLogin = (userData) => setUser(userData);
  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, logout: handleLogout }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={
            user ? <Navigate to="/" replace /> : <AdminLogin onLogin={handleLogin} />
          } />
          <Route path="/" element={
            <ProtectedRoute user={user}>
              <Layout onLogout={handleLogout} />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="courses" element={<CourseManagement />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="vacancies" element={<VacancyManagement />} />
            <Route path="notifications" element={<NotificationManagement />} />
            <Route path="admit-cards" element={<AdmitCards />} />
            <Route path="results" element={<Results />} />
            <Route path="payments" element={<Payments />} />
            <Route path="current-affairs" element={<CurrentAffairs />} />
            <Route path="study-materials" element={<StudyMaterials />} />
            <Route path="quizzes" element={<Quizzes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthContext.Provider>
  );
}

export default App;
export { useAdminAuth };
