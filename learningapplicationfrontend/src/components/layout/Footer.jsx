import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const Footer = () => {
  const { siteConfig } = useContext(AuthContext);
  const brandName = siteConfig?.siteName || 'Gaurav';
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        background: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)',
        padding: '48px 0 24px 0',
        marginTop: 'auto',
        color: 'var(--text-secondary)'
      }}
    >
      <div
        className="container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '32px',
          marginBottom: '32px'
        }}
      >
        {/* Col 1: Brand Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
            src="/serversidelog.jpg"
            alt="ServerSide Logo"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              objectFit: 'cover',
              border: '2px solid var(--primary)',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}
          />
            <span style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
              {brandName.toUpperCase()} Learning Platform
            </span>
          </div>
          <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
            High-performance CDN-powered learning application designed by {siteConfig?.owner || 'Gaurav'}.
          </p>
        </div>

        {/* Col 2: Navigation */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '14px', fontSize: '15px' }}>Platform Navigation</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <a href="/" style={{ color: 'var(--text-secondary)' }}>Home</a>
            <a href="/courses" style={{ color: 'var(--text-secondary)' }}>All Courses</a>
            <a href="/student/dashboard" style={{ color: 'var(--text-secondary)' }}>Student Dashboard</a>
            <a href="/admin/dashboard" style={{ color: 'var(--text-secondary)' }}>Admin Portal</a>
          </div>
        </div>

        {/* Col 3: Authentication & Account */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '14px', fontSize: '15px' }}>Account & Help</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <a href="/login" style={{ color: 'var(--text-secondary)' }}>Sign In</a>
            <a href="/register" style={{ color: 'var(--text-secondary)' }}>Create Account</a>
            <a href="/forgot-password" style={{ color: 'var(--text-secondary)' }}>Forgot Password?</a>
            <a href="/reset-password" style={{ color: 'var(--text-secondary)' }}>Reset Password</a>
          </div>
        </div>

        {/* Col 4: Contact */}
        <div>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '14px', fontSize: '15px' }}>Support</h4>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            📩 {siteConfig?.supportEmail || 'support@gauravlearn.com'}
          </p>
          <span className="badge badge-success">⚡ Platform Status: Online</span>
        </div>
      </div>

      <div
        className="container"
        style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: '20px',
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '13px',
          color: 'var(--text-muted)'
        }}
      >
        <div>© {year} {brandName} Academy. All rights reserved.</div>
        <div>Empowering engineers with high-quality education worldwide.</div>
      </div>
    </footer>
  );
};

export default Footer;
