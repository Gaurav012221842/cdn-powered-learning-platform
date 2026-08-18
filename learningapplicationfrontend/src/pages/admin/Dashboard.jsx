import React, { useContext } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import ProfilePhotoUploader from '../../components/profile/ProfilePhotoUploader';
import { AuthContext } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user, siteConfig } = useContext(AuthContext);
  const brandName = siteConfig?.siteName || 'ServerSide';
  const displayName = user?.fullName || `${brandName} Admin`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Admin Hero Header */}
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
                ⚡ Administrator Control Panel
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>
                Welcome, {displayName}!
              </h1>
              <p style={{ opacity: 0.9, marginTop: '8px', fontSize: '15px' }}>
                Manage course content, direct Cloudflare R2 media streaming, campaigns, and user permissions.
              </p>
            </div>

            {/* Prominent Direct Upload Button requested by user */}
            <a
              href="/admin/media/upload"
              className="btn"
              style={{
                background: '#ffffff',
                color: 'var(--primary)',
                fontWeight: '800',
                fontSize: '16px',
                padding: '14px 28px',
                boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
              }}
            >
              📤 Upload Videos, PDFs, Images & Reels
            </a>
          </div>

          {/* Admin Profile Photo Settings with Quick Change Password Navigation */}
          <ProfilePhotoUploader />

          {/* Quick Media Upload Action Grid */}
          <div className="card" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  🎥 Quick Asset Upload Portal
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                  Upload high bitrate video lectures, PDFs, reels, and audio assets to Cloudflare CDN.
                </p>
              </div>
              <a href="/admin/media/upload" className="btn btn-primary">
                Open Full Upload Studio →
              </a>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <a
                href="/admin/media/upload?type=VIDEO"
                style={{
                  background: 'var(--bg-card)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                🎬 Upload Video
              </a>
              <a
                href="/admin/media/upload?type=PDF"
                style={{
                  background: 'var(--bg-card)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                📄 Upload PDF
              </a>
              <a
                href="/admin/media/upload?type=IMAGE"
                style={{
                  background: 'var(--bg-card)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                🖼️ Upload Image
              </a>
              <a
                href="/admin/media/upload?type=REEL"
                style={{
                  background: 'var(--bg-card)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                📹 Upload Reel
              </a>
            </div>
          </div>

          {/* Core Admin Modules */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                📁 Media Library & Assets
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', flex: 1, lineHeight: 1.5 }}>
                View all uploaded videos, PDFs, images, and signed streaming URLs.
              </p>
              <div style={{ marginTop: 'auto' }}>
                <a href="/admin/media" className="btn btn-secondary" style={{ width: '100%', padding: '12px', fontWeight: '700' }}>
                  Browse Media Library
                </a>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                📚 Course Management
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', flex: 1, lineHeight: 1.5 }}>
                Create new course titles, organize chapter curriculums, assign videos, PDFs, images & quizzes.
              </p>
              <div style={{ marginTop: 'auto' }}>
                <a href="/admin/course/create" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontWeight: '700' }}>
                  ➕ Create New Course
                </a>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                👥 Student Enrollments & Access
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', flex: 1, lineHeight: 1.5 }}>
                View all enrolled students across your courses, check active access, and revoke/remove student access.
              </p>
              <div style={{ marginTop: 'auto' }}>
                <a href="/admin/enrollments" className="btn btn-primary" style={{ width: '100%', padding: '12px', fontWeight: '700' }}>
                  🎓 Manage Student Access
                </a>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                🏷️ Campaigns & Discounts
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', flex: 1, lineHeight: 1.5 }}>
                Create promotional discount coupons, percentage offers, and flash sales.
              </p>
              <div style={{ marginTop: 'auto' }}>
                <a href="/admin/campaigns" className="btn btn-secondary" style={{ width: '100%', padding: '12px', fontWeight: '700' }}>
                  🏷️ Manage Campaigns
                </a>
              </div>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>
                📊 Analytics & Streams
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '20px', flex: 1, lineHeight: 1.5 }}>
                Monitor bandwidth consumption, student enrollment statistics, and revenue.
              </p>
              <div style={{ marginTop: 'auto' }}>
                <a href="/student/dashboard" className="btn btn-secondary" style={{ width: '100%', padding: '12px', fontWeight: '700' }}>
                  View System Telemetry
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

export default AdminDashboard;
