import React from 'react';
import CountdownTimer from './CountdownTimer';

const CampaignCard = ({ campaign }) => {
  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <h3 style={{ margin: 0 }}>{campaign?.name || 'Summer Discount Campaign'}</h3>
      <div style={{ color: '#06b6d4', fontSize: '24px', fontWeight: 'bold' }}>{campaign?.discountPercentage || 25}% OFF</div>
      <CountdownTimer targetDate={campaign?.endDate} />
    </div>
  );
};

export default CampaignCard;
