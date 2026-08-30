import React, { createContext, useState, useEffect, useCallback } from 'react';
import { apiFetch, isJwtExpired, clearAuthSession, getStoredUser } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Server-side site branding state
  const [siteConfig, setSiteConfig] = useState({
    siteName: 'Gaurav',
    platformTitle: "Gaurav's CDN Learning Platform",
    owner: 'Gaurav',
    supportEmail: 'serversidegaurav@gmail.com',
    defaultTheme: 'light',
    version: '1.0.0'
  });

  // User auth state with 24-hour expiration check
  const [user, setUser] = useState(() => getStoredUser());

  const [token, setToken] = useState(() => {
    const rawToken = localStorage.getItem('token');
    const loginTime = localStorage.getItem('loginTimestamp');
    const MAX_SESSION_MS = 24 * 60 * 60 * 1000; // 24 Hours / 1 Day

    if (!rawToken || isJwtExpired(rawToken) || (loginTime && Date.now() - Number(loginTime) > MAX_SESSION_MS)) {
      clearAuthSession();
      return null;
    }
    return rawToken;
  });

  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
  }, []);

  // Validate active token against backend on startup
  useEffect(() => {
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      if (isJwtExpired(currentToken)) {
        clearAuthSession();
        setToken(null);
        setUser(null);
        return;
      }

      // Verify token with backend
      apiFetch('/users/me')
        .then((res) => {
          if (res?.data) {
            const freshUser = {
              id: res.data.id,
              fullName: res.data.fullName,
              email: res.data.email,
              role: res.data.role,
              avatarUrl: res.data.avatarUrl
            };
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        })
        .catch((err) => {
          console.warn('Session expired or unauthorized, clearing local session:', err);
          clearAuthSession();
          setToken(null);
          setUser(null);
        });
    }
  }, []);

  // Sync theme attribute on document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fetch server-side site config on mount
  useEffect(() => {
    apiFetch('/config/site')
      .then((data) => {
        if (data?.data) {
          const config = { ...data.data };
          if (config.siteName?.toLowerCase() === 'gaurav') {
            config.siteName = 'Gaurav';
          }
          setSiteConfig(config);
        }
      })
      .catch(() => {
        setSiteConfig((prev) => ({ ...prev, siteName: 'Gaurav' }));
      });
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    showToast(`Switched to ${newTheme === 'light' ? 'Light Mode' : 'Dark Mode'}`, 'success');
  };

  const login = (authToken, userData) => {
    const formattedUser = {
      id: userData?.id || null,
      fullName: userData?.fullName || (userData?.email ? userData.email.split('@')[0] : 'Student User'),
      email: userData?.email || '',
      role: userData?.role || 'STUDENT',
      avatarUrl: userData?.avatarUrl || null
    };
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(formattedUser));
    localStorage.setItem('loginTimestamp', String(Date.now()));
    setToken(authToken);
    setUser(formattedUser);
    showToast(`Welcome back, ${formattedUser.fullName}!`, 'success');
  };

  const updateProfileAvatar = (newAvatarUrl) => {
    setUser((prev) => {
      const updated = { ...(prev || {}), avatarUrl: newAvatarUrl };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
    showToast('Profile photo updated successfully!', 'success');
  };

  const logout = (silent = false) => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    if (!silent) {
      showToast('You have been logged out successfully.', 'info');
      window.location.href = '/login';
    }
  };

  const forgotPassword = async (email) => {
    try {
      const data = await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      if (data?.success) {
        showToast('✉️ Password reset verification link sent to your email!', 'success');
        return { success: true };
      }
    } catch (err) {
      showToast(err.message || 'Could not send password reset email.', 'error');
      return { success: false, error: err.message };
    }
  };

  const resetPassword = async (email, resetToken, newPassword) => {
    try {
      const data = await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, token: resetToken, newPassword })
      });
      if (data?.success) {
        showToast('🎉 Password reset successfully! Please log in.', 'success');
        return { success: true };
      }
    } catch (err) {
      showToast(err.message || 'Failed to reset password.', 'error');
      return { success: false, error: err.message };
    }
  };

  const changePassword = async (email, currentPassword, newPassword) => {
    try {
      const data = await apiFetch('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ email, currentPassword, newPassword })
      });
      if (data?.success) {
        showToast('🎉 Password changed successfully!', 'success');
        return { success: true };
      }
    } catch (err) {
      showToast(err.message || 'Failed to change password. Please check your current password.', 'error');
      return { success: false, error: err.message };
    }
  };

  const sendRegistrationOtp = async (email, password, fullName, role) => {
    try {
      const data = await apiFetch('/auth/send-registration-otp', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName, role })
      });
      if (data?.success) {
        showToast('📧 Verification code sent to your email!', 'success');
        return { success: true };
      }
    } catch (err) {
      showToast(err.message || 'Failed to send verification code.', 'error');
      return { success: false, error: err.message };
    }
  };

  const verifyRegistrationOtp = async (email, otpCode, password, fullName, role) => {
    try {
      const data = await apiFetch('/auth/verify-registration-otp', {
        method: 'POST',
        body: JSON.stringify({ email, otpCode, password, fullName, role })
      });
      if (data?.success && data.data?.token) {
        const { token: userToken, role: userRole, avatarUrl, id } = data.data;
        login(userToken, {
          id,
          email,
          fullName: fullName || data.data.fullName || 'User',
          role: userRole || role || 'STUDENT',
          avatarUrl: avatarUrl || data.data.avatarUrl
        });
        showToast('🎉 Account registered and verified successfully!', 'success');
        return { success: true, data: data.data };
      }
    } catch (err) {
      showToast(err.message || 'Verification failed. Please check your OTP code.', 'error');
      return { success: false, error: err.message };
    }
  };

  const googleLogin = async (googlePayload) => {
    try {
      const data = await apiFetch('/auth/google', {
        method: 'POST',
        body: JSON.stringify(googlePayload)
      });
      if (data?.success && data.data?.token) {
        const { token: userToken, role: userRole, avatarUrl, fullName, email, id } = data.data;
        login(userToken, {
          id,
          email,
          fullName,
          role: userRole || 'STUDENT',
          avatarUrl
        });
        showToast(`🌐 Welcome, ${fullName || 'User'}! Authenticated via Google.`, 'success');
        return { success: true, data: data.data };
      }
    } catch (err) {
      showToast(err.message || 'Google authentication failed.', 'error');
      return { success: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        theme,
        siteConfig,
        toast,
        toggleTheme,
        login,
        logout,
        updateProfileAvatar,
        forgotPassword,
        resetPassword,
        changePassword,
        sendRegistrationOtp,
        verifyRegistrationOtp,
        googleLogin,
        showToast
      }}
    >
      {children}
      {toast && (
        <div
          role="alert"
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 1000,
            padding: '14px 20px',
            borderRadius: '12px',
            background: toast.type === 'success' ? '#10b981' : toast.type === 'error' ? '#ef4444' : '#4f46e5',
            color: '#ffffff',
            fontWeight: '600',
            fontSize: '14px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span>{toast.message}</span>
        </div>
      )}
    </AuthContext.Provider>
  );
};
