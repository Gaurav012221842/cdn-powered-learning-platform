import React, { useState, useContext, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL, API_BASE_URL } from '../../services/api';
import GoogleLoginButton from '../../components/common/GoogleLoginButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const { user, login, siteConfig } = useContext(AuthContext);

  const brandName = siteConfig?.siteName || 'Gaurav';
  const redirectUrl = new URLSearchParams(window.location.search).get('redirect');

  useEffect(() => {
    if (window.location.search.includes('expired=1')) {
      setInfoMsg('⏰ Your previous session has expired. Please log in again.');
    }
  }, []);

  // Redirect if already logged in based on auto-detected backend role
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
        body: JSON.stringify({ email: email.trim(), password })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success && data.data?.token) {
        const { token, fullName, role: userRole, avatarUrl } = data.data;
        login(token, {
          email: email.trim(),
          fullName: fullName || email.split('@')[0],
          role: userRole || 'STUDENT',
          avatarUrl
        });
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          window.location.href = userRole === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
        }
      } else {
        setErrorMsg(data.message || 'Invalid email or password. Please verify your credentials.');
      }
    } catch (err) {
      setErrorMsg(`Unable to connect to server at ${API_BASE_URL}. Please ensure backend is running.`);
    } finally {
      setLoading(false);
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
          justifyContent: 'center',
          padding: '48px 24px'
        }}
      >
        <div className="card auth-card-grid animate-fade-in">
          {/* LEFT COLUMN: LOGIN FORM */}
          <div className="auth-form-side">
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
                Welcome to {brandName}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
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

            {/* Google OAuth 2.0 Sign In */}
            <GoogleLoginButton label="Continue with Google" isRegister={false} />

            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', gap: '10px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', letterSpacing: '0.5px' }}>
                OR SIGN IN WITH EMAIL
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
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
                  placeholder="••••••••"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px', marginTop: '4px', fontWeight: '800' }} disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Don't have an account?{' '}
              </span>
              <a href="/register" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)', textDecoration: 'none' }}>
                Sign Up Free
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: BRANDING & MOTIVATIONAL BANNER */}
          <div className="auth-banner-side">
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
