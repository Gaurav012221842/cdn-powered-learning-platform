import React, { useState } from 'react';
import Button from '../common/Button';

const CouponInput = ({ onApply }) => {
  const [code, setCode] = useState('');

  const handleApply = () => {
    if (onApply) onApply(code);
  };

  return (
    <div style={{ display: 'flex', gap: '8px' }}>
      <input
        type="text"
        placeholder="Enter Promo Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        style={{ padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff', flex: 1 }}
      />
      <Button onClick={handleApply}>Apply</Button>
    </div>
  );
};

export default CouponInput;
