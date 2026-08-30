import React, { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import CourseList from '../../components/course/CourseList';
import OfferBanner from '../../components/campaign/OfferBanner';
import { API_V1_URL } from '../../services/api';

const fallbackCourses = [
  {
    id: '1',
    title: 'High-Performance System Architecture & Distributed Systems',
    description: 'Master microservices, Redis distributed caching, and Kafka event streaming with zero latency.',
    price: 99.99,
    instructor: 'Gaurav Kumar',
    rating: 4.9,
    students: 2450,
    category: 'Backend'
  },
  {
    id: '2',
    title: 'Full-Stack React 19 & Spring Boot 3 Enterprise Guide',
    description: 'Build robust enterprise cloud platforms with modern frontend frameworks and Java Spring Boot.',
    price: 79.99,
    instructor: 'Gaurav Kumar',
    rating: 4.8,
    students: 3120,
    category: 'Full Stack'
  },
  {
    id: '3',
    title: 'Cloudflare R2 & Video Transcoding Masterclass',
    description: 'Learn adaptive HLS multi-bitrate streaming, worker queues, and global edge delivery.',
    price: 89.99,
    instructor: 'Gaurav Kumar',
    rating: 5.0,
    students: 1890,
    category: 'DevOps & CDN'
  }
];

const Courses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_V1_URL}/courses`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data) && data.data.length > 0) {
          const formatted = data.data.map((c) => ({
            id: c.id,
            title: c.title,
            description: c.description || 'Master modern cloud architecture & fullstack engineering.',
            price: c.price || 49.99,
            instructor: 'Gaurav Kumar',
            rating: 4.9,
            students: 1200,
            category: c.category || 'Fullstack Development',
            thumbnailUrl: c.thumbnailUrl
          }));
          setCourses(formatted);
        } else {
          setCourses(fallbackCourses);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch courses from backend:', err);
        setCourses(fallbackCourses);
      })
      .finally(() => setLoading(false));
  }, []);

  // Dynamically compile categories list from defaults + actual backend courses
  const baseCategories = ['All', 'Fullstack Development', 'Cloud Infrastructure & CDN', 'Backend Engineering', 'DevOps & Microservices', 'DSA', 'AI/ML'];
  const dynamicCategories = Array.from(
    new Set([...baseCategories, ...courses.map((c) => c.category).filter(Boolean)])
  );

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      (course.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (course.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'All' || course.category === selectedCategory || (selectedCategory === 'DSA' && (course.category || '').toUpperCase() === 'DSA');
    return matchesSearch && matchesCat;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '48px 24px' }}>
          <div style={{ marginBottom: '28px' }}>
            <h1 style={{ fontSize: '36px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px' }}>
              Explore All Courses
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
              Explore expert-led engineering masterclasses, interactive courses, and hands-on learning paths designed for modern software developers.
            </p>
          </div>

          {/* Active Campaigns Banner */}
          <OfferBanner />

          {/* Search & Category Filter Section */}
          <div
            className="card"
            style={{
              padding: '20px 24px',
              borderRadius: '16px',
              marginBottom: '32px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)'
            }}
          >
            {/* Top Row: Search Input & Results Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '280px', maxWidth: '540px' }}>
                <input
                  type="text"
                  placeholder="🔍 Search courses by title or topic..."
                  className="form-input"
                  style={{ paddingRight: searchTerm ? '40px' : '14px', fontSize: '15px' }}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '16px',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-muted)' }}>
                Showing <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{filteredCourses.length}</span> {filteredCourses.length === 1 ? 'course' : 'courses'}
              </div>
            </div>

            {/* Bottom Row: Horizontally Scrollable Category Ribbon */}
            <div
              style={{
                display: 'flex',
                gap: '10px',
                overflowX: 'auto',
                paddingBottom: '6px',
                WebkitOverflowScrolling: 'touch',
                scrollbarWidth: 'thin'
              }}
            >
              {dynamicCategories.map((cat) => {
                const count = cat === 'All' ? courses.length : courses.filter((c) => c.category === cat).length;
                const isSelected = selectedCategory === cat;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '9999px',
                      border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                      background: isSelected ? 'var(--primary)' : 'var(--bg-primary)',
                      color: isSelected ? '#ffffff' : 'var(--text-primary)',
                      fontWeight: isSelected ? '700' : '600',
                      fontSize: '13px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isSelected ? '0 4px 12px var(--primary-glow)' : 'none'
                    }}
                  >
                    <span>{cat}</span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '2px 6px',
                        borderRadius: '999px',
                        background: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--bg-secondary)',
                        color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        fontWeight: '800'
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              🔄 Loading published courses from backend...
            </div>
          ) : (
            <CourseList courses={filteredCourses} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Courses;
