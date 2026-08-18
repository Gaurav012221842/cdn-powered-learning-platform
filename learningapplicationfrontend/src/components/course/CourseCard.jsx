import React from 'react';
import { formatPrice } from '../../utils/formatPrice';

const CourseCard = ({ course }) => {
  const rating = course?.rating || 4.9;
  const instructor = course?.instructor || 'Gaurav Kumar';
  const category = course?.category || 'Development';

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        borderRadius: 'var(--radius-lg)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        height: '100%',
        overflow: 'hidden'
      }}
      onClick={() => (window.location.href = `/courses/${course?.id || 1}`)}
    >
      <div
        style={{
          height: '160px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justify: 'space-between',
          color: '#ffffff',
          position: 'relative'
        }}
      >
        <span
          className="badge"
          style={{
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            alignSelf: 'flex-start'
          }}
        >
          {category}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
          <span>⭐ {rating}</span>
          <span style={{ opacity: 0.8 }}>({course?.students || '1,200'} enrolled)</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            lineHeight: 1.3
          }}
        >
          {course?.title || 'Course Title'}
        </h3>
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            lineHeight: 1.5,
            flex: 1
          }}
        >
          {course?.description || 'Learn cutting-edge development skills with hands-on practice.'}
        </p>

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>
          👨‍🏫 Instructor: <span style={{ color: 'var(--text-primary)' }}>{instructor}</span>
        </div>
      </div>

      {(() => {
        const rawPrice = course?.price || 49.99;
        let claimedCampaign = null;
        try {
          const raw = localStorage.getItem('claimedCampaign');
          if (raw) claimedCampaign = JSON.parse(raw);
        } catch (e) {}

        const discountPct = course?.discountPercentage || claimedCampaign?.discountPercentage || 25;
        const discountedPrice = Math.max(1, rawPrice * (1 - discountPct / 100));

        return (
          <div
            style={{
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              paddingTop: '16px',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: '800', fontSize: '20px', color: 'var(--primary)' }}>
                  {formatPrice(discountedPrice)}
                </span>
                <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '13px' }}>
                  {formatPrice(rawPrice)}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>
                🔥 {discountPct}% OFF {claimedCampaign ? 'Claimed' : 'Special Offer'}
              </span>
            </div>
            <button
              className="btn btn-primary"
              style={{ padding: '8px 16px', fontSize: '13px' }}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/courses/${course?.id || 1}`;
              }}
            >
              View Course
            </button>
          </div>
        );
      })()}
    </div>
  );
};

export default CourseCard;
