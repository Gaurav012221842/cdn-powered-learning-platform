import React from 'react';
import { formatPrice } from '../../utils/formatPrice';

const PriceCard = ({ basePrice, discountPrice }) => {
  return (
    <div className="card">
      <div style={{ textDecoration: discountPrice ? 'line-through' : 'none', color: discountPrice ? '#94a3b8' : '#fff' }}>
        {formatPrice(basePrice)}
      </div>
      {discountPrice && (
        <div style={{ color: '#06b6d4', fontSize: '24px', fontWeight: 'bold' }}>
          {formatPrice(discountPrice)}
        </div>
      )}
    </div>
  );
};

export default PriceCard;
