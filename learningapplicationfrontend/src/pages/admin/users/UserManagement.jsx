import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { AuthContext } from '../../../context/AuthContext';
import { API_V1_URL } from '../../../services/api';

const UserManagement = () => {
  const { user: currentUser, showToast, siteConfig } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const masterAdminEmail = siteConfig?.masterAdminEmail || 'serversidegaurav@gmail.com';
  const isCallerMasterAdmin = (currentUser?.email || '').toLowerCase() === masterAdminEmail.toLowerCase();

  const fetchUsers = () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    fetch(`${API_V1_URL}/users`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data)) {
          setUsers(data.data);
        } else {
          setUsers([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch users:', err);
        showToast('Failed to load user roster', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (targetUser) => {
    if (!isCallerMasterAdmin) {
      alert(`⚠️ Permission Denied: Only the Master Admin (${masterAdminEmail}) has authorization to change user roles.`);
      return;
    }

    const isTargetAdmin = targetUser.role === 'ADMIN';
    const newRole = isTargetAdmin ? 'STUDENT' : 'ADMIN';
    const actionName = isTargetAdmin ? 'demote to Student' : 'promote to Admin';

    // Prevent self-demotion
    if (targetUser.id === currentUser?.id && isTargetAdmin) {
      alert('⚠️ You cannot revoke your own admin access while logged in as yourself.');
      return;
    }

    const confirmAction = window.confirm(`Are you sure you want to ${actionName} "${targetUser.fullName || targetUser.email}"?`);
    if (!confirmAction) return;

    setUpdatingId(targetUser.id);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/users/${targetUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ role: newRole })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast(`🎉 User successfully updated to ${newRole}!`, 'success');
        setUsers((prev) =>
          prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
        );
      } else {
        showToast(data.message || 'Failed to update user role', 'error');
      }
    } catch (err) {
      showToast('Connection error updating user role', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const nameMatch = (u.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = (u.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const roleMatch = (u.role || '').toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || emailMatch || roleMatch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%', padding: '40px 24px' }}>
        <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                🛡️ Master Role-Based Access Control (RBAC)
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                User & Admin Team Management
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '15px' }}>
                Master Admin: <strong style={{ color: '#f59e0b' }}>{masterAdminEmail}</strong> — Only the Master Admin can promote or demote user roles.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <a href="/admin/dashboard" className="btn btn-secondary" style={{ fontWeight: '700' }}>
                ← Dashboard
              </a>
            </div>
          </div>

          {!isCallerMasterAdmin && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                padding: '14px 20px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            >
              <span>🔒</span>
              <div>
                <strong>Read-Only Mode:</strong> You are signed in as an Admin. Role modifications are strictly restricted to the platform Master Admin (<strong>{masterAdminEmail}</strong>).
              </div>
            </div>
          )}

          {/* Search Card */}
          <div
            className="card"
            style={{
              padding: '20px 24px',
              borderRadius: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ flex: 1, minWidth: '280px', maxWidth: '480px' }}>
              <input
                type="text"
                placeholder="🔍 Search users by name, email, or role..."
                className="form-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>
              Total Registered Users: {filteredUsers.length}
            </div>
          </div>

          {/* Users Table */}
          <div className="card" style={{ padding: '0', borderRadius: '18px', overflow: 'hidden', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            {loading ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '16px', fontWeight: '600' }}>⏳ Loading users...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>No Users Found</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '16px 20px', fontWeight: '700' }}>User</th>
                      <th style={{ padding: '16px 20px', fontWeight: '700' }}>Email</th>
                      <th style={{ padding: '16px 20px', fontWeight: '700' }}>Role</th>
                      <th style={{ padding: '16px 20px', fontWeight: '700' }}>Joined</th>
                      <th style={{ padding: '16px 20px', fontWeight: '700', textAlign: 'center' }}>Admin Access Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => {
                      const isAdmin = u.role === 'ADMIN';
                      const isMe = u.id === currentUser?.id || (currentUser?.email && u.email?.toLowerCase() === currentUser.email.toLowerCase());
                      const isOwnerEmail = (u.email || '').toLowerCase() === 'serversidegaurav@gmail.com';

                      return (
                        <tr
                          key={u.id}
                          style={{
                            borderBottom: '1px solid var(--border-color)',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: isOwnerEmail
                                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                                    : isAdmin
                                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                    : 'var(--bg-card)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '800',
                                  color: '#ffffff',
                                  fontSize: '14px',
                                  border: '1px solid var(--border-color)'
                                }}
                              >
                                {(u.fullName || u.email || 'U').charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <strong style={{ color: 'var(--text-primary)', fontSize: '14px', display: 'block' }}>
                                  {u.fullName || 'Registered User'}
                                </strong>
                                {isOwnerEmail ? (
                                  <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '800' }}>
                                    👑 Platform Owner
                                  </span>
                                ) : isMe ? (
                                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: '700' }}>
                                    (You - Current Session)
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {u.email}
                          </td>

                          <td style={{ padding: '16px 20px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '800',
                                background: isOwnerEmail
                                  ? 'rgba(245, 158, 11, 0.18)'
                                  : isAdmin
                                  ? 'rgba(99, 102, 241, 0.18)'
                                  : 'rgba(148, 163, 184, 0.15)',
                                color: isOwnerEmail
                                  ? '#f59e0b'
                                  : isAdmin
                                  ? '#818cf8'
                                  : 'var(--text-secondary)',
                                border: `1px solid ${
                                  isOwnerEmail
                                    ? 'rgba(245, 158, 11, 0.4)'
                                    : isAdmin
                                    ? 'rgba(99, 102, 241, 0.4)'
                                    : 'var(--border-color)'
                                }`
                              }}
                            >
                              {isOwnerEmail ? '👑 SUPER ADMIN' : isAdmin ? '⚙️ ADMIN' : '🎓 STUDENT'}
                            </span>
                          </td>

                          <td style={{ padding: '16px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                          </td>

                          <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                            {isOwnerEmail ? (
                              <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '700' }}>
                                👑 Master Owner
                              </span>
                            ) : isMe ? (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                (Your Active Login)
                              </span>
                            ) : !isCallerMasterAdmin ? (
                              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                🔒 Master Admin Only
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRoleToggle(u)}
                                disabled={updatingId === u.id}
                                style={{
                                  padding: '8px 16px',
                                  borderRadius: '8px',
                                  fontSize: '12px',
                                  fontWeight: '800',
                                  cursor: updatingId === u.id ? 'not-allowed' : 'pointer',
                                  transition: 'all 0.2s',
                                  border: '1px solid',
                                  ...(isAdmin
                                    ? {
                                        background: 'rgba(239, 68, 68, 0.12)',
                                        color: '#ef4444',
                                        borderColor: 'rgba(239, 68, 68, 0.3)'
                                      }
                                    : {
                                        background: 'rgba(99, 102, 241, 0.15)',
                                        color: '#818cf8',
                                        borderColor: 'rgba(99, 102, 241, 0.4)'
                                      })
                                }}
                              >
                                {updatingId === u.id
                                  ? '⏳ Updating...'
                                  : isAdmin
                                  ? '🔻 Demote to Student'
                                  : '⭐ Promote to Admin'}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UserManagement;
