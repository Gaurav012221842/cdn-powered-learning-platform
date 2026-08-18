import React, { useState, useEffect } from 'react';
import { campaignService } from '../../services/campaignService';

const fallbackActiveCampaigns = [
  {
    id: 'c-active-1',
    name: 'Summer Learning Blast 2026',
    discountPercentage: 25,
    endDate: '2026-08-31T23:59:59Z',
    isActive: true
  },
  {
    id: 'c-active-2',
    name: 'Independence Day Special Flash Sale',
    discountPercentage: 40,
    endDate: '2026-08-20T23:59:59Z',
    isActive: true
  }
];

const OfferBanner = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    campaignService.getActiveCampaigns()
      .then((res) => {
        if (res && res.data && Array.isArray(res.data) && res.data.length > 0) {
          setCampaigns(res.data);
        } else {
          setCampaigns(fallbackActiveCampaigns);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch active campaigns for student banner:', err);
        setCampaigns(fallbackActiveCampaigns);
      });
  }, []);

  useEffect(() => {
    if (campaigns.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [campaigns]);

  if (!visible || campaigns.length === 0) return null;

  const activeCamp = campaigns[currentIndex];
  const endDateFormatted = activeCamp.endDate
    ? new Date(activeCamp.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Limited Time';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
        padding: '16px 24px',
        borderRadius: '16px',
        color: '#ffffff',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        boxShadow: '0 8px 24px rgba(79, 70, 229, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background glow circle decoration */}
      <div
        style={{
          position: 'absolute',
          right: '-40px',
          bottom: '-40px',
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 1 }}>
        <div
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '22px',
            fontWeight: '800'
          }}
        >
          🔥
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '12px',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                background: '#ffffff',
                color: '#4f46e5',
                padding: '2px 8px',
                borderRadius: '12px'
              }}
            >
              {activeCamp.discountPercentage}% OFF
            </span>
            <span style={{ fontSize: '13px', opacity: 0.9, fontWeight: '600' }}>
              Valid till {endDateFormatted}
            </span>
          </div>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: '800' }}>
            {activeCamp.name}
          </h3>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 1 }}>
        <button
          onClick={() => {
            if (activeCamp) {
              localStorage.setItem('claimedCampaign', JSON.stringify(activeCamp));
              window.dispatchEvent(new Event('claimedCampaignChanged'));
            }
            window.location.href = `/courses?offer=${encodeURIComponent(activeCamp?.name || 'claimed')}`;
          }}
          className="btn"
          style={{
            background: '#ffffff',
            color: '#4f46e5',
            fontWeight: '800',
            fontSize: '14px',
            padding: '10px 20px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer'
          }}
        >
          Claim Offer & Explore →
        </button>
        <button
          onClick={() => setVisible(false)}
          style={{
            background: 'rgba(255,255,255,0.15)',
            border: 'none',
            color: '#ffffff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}
          title="Dismiss Banner"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default OfferBanner;
