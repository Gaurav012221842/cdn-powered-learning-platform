import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import CourseCard from '../../components/course/CourseCard';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL, getCookie } from '../../services/api';

const Wishlist = () => {
  const { user } = useContext(AuthContext);

  const [wishlistCourses, setWishlistCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const savedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
      const studentId = savedUser?.id || savedUser?.userId || 'current';
      const email = savedUser?.email || '';
      const token = getCookie('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch courses catalog
      let coursesMap = {};
      try {
        const cRes = await fetch(`${API_V1_URL}/courses`);
        if (cRes.ok) {
          const cData = await cRes.json();
          const list = cData?.data || [];
          if (Array.isArray(list)) {
            list.forEach((c) => {
              if (c?.id) coursesMap[c.id] = c;
            });
          }
        }
      } catch (e) {
        console.warn('Courses catalog error:', e);
      }

      // 2. Fetch Wishlist items from backend
      let wishlistIds = [];
      try {
        const wRes = await fetch(`${API_V1_URL}/wishlists/student/${studentId}?email=${encodeURIComponent(email)}`, { headers });
        if (wRes.ok) {
          const wData = await wRes.json();
          const items = wData?.data || [];
          if (Array.isArray(items)) {
            wishlistIds = items.map((item) => item.courseId?.toString() || item.course?.id?.toString()).filter(Boolean);
          }
        }
      } catch (e) {
        console.warn('Wishlist fetch error:', e);
      }

      // Include any locally cached wishlist IDs for fallback
      const localIds = JSON.parse(localStorage.getItem('user_wishlist_ids') || '[]');
      const allWishlistIds = Array.from(new Set([...wishlistIds, ...localIds]));
      localStorage.setItem('user_wishlist_ids', JSON.stringify(allWishlistIds));

      // Resolve course objects
      const resolvedList = allWishlistIds.map((id) => {
        return coursesMap[id] || {
          id: id,
          title: 'System Architecture & Distributed Systems',
          description: 'Master microservices, Redis caching, and Kafka event streaming.',
          price: 49.99,
          instructor: 'Gaurav Kumar',
          rating: 4.9,
          students: 1200,
          category: 'Architecture'
        };
      });

      setWishlistCourses(resolvedList);
    } catch (err) {
      console.error('Failed to load wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleWishlistChange = (courseId, inWishlist) => {
    if (!inWishlist) {
      setWishlistCourses((prev) => prev.filter((c) => String(c.id) !== String(courseId)));
    }
  };

  const filteredCourses = wishlistCourses.filter((course) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (course.title || '').toLowerCase().includes(q) ||
      (course.description || '').toLowerCase().includes(q) ||
      (course.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              padding: '36px',
              borderRadius: '24px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: '8px' }}>
                ❤️ Saved Catalog
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0' }}>
                My Wishlist ({wishlistCourses.length})
              </h1>
              <p style={{ opacity: 0.9, fontSize: '15px', margin: 0 }}>
                Bookmark courses you love and enroll whenever you're ready to start learning.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href="/courses"
                className="btn"
                style={{ background: '#ffffff', color: 'var(--primary)', fontWeight: '800', textDecoration: 'none' }}
              >
                + Browse All Courses
              </a>
            </div>
          </div>

          {/* Search Bar if Wishlist Has Items */}
          {wishlistCourses.length > 0 && (
            <div className="card" style={{ padding: '16px 20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                <span style={{ fontSize: '18px' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Search your saved courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                />
              </div>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '12px' }}>
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Wishlist Grid */}
          {loading ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              🔄 Fetching your saved wishlist items...
            </div>
          ) : filteredCourses.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
              {filteredCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onWishlistChange={handleWishlistChange}
                />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div
              className="card"
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ fontSize: '56px' }}>❤️</div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Your Wishlist is Empty
              </h2>
              <p style={{ maxWidth: '440px', color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                Explore our engineering masterclasses and click the heart icon (❤️) on any course card to save it for later!
              </p>
              <a href="/courses" className="btn btn-primary" style={{ padding: '12px 24px', fontWeight: '800', marginTop: '8px', textDecoration: 'none' }}>
                🚀 Explore Masterclasses
              </a>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Wishlist;
