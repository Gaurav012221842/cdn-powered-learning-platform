import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL } from '../../services/api';

const API_BASE = API_V1_URL;

// Helper to detect current browser & OS from browser environment
const getBrowserDeviceInfo = () => {
  const ua = navigator.userAgent;
  let os = 'Unknown OS';
  let browser = 'Web Browser';
  let deviceType = 'DESKTOP';

  if (/iPad|Tablet/i.test(ua)) {
    deviceType = 'TABLET';
  } else if (/Mobile|Android|iPhone/i.test(ua)) {
    deviceType = 'MOBILE';
  }

  if (/Mac OS|Macintosh/i.test(ua)) os = 'macOS';
  else if (/Windows NT 10.0/i.test(ua)) os = 'Windows 10/11';
  else if (/Windows/i.test(ua)) os = 'Windows';
  else if (/iPhone/i.test(ua)) os = 'iOS (iPhone)';
  else if (/iPad/i.test(ua)) os = 'iPadOS';
  else if (/Android/i.test(ua)) os = 'Android';
  else if (/Linux/i.test(ua)) os = 'Linux';

  if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua) && !/OPR\//i.test(ua)) browser = 'Google Chrome';
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/OPR\/|Opera/i.test(ua)) browser = 'Opera';

  return { os, browser, deviceType };
};

const getDeviceIcon = (deviceType, os = '') => {
  const osLower = (os || '').toLowerCase();
  if (deviceType === 'MOBILE' || osLower.includes('iphone') || osLower.includes('android')) {
    return '📱';
  }
  if (deviceType === 'TABLET' || osLower.includes('ipad')) {
    return '📟';
  }
  if (osLower.includes('mac')) {
    return '💻';
  }
  if (osLower.includes('win')) {
    return '🖥️';
  }
  return '💻';
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'Just now';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return dateStr;
  }
};

const DeviceSessionsSection = () => {
  const { user, token, showToast } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminSessions, setAdminSessions] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const localInfo = useMemo(() => getBrowserDeviceInfo(), []);

  const fetchMySessions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/users/sessions/me`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setSessions(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to load user device sessions:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchAdminSessions = useCallback(async () => {
    try {
      setAdminLoading(true);
      const res = await fetch(`${API_BASE}/users/sessions/admin/all`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data)) {
          setAdminSessions(json.data);
        }
      }
    } catch (err) {
      if (showToast) showToast('Failed to load student login history', 'error');
    } finally {
      setAdminLoading(false);
    }
  }, [token, showToast]);

  useEffect(() => {
    fetchMySessions();
  }, [fetchMySessions]);

  const handleRevokeSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to log out / revoke this device session?')) {
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/users/sessions/${sessionId}/revoke`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });
      if (res.ok) {
        if (showToast) showToast('Session revoked successfully', 'success');
        fetchMySessions();
        if (showAdminModal) fetchAdminSessions();
      } else {
        throw new Error('Failed to revoke session');
      }
    } catch (err) {
      if (showToast) showToast(err.message || 'Error revoking session', 'error');
    }
  };

  // Find current session from API or use fallback
  const currentSession = sessions.find((s) => s.isCurrentDevice) || sessions[0] || {
    deviceType: localInfo.deviceType,
    os: localInfo.os,
    browser: localInfo.browser,
    ipAddress: '127.0.0.1 (Local Session)',
    location: 'Current Browser Session',
    isActive: true,
    loginAt: new Date().toISOString()
  };

  const otherSessions = sessions.filter((s) => s.id !== currentSession.id);

  const filteredAdminSessions = adminSessions.filter((s) => {
    const matchesSearch =
      (s.userEmail || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.fullName || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.os || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.browser || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (s.ipAddress || '').toLowerCase().includes(searchFilter.toLowerCase());

    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'STUDENT' && s.role !== 'ADMIN') ||
      (roleFilter === 'ADMIN' && s.role === 'ADMIN');

    return matchesSearch && matchesRole;
  });

  return (
    <div
      style={{
        marginTop: '24px',
        paddingTop: '20px',
        borderTop: '1px solid var(--border-color, rgba(255,255,255,0.1))'
      }}
    >
      {/* Header with Title and Badges */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>🔐</span>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
              Logged-in Device & Security
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Track active hardware, browser details, and login audit trails.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {otherSessions.length > 0 && (
            <button
              type="button"
              onClick={() => setShowHistoryModal(true)}
              className="btn btn-secondary"
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>📜</span> History ({sessions.length})
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => {
                setShowAdminModal(true);
                fetchAdminSessions();
              }}
              style={{
                fontSize: '12px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                color: '#ffffff',
                border: 'none',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
              }}
            >
              <span>👑</span> Student Device Logins
            </button>
          )}
        </div>
      </div>

      {/* Current Active Device Card */}
      <div
        style={{
          background: 'var(--bg-card-secondary, rgba(99, 102, 241, 0.05))',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          borderRadius: '12px',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              boxShadow: '0 4px 12px var(--primary-glow)'
            }}
          >
            {getDeviceIcon(currentSession.deviceType || localInfo.deviceType, currentSession.os || localInfo.os)}
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                {currentSession.os || localInfo.os} • {currentSession.browser || localInfo.browser}
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: '#10b981',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '700'
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    display: 'inline-block'
                  }}
                />
                Active Now (This Device)
              </span>
            </div>

            <div
              style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
            >
              <span>🌐 IP: <strong style={{ color: 'var(--text-primary)' }}>{currentSession.ipAddress || '127.0.0.1'}</strong></span>
              <span>📍 {currentSession.location || 'Current Session'}</span>
              <span>🕒 Logged in: {formatDate(currentSession.loginAt)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={fetchMySessions}
            className="btn btn-secondary"
            title="Refresh session status"
            disabled={loading}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              opacity: loading ? 0.6 : 1,
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <span style={{ display: 'inline-block', transform: loading ? 'rotate(180deg)' : 'none', transition: 'transform 0.5s' }}>
              🔄
            </span>
          </button>
        </div>
      </div>

      {/* User Session History Modal */}
      {showHistoryModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
          onClick={() => setShowHistoryModal(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '650px',
              backgroundColor: 'var(--bg-card, #1e293b)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.1))',
              borderRadius: 'var(--radius-lg, 16px)',
              padding: '24px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>📱</span>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                    Your Login & Device History
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Devices you have signed into with this account.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '22px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {sessions.map((s, idx) => (
                <div
                  key={s.id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: s.isCurrentDevice ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-secondary, rgba(255,255,255,0.03))',
                    border: `1px solid ${s.isCurrentDevice ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-color, rgba(255,255,255,0.07))'}`
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '24px' }}>
                      {getDeviceIcon(s.deviceType, s.os)}
                    </span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>
                          {s.os || 'Unknown OS'} • {s.browser || 'Browser'}
                        </span>
                        {s.isCurrentDevice ? (
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.15)',
                              color: '#10b981',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              padding: '1px 6px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: '700'
                            }}
                          >
                            🟢 Current Device
                          </span>
                        ) : s.isActive ? (
                          <span
                            style={{
                              background: 'rgba(59, 130, 246, 0.15)',
                              color: '#3b82f6',
                              padding: '1px 6px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: '700'
                            }}
                          >
                            Active
                          </span>
                        ) : (
                          <span
                            style={{
                              background: 'rgba(156, 163, 175, 0.15)',
                              color: '#9ca3af',
                              padding: '1px 6px',
                              borderRadius: '8px',
                              fontSize: '10px',
                              fontWeight: '700'
                            }}
                          >
                            Logged Out
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        IP: {s.ipAddress} • {formatDate(s.loginAt)}
                      </div>
                    </div>
                  </div>

                  {!s.isCurrentDevice && s.isActive && (
                    <button
                      type="button"
                      onClick={() => handleRevokeSession(s.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Student Device Audit Modal */}
      {showAdminModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
          onClick={() => setShowAdminModal(false)}
        >
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '900px',
              backgroundColor: 'var(--bg-card, #0f172a)',
              border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
              borderRadius: 'var(--radius-lg, 16px)',
              padding: '24px',
              maxHeight: '88vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '26px' }}>👑</span>
                <div>
                  <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                    Student Device Login Audit & Tracking
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Real-time monitoring of devices, browsers, and IP addresses used by students across the platform.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAdminModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
              >
                ✕
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <input
                type="text"
                placeholder="🔍 Search student name, email, OS, IP..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={{
                  flex: 1,
                  minWidth: '240px',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color, rgba(255,255,255,0.15))',
                  backgroundColor: 'var(--bg-secondary, rgba(255,255,255,0.05))',
                  color: 'var(--text-primary)',
                  fontSize: '13px'
                }}
              />

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setRoleFilter('ALL')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: roleFilter === 'ALL' ? 'var(--primary)' : 'var(--bg-secondary)',
                    color: '#ffffff',
                    border: 'none'
                  }}
                >
                  All Users ({adminSessions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setRoleFilter('STUDENT')}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    background: roleFilter === 'STUDENT' ? 'var(--primary)' : 'var(--bg-secondary)',
                    color: '#ffffff',
                    border: 'none'
                  }}
                >
                  🎓 Students Only
                </button>
                <button
                  type="button"
                  onClick={fetchAdminSessions}
                  className="btn btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                  title="Refresh Audit Data"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Table of Student Sessions */}
            {adminLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                ⚡ Loading device audit records...
              </div>
            ) : filteredAdminSessions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No device login records found matching your filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid var(--border-color, rgba(255,255,255,0.1))' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-secondary, rgba(255,255,255,0.05))', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '12px 16px' }}>Student / User</th>
                      <th style={{ padding: '12px 16px' }}>Role</th>
                      <th style={{ padding: '12px 16px' }}>Device & OS</th>
                      <th style={{ padding: '12px 16px' }}>Browser</th>
                      <th style={{ padding: '12px 16px' }}>IP & Location</th>
                      <th style={{ padding: '12px 16px' }}>Login Time</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAdminSessions.map((s, idx) => (
                      <tr
                        key={s.id || idx}
                        style={{
                          borderBottom: '1px solid var(--border-color, rgba(255,255,255,0.05))',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                        }}
                      >
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                            {s.fullName || 'Student'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            {s.userEmail}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: s.role === 'ADMIN' ? 'rgba(234, 88, 12, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                              color: s.role === 'ADMIN' ? '#f97316' : '#818cf8'
                            }}
                          >
                            {s.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{getDeviceIcon(s.deviceType, s.os)}</span>
                            <span style={{ fontWeight: '600' }}>{s.os || 'Unknown OS'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                          {s.browser || 'Browser'}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '600' }}>{s.ipAddress}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{s.location || 'Local / LAN'}</div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                          {formatDate(s.loginAt)}
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          {s.isActive ? (
                            <button
                              type="button"
                              onClick={() => handleRevokeSession(s.id)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#ef4444',
                                padding: '4px 10px',
                                borderRadius: '6px',
                                fontSize: '11px',
                                fontWeight: '700',
                                cursor: 'pointer'
                              }}
                            >
                              Terminate
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Terminated</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeviceSessionsSection;
