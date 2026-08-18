import React, { useState, useContext } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AuthContext } from '../../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { forgotPassword, siteConfig } = useContext(AuthContext);

  const brandName = siteConfig?.siteName || 'Gaurav';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);
    if (res?.success) {
      setCodeSent(true);
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
            maxWidth: '460px',
            borderRadius: '20px',
            padding: '36px'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'inline-flex',
                alignItems: 'center',
                justify: 'center',
                fontSize: '28px',
                marginBottom: '16px'
              }}
            >
              🔑
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              Forgot Password?
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Enter your email address to receive password reset verification details from {brandName}.
            </p>
          </div>

          {!codeSent ? (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@domain.com"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                {loading ? 'Sending Code...' : '✉️ Send Reset Code'}
              </button>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '16px',
                  borderRadius: '12px',
                  textAlign: 'center'
                }}
              >
                <p style={{ fontSize: '15px', color: '#10b981', fontWeight: '700', marginBottom: '8px' }}>
                  ✉️ Verification Code Sent!
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  We've sent a 6-digit verification code and direct reset link to <strong>{email}</strong>.
                </p>
              </div>

              <a
                href={`/reset-password?email=${encodeURIComponent(email)}`}
                className="btn btn-primary"
                style={{ textDecoration: 'none', textAlign: 'center', width: '100%', padding: '14px' }}
              >
                Enter Verification Code & Set New Password →
              </a>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <a href="/login" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary)' }}>
              ← Return to Sign In
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ForgotPassword;
