import React from 'react';

const ProgressBar = ({ percentage = 0 }) => {
  return (
    <div style={{ width: '100%', background: '#0f172a', borderRadius: '8px', height: '10px', overflow: 'hidden' }}>
      <div style={{ width: `${percentage}%`, background: '#4f46e5', height: '100%', transition: 'width 0.3s ease' }} />
    </div>
  );
};

export default ProgressBar;
