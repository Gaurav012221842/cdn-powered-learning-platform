import React, { createContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  // Server-side site branding state
  const [siteConfig, setSiteConfig] = useState({
    siteName: 'Gaurav',
    platformTitle: "Gaurav's CDN Learning Platform",
    owner: 'Gaurav',
    supportEmail: 'support@gauravlearn.com',
    defaultTheme: 'light',
    version: '1.0.0'
  });

  // User auth state
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
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

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    showToast('You have been logged out successfully.', 'info');
    window.location.href = '/';
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
