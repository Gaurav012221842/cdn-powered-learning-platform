import React, { useContext, useState, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';

const GoogleLoginButton = ({ label = 'Continue with Google', role = 'STUDENT', isRegister = false }) => {
  const { user, googleLogin, siteConfig, showToast } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || siteConfig?.googleClientId || '';

  // Handle Google Profile response and authenticate with Spring Boot backend
  const handleGoogleSuccess = useCallback(
    async (email, fullName, avatarUrl, googleId) => {
      try {
        setLoading(true);
        const res = await googleLogin({
          email,
          fullName: fullName || email.split('@')[0],
          avatarUrl,
          googleId,
          role,
          isRegister
        });

        if (res?.success) {
          const redirectUrl = res.data?.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
          window.location.replace(redirectUrl);
        }
      } catch (err) {
        const errMsg = err.message || 'Google login failed.';
        if (errMsg.toLowerCase().includes('register')) {
          showToast(`⚠️ ${errMsg} Redirecting to Sign Up page...`, 'error');
          setTimeout(() => {
            window.location.href = '/register';
          }, 1400);
        } else {
          showToast(errMsg, 'error');
        }
      } finally {
        setLoading(false);
      }
    },
    [googleLogin, role, isRegister, showToast]
  );

  const handleGoogleSignInClick = () => {
    // If user is already logged in, redirect directly to dashboard
    if (user) {
      window.location.replace(user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard');
      return;
    }

    if (!googleClientId) {
      showToast('Google Client ID is missing in .env file.', 'error');
      return;
    }

    // Official Google Identity Services OAuth 2.0 Token Client Popup
    if (window.google?.accounts?.oauth2) {
      try {
        setLoading(true);
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'email profile openid',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse?.access_token) {
              try {
                // Fetch authenticated user profile directly from Google's userinfo API
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
                });

                if (!userInfoRes.ok) {
                  throw new Error('Failed to fetch Google profile info.');
                }

                const userInfo = await userInfoRes.json();
                await handleGoogleSuccess(userInfo.email, userInfo.name, userInfo.picture, userInfo.sub);
              } catch (err) {
                showToast('Failed to retrieve Google account info.', 'error');
                setLoading(false);
              }
            } else {
              setLoading(false);
            }
          },
          error_callback: (err) => {
            console.warn('Google popup notice:', err);
            setLoading(false);
          }
        });

        tokenClient.requestAccessToken();
        return;
      } catch (err) {
        console.warn('Google OAuth2 client error:', err);
        setLoading(false);
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleSignInClick}
      disabled={loading}
      style={{
        width: '100%',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        color: 'var(--text-primary)',
        fontWeight: '700',
        fontSize: '14px',
        cursor: loading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
        opacity: loading ? 0.7 : 1
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-primary)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--bg-secondary)')}
    >
      <svg width="20" height="20" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        />
      </svg>
      <span>{loading ? 'Opening Google Sign-In...' : label}</span>
    </button>
  );
};

export default GoogleLoginButton;
