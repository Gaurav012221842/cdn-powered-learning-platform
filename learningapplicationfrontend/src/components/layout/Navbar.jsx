import React, { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import ThemeToggle from '../common/ThemeToggle';

const Navbar = () => {
  const { user, logout, siteConfig } = useContext(AuthContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rawBrandName = siteConfig?.siteName || 'Gaurav';
  const brandName = rawBrandName.toLowerCase() === 'gaurav' ? 'Gaurav' : (rawBrandName.charAt(0).toUpperCase() + rawBrandName.slice(1));

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <header className="glass-nav" style={{ width: '100%' }}>
      <div
        className="container"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '72px'
        }}
      >
        {/* Brand Logo & Server Site Name Gaurav */}
        <a
          href="/"
          onClick={closeMobileMenu}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none'
          }}
        >
          <img
            src="/serversidelog.jpg"
            alt="ServerSide Logo"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              objectFit: 'cover',
              border: '2px solid var(--primary)',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: '18px',
                fontWeight: '800',
                letterSpacing: '-0.5px',
                color: 'var(--text-primary)',
                lineHeight: 1.2
              }}
            >
              {brandName}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: '700',
                color: 'var(--primary)',
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
              }}
            >
              Learning Platform
            </span>
          </div>
        </a>

        {/* Right Actions: Mobile Toggle + Desktop Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          {/* Mobile Theme Toggle (quick access on phone) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ThemeToggle showLabel={false} />
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          {/* DESKTOP NAV GROUP */}
          <div className="desktop-nav-group">
            <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
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
      </div>

      {/* MOBILE FULL-SCREEN RESPONSIVE DRAWER */}
      <div className={`mobile-drawer ${mobileMenuOpen ? 'open' : ''}`}>
        {user && (
          <div style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div style={{ fontWeight: '800', fontSize: '16px', color: 'var(--text-primary)' }}>
              {user.fullName || 'User Profile'}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user.email}</div>
            <span className="badge badge-primary" style={{ marginTop: '8px' }}>
              {user.role || 'STUDENT'}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href="/"
            onClick={closeMobileMenu}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              fontWeight: '700',
              fontSize: '15px',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            🏠 Home
          </a>

          <a
            href="/courses"
            onClick={closeMobileMenu}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              fontWeight: '700',
              fontSize: '15px',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            🔍 Explore Courses
          </a>

          {user?.role === 'ADMIN' && (
            <a
              href="/admin/dashboard"
              onClick={closeMobileMenu}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(99, 102, 241, 0.1)',
                fontWeight: '700',
                fontSize: '15px',
                color: 'var(--primary)',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              ⚙️ Admin Panel
            </a>
          )}

          {user && (
            <>
              <a
                href="/student/dashboard"
                onClick={closeMobileMenu}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  fontWeight: '700',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                📊 My Dashboard
              </a>

              <a
                href="/student/my-courses"
                onClick={closeMobileMenu}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  fontWeight: '700',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                📚 My Enrolled Courses
              </a>

              <a
                href="/student/certificates"
                onClick={closeMobileMenu}
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  fontWeight: '700',
                  fontSize: '15px',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                🎓 My Certificates
              </a>
            </>
          )}
        </div>

        {/* Mobile Auth Buttons */}
        <div style={{ marginTop: 'auto', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {user ? (
            <button
              onClick={() => {
                closeMobileMenu();
                logout();
              }}
              className="btn btn-danger"
              style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700' }}
            >
              🚪 Logout
            </button>
          ) : (
            <>
              <a
                href="/login"
                onClick={closeMobileMenu}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700' }}
              >
                🔑 Sign In
              </a>
              <a
                href="/register"
                onClick={closeMobileMenu}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: '700' }}
              >
                ✨ Get Started Free
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
