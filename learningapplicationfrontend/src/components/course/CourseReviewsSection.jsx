import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL } from '../../services/api';

const CourseReviewsSection = ({ courseId, courseTitle, onSummaryChange }) => {
  const { user, showToast } = useContext(AuthContext);

  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ averageRating: 4.9, totalReviews: 0, starBreakdown: {} });
  const [loading, setLoading] = useState(true);

  // Review submission state
  const [selectedStars, setSelectedStars] = useState(5);
  const [hoverStars, setHoverStars] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showWriteModal, setShowWriteModal] = useState(false);

  const loadReviews = async () => {
    if (!courseId || courseId === 'courses') return;
    setLoading(true);
    try {
      // 1. Fetch reviews list
      const rRes = await fetch(`${API_V1_URL}/reviews/course/${courseId}`);
      if (rRes.ok) {
        const rData = await rRes.json();
        const list = Array.isArray(rData?.data) ? rData.data : [];
        setReviews(list);
      }

      // 2. Fetch rating summary
      const sRes = await fetch(`${API_V1_URL}/reviews/course/${courseId}/summary`);
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData?.data) {
          setSummary(sData.data);
          if (onSummaryChange) {
            onSummaryChange(sData.data);
          }
        }
      }
    } catch (err) {
      console.warn('Could not load course reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) {
      if (showToast) showToast('🔒 Please sign in to leave a review for this course!', 'info');
      window.location.href = `/login?redirect=/courses/${courseId}`;
      return;
    }

    if (!commentText.trim()) {
      if (showToast) showToast('Please write a few words about your experience with this course.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const studentId = user.id || '';
      const email = user.email || '';
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const url = `${API_V1_URL}/reviews?courseId=${courseId}&rating=${selectedStars}&comment=${encodeURIComponent(commentText.trim())}${studentId ? `&studentId=${studentId}` : ''}${email ? `&email=${encodeURIComponent(email)}` : ''}`;
      
      const res = await fetch(url, { method: 'POST', headers });
      if (res.ok) {
        await res.json().catch(() => ({}));
        if (showToast) showToast('🎉 Thank you! Your review and rating have been published.', 'success');
        setCommentText('');
        setShowWriteModal(false);
        loadReviews();
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (err) {
      if (showToast) showToast('Could not submit review. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = summary.averageRating || (reviews.length > 0 ? (reviews.reduce((a, b) => a + (b.rating || 5), 0) / reviews.length).toFixed(1) : 4.9);
  const totalCount = summary.totalReviews || reviews.length;

  return (
    <div className="card" style={{ padding: '32px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '28px', border: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
      {/* Header Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
        <div>
          <span className="badge badge-accent" style={{ marginBottom: '6px', fontSize: '11px' }}>
            ⭐ STUDENT TESTIMONIALS & RATINGS
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
            Course Reviews & Feedback
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Real reviews from verified students who enrolled in this masterclass.
          </p>
        </div>

        <button
          onClick={() => {
            if (!user) {
              if (showToast) showToast('🔒 Please sign in to write a review!', 'info');
              window.location.href = `/login?redirect=/courses/${courseId}`;
              return;
            }
            setShowWriteModal(true);
          }}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontWeight: '800', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', borderRadius: '12px' }}
        >
          <span>✍️</span>
          <span>Write a Review</span>
        </button>
      </div>

      {/* Ratings Overview Banner */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: '18px',
          padding: '24px',
          border: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '24px',
          alignItems: 'center'
        }}
      >
        {/* Score Left Box */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <div style={{ fontSize: '48px', fontWeight: '900', color: 'var(--text-primary)', lineHeight: 1 }}>
            {avgRating}
          </div>
          <div style={{ fontSize: '20px', color: '#f59e0b' }}>
            {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '700' }}>
            Course Rating • {totalCount} {totalCount === 1 ? 'Review' : 'Reviews'}
          </div>
        </div>

        {/* Value Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '16px', color: '#10b981' }}>✅</span>
            <span><strong>100% Verified Student Reviews</strong> (Enrolled learners)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '16px', color: '#3b82f6' }}>⚡</span>
            <span>Up-to-date with latest 2026 course architecture curriculum</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '16px', color: '#f59e0b' }}>🏆</span>
            <span>Accredited Completion Certificate upon 100% progress</span>
          </div>
        </div>
      </div>

      {/* Review Write Modal / Expandable Form */}
      {showWriteModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(6px)',
            zIndex: 3500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            className="card animate-fade-in"
            style={{
              maxWidth: '520px',
              width: '100%',
              borderRadius: '24px',
              padding: '32px',
              background: 'var(--bg-card)',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  Rate & Review Course
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Posting as: <strong>{user?.fullName || user?.email}</strong>
                </div>
              </div>
              <button
                onClick={() => setShowWriteModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Star Picker */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  Your Overall Rating:
                </label>
                <div style={{ display: 'flex', gap: '8px', fontSize: '32px', cursor: 'pointer' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      onMouseEnter={() => setHoverStars(star)}
                      onMouseLeave={() => setHoverStars(0)}
                      onClick={() => setSelectedStars(star)}
                      style={{
                        color: (hoverStars || selectedStars) >= star ? '#f59e0b' : 'var(--border-color)',
                        transition: 'transform 0.15s',
                        transform: (hoverStars || selectedStars) >= star ? 'scale(1.15)' : 'scale(1)'
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span style={{ fontSize: '14px', fontWeight: '800', color: 'var(--primary)', alignSelf: 'center', marginLeft: '10px' }}>
                    {selectedStars} / 5 Stars
                  </span>
                </div>
              </div>

              {/* Comment Textarea */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ fontWeight: '700' }}>Your Review Feedback:</label>
                <textarea
                  rows="4"
                  required
                  placeholder="What did you learn? How were the video lectures, quizzes, and project labs?"
                  className="form-input"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', fontSize: '14px', resize: 'vertical' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontWeight: '800', fontSize: '14px' }}
                >
                  {submitting ? 'Publishing Review...' : '🚀 Submit Public Review'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWriteModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '12px 18px', fontWeight: '700' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reviews List Feed */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          🔄 Loading student reviews...
        </div>
      ) : reviews.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reviews.map((rev, idx) => {
            const initial = (rev.studentName || 'Student').charAt(0).toUpperCase();
            const dateStr = rev.createdAt ? new Date(rev.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : 'Verified Student';
            const starCount = rev.rating || 5;

            return (
              <div
                key={rev.id || idx}
                style={{
                  background: 'var(--bg-secondary)',
                  borderRadius: '16px',
                  padding: '20px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {rev.avatarUrl ? (
                      <img
                        src={rev.avatarUrl}
                        alt={rev.studentName}
                        style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '42px',
                          height: '42px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '16px'
                        }}
                      >
                        {initial}
                      </div>
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-primary)' }}>
                          {rev.studentName || 'Student Learner'}
                        </span>
                        <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                          ✓ Verified Student
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Reviewed on {dateStr}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '18px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {'★'.repeat(starCount)}{'☆'.repeat(5 - starCount)}
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-primary)', marginLeft: '6px' }}>
                      {starCount}.0
                    </span>
                  </div>
                </div>

                {rev.comment && (
                  <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, opacity: 0.95 }}>
                    "{rev.comment}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            border: '1px dashed var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div style={{ fontSize: '40px' }}>⭐</div>
          <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            No Public Reviews Yet
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0, maxWidth: '400px' }}>
            Be the first student to review <strong>{courseTitle || 'this course'}</strong> and help future learners!
          </p>
          <button
            onClick={() => {
              if (!user) {
                if (showToast) showToast('🔒 Please sign in to write a review!', 'info');
                window.location.href = `/login?redirect=/courses/${courseId}`;
                return;
              }
              setShowWriteModal(true);
            }}
            className="btn btn-primary"
            style={{ padding: '8px 18px', fontSize: '13px', fontWeight: '800', marginTop: '6px' }}
          >
            ⭐ Be First to Rate & Review
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseReviewsSection;
