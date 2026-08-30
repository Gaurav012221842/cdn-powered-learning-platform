import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import { AuthContext } from '../../../context/AuthContext';
import { API_V1_URL } from '../../../services/api';

const CourseManagement = () => {
  const { showToast } = useContext(AuthContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deletingId, setDeletingId] = useState(null);

  const fetchCourses = () => {
    setLoading(true);
    fetch(`${API_V1_URL}/courses`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data)) {
          setCourses(data.data);
        } else {
          setCourses([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch courses:', err);
        showToast('Failed to load courses', 'error');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeleteCourse = async (courseId, courseTitle) => {
    const confirmDelete = window.confirm(`⚠️ Are you sure you want to permanently delete the course "${courseTitle}"? This cannot be undone.`);
    if (!confirmDelete) return;

    setDeletingId(courseId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        showToast('🗑️ Course deleted successfully', 'success');
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
      } else {
        showToast(data.message || 'Failed to delete course', 'error');
      }
    } catch (err) {
      showToast('Error deleting course', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const categories = ['All', 'Fullstack Development', 'Cloud Infrastructure & CDN', 'Backend Engineering', 'DevOps & Microservices', 'DSA', 'AI/ML'];

  const filteredCourses = courses.filter((c) => {
    const matchesSearch =
      (c.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || c.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%', padding: '40px 24px' }}>
        <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                📚 Course Administration Studio
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Course Management & Edit Portal
              </h1>
              <p style={{ color: 'var(--text-secondary)', marginTop: '6px', fontSize: '15px' }}>
                View all published and draft courses, update curriculums, adjust pricing & categories, and manage student access.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <a
                href="/admin/course/create"
                className="btn btn-primary"
                style={{ fontWeight: '800', padding: '12px 24px', boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)' }}
              >
                ➕ Create New Course
              </a>
              <a href="/admin/dashboard" className="btn btn-secondary" style={{ fontWeight: '700' }}>
                ← Dashboard
              </a>
            </div>
          </div>

          {/* Filters and Search */}
          <div
            className="card"
            style={{
              padding: '20px 24px',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ flex: 1, minWidth: '280px', maxWidth: '480px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search courses by title, category, or description..."
                  className="form-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-muted)' }}>
                Showing {filteredCourses.length} of {courses.length} Courses
              </div>
            </div>

            {/* Category Pills */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    border: '1px solid',
                    borderColor: selectedCategory === cat ? 'var(--primary)' : 'var(--border-color)',
                    background: selectedCategory === cat ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                    color: selectedCategory === cat ? 'var(--primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Course Table / Grid */}
          {loading ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '16px', fontWeight: '600' }}>⏳ Loading course catalog...</p>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                No Courses Found
              </p>
              <p style={{ fontSize: '14px', marginBottom: '20px' }}>
                {courses.length === 0 ? 'No courses have been created yet.' : 'No courses match your current search or category filter.'}
              </p>
              <a href="/admin/course/create" className="btn btn-primary">
                ➕ Create First Course
              </a>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
              {filteredCourses.map((c) => {
                const totalLessons = (c.chapters || []).reduce((acc, ch) => acc + (ch.lessons ? ch.lessons.length : 0), 0);
                const totalChapters = (c.chapters || []).length;

                return (
                  <div
                    key={c.id}
                    className="card"
                    style={{
                      borderRadius: '18px',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-secondary)',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                    }}
                  >
                    {/* Thumbnail */}
                    <div style={{ position: 'relative', height: '180px', background: '#0f172a', overflow: 'hidden' }}>
                      {c.thumbnailUrl ? (
                        <img
                          src={c.thumbnailUrl}
                          alt={c.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '36px' }}>
                          🎓
                        </div>
                      )}

                      {/* Category Badge */}
                      <span
                        style={{
                          position: 'absolute',
                          top: '12px',
                          left: '12px',
                          background: 'rgba(15, 23, 42, 0.85)',
                          backdropFilter: 'blur(8px)',
                          color: '#818cf8',
                          border: '1px solid rgba(99, 102, 241, 0.4)',
                          fontSize: '11px',
                          fontWeight: '800',
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}
                      >
                        🏷️ {c.category || 'Fullstack Development'}
                      </span>

                      {/* Price Badge */}
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '12px',
                          right: '12px',
                          background: 'rgba(16, 185, 129, 0.9)',
                          color: '#ffffff',
                          fontSize: '13px',
                          fontWeight: '800',
                          padding: '4px 10px',
                          borderRadius: '8px'
                        }}
                      >
                        ${c.price !== undefined ? parseFloat(c.price).toFixed(2) : '0.00'}
                      </span>
                    </div>

                    {/* Content Info */}
                    <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-primary)', margin: 0, lineHeight: 1.4 }}>
                        {c.title}
                      </h3>

                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5, flex: 1, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {c.description || 'No description provided.'}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <span>📁 {totalChapters} Chapters</span>
                        <span>🎬 {totalLessons} Lessons</span>
                        <span style={{ marginLeft: 'auto', fontWeight: '700', color: c.status === 'PUBLISHED' ? '#10b981' : '#f59e0b' }}>
                          ● {c.status || 'PUBLISHED'}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginTop: '4px' }}>
                        <a
                          href={`/admin/course/create?editId=${c.id}`}
                          className="btn btn-primary"
                          style={{ fontSize: '13px', fontWeight: '700', padding: '10px 12px', textAlign: 'center' }}
                        >
                          ✏️ Edit
                        </a>

                        <a
                          href={`/courses/${c.id}`}
                          className="btn btn-secondary"
                          style={{ fontSize: '13px', fontWeight: '700', padding: '10px 12px', textAlign: 'center' }}
                        >
                          👁️ View
                        </a>

                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(c.id, c.title)}
                          disabled={deletingId === c.id}
                          className="btn"
                          title="Delete Course"
                          style={{
                            padding: '10px 12px',
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            cursor: 'pointer',
                            fontSize: '14px'
                          }}
                        >
                          {deletingId === c.id ? '⏳' : '🗑️'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CourseManagement;
