import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import SecureVideoPlayer from '../../components/video/SecureVideoPlayer';
import RazorpayPaymentModal from '../../components/payment/RazorpayPaymentModal';
import OfferBanner from '../../components/campaign/OfferBanner';
import CertificateModal from '../../components/certificate/CertificateModal';
import StudentQuizViewer from '../../components/quiz/StudentQuizViewer';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL, fetchStudentProgress, toggleLessonProgress } from '../../services/api';

const isQuizLesson = (les) => {
  if (!les) return false;
  const type = (les.lessonType || '').toUpperCase();
  return type === 'QUIZ';
};

const isPdfLesson = (les) => {
  if (!les) return false;
  const type = (les.lessonType || '').toUpperCase();
  if (type === 'PDF' || type === 'DOCUMENT') return true;
  const url = (les.contentUrl || les.pdfUrl || '').toLowerCase();
  return url.endsWith('.pdf') || url.includes('/pdf/');
};

const isImageLesson = (les) => {
  if (!les) return false;
  const type = (les.lessonType || '').toUpperCase();
  if (type === 'IMAGE' || type === 'PHOTO' || type === 'DIAGRAM' || type === 'SLIDE') return true;
  const url = (les.contentUrl || les.imageUrl || les.videoThumbnailUrl || '').toLowerCase();
  return (
    url.endsWith('.jpg') ||
    url.endsWith('.jpeg') ||
    url.endsWith('.png') ||
    url.endsWith('.webp') ||
    url.endsWith('.gif') ||
    url.endsWith('.svg') ||
    url.includes('/image/')
  );
};

const CourseDetails = () => {
  const { user, showToast } = useContext(AuthContext);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [showRazorpayModal, setShowRazorpayModal] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [lessonSearch, setLessonSearch] = useState('');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [collapsedChapters, setCollapsedChapters] = useState({});
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  // Extract courseId from URL path
  const pathParts = window.location.pathname.split('/');
  const courseId = pathParts[pathParts.length - 1];

  // Fetch persistent student progress from backend PostgreSQL DB
  useEffect(() => {
    if (!courseId) return;

    fetchStudentProgress(courseId, user)
      .then((data) => {
        if (data && data.data && Array.isArray(data.data)) {
          const completedIds = data.data.filter((p) => p.isCompleted).map((p) => String(p.lessonId));
          setCompletedLessons(completedIds);
        }
      })
      .catch((err) => console.warn('Could not fetch student progress from DB:', err));
  }, [courseId, user]);

  const toggleChapterCollapse = (chapId) => {
    setCollapsedChapters((prev) => ({
      ...prev,
      [chapId]: !prev[chapId]
    }));
  };

  const handleToggleLessonComplete = (lessonId) => {
    const stringLessonId = String(lessonId);
    const isCompletedNow = completedLessons.includes(stringLessonId);
    const newStatus = !isCompletedNow;

    if (isCompletedNow) {
      setCompletedLessons((prev) => prev.filter((id) => id !== stringLessonId));
    } else {
      setCompletedLessons((prev) => [...prev, stringLessonId]);
      if (showToast) showToast('🎉 Lesson marked completed!', 'success');
    }

    // Persist progress to backend PostgreSQL database
    toggleLessonProgress(courseId, stringLessonId, newStatus, user)
      .then((data) => console.log('Progress toggle saved in DB:', data))
      .catch((err) => console.warn('Failed to persist progress in PostgreSQL:', err));
  };

  useEffect(() => {
    console.log('User authContext', user);
    console.log('Enroll user data:', {
      id: user?.id,
      email: user?.email,
      role: user?.role,
      fullName: user?.fullName
    });
  }, [user]);

  useEffect(() => {
    if (!courseId || courseId === 'courses') {
      setLoading(false);
      return;
    }

    // Step 1: Fetch Course details
    fetch(`${API_V1_URL}/courses/${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data) {
          setCourse(data.data);
          if (data.data.chapters && data.data.chapters.length > 0) {
            const firstChap = data.data.chapters[0];
            if (firstChap.lessons && firstChap.lessons.length > 0) {
              setActiveLesson(firstChap.lessons[0]);
            }
          }
        }
      })
      .catch((err) => console.warn('Error fetching course:', err))
      .finally(() => setLoading(false));

    // Step 2: Query live PostgreSQL database for student enrollment status
    const studentId = user?.id || '';
    const userEmail = user?.email || '';
    fetch(`${API_V1_URL}/enrollments/student/${studentId || 'current'}?email=${encodeURIComponent(userEmail)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data)) {
          const match = data.data.some((e) => e.courseId === courseId || e.course?.id === courseId);
          if (match) {
            setIsEnrolled(true);
          } else {
            setIsEnrolled(false);
            localStorage.removeItem(`enrolled_${courseId}`);
          }
        } else {
          setIsEnrolled(false);
          localStorage.removeItem(`enrolled_${courseId}`);
        }
      })
      .catch(() => {
        setIsEnrolled(false);
      });
  }, [courseId, user]);

  const handleLessonSelect = (lesson, isPreviewAllowed) => {
    if (isPreviewAllowed || isEnrolled) {
      setActiveLesson(lesson);
      setQuizAnswers({});
      setQuizScore(null);
    } else if (!user) {
      showToast('🔒 Please sign in to access course lessons!', 'info');
      window.location.href = `/login?redirect=/courses/${courseId}`;
    } else {
      showToast('🔒 Enrollment required to view this lesson!', 'info');
      setShowRazorpayModal(true);
    }
  };

  const handleEnrollClick = () => {
    if (!user) {
      showToast('🔒 Please sign in to purchase or enroll in this course!', 'info');
      window.location.href = `/login?redirect=/courses/${courseId}`;
      return;
    }
    if (isEnrolled) {
      showToast('You are enrolled! Accessing lessons...', 'success');
    } else {
      setShowRazorpayModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    setIsEnrolled(true);
    setShowRazorpayModal(false);
  };

  const handleQuizSubmit = (quizQuestions) => {
    let score = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correctIndex) {
        score++;
      }
    });
    setQuizScore({ score, total: quizQuestions.length });
    showToast(`Quiz result: ${score} out of ${quizQuestions.length} correct!`, score === quizQuestions.length ? 'success' : 'info');
  };

  const parseQuizData = (rawJson) => {
    try {
      if (!rawJson) return null;
      return typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;
    } catch (e) {
      return null;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Navbar />
        <main style={{ flex: 1, padding: '80px 24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          🔄 Loading Course Details...
        </main>
        <Footer />
      </div>
    );
  }

  const activeQuizObj = activeLesson?.lessonType === 'QUIZ' ? parseQuizData(activeLesson.quizData) : null;

  const rawPriceUsd = course?.price || 49.99;
  let claimedCampaign = null;
  try {
    const raw = localStorage.getItem('claimedCampaign');
    if (raw) claimedCampaign = JSON.parse(raw);
  } catch (e) {}

  const discountPct = course?.discountPercentage || claimedCampaign?.discountPercentage || 25;
  const discountedPriceUsd = Math.max(1, rawPriceUsd * (1 - discountPct / 100));
  const discountedPriceInr = Math.round(discountedPriceUsd * 83);

  const currentlyEnrolled = isEnrolled || localStorage.getItem(`enrolled_${courseId}`) === 'true';

  // =========================================================================
  // ENROLLED STUDENT WORKSPACE VIEW (Distraction-free Left Sidebar + Right View)
  // =========================================================================
  if (currentlyEnrolled) {
    const allLessons = course?.chapters ? course.chapters.flatMap((ch) => ch.lessons || []) : [];
    const totalCount = allLessons.length;
    const completedCount = allLessons.filter((les) => completedLessons.includes(String(les.id))).length;
    const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const isFullyCompleted = progressPct === 100 && totalCount > 0;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <Navbar />

        {/* Dedicated Enrolled Player Header Bar */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '16px 24px',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a
              href="/student/my-courses"
              className="btn btn-secondary"
              style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '800', borderRadius: '10px', textDecoration: 'none' }}
            >
              ← My Courses
            </a>
            <div>
              <span className="badge badge-accent" style={{ fontSize: '11px', marginBottom: '2px' }}>
                🎓 STUDENT WORKSPACE
              </span>
              <h1 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
                {course?.title || 'System Architecture & Distributed Systems'}
              </h1>
            </div>
          </div>

          {/* Student Progress & 100% Certificate CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isFullyCompleted && (
              <button
                onClick={() => setShowCertificateModal(true)}
                className="btn"
                style={{
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: '#ffffff',
                  fontWeight: '800',
                  fontSize: '13px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                  cursor: 'pointer'
                }}
              >
                🎓 Download Official Certificate
              </button>
            )}

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {completedCount} / {totalCount} Lessons ({progressPct}%)
              </div>
              <div
                style={{
                  width: '180px',
                  height: '8px',
                  background: 'var(--border-color)',
                  borderRadius: '4px',
                  marginTop: '4px',
                  overflow: 'hidden'
                }}
              >
                <div
                  style={{
                    width: `${progressPct}%`,
                    height: '100%',
                    background: '#10b981',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 100% Course Completion Celebration Banner */}
        {isFullyCompleted && (
          <div
            style={{
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: '#ffffff',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justify: 'space-between',
              fontWeight: '800',
              fontSize: '15px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>🏆</span>
              <span>Congratulations! You have completed 100% of this masterclass!</span>
            </div>
            <button
              onClick={() => setShowCertificateModal(true)}
              className="btn"
              style={{ background: '#ffffff', color: '#059669', fontWeight: '800', padding: '6px 16px', borderRadius: '8px', fontSize: '13px' }}
            >
              🎓 View & Print Certificate →
            </button>
          </div>
        )}

        {/* Enrolled Workspace Responsive Split Layout */}
        <div className="course-workspace-layout">
          
          {/* LEFT SIDEBAR: Collapsible Topic Dropdowns (Array, Linked List, DP, etc.) */}
          <div className="course-sidebar">
            <div style={{ padding: '16px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                📚 COURSE TOPICS ({course?.chapters?.length || 0} TOPICS, {totalCount} LESSONS)
              </div>
              <input
                type="text"
                placeholder="🔍 Search video/quiz/pdf..."
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '13px', borderRadius: '10px' }}
                value={lessonSearch}
                onChange={(e) => setLessonSearch(e.target.value)}
              />
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {course?.chapters && course.chapters.length > 0 ? (
                course.chapters.map((chap, cIdx) => {
                  const chapId = chap.id || `chap_${cIdx}`;
                  const isCollapsed = collapsedChapters[chapId];
                  const chapLessons = chap.lessons || [];
                  const filteredChapLessons = chapLessons.filter((l) =>
                    (l.title || '').toLowerCase().includes(lessonSearch.toLowerCase())
                  );
                  const chapCompletedCount = chapLessons.filter((l) => completedLessons.includes(String(l.id))).length;
                  const isChapFullyCompleted = chapLessons.length > 0 && chapCompletedCount === chapLessons.length;

                  return (
                    <div key={chapId} style={{ border: '1px solid var(--border-color)', borderRadius: '14px', overflow: 'hidden' }}>
                      {/* Collapsible Topic Accordion Header */}
                      <div
                        onClick={() => toggleChapterCollapse(chapId)}
                        style={{
                          padding: '12px 14px',
                          background: 'var(--bg-secondary)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justify: 'space-between',
                          userSelect: 'none',
                          borderBottom: isCollapsed ? 'none' : '1px solid var(--border-color)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            {isCollapsed ? '►' : '▼'}
                          </span>
                          <div style={{ fontSize: '13px', fontWeight: '800', color: 'var(--primary)' }}>
                            📁 Topic {cIdx + 1}: {chap.title || `Topic ${cIdx + 1}`}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '700' }}>
                            {chapCompletedCount}/{chapLessons.length}
                          </span>
                          {isChapFullyCompleted && <span style={{ fontSize: '13px' }}>✅</span>}
                        </div>
                      </div>

                      {/* Collapsible Lessons Dropdown List */}
                      {!isCollapsed && (
                        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--bg-card)' }}>
                          {filteredChapLessons.length > 0 ? (
                            filteredChapLessons.map((les) => {
                              const isCurrent = activeLesson?.id === les.id;
                              const isCompleted = completedLessons.includes(String(les.id));
                              const icon = isQuizLesson(les)
                                ? '📝'
                                : isPdfLesson(les)
                                ? '📄'
                                : isImageLesson(les)
                                ? '🖼️'
                                : '📹';

                              return (
                                <div
                                  key={les.id}
                                  onClick={() => handleLessonSelect(les, true)}
                                  style={{
                                    padding: '10px 12px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    background: isCurrent ? 'var(--primary-light)' : 'var(--bg-secondary)',
                                    border: isCurrent ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '10px',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                                    <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center' }}>{icon}</span>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div
                                        style={{
                                          fontSize: '13px',
                                          fontWeight: isCurrent ? '800' : '600',
                                          color: isCurrent ? 'var(--primary)' : 'var(--text-primary)',
                                          whiteSpace: 'nowrap',
                                          textOverflow: 'ellipsis',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {les.title}
                                      </div>
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                        {les.lessonType || 'VIDEO'}
                                      </div>
                                    </div>
                                  </div>
                                  <span style={{ fontSize: '14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {isCompleted ? '✅' : '⭕'}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <div style={{ padding: '8px', fontSize: '12px', color: 'var(--text-muted)' }}>
                              No matching lessons in this topic
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '20px', fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>
                  No topics uploaded yet.
                </div>
              )}
            </div>
          </div>

          {/* RIGHT SIDE MAIN CONTENT AREA */}
          <div className="course-content-area" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header & Mark Complete */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <span className="badge badge-accent" style={{ marginBottom: '6px' }}>
                  {isQuizLesson(activeLesson)
                    ? '📝 Interactive Quiz'
                    : isPdfLesson(activeLesson)
                    ? '📄 PDF Document Resource'
                    : isImageLesson(activeLesson)
                    ? '🖼️ Image & CDN Resource'
                    : '📹 Masterclass Lecture'}
                </span>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  {activeLesson?.title || 'Select a lesson to begin learning'}
                </h2>
              </div>

              {activeLesson && (
                <button
                  onClick={() => handleToggleLessonComplete(activeLesson.id)}
                  className={`btn ${completedLessons.includes(activeLesson?.id) ? 'btn-secondary' : 'btn-primary'}`}
                  style={{ padding: '10px 18px', fontSize: '13px', fontWeight: '800', borderRadius: '12px' }}
                >
                  {completedLessons.includes(activeLesson?.id) ? '✅ Mark Uncompleted' : '✓ Mark as Completed'}
                </button>
              )}
            </div>

            {/* Active Content Viewer */}
            {activeLesson ? (
              isQuizLesson(activeLesson) ? (
                /* QUIZ VIEWER */
                <StudentQuizViewer
                  key={activeLesson?.id || activeLesson?.title}
                  courseId={course?.id}
                  lessonId={activeLesson?.id}
                  quizData={activeLesson?.quizData}
                  onComplete={(isPassed, pct, score, total) => {
                    if (showToast) {
                      showToast(
                        isPassed
                          ? `🎉 Quiz Passed! ${score}/${total} Correct (${pct}%)`
                          : `⚠️ Quiz Submitted. ${score}/${total} Correct (${pct}%). Review explanations below!`,
                        isPassed ? 'success' : 'info'
                      );
                    }
                    if (activeLesson && activeLesson.id) {
                      const stringLessonId = String(activeLesson.id);
                      if (!completedLessons.includes(stringLessonId)) {
                        handleToggleLessonComplete(activeLesson.id);
                      }
                    }
                  }}
                />
              ) : isPdfLesson(activeLesson) ? (
                /* PDF VIEWER */
                <div className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                      📄 PDF Document & Learning Resource
                    </h3>
                    <a
                      href={activeLesson.pdfUrl || activeLesson.contentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '10px' }}
                    >
                      📥 Download PDF
                    </a>
                  </div>
                  <iframe
                    src={activeLesson.pdfUrl || activeLesson.contentUrl}
                    title={activeLesson.title}
                    style={{ width: '100%', height: '600px', borderRadius: '14px', border: '1px solid var(--border-color)' }}
                  />
                </div>
              ) : isImageLesson(activeLesson) ? (
                /* IMAGE & CDN ASSET VIEWER */
                <div className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                      🖼️ Image & Diagram Resource
                    </h3>
                    <a
                      href={activeLesson.contentUrl || activeLesson.imageUrl || activeLesson.videoThumbnailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px', fontWeight: '700', borderRadius: '10px' }}
                    >
                      🔍 Open Full Resolution in New Tab ↗
                    </a>
                  </div>

                  <div
                    style={{
                      background: 'var(--bg-secondary)',
                      borderRadius: '16px',
                      padding: '24px',
                      display: 'flex',
                      justify: 'center',
                      alignItems: 'center',
                      minHeight: '350px',
                      border: '1px solid var(--border-color)',
                      overflow: 'hidden'
                    }}
                  >
                    <img
                      src={activeLesson.contentUrl || activeLesson.imageUrl || activeLesson.videoThumbnailUrl || '/serversidelog.jpg'}
                      alt={activeLesson.title || 'Course Image Material'}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '650px',
                        borderRadius: '12px',
                        objectFit: 'contain',
                        boxShadow: 'var(--shadow-md)'
                      }}
                    />
                  </div>
                </div>
              ) : (
                /* VIDEO VIEWER */
                <SecureVideoPlayer
                  videoUrl={activeLesson.contentUrl || activeLesson.videoUrl}
                  hlsUrl={activeLesson.hlsMasterPlaylistUrl}
                  title={activeLesson.title}
                />
              )
            ) : (
              <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Please select a lesson from the left sidebar to start watching.
              </div>
            )}

            {/* Lesson Notes & Text */}
            {activeLesson?.content && (
              <div className="card" style={{ padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
                  📖 Lesson Overview & Material Notes
                </h4>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  {activeLesson.content}
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Certificate Modal */}
        {showCertificateModal && (
          <CertificateModal
            courseTitle={course?.title}
            studentName={user?.fullName || user?.email}
            onClose={() => setShowCertificateModal(false)}
          />
        )}

        <Footer />
      </div>
    );
  }

  // =========================================================================
  // PUBLIC / UNENROLLED COURSE DETAILS VIEW
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-muted)' }}>
            <a href="/" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Home</a>
            <span>/</span>
            <a href="/courses" style={{ color: 'var(--primary)', textDecoration: 'none' }}>Courses</a>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{course?.title || 'Course Details'}</span>
          </div>

          {/* Active Campaigns Banner */}
          <OfferBanner />

          {/* Hero Banner */}
          <div
            className="card"
            style={{
              padding: '32px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(147, 51, 234, 0.08) 100%)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
                  {isEnrolled ? '✅ Enrolled & Unlocked' : '⚡ Razorpay Protected Course'}
                </span>
                <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)', lineHeight: 1.2 }}>
                  {course?.title || 'System Architecture & Distributed Systems'}
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '12px', lineHeight: 1.6 }}>
                  {course?.description || 'Learn cutting-edge microservices, Kafka event streaming, and global CDN distribution.'}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>
                  <span>👨‍🏫 Instructor: <strong style={{ color: 'var(--text-primary)' }}>Gaurav Kumar</strong></span>
                  <span>•</span>
                  <span>⭐ 4.9 Rating</span>
                  <span>•</span>
                  <span>🎓 {course?.chapters?.length || 1} Chapters</span>
                </div>
              </div>

              {/* Pricing & Enrollment CTA */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '24px',
                  borderRadius: '16px',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  minWidth: '280px',
                  boxShadow: 'var(--shadow-md)'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ fontSize: '26px', fontWeight: '800', color: 'var(--primary)' }}>
                      ₹{discountedPriceInr} INR <span style={{ fontSize: '13px', opacity: 0.9 }}>(${discountedPriceUsd.toFixed(2)})</span>
                    </div>
                    <div style={{ fontSize: '15px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                      ${rawPriceUsd.toFixed(2)}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', marginTop: '6px' }}>
                    🔥 {discountPct}% OFF Applied ({claimedCampaign?.name || 'Campaign Offer'})! You save ${(rawPriceUsd - discountedPriceUsd).toFixed(2)}
                  </div>
                </div>

                <button
                  onClick={handleEnrollClick}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '15px',
                    fontWeight: '800',
                    background: isEnrolled ? '#10b981' : 'var(--primary)'
                  }}
                >
                  {isEnrolled ? '✅ Enrolled (Unlocked)' : '🚀 Enroll Now via Razorpay'}
                </button>
              </div>
            </div>
          </div>

          {/* Active Lesson Viewer (Only if Enrolled or Preview Allowed) */}
          {activeLesson && (isEnrolled || (course?.chapters?.[0]?.lessons?.[0]?.id === activeLesson.id)) && (
            <div className="card" style={{ padding: '24px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                  ▶️ Active Viewer: {activeLesson.title}
                </h2>
                <span className="badge badge-accent">
                  {activeLesson.lessonType}
                </span>
              </div>

              {/* VIDEO Player */}
              {activeLesson.lessonType === 'VIDEO' && (
                <div>
                  <SecureVideoPlayer
                    videoUrl={activeLesson.contentUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                    posterUrl={activeLesson.videoThumbnailUrl || course?.thumbnailUrl || '/serversidelog.jpg'}
                    title={activeLesson.title}
                  />
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    🔒 Video protection enabled: 60s signed presigned links + student floating watermark overlay active.
                  </p>
                </div>
              )}

              {/* PDF Viewer */}
              {activeLesson.lessonType === 'PDF' && (
                <div style={{ height: '480px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  {activeLesson.contentUrl ? (
                    <iframe src={activeLesson.contentUrl} title={activeLesson.title} style={{ width: '100%', height: '100%', border: 'none' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                      📄 PDF document preview ({activeLesson.title})
                    </div>
                  )}
                </div>
              )}

              {/* IMAGE Viewer */}
              {activeLesson.lessonType === 'IMAGE' && (
                <div style={{ textAlign: 'center' }}>
                  <img
                    src={activeLesson.contentUrl || '/serversidelog.jpg'}
                    alt={activeLesson.title}
                    style={{ maxWidth: '100%', maxHeight: '480px', borderRadius: '12px', objectFit: 'contain' }}
                  />
                </div>
              )}

              {/* QUIZ Viewer */}
              {activeLesson.lessonType === 'QUIZ' && (
                <div style={{ background: 'var(--bg-secondary)', padding: '20px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  <h3 style={{ fontSize: '17px', fontWeight: '800', margin: 0 }}>
                    📝 Quiz: Test Your Knowledge
                  </h3>

                  {activeQuizObj && activeQuizObj.questions && activeQuizObj.questions.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {activeQuizObj.questions.map((q, qIdx) => (
                        <div key={qIdx} style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-primary)', marginBottom: '10px' }}>
                            Q{qIdx + 1}. {q.question}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {q.options && q.options.map((opt, optIdx) => (
                              <label
                                key={optIdx}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid var(--border-color)',
                                  background: quizAnswers[qIdx] === optIdx ? 'var(--primary-light)' : 'transparent',
                                  cursor: 'pointer'
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`quiz-${qIdx}`}
                                  checked={quizAnswers[qIdx] === optIdx}
                                  onChange={() => setQuizAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                                />
                                <span style={{ fontSize: '13px', fontWeight: '600' }}>{opt}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => handleQuizSubmit(activeQuizObj.questions)}
                        className="btn btn-primary"
                        style={{ alignSelf: 'flex-start', padding: '10px 20px', fontSize: '13px', fontWeight: '700' }}
                      >
                        ✅ Submit Quiz
                      </button>

                      {quizScore && (
                        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '12px 16px', borderRadius: '8px', color: '#10b981', fontWeight: '700', fontSize: '14px' }}>
                          🎯 Quiz Result: {quizScore.score} / {quizScore.total} Correct!
                        </div>
                      )}
                    </div>
                  ) : (
                    <p style={{ color: 'var(--text-muted)' }}>No questions configured for this quiz yet.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Curriculum Accordion with Locked/Unlocked Badge */}
          <div className="card" style={{ padding: '28px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                📚 Course Curriculum & Chapters
              </h2>
              {!isEnrolled && (
                <span className="badge badge-accent">
                  🔒 Complete Razorpay Payment to Unlock
                </span>
              )}
            </div>

            {course?.chapters && course.chapters.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {course.chapters.map((chap, cIdx) => (
                  <div
                    key={chap.id || cIdx}
                    style={{
                      border: '1px solid var(--border-color)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      background: 'var(--bg-secondary)'
                    }}
                  >
                    <div style={{ padding: '14px 20px', fontWeight: '800', fontSize: '15px', color: 'var(--text-primary)', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-color)' }}>
                      Chapter {cIdx + 1}: {chap.title}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {chap.lessons && chap.lessons.length > 0 ? (
                        chap.lessons.map((les, lIdx) => {
                          const isPreviewAllowed = cIdx === 0 && lIdx === 0; // Allow Chapter 1, Lesson 1 Free Preview
                          const canAccess = isEnrolled || isPreviewAllowed;

                          return (
                            <div
                              key={les.id || lIdx}
                              onClick={() => handleLessonSelect(les, isPreviewAllowed)}
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '14px 20px',
                                borderBottom: lIdx === chap.lessons.length - 1 ? 'none' : '1px solid var(--border-color)',
                                background: activeLesson?.id === les.id ? 'var(--primary-light)' : 'transparent',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                                opacity: canAccess ? 1 : 0.75
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '16px' }}>
                                  {les.lessonType === 'VIDEO' ? '🎥' : les.lessonType === 'PDF' ? '📄' : les.lessonType === 'IMAGE' ? '🖼️' : '📝'}
                                </span>
                                <span style={{ fontSize: '14px', fontWeight: '700', color: activeLesson?.id === les.id ? 'var(--primary)' : 'var(--text-primary)' }}>
                                  {les.title}
                                </span>
                                {isPreviewAllowed && !isEnrolled && (
                                  <span className="badge badge-primary" style={{ fontSize: '10px', padding: '2px 6px' }}>
                                    👁️ Free Preview
                                  </span>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)' }}>
                                  {les.lessonType}
                                </span>
                                <span>
                                  {canAccess ? '✅' : '🔒'}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '12px 20px', fontSize: '13px', color: 'var(--text-muted)' }}>
                          No lessons added to this chapter yet.
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No chapters created for this course yet.</p>
            )}
          </div>

          {/* Certificate Modal */}
          {showCertificateModal && (
            <CertificateModal
              courseTitle={course?.title}
              studentName={user?.fullName || user?.email}
              onClose={() => setShowCertificateModal(false)}
            />
          )}

          {/* Razorpay Modal */}
          {showRazorpayModal && (
            <RazorpayPaymentModal
              course={{
                ...course,
                price: discountedPriceUsd,
                originalPrice: rawPriceUsd,
                discountPercentage: discountPct,
                campaignName: claimedCampaign?.name || 'Campaign Offer'
              }}
              onClose={() => setShowRazorpayModal(false)}
              onSuccess={handlePaymentSuccess}
            />
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CourseDetails;
