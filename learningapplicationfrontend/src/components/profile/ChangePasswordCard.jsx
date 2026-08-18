import React, { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import PasswordStrengthIndicator, { isPasswordStrong } from '../common/PasswordStrengthIndicator';

const ChangePasswordCard = () => {
  const { user, changePassword } = useContext(AuthContext);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const isStrong = isPasswordStrong(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!user?.email) {
      setErrorMsg('User email session not found. Please re-login.');
      return;
    }

    if (!currentPassword) {
      setErrorMsg('Please enter your current password.');
      return;
    }

    if (!isStrong) {
      setErrorMsg('New password must be 8+ characters and contain uppercase, lowercase, digit, and special character (!@#$%^&*...).');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('New passwords do not match. Please verify your confirm password field.');
      return;
    }

    setLoading(true);
    const res = await changePassword(user.email, currentPassword, newPassword);
    setLoading(false);

    if (res?.success) {
      setSuccessMsg('🔒 Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else if (res?.error) {
      setErrorMsg(res.error);
    }
  };

  return (
    <div className="card" style={{ padding: '28px', borderRadius: '16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'var(--primary-light)',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '20px'
          }}
        >
          🔐
        </div>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            Change Account Password
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
            Update your password securely using your current password.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '16px', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: '600' }}>
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Current Password */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '13px', marginBottom: '4px' }}>Current Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              className="form-input"
              style={{ padding: '9px 40px 9px 14px', fontSize: '14px' }}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              title={showCurrentPassword ? 'Hide Password' : 'Show Password'}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                lineHeight: 1
              }}
            >
              {showCurrentPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* New Password */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '13px', marginBottom: '4px' }}>New Password</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showNewPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              className="form-input"
              style={{ padding: '9px 40px 9px 14px', fontSize: '14px' }}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              title={showNewPassword ? 'Hide Password' : 'Show Password'}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                lineHeight: 1
              }}
            >
              {showNewPassword ? '🙈' : '👁️'}
            </button>
          </div>
          <PasswordStrengthIndicator password={newPassword} />
        </div>

        {/* Confirm New Password */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label className="form-label" style={{ fontSize: '13px', margin: 0 }}>Confirm New Password</label>
            {confirmPassword && (
              <span style={{ fontSize: '11px', fontWeight: '700', color: passwordsMatch ? 'var(--success)' : '#ef4444' }}>
                {passwordsMatch ? '✓ Match' : '✕ Mismatch'}
              </span>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              placeholder="••••••••"
              className="form-input"
              style={{ padding: '9px 40px 9px 14px', fontSize: '14px' }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              title={showConfirmPassword ? 'Hide Password' : 'Show Password'}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '4px',
                lineHeight: 1
              }}
            >
              {showConfirmPassword ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '14px', fontWeight: '700' }}
          disabled={loading || !currentPassword || !newPassword || !confirmPassword || !passwordsMatch || !isStrong}
        >
          {loading ? 'Updating Password...' : '🔑 Update Password'}
        </button>
      </form>
    </div>
  );
};

export default ChangePasswordCard;
