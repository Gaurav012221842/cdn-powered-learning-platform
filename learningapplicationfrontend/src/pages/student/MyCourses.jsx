import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL, fetchStudentProgress, getCookie } from '../../services/api';

const EnrolledCourseCard = ({ course, pct, compLess, totalLess }) => {
  const [imgErr, setImgErr] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const thumbnailUrl = course?.thumbnailUrl || course?.imageUrl || course?.thumbnail || course?.coverImage;

  return (
    <div
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        borderRadius: '18px',
        border: '1px solid var(--border-color)',
        overflow: 'hidden',
        transition: 'all 0.3s ease',
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        style={{
          height: '165px',
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          color: '#ffffff',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Course Thumbnail */}
        {thumbnailUrl && !imgErr && (
          <img
            src={thumbnailUrl}
            alt={course?.title || 'Course Thumbnail'}
            onError={() => setImgErr(true)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              zIndex: 0,
              transform: isHovered ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        )}

        {/* Gradient dark overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: thumbnailUrl && !imgErr
              ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.4) 0%, rgba(15, 23, 42, 0.1) 40%, rgba(15, 23, 42, 0.85) 100%)'
              : 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
            zIndex: 1,
            pointerEvents: 'none'
          }}
        />

        <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span
            className="badge"
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '700'
            }}
          >
            {course.category || 'Full Stack'}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: '800',
              background: pct === 100 ? '#10b981' : 'rgba(15, 23, 42, 0.75)',
              color: '#fff',
              padding: '3px 8px',
              borderRadius: '6px',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {pct === 100 ? '🏆 Completed' : `${pct}% Complete`}
          </span>
        </div>

        <div style={{ position: 'relative', zIndex: 2, fontSize: '12px', fontWeight: '700', textShadow: '0 1px 3px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
          <span>Active Student Access</span>
        </div>
      </div>

      <div style={{ padding: '0 20px 20px 20px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
          {course.title || 'Masterclass'}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, flex: 1 }}>
          {course.description || 'Master modern development and cloud architecture.'}
        </p>

        {/* Progress Bar */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>Progress</span>
            <span>{pct}% ({compLess}/{totalLess} Lessons)</span>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', transition: 'width 0.3s ease' }} />
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
};

const MyCourses = () => {
  const { user, siteConfig } = useContext(AuthContext);
  const brandName = siteConfig?.siteName || 'Gaurav';
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
    const studentId = savedUser?.id || 'current';
    const userEmail = savedUser?.email || '';
    const token = getCookie('token');

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Step 1: Fetch user enrollments from backend
    fetch(`${API_V1_URL}/enrollments/student/${studentId}?email=${encodeURIComponent(userEmail)}`, { headers })
      .then((res) => res.json())
      .then(async (data) => {
        let enrollmentList = (data && data.data && Array.isArray(data.data)) ? data.data : [];

        // If Admin has 0 manual enrollments, load all available courses for preview
        if (enrollmentList.length === 0 && savedUser?.role === 'ADMIN') {
          try {
            const allRes = await fetch(`${API_V1_URL}/courses`, { headers });
            if (allRes.ok) {
              const allData = await allRes.json();
              if (allData?.data && Array.isArray(allData.data)) {
                enrollmentList = allData.data.map((c) => ({ courseId: c.id, course: c }));
              }
            }
          } catch (e) {}
        }

        if (enrollmentList.length > 0) {
          // Fetch course details and real progress from PostgreSQL for each enrolled course
          const enrolledList = await Promise.all(
            enrollmentList.map(async (e) => {
              const cId = e.courseId || e.course?.id;
              let courseObj = e.course;
              try {
                const cRes = await fetch(`${API_V1_URL}/courses/${cId}`, { headers });
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
                  <EnrolledCourseCard
                    key={course.id || idx}
                    course={course}
                    pct={pct}
                    compLess={compLess}
                    totalLess={totalLess}
                  />
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
