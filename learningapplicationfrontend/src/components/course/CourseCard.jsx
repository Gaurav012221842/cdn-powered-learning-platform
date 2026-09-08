import React, { useState, useEffect, useContext } from 'react';
import { formatPrice } from '../../utils/formatPrice';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL } from '../../services/api';

const CourseCard = ({ course, onWishlistChange }) => {
  const { user, showToast } = useContext(AuthContext);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [reviewSummary, setReviewSummary] = useState({
    averageRating: course?.rating || course?.averageRating || null,
    totalReviews: course?.totalReviews || 0
  });

  const instructor = course?.instructor || 'Gaurav Kumar';
  const category = course?.category || 'Development';
  const courseId = course?.id;

  // Real-time dynamic rating calculation
  const liveRating = reviewSummary?.totalReviews > 0
    ? Number(reviewSummary.averageRating).toFixed(1)
    : (course?.rating ? Number(course.rating).toFixed(1) : '5.0');
  const liveReviews = reviewSummary?.totalReviews || 0;

  // Fetch real-time rating summary for this course
  useEffect(() => {
    if (!courseId) return;
    fetch(`${API_V1_URL}/reviews/course/${courseId}/summary`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && typeof data.data.averageRating !== 'undefined') {
          setReviewSummary(data.data);
        }
      })
      .catch(() => {});
  }, [courseId]);

  // Check if course is in user's wishlist
  useEffect(() => {
    if (!user || !courseId) {
      // Check local cache for guests / instant state
      const localWishlist = JSON.parse(localStorage.getItem('user_wishlist_ids') || '[]');
      setIsWishlisted(localWishlist.includes(String(courseId)));
      return;
    }

    const studentId = user.id || '';
    const email = user.email || '';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    fetch(`${API_V1_URL}/wishlists/check?courseId=${courseId}${studentId ? `&studentId=${studentId}` : ''}${email ? `&email=${encodeURIComponent(email)}` : ''}`, { headers })
      .then((res) => res.json())
      .then((data) => {
        if (data?.data && typeof data.data.inWishlist === 'boolean') {
          setIsWishlisted(data.data.inWishlist);
        }
      })
      .catch(() => {});
  }, [user, courseId]);

  // Toggle wishlist action
  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) {
      if (showToast) showToast('🔒 Please sign in to save courses to your wishlist!', 'info');
      window.location.href = `/login?redirect=/courses/${courseId || ''}`;
      return;
    }

    if (wishlistLoading) return;
    setWishlistLoading(true);

    const studentId = user.id || '';
    const email = user.email || '';
    const token = localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    // Update local cache
    const localWishlist = new Set(JSON.parse(localStorage.getItem('user_wishlist_ids') || '[]'));
    if (nextState) {
      localWishlist.add(String(courseId));
    } else {
      localWishlist.delete(String(courseId));
    }
    localStorage.setItem('user_wishlist_ids', JSON.stringify(Array.from(localWishlist)));

    try {
      if (nextState) {
        // Add to wishlist
        const url = `${API_V1_URL}/wishlists?courseId=${courseId}${studentId ? `&studentId=${studentId}` : ''}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
        await fetch(url, { method: 'POST', headers });
        if (showToast) showToast(`❤️ Added "${course?.title || 'Course'}" to your Wishlist!`, 'success');
      } else {
        // Remove from wishlist
        const url = `${API_V1_URL}/wishlists?courseId=${courseId}${studentId ? `&studentId=${studentId}` : ''}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
        await fetch(url, { method: 'DELETE', headers });
        if (showToast) showToast(`💔 Removed from your Wishlist.`, 'info');
      }
      if (onWishlistChange) onWishlistChange(courseId, nextState);
    } catch (err) {
      console.warn('Wishlist toggle API error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

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
        overflow: 'hidden',
        position: 'relative'
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
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
          <span
            className="badge"
            style={{
              background: 'rgba(255, 255, 255, 0.25)',
              backdropFilter: 'blur(8px)',
              color: '#ffffff'
            }}
          >
            {category}
          </span>

          {/* Floating Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleToggleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
            style={{
              background: isWishlisted ? '#ef4444' : 'rgba(0, 0, 0, 0.35)',
              border: isWishlisted ? 'none' : '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(6px)',
              boxShadow: isWishlisted ? '0 4px 12px rgba(239, 68, 68, 0.4)' : 'none',
              transform: isWishlisted ? 'scale(1.05)' : 'scale(1)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = isWishlisted ? 'scale(1.05)' : 'scale(1)';
            }}
          >
            {isWishlisted ? '❤️' : '🤍'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '700' }}>
          <span>⭐ {liveRating}</span>
          <span style={{ opacity: 0.85 }}>({liveReviews} {liveReviews === 1 ? 'review' : 'reviews'})</span>
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

        <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
          <span>👨‍🏫 Instructor: <span style={{ color: 'var(--text-primary)' }}>{instructor}</span></span>
          {course?.chapters?.length > 0 && (
            <span>🎓 {course.chapters.length} {course.chapters.length === 1 ? 'Chapter' : 'Chapters'}</span>
          )}
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
              justifyContent: 'space-between',
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
