import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import CertificateModal from '../../components/certificate/CertificateModal';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL, fetchStudentProgress, getCookie } from '../../services/api';

const Certificates = () => {
  const { user, siteConfig, showToast } = useContext(AuthContext);
  const brandName = siteConfig?.siteName || 'Gaurav';

  const [certificates, setCertificates] = useState([]);
  const [inProgressCourses, setInProgressCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);

  useEffect(() => {
    const loadCertificatesAndProgress = async () => {
      setLoading(true);
      try {
        const savedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
        const studentId = savedUser?.id || savedUser?.userId || 'current';
        const userEmail = savedUser?.email || '';
        const token = getCookie('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // 1. Fetch courses catalog map
        let allCoursesMap = {};
        try {
          const cRes = await fetch(`${API_V1_URL}/courses`);
          if (cRes.ok) {
            const cData = await cRes.json();
            const list = cData?.data || [];
            if (Array.isArray(list)) {
              list.forEach((c) => {
                if (c?.id) allCoursesMap[c.id] = c;
              });
            }
          }
        } catch (e) {
          console.warn('Courses catalog error:', e);
        }

        // 2. Fetch earned certificates from backend
        let certsList = [];
        try {
          const certRes = await fetch(`${API_V1_URL}/certificates/student/${studentId}?email=${encodeURIComponent(userEmail)}`, { headers });
          if (certRes.ok) {
            const certData = await certRes.json();
            certsList = Array.isArray(certData?.data) ? certData.data : [];
          }
        } catch (e) {
          console.warn('Certificates fetch error:', e);
        }

        // 3. Fetch enrollments & progress to evaluate 100% completions
        let inProgress = [];
        try {
          const eRes = await fetch(`${API_V1_URL}/enrollments/student/${studentId}?email=${encodeURIComponent(userEmail)}`, { headers });
          if (eRes.ok) {
            const eData = await eRes.json();
            const enrollments = Array.isArray(eData?.data) ? eData.data : [];

            for (const enr of enrollments) {
              const cId = enr.courseId || enr.course?.id;
              const courseObj = allCoursesMap[cId] || enr.course || { id: cId, title: 'Engineering Masterclass' };

              // Check chapters & lessons count
              const chapters = courseObj.chapters || [];
              let totalLessons = 0;
              chapters.forEach((ch) => {
                totalLessons += (ch.lessons || []).length;
              });

              // Check completed count
              let completedCount = 0;
              try {
                const pData = await fetchStudentProgress(cId, savedUser);
                if (pData?.data && Array.isArray(pData.data)) {
                  completedCount = pData.data.filter((p) => p.isCompleted).length;
                }
              } catch (e) {}

              const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : (completedCount > 0 ? 100 : 0);

              // If course is 100% completed and certificate not yet in certsList, auto-issue or add
              const hasExistingCert = certsList.some((ct) => String(ct.courseId) === String(cId));
              if (pct === 100 && !hasExistingCert && cId) {
                try {
                  const genRes = await fetch(`${API_V1_URL}/certificates/generate?courseId=${cId}${studentId ? `&studentId=${studentId}` : ''}${userEmail ? `&email=${encodeURIComponent(userEmail)}` : ''}`, { method: 'POST', headers });
                  if (genRes.ok) {
                    const genData = await genRes.json();
                    if (genData?.data) {
                      certsList.push(genData.data);
                    }
                  }
                } catch (e) {}
              } else if (pct < 100) {
                inProgress.push({
                  courseId: cId,
                  courseTitle: courseObj.title || 'Course In Progress',
                  category: courseObj.category || 'Architecture',
                  completedLessons: completedCount,
                  totalLessons: totalLessons,
                  progressPct: pct
                });
              }
            }
          }
        } catch (e) {
          console.warn('Enrollment progress error:', e);
        }

        // Format certificates with course titles and deduplicate by courseId
        const seenCourseIds = new Set();
        const formattedCerts = [];

        for (const c of certsList) {
          const cId = (c.courseId || '').toString();
          if (cId && !seenCourseIds.has(cId)) {
            seenCourseIds.add(cId);
            const courseInfo = allCoursesMap[c.courseId] || { title: 'System Architecture & Distributed Systems', category: 'Engineering' };
            formattedCerts.push({
              id: c.id,
              certificateCode: c.certificateCode || `CERT-${(c.id || '').toString().substring(0, 8).toUpperCase()}`,
              courseId: c.courseId,
              courseTitle: courseInfo.title || 'Masterclass Certification',
              category: courseInfo.category || 'Architecture',
              issuedAt: c.issuedAt ? new Date(c.issuedAt) : new Date(),
              studentName: savedUser?.fullName || 'Certified Student'
            });
          }
        }

        setCertificates(formattedCerts);
        setInProgressCourses(inProgress);
      } catch (err) {
        console.error('Failed to load certificates:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCertificatesAndProgress();
  }, [user]);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    if (showToast) {
      showToast(`Copied ${code} to clipboard!`, 'success');
    } else {
      alert(`Copied ${code} to clipboard!`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 50%, #92400e 100%)',
              padding: '36px',
              borderRadius: '24px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              boxShadow: '0 10px 30px rgba(217, 119, 6, 0.3)'
            }}
          >
            <div>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', marginBottom: '8px' }}>
                🎓 Official Verified Credentials
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0' }}>
                My Earned Certificates
              </h1>
              <p style={{ opacity: 0.95, fontSize: '15px', margin: 0, maxWidth: '600px' }}>
                Download, print, or share your accredited certificates of completion issued by {brandName} Platform.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href="/student/my-courses"
                className="btn"
                style={{ background: '#ffffff', color: '#92400e', fontWeight: '800', textDecoration: 'none' }}
              >
                ▶️ Continue Learning
              </a>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px', background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', padding: '12px', borderRadius: '12px' }}>
                🏆
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Verified Credentials</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{certificates.length}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '12px', borderRadius: '12px' }}>
                ⏳
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>In-Progress Certifications</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#3b82f6' }}>{inProgressCourses.length}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '12px', borderRadius: '12px' }}>
                🔒
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Verification Standard</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>100% Course Pass</div>
              </div>
            </div>
          </div>

          {/* EARNED CERTIFICATES SECTION */}
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏅</span>
              <span>Available Certificates ({certificates.length})</span>
            </h2>

            {loading ? (
              <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                🔄 Verifying completion progress and loading certificates...
              </div>
            ) : certificates.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
                {certificates.map((cert) => (
                  <div
                    key={cert.id || cert.certificateCode}
                    className="card"
                    style={{
                      borderRadius: '20px',
                      padding: '24px',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '20px',
                      background: 'var(--bg-card)',
                      boxShadow: 'var(--shadow-md)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Top Accent Ribbon */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '6px', background: 'linear-gradient(90deg, #f59e0b, #d97706)' }} />

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <span className="badge" style={{ background: 'rgba(217, 119, 6, 0.15)', color: '#d97706', fontWeight: '800' }}>
                          VERIFIED CREDENTIAL
                        </span>
                        <div style={{ fontSize: '24px' }}>🎓</div>
                      </div>

                      <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', margin: '0 0 8px 0', lineHeight: 1.3 }}>
                        {cert.courseTitle}
                      </h3>

                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                        Issued to: <strong style={{ color: 'var(--text-primary)' }}>{cert.studentName}</strong>
                      </div>

                      {/* Certificate Code Badge with Copy */}
                      <div
                        onClick={() => copyCode(cert.certificateCode)}
                        style={{
                          background: 'var(--bg-secondary)',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          border: '1px solid var(--border-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer'
                        }}
                        title="Click to copy certificate code"
                      >
                        <div>
                          <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700' }}>CREDENTIAL ID</div>
                          <div style={{ fontSize: '13px', fontWeight: '800', fontFamily: 'monospace', color: 'var(--primary)' }}>
                            {cert.certificateCode}
                          </div>
                        </div>
                        <span style={{ fontSize: '14px', opacity: 0.7 }}>📋</span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
                        Issued Date: {cert.issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                      <button
                        onClick={() => setSelectedCert(cert)}
                        className="btn btn-primary"
                        style={{
                          flex: 1,
                          padding: '10px 14px',
                          fontSize: '13px',
                          fontWeight: '800',
                          background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>🖨️</span>
                        <span>View / Print PDF</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="card"
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  borderRadius: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '48px' }}>🎓</div>
                <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                  No Certificates Issued Yet
                </h3>
                <p style={{ maxWidth: '440px', color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                  Complete 100% of all lessons, quizzes, and resources in any of your enrolled courses to automatically unlock your official certificate!
                </p>
              </div>
            )}
          </div>

          {/* IN PROGRESS CERTIFICATIONS */}
          {inProgressCourses.length > 0 && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>⏳</span>
                <span>Certifications in Progress ({inProgressCourses.length})</span>
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {inProgressCourses.map((c, idx) => (
                  <div key={idx} className="card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', fontSize: '11px' }}>
                        {c.category}
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>
                        {c.progressPct}% Completed
                      </span>
                    </div>

                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                      {c.courseTitle}
                    </h4>

                    {/* Progress Bar */}
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-secondary)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${c.progressPct}%`, height: '100%', background: '#3b82f6' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
                      <span>{c.completedLessons} / {c.totalLessons} Lessons done</span>
                      <span>{c.totalLessons - c.completedLessons} left for certificate</span>
                    </div>

                    <a
                      href={`/courses/${c.courseId}`}
                      className="btn btn-outline"
                      style={{ padding: '8px', textAlign: 'center', fontSize: '13px', fontWeight: '700', textDecoration: 'none', marginTop: '4px' }}
                    >
                      ▶️ Complete Lessons to Unlock
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certificate Modal */}
          {selectedCert && (
            <CertificateModal
              courseTitle={selectedCert.courseTitle}
              studentName={selectedCert.studentName}
              completionDate={selectedCert.issuedAt.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              onClose={() => setSelectedCert(null)}
            />
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Certificates;
