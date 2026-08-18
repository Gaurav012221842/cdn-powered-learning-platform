import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AuthContext } from '../../context/AuthContext';
import PasswordStrengthIndicator, { isPasswordStrong } from '../../components/common/PasswordStrengthIndicator';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [fromUrlToken, setFromUrlToken] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [step, setStep] = useState(1); // 1 = Request Code, 2 = Enter New Password, 3 = Success
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { forgotPassword, resetPassword, siteConfig } = useContext(AuthContext);

  const brandName = siteConfig?.siteName || 'Gaurav';
  const isStrong = isPasswordStrong(newPassword);
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    const urlToken = params.get('token');
    if (urlEmail) setEmail(urlEmail);
    if (urlToken) {
      setToken(urlToken);
      setFromUrlToken(true);
      setStep(2); // Jump directly to password reset form if link came from email
    }
  }, []);

  const handleSendCode = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    if (!email) {
      setErrorMsg('Please enter your account email address.');
      return;
    }

    setLoading(true);
    const res = await forgotPassword(email);
    setLoading(false);

    if (res?.success) {
      setInfoMsg('✉️ Verification code sent to your email address! Check your inbox or click the link in your email.');
      setStep(2);
    } else if (res?.error) {
      setErrorMsg(res.error);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');

    if (!token) {
      setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      return;
    }

    if (!isStrong) {
      setErrorMsg('Password must be 8+ characters and contain uppercase, lowercase, digit, and special character (!@#$%^&*...).');
      return;
    }

    if (!passwordsMatch) {
      setErrorMsg('Passwords do not match. Please verify your confirm password field.');
      return;
    }

    setLoading(true);
    const res = await resetPassword(email, token, newPassword);
    setLoading(false);

    if (res?.success) {
      setStep(3);
    } else if (res?.error) {
      setErrorMsg(res.error);
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
          justifyContent: 'center',
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
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '16px'
              }}
            >
              🛡️
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
              {step === 1 ? 'Forgot Password?' : step === 2 ? 'Set New Password' : 'Password Reset Complete'}
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {step === 1
                ? `Enter your email to receive a password reset link & verification code for ${brandName}.`
                : step === 2
                ? `Enter your verification code and choose a new password.`
                : `Your account password has been updated successfully.`}
            </p>
          </div>

          {errorMsg && (
            <div
              style={{
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                marginBottom: '20px',
                border: '1px solid rgba(239, 68, 68, 0.2)'
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981',
                padding: '12px 16px',
                borderRadius: '10px',
                fontSize: '14px',
                marginBottom: '20px',
                border: '1px solid rgba(16, 185, 129, 0.3)'
              }}
            >
              {infoMsg}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSendCode} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                {loading ? 'Sending Code...' : '✉️ Send Reset Code to Email'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}
                >
                  Already have a 6-digit code? Click here →
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {fromUrlToken ? (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    color: '#10b981',
                    fontWeight: '700'
                  }}
                >
                  ✓ Verification Code Verified from Email Link
                </div>
              ) : (
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label className="form-label" style={{ margin: 0 }}>Reset Verification Code</label>
                    <button
                      type="button"
                      onClick={handleSendCode}
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
                    >
                      Resend Code
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Enter 6-digit code (e.g. 550954)"
                    className="form-input"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    className="form-input"
                    style={{ padding: '9px 40px 9px 14px' }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide Password' : 'Show Password'}
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
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                <PasswordStrengthIndicator password={newPassword} />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ margin: 0 }}>Confirm New Password</label>
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
                    style={{ padding: '9px 40px 9px 14px' }}
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

              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }} disabled={loading}>
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--success-bg)',
                  color: 'var(--success)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  margin: '0 auto'
                }}
              >
                ✓
              </div>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
                Your password has been reset successfully. You can now log in with your new password!
              </p>
              <a href="/login" className="btn btn-primary" style={{ textDecoration: 'none', width: '100%', padding: '14px' }}>
                Proceed to Sign In →
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

export default ResetPassword;
