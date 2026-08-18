import React, { useState, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL } from '../../services/api';
import ChangePasswordCard from './ChangePasswordCard';

const API_BASE = API_V1_URL;

const ProfilePhotoUploader = () => {
  const { user, token, updateProfileAvatar, showToast } = useContext(AuthContext);
  const [previewUrl, setPreviewUrl] = useState(user?.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelectAndUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)', 'error');
      return;
    }

    // Show temporary preview
    const tempObjectUrl = URL.createObjectURL(file);
    setPreviewUrl(tempObjectUrl);

    setUploading(true);
    setProgress(30);

    try {
      // Step 1: Upload file directly to backend server-side Cloudflare R2 service
      setProgress(50);
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch(`${API_BASE}/media/upload-avatar-file`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload photo to Cloudflare R2');
      }

      const uploadData = await uploadResponse.json();
      const publicUrl = uploadData.data;

      setProgress(80);

      // Step 2: Save public R2 URL to user profile in PostgreSQL
      const profileResponse = await fetch(`${API_BASE}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          avatarUrl: publicUrl,
          fullName: user?.fullName
        })
      });

      if (!profileResponse.ok) {
        throw new Error('Failed to save profile');
      }

      const profileData = await profileResponse.json().catch(() => ({}));

      setProgress(100);
      updateProfileAvatar(publicUrl);
      setPreviewUrl(publicUrl);
      showToast(profileData.message || '⚡ Profile photo uploaded & saved to Cloudflare R2!', 'success');
    } catch (err) {
      showToast(err.message || 'Error uploading profile photo', 'error');
      setPreviewUrl(user?.avatarUrl || '');
    } finally {
      setUploading(false);
      // Reset input value so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
            📸 Profile Photo Settings ({user?.role || 'STUDENT'})
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
            Click the camera icon on your avatar to select and update your profile photo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowChangePasswordModal(true)}
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: '700' }}
        >
          🔑 Change Password
        </button>
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setShowChangePasswordModal(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '480px',
              position: 'relative',
              margin: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowChangePasswordModal(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                zIndex: 10
              }}
            >
              ✕
            </button>
            <ChangePasswordCard />
          </div>
        </div>
      )}

      {/* Photo Avatar with Floating Camera Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        <div style={{ position: 'relative', width: '104px', height: '104px' }}>
          {/* Avatar Image */}
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Avatar Preview"
              style={{
                width: '104px',
                height: '104px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--primary)',
                boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
                opacity: uploading ? 0.6 : 1,
                transition: 'opacity 0.3s'
              }}
            />
          ) : (
            <div
              style={{
                width: '104px',
                height: '104px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                fontWeight: '800',
                boxShadow: '0 6px 18px var(--primary-glow)',
                opacity: uploading ? 0.6 : 1
              }}
            >
              {(user?.fullName || user?.email || 'G').charAt(0).toUpperCase()}
            </div>
          )}

          {/* Uploading Spinner Overlay */}
          {uploading && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '104px',
                height: '104px',
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: '700'
              }}
            >
              <div>🔄 {progress}%</div>
            </div>
          )}

          {/* Camera Emoji Badge Button */}
          <button
            onClick={triggerFileSelect}
            disabled={uploading}
            title="Click to change profile photo"
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'var(--primary)',
              color: '#ffffff',
              border: '3px solid var(--bg-card, #ffffff)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              cursor: uploading ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
              transition: 'transform 0.2s, background-color 0.2s',
              zIndex: 10
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            📷
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelectAndUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {user?.fullName || 'User Profile'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {user?.email}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', marginTop: '4px' }}>
            Click 📷 camera icon to select and instant-upload
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoUploader;
