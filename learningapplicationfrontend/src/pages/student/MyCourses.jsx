import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL, fetchStudentProgress } from '../../services/api';

const MyCourses = () => {
  const { user, siteConfig } = useContext(AuthContext);
  const brandName = siteConfig?.siteName || 'Gaurav';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
    const studentId = savedUser?.id || 'current';
    const userEmail = savedUser?.email || '';
    const token = localStorage.getItem('token');

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Step 1: Fetch user enrollments from backend
    fetch(`${API_V1_URL}/enrollments/student/${studentId}?email=${encodeURIComponent(userEmail)}`, { headers })
      .then((res) => res.json())
      .then(async (data) => {
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          // Fetch course details and real progress from PostgreSQL for each enrolled course
          const enrolledList = await Promise.all(
            data.data.map(async (e) => {
              const cId = e.courseId || e.course?.id;
              let courseObj = e.course;
              try {
                const cRes = await fetch(`${API_V1_URL}/courses/${cId}`);
                if (cRes.ok) {
                  const cData = await cRes.json();
                  courseObj = cData.data || e.course;
                }
              } catch (err) {}

              // Fetch real persistent progress from DB using centralized helper
              let completedLessonsCount = 0;
              try {
                const pData = await fetchStudentProgress(cId, savedUser);
                if (pData?.data && Array.isArray(pData.data)) {
                  completedLessonsCount = pData.data.filter((p) => p.isCompleted).length;
                }
              } catch (err) {
                console.warn('Could not fetch progress for course:', cId, err);
              }

              return {
                ...(courseObj || { id: cId, title: 'Enrolled Masterclass' }),
                completedLessonsCount
              };
            })
          );
          setCourses(enrolledList.filter(Boolean));
        } else {
          setCourses([]);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch enrollments:', err);
        setCourses([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              padding: '32px',
              borderRadius: '20px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              boxShadow: 'var(--shadow-md)'
            }}
          >
            <div>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: '8px' }}>
                🎓 {brandName} Enrolled Library
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0' }}>
                My Enrolled Courses
              </h1>
              <p style={{ opacity: 0.9, fontSize: '15px', margin: 0 }}>
                Access all your purchased engineering masterclasses, video lectures, quizzes, and PDF resources.
              </p>
            </div>
            <a href="/courses" className="btn" style={{ background: '#ffffff', color: 'var(--primary)', fontWeight: '800', padding: '10px 20px' }}>
              + Browse More Courses
            </a>
          </div>

          {/* Enrolled Courses Grid */}
          {loading ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              🔄 Loading your enrolled courses...
            </div>
          ) : courses.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {courses.map((course, idx) => {
                const totalLess = course.chapters ? course.chapters.reduce((acc, ch) => acc + (ch.lessons ? ch.lessons.length : 0), 0) : 0;
                const compLess = course.completedLessonsCount || 0;
                const pct = totalLess > 0 ? Math.round((compLess / totalLess) * 100) : 0;

                return (
                  <div
                    key={course.id || idx}
                    className="card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      borderRadius: '18px',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div
                      style={{
                        height: '140px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justify: 'space-between',
                        color: '#ffffff'
                      }}
                    >
                      <span className="badge" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', alignSelf: 'flex-start' }}>
                        {course.category || 'Full Stack'}
                      </span>
                      <div style={{ fontSize: '12px', fontWeight: '700' }}>
                        ✅ Active Student Access
                      </div>
                    </div>

                    <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                        {course.title || 'System Architecture Masterclass'}
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, flex: 1 }}>
                        {course.description || 'Master cloud architecture, microservices, and distributed streaming.'}
                      </p>

                      {/* Progress Bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          <span>Progress</span>
                          <span>{pct}% ({compLess}/{totalLess} Lessons)</span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: '#10b981' }} />
                        </div>
                      </div>

                      <a
                        href={`/courses/${course.id || 1}`}
                        className="btn btn-primary"
                        style={{
                          width: '100%',
                          textAlign: 'center',
                          padding: '10px',
                          fontWeight: '800',
                          fontSize: '14px',
                          marginTop: '8px',
                          display: 'block',
                          textDecoration: 'none'
                        }}
                      >
                        ▶️ Continue Learning
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No enrolled courses found. Explore our catalog and enroll to start learning!
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default MyCourses;
