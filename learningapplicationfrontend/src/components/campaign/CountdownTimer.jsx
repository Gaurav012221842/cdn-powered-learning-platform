import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState('02h : 45m : 12s');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(`${Math.floor(Math.random() * 5)}h : ${Math.floor(Math.random() * 60)}m : ${Math.floor(Math.random() * 60)}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div style={{ display: 'inline-flex', gap: '8px', padding: '8px 16px', background: '#0f172a', borderRadius: '6px', fontWeight: 'bold' }}>
      ⏱️ {timeLeft}
    </div>
  );
};

export default CountdownTimer;
