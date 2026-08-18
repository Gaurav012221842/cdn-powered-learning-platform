import React, { useContext, useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import LessonProgress from '../../components/progress/LessonProgress';
import ProfilePhotoUploader from '../../components/profile/ProfilePhotoUploader';
import OfferBanner from '../../components/campaign/OfferBanner';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL } from '../../services/api';

const Dashboard = () => {
  const { user, siteConfig, showToast } = useContext(AuthContext);
  const brandName = siteConfig?.siteName || 'Gaurav';
  const userName = user?.fullName || 'Gaurav Student';

  const [progressData, setProgressData] = useState({
    completedLessons: 0,
    totalLessons: 0,
    courseTitle: '',
    loading: true
  });

  useEffect(() => {
    const loadStudentDashboardProgress = async () => {
      try {
        const savedUserStr = localStorage.getItem('user');
        const currentUser = user || (savedUserStr ? JSON.parse(savedUserStr) : null);
        const studentId = currentUser?.id || currentUser?.userId || 'current';
        const userEmail = currentUser?.email || '';

        const eRes = await fetch(`${API_V1_URL}/enrollments/student/${studentId}?email=${encodeURIComponent(userEmail)}`);
        if (eRes.ok) {
          const eData = await eRes.json();
          const enrollments = eData?.data || [];
          if (Array.isArray(enrollments) && enrollments.length > 0) {
            const firstCourse = enrollments[0].course || {};
            const courseId = enrollments[0].courseId || firstCourse.id;
            const courseTitle = firstCourse.title || enrollments[0].courseTitle || 'Enrolled Course';

            let totalLessonsCount = 0;
            const cRes = await fetch(`${API_V1_URL}/courses/${courseId}`);
            if (cRes.ok) {
              const cData = await cRes.json();
              const courseDetails = cData?.data || {};
              const chapters = courseDetails.chapters || [];
              chapters.forEach((ch) => {
                totalLessonsCount += (ch.lessons || []).length;
              });
            }

            let completedLessonsCount = 0;
            const pRes = await fetch(`${API_V1_URL}/progress/student/${studentId}/course/${courseId}?email=${encodeURIComponent(userEmail)}`);
            if (pRes.ok) {
              const pData = await pRes.json();
              if (pData?.data && Array.isArray(pData.data)) {
                completedLessonsCount = pData.data.filter((p) => p.isCompleted).length;
              }
            }

            setProgressData({
              completedLessons: completedLessonsCount,
              totalLessons: totalLessonsCount,
              courseTitle: courseTitle,
              loading: false
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to load dashboard progress:', err);
      }
      setProgressData({
        completedLessons: 0,
        totalLessons: 0,
        courseTitle: '',
        loading: false
      });
    };

    loadStudentDashboardProgress();
  }, [user]);

  const handleResumeLearning = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const savedUserStr = localStorage.getItem('user');
    const currentUser = user || (savedUserStr ? JSON.parse(savedUserStr) : null);
    const userId = currentUser?.id || currentUser?.userId || '';
    const userEmail = currentUser?.email || '';

    if (!currentUser) {
      alert("🔒 Please log in to view your courses.");
      window.location.href = '/login';
      return;
    }

    try {
      const res = await fetch(`${API_V1_URL}/enrollments/student/${userId || 'current'}?email=${encodeURIComponent(userEmail)}`);
      const data = await res.json();
      const enrollments = data?.data || [];

      if (Array.isArray(enrollments) && enrollments.length > 0) {
        const targetCourseId = enrollments[0].courseId || enrollments[0].course?.id;
        if (targetCourseId) {
          if (showToast) showToast('🚀 Resuming your course player...', 'info');
          window.location.href = `/courses/${targetCourseId}`;
          return;
        }
      }

      // If user has 0 enrollments
      alert("🔒 You haven't purchased any course yet! Redirecting you to explore available courses...");
      window.location.href = '/courses';
    } catch (err) {
      console.warn('Enrollment check failed:', err);
      alert("🔒 You haven't purchased any course yet! Redirecting you to explore available courses...");
      window.location.href = '/courses';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Active Campaign Banner */}
          <OfferBanner />

          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              borderRadius: 'var(--radius-xl)',
              padding: '36px',
              color: '#ffffff',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: '10px' }}>
                🎓 {brandName} Student Workspace
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>
                Welcome back, {userName}!
              </h1>
              <p style={{ opacity: 0.9, marginTop: '8px', fontSize: '15px' }}>
                Keep up the great work. You're on track to complete your architecture certification!
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => handleResumeLearning(e)}
              className="btn"
              style={{ background: '#ffffff', color: 'var(--primary)', fontWeight: '800', cursor: 'pointer', border: 'none' }}
            >
              ▶️ Resume Learning
            </button>
          </div>

          {/* Profile Photo Settings with Quick Change Password Navigation */}
          <ProfilePhotoUploader />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Current Course Progress
                </h3>
                {progressData.courseTitle && (
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>
                    {progressData.courseTitle}
                  </span>
                )}
              </div>
              {progressData.loading ? (
                <div style={{ fontSize: '14px', color: 'var(--text-muted)', padding: '12px 0' }}>
                  Loading progress...
                </div>
              ) : (
                <LessonProgress
                  completedLessons={progressData.completedLessons}
                  totalLessons={progressData.totalLessons}
                />
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Quick Navigation
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <a
                  href="/student/my-courses"
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  📚 My Courses
                </a>
                <a
                  href="/student/certificates"
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  🎓 Certificates
                </a>
                <a
                  href="/student/wishlist"
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  ❤️ Wishlist
                </a>
                <a
                  href="/student/purchase-history"
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontWeight: '600',
                    fontSize: '14px',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  💳 Purchases
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
