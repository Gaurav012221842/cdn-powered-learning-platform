import React from 'react';

export const validatePasswordStrength = (password = '') => {
  return {
    hasMinLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};

export const isPasswordStrong = (password = '') => {
  const result = validatePasswordStrength(password);
  return (
    result.hasMinLength &&
    result.hasUppercase &&
    result.hasLowercase &&
    result.hasNumber &&
    result.hasSpecialChar
  );
};

const PasswordStrengthIndicator = ({ password = '' }) => {
  if (!password || isPasswordStrong(password)) return null;

  const checks = validatePasswordStrength(password);
  const passedCount = Object.values(checks).filter(Boolean).length;

  let strengthLabel = 'Weak';
  let strengthColor = '#ef4444'; // Red
  if (passedCount >= 5) {
    strengthLabel = 'Strong';
    strengthColor = '#10b981'; // Green
  } else if (passedCount >= 3) {
    strengthLabel = 'Medium';
    strengthColor = '#f59e0b'; // Amber
  }

  const items = [
    { label: '8+ Characters', met: checks.hasMinLength },
    { label: 'Uppercase Letter (A-Z)', met: checks.hasUppercase },
    { label: 'Lowercase Letter (a-z)', met: checks.hasLowercase },
    { label: 'Number (0-9)', met: checks.hasNumber },
    { label: 'Special Symbol (!@#$%^&*)', met: checks.hasSpecialChar },
  ];

  return (
    <div style={{ marginTop: '10px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
      {/* Strength Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
          Password Strength
        </span>
        <span style={{ fontSize: '12px', fontWeight: '800', color: strengthColor }}>
          {strengthLabel}
        </span>
      </div>

      <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
        <div
          style={{
            width: `${(passedCount / 5) * 100}%`,
            height: '100%',
            background: strengthColor,
            transition: 'all 0.3s ease'
          }}
        />
      </div>

      {/* Real-Time Rule Checklist */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
        {items.map((item, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: item.met ? '#10b981' : 'var(--text-muted)' }}>
            <span>{item.met ? '✓' : '○'}</span>
            <span style={{ fontWeight: item.met ? '700' : '400', textDecoration: item.met ? 'none' : 'none' }}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
