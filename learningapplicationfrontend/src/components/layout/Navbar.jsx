import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const Navbar = () => {
  const { user, logout, siteConfig } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const rawBrandName = siteConfig?.siteName || 'Gaurav';
  const brandName = rawBrandName.toLowerCase() === 'gaurav' ? 'Gaurav' : (rawBrandName.charAt(0).toUpperCase() + rawBrandName.slice(1));

  return (
    <header className="glass-nav" style={{ width: '100%' }}>
      <div
        className="container"
        style={{
          display: 'flex',
          justify: 'space-between',
          alignItems: 'center',
          height: '72px'
        }}
      >
        {/* Brand Logo & Server Site Name Gaurav */}
        <a
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none'
          }}
        >
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
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '20px',
                fontWeight: '800',
                letterSpacing: '-0.5px',
                color: 'var(--text-primary)'
              }}
            >
              {brandName}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: '700',
                color: 'var(--primary)',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}
            >
              ServerSide Learning Platform
            </span>
          </div>
        </a>

        {/* Navigation Links & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center', paddingLeft: '20px' }}>
            <a
              href="/"
              style={{
                fontWeight: '600',
                fontSize: '15px',
                color: 'var(--text-primary)',
                transition: 'color 0.2s'
              }}
            >
              Home
            </a>
            <a
              href="/courses"
              style={{
                fontWeight: '600',
                fontSize: '15px',
                color: 'var(--text-primary)',
                transition: 'color 0.2s'
              }}
            >
              Explore Courses
            </a>

            {user?.role === 'ADMIN' ? (
              <a
                href="/admin/dashboard"
                style={{
                  fontWeight: '600',
                  fontSize: '15px',
                  color: 'var(--primary)'
                }}
              >
                Admin Panel
              </a>
            ) : user ? (
              <a
                href="/student/dashboard"
                style={{
                  fontWeight: '600',
                  fontSize: '15px',
                  color: 'var(--text-primary)'
                }}
              >
                My Dashboard
              </a>
            ) : null}
          </nav>

          {/* Theme Switcher Toggle (Light Mode Default with Crisp White BG) */}
          <ThemeToggle showLabel={true} />

          {/* Auth State & Dropdown / Login Logout Buttons */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  padding: '6px 14px 6px 8px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  fontWeight: '600'
                }}
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.fullName || 'User Avatar'}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid var(--primary)'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justify: 'center',
                      fontSize: '14px',
                      fontWeight: '700'
                    }}
                  >
                    {(user.fullName || user.email || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ fontSize: '14px' }}>{user.fullName || user.email.split('@')[0]}</span>
                <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
              </button>

              {/* User Dropdown Menu */}
              {dropdownOpen && (
                <div
                  className="animate-fade-in"
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '48px',
                    width: '240px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-xl)',
                    padding: '8px',
                    zIndex: 200,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ padding: '12px 12px 8px 12px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)' }}>
                      {user.fullName || 'User'}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user.email}</div>
                    <span
                      className="badge badge-primary"
                      style={{ marginTop: '6px', fontSize: '10px' }}
                    >
                      {user.role || 'STUDENT'}
                    </span>
                  </div>

                  <a
                    href="/student/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    📊 Dashboard
                  </a>
                  <a
                    href="/student/my-courses"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    📚 My Courses
                  </a>
                  <a
                    href="/student/certificates"
                    onClick={() => setDropdownOpen(false)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🎓 Certificates
                  </a>

                  <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '10px 12px',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: 'var(--danger)',
                      background: 'var(--danger-bg)',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <a
                href="/login"
                style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  padding: '8px 16px'
                }}
              >
                Sign In
              </a>
              <a href="/register" className="btn btn-primary" style={{ padding: '8px 18px', fontSize: '14px' }}>
                Get Started
              </a>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
