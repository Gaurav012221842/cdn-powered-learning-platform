import React from 'react';

const ErrorMessage = ({ message }) => {
  if (!message) return null;
  return (
    <div style={{ background: '#ef444422', border: '1px solid #ef4444', color: '#f87171', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
      {message}
    </div>
  );
};

export default ErrorMessage;
