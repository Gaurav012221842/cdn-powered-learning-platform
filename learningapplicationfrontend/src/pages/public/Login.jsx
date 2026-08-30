import React, { useState, useContext, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL, API_BASE_URL } from '../../services/api';

import GoogleLoginButton from '../../components/common/GoogleLoginButton';

const Login = () => {
  const [email, setEmail] = useState('student@gauravlearn.com');
  const [password, setPassword] = useState('password123');
  const [role, setRole] = useState('STUDENT');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const { user, login, siteConfig } = useContext(AuthContext);

  const brandName = siteConfig?.siteName || 'Gaurav';

  const redirectUrl = new URLSearchParams(window.location.search).get('redirect');

  useEffect(() => {
    if (window.location.search.includes('expired=1')) {
      setInfoMsg('⏰ Your previous session has expired (1-day limit). Please log in again.');
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        window.location.href = user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
      }
    }
  }, [user, redirectUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch(`${API_V1_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.data?.token) {
        const { token, fullName, role: userRole, avatarUrl } = data.data;
        login(token, {
          email,
          fullName: fullName || (role === 'ADMIN' ? 'Gaurav Admin' : 'Gaurav Student'),
          role: userRole || role,
          avatarUrl
        });
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          window.location.href = (userRole || role) === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
        }
      } else {
        setErrorMsg(data.message || 'Invalid email or password. Please verify your credentials.');
      }
    } catch (err) {
      setErrorMsg(`Unable to connect to Spring Boot server at ${API_BASE_URL}. Please ensure your backend is running.`);
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userRole) => {
    setRole(userRole);
    if (userRole === 'ADMIN') {
      setEmail('admin@gauravlearn.com');
    } else {
      setEmail('student@gauravlearn.com');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justify: 'center',
          padding: '48px 24px'
        }}
      >
        <div
          className="card animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '900px',
            borderRadius: '24px',
            padding: 0,
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            boxShadow: 'var(--shadow-xl)',
            margin: '0 auto'
          }}
        >
          {/* LEFT COLUMN: LOGIN FORM */}
          <div style={{ padding: '36px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '20px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Welcome to {brandName}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Sign in to your account
              </p>
            </div>

            {infoMsg && (
              <div
                style={{
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--primary)',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '700',
                  marginBottom: '16px',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}
              >
                {infoMsg}
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: '600',
                  marginBottom: '16px',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Quick Demo Selector */}
            <div
              style={{
                display: 'flex',
                gap: '8px',
                background: 'var(--bg-secondary)',
                padding: '4px',
                borderRadius: '10px',
                marginBottom: '20px'
              }}
            >
              <button
                type="button"
                onClick={() => setDemoUser('STUDENT')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: '7px',
                  border: 'none',
                  background: role === 'STUDENT' ? 'var(--bg-card)' : 'transparent',
                  color: role === 'STUDENT' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: role === 'STUDENT' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                🎓 Student Demo
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('ADMIN')}
                style={{
                  flex: 1,
                  padding: '7px',
                  borderRadius: '7px',
                  border: 'none',
                  background: role === 'ADMIN' ? 'var(--bg-card)' : 'transparent',
                  color: role === 'ADMIN' ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: role === 'ADMIN' ? 'var(--shadow-sm)' : 'none'
                }}
              >
                ⚡ Admin Demo
              </button>
            </div>

            <GoogleLoginButton label="Sign in with Google" role={role} isRegister={false} />

            <div style={{ display: 'flex', alignItems: 'center', margin: '16px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>OR SIGN IN WITH EMAIL</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Password</label>
                  <a
                    href="/forgot-password"
                    style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: 'var(--primary)',
                      textDecoration: 'none'
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
                <input
                  type="password"
                  required
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '4px' }} disabled={loading}>
                {loading ? 'Authenticating with Backend...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
              </span>
              <a href="/register" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
                Sign Up Free
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: BRANDING & MOTIVATIONAL BANNER */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              color: '#ffffff',
              padding: '40px 36px',
              display: 'flex',
              flexDirection: 'column',
              justify: 'center',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Logo Image */}
            <div style={{ position: 'relative', marginBottom: '18px' }}>
              <img
                src="/serversidelog.jpg"
                alt="ServerSide Logo"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '22px',
                  objectFit: 'cover',
                  border: '3px solid #ffffff',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.3)'
                }}
              />
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px', color: '#ffffff' }}>
              ServerSide Education
            </h3>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.95)', maxWidth: '300px', lineHeight: 1.4, marginBottom: '20px', fontStyle: 'italic' }}>
              "Empower Your Mind, Shape Your Future."
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', width: '100%', maxWidth: '290px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#ffffff', background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '12px', fontWeight: '600' }}>
                <span>🚀 Master In-Demand Tech & Engineering</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#ffffff', background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '12px', fontWeight: '600' }}>
                <span>💡 Learn at Your Pace with Global Speed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#ffffff', background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '12px', fontWeight: '600' }}>
                <span>🎓 Turn Ambition into Certified Expertise</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
