import React, { useState, useEffect } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import OfferBanner from '../../components/campaign/OfferBanner';
import CourseList from '../../components/course/CourseList';
import { SOCIAL_LINKS } from '../../constants/socialLinks';
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
    category: 'Backend & Cloud'
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
    category: 'Media & CDN'
  }
];

const Home = () => {
  const [courses, setCourses] = useState([]);

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
      });
  }, []);

  const telegramLink = SOCIAL_LINKS.TELEGRAM;
  const instagramLink = SOCIAL_LINKS.INSTAGRAM;
  const facebookLink = SOCIAL_LINKS.FACEBOOK;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%' }}>
        {/* Banner */}
        <div className="container" style={{ paddingTop: '16px' }}>
          <OfferBanner />
        </div>

        {/* Hero Section */}
        <section
          style={{
            padding: '64px 0 48px 0',
            textAlign: 'center',
            background: 'radial-gradient(ellipse at top, var(--primary-light) 0%, transparent 70%)'
          }}
        >
          <div className="container">
            <span className="badge badge-primary" style={{ marginBottom: '16px' }}>
              🚀 World-Class Engineering Education
            </span>
            <h1
              style={{
                fontSize: '48px',
                fontWeight: '800',
                letterSpacing: '-1px',
                color: 'var(--text-primary)',
                marginBottom: '16px',
                lineHeight: 1.15
              }}
            >
              Accelerate Your Tech Career with{' '}
              <span style={{ color: 'var(--primary)' }}>ServerSide Academy</span>
            </h1>
            <p
              style={{
                fontSize: '18px',
                color: 'var(--text-secondary)',
                maxWidth: '640px',
                margin: '0 auto 32px auto',
                lineHeight: 1.6
              }}
            >
              Master in-demand software engineering skills through interactive video courses, hands-on projects, and personalized learning paths.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/courses" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '16px' }}>
                🚀 Explore Courses
              </a>
              <a
                href={telegramLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ padding: '14px 28px', fontSize: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span>✈️</span> Join Community
              </a>
            </div>

            {/* Quick Metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '24px',
                marginTop: '56px',
                padding: '24px',
                background: 'var(--bg-card)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              <div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)' }}>10,000+</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Active Engineers</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)' }}>{courses.length}+</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>CDN Courses</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)' }}>99.9%</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Video Uptime</div>
              </div>
              <div>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--primary)' }}>4.9 ★</div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '600' }}>Average Rating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Courses Section */}
        <section className="container" style={{ padding: '48px 24px 32px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '32px' }}>
            <div>
              <span className="badge badge-accent" style={{ marginBottom: '8px' }}>Top Rated</span>
              <h2 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>Featured Courses</h2>
            </div>
            <a href="/courses" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary)' }}>
              View All Courses →
            </a>
          </div>

          <CourseList courses={courses} />
        </section>

        {/* Community & Social Channels Section */}
        <section className="container" style={{ padding: '32px 24px 64px 24px' }}>
          <div
            className="card"
            style={{
              padding: '36px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px'
            }}
          >
            <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
              <span className="badge badge-primary" style={{ marginBottom: '10px' }}>
                🌐 Developer Network
              </span>
              <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                Join Our Official Channels & Community
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                Connect directly with mentors and peers, discuss code architectures, and stay updated with new course releases.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
              {/* Telegram Card */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '32px' }}>✈️</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Telegram Channel
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, flex: 1 }}>
                  Join our main Telegram group for instant course alerts, study notes, live Q&A sessions, and engineer networking.
                </p>
                <a
                  href={telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                    textDecoration: 'none'
                  }}
                >
                  Join Telegram Channel ↗
                </a>
              </div>

              {/* Instagram Card */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '32px' }}>📸</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Instagram
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, flex: 1 }}>
                  Follow for daily system design snippets, developer tips, quick tutorial reels, and behind-the-scenes content.
                </p>
                <a
                  href={instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                    textDecoration: 'none'
                  }}
                >
                  Follow on Instagram ↗
                </a>
              </div>

              {/* Facebook Card */}
              <div
                style={{
                  background: 'var(--bg-card)',
                  padding: '24px',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{ fontSize: '32px' }}>📘</div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                  Facebook Page
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0, flex: 1 }}>
                  Like and follow our official Facebook page for platform updates, tech articles, and community discussions.
                </p>
                <a
                  href={facebookLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{
                    padding: '10px 16px',
                    fontSize: '13px',
                    fontWeight: '700',
                    textAlign: 'center',
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    textDecoration: 'none'
                  }}
                >
                  Connect on Facebook ↗
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
