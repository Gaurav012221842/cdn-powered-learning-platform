import React, { useState, useContext, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AuthContext } from '../../context/AuthContext';
import PasswordStrengthIndicator, { isPasswordStrong } from '../../components/common/PasswordStrengthIndicator';
import GoogleLoginButton from '../../components/common/GoogleLoginButton';

const Register = () => {
  const [step, setStep] = useState(1); // Step 1: Account Info | Step 2: Email OTP
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const role = 'STUDENT';
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, sendRegistrationOtp, verifyRegistrationOtp, siteConfig } = useContext(AuthContext);

  const brandName = siteConfig?.siteName || 'Gaurav';
  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const isStrong = isPasswordStrong(password);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      window.location.href = user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
    }
  }, [user]);

  // Step 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isStrong) {
      setErrorMsg('Password must be 8+ characters and contain uppercase, lowercase, digit, and special character (!@#$%^&*...).');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify your confirm password field.');
      return;
    }

    setLoading(true);
    const res = await sendRegistrationOtp(email.trim(), password, fullName, role);
    setLoading(false);

    if (res?.success) {
      setStep(2);
      setSuccessMsg(`📧 Verification code sent to ${email}. Please check your inbox/spam folder.`);
    } else if (res?.error) {
      setErrorMsg(res.error);
    }
  };

  // Step 2: Verify OTP & Create Account
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMsg('Please enter the valid 6-digit verification code sent to your email.');
      return;
    }

    setLoading(true);
    const res = await verifyRegistrationOtp(email.trim(), otpCode.trim(), password, fullName, role);
    setLoading(false);

    if (res?.success) {
      const userRole = res.data?.role || role;
      window.location.href = userRole === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
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
          justify: 'center',
          padding: '48px 24px'
        }}
      >
        <div
          className="card animate-fade-in"
          style={{
            width: '100%',
            maxWidth: '900px',
            borderRadius: '24px',
            padding: 0,
            overflow: 'hidden',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            boxShadow: 'var(--shadow-xl)',
            margin: '0 auto'
          }}
        >
          {/* LEFT COLUMN: REGISTRATION FORM */}
          <div style={{ padding: '36px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '14px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                {step === 1 ? 'Create Your Account' : 'Verify Your Email'}
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                {step === 1 ? `Join ${brandName}'s Learning Academy` : `Enter 6-digit code sent to ${email}`}
              </p>
            </div>

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  marginBottom: '14px',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            {successMsg && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  color: '#10b981',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: '700',
                  marginBottom: '14px',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                {successMsg}
              </div>
            )}

            {step === 1 ? (
              <>
                <GoogleLoginButton label="Sign up with Google" role={role} isRegister={true} />

                <div style={{ display: 'flex', alignItems: 'center', margin: '14px 0', gap: '10px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>OR REGISTER WITH EMAIL</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                </div>

                <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', marginBottom: '4px' }}>Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Gaurav Kumar"
                      className="form-input"
                      style={{ padding: '9px 14px', fontSize: '14px' }}
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', marginBottom: '4px' }}>Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="gaurav@example.com"
                      className="form-input"
                      style={{ padding: '9px 14px', fontSize: '14px' }}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" style={{ fontSize: '13px', marginBottom: '4px' }}>Password</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        className="form-input"
                        style={{ padding: '9px 40px 9px 14px', fontSize: '14px' }}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
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
                    <PasswordStrengthIndicator password={password} />
                  </div>

                  {/* Confirm Password Field */}
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label className="form-label" style={{ fontSize: '13px', margin: 0 }}>Confirm Password</label>
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
                        style={{
                          padding: '9px 40px 9px 14px',
                          fontSize: '14px',
                          borderColor: confirmPassword && !passwordsMatch ? '#ef4444' : undefined
                        }}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
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
                    disabled={loading || (confirmPassword !== '' && !passwordsMatch) || !isStrong}
                  >
                    {loading ? 'Sending Verification Code...' : '📩 Send Verification Code to Email'}
                  </button>
                </form>
              </>
            ) : (
              /* Step 2: OTP Verification Form */
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontSize: '13px', marginBottom: '6px' }}>
                    Enter 6-Digit Email Verification Code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    className="form-input"
                    style={{
                      padding: '12px',
                      fontSize: '24px',
                      fontWeight: '800',
                      letterSpacing: '8px',
                      textAlign: 'center',
                      fontFamily: 'monospace'
                    }}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: '700' }}
                  disabled={loading || otpCode.length !== 6}
                >
                  {loading ? 'Verifying Code...' : '✅ Verify & Complete Registration'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtpCode('');
                      setSuccessMsg('');
                      setErrorMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontWeight: '700',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    ← Edit Details
                  </button>

                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      cursor: 'pointer'
                    }}
                  >
                    🔄 Resend Code
                  </button>
                </div>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
              </span>
              <a href="/login" style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
                Sign In
              </a>
            </div>
          </div>

          {/* RIGHT COLUMN: BRANDING & MOTIVATIONAL BANNER */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              color: '#ffffff',
              padding: '40px 36px',
              display: 'flex',
              flexDirection: 'column',
              justify: 'center',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative'
            }}
          >
            {/* Logo Image */}
            <div style={{ position: 'relative', marginBottom: '18px' }}>
              <img
                src="/serversidelog.jpg"
                alt="ServerSide Logo"
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '22px',
                  objectFit: 'cover',
                  border: '3px solid #ffffff',
                  boxShadow: '0 10px 28px rgba(0,0,0,0.3)'
                }}
              />
            </div>

            <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '6px', color: '#ffffff' }}>
              ServerSide Education
            </h3>
            <p style={{ fontSize: '15px', fontWeight: '700', color: 'rgba(255, 255, 255, 0.95)', maxWidth: '300px', lineHeight: 1.4, marginBottom: '20px', fontStyle: 'italic' }}>
              "Empower Your Mind, Shape Your Future."
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left', width: '100%', maxWidth: '290px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#ffffff', background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '12px', fontWeight: '600' }}>
                <span>🚀 Master In-Demand Tech & Engineering</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#ffffff', background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '12px', fontWeight: '600' }}>
                <span>💡 Learn at Your Pace with Global Speed</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#ffffff', background: 'rgba(255,255,255,0.15)', padding: '10px 14px', borderRadius: '12px', fontWeight: '600' }}>
                <span>🎓 Turn Ambition into Certified Expertise</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
