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
  const xhrRef = useRef(null);

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setUploading(false);
    setProgress(0);
    setPreviewUrl(user?.avatarUrl || '');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (showToast) {
      showToast('Avatar upload cancelled', 'info');
    }
  };

  const handleFileSelectAndUpload = (e) => {
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
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    // Track real 0% to 100% upload progress
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setProgress(percent);
      }
    });

    xhr.addEventListener('load', async () => {
      xhrRef.current = null;

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const uploadData = JSON.parse(xhr.responseText);
          const publicUrl = uploadData.data;

          setProgress(100);

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
          updateProfileAvatar(publicUrl);
          setPreviewUrl(publicUrl);
          if (showToast) {
            showToast(profileData.message || '⚡ Profile photo uploaded & saved to Cloudflare R2!', 'success');
          }
        } catch (err) {
          if (showToast) showToast(err.message || 'Error uploading profile photo', 'error');
          setPreviewUrl(user?.avatarUrl || '');
        } finally {
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
      } else {
        setUploading(false);
        setPreviewUrl(user?.avatarUrl || '');
        if (showToast) showToast(`Upload failed with status ${xhr.status}`, 'error');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    });

    xhr.addEventListener('error', () => {
      xhrRef.current = null;
      setUploading(false);
      setPreviewUrl(user?.avatarUrl || '');
      if (showToast) showToast('Network error during upload', 'error');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });

    xhr.addEventListener('abort', () => {
      xhrRef.current = null;
      setUploading(false);
      setProgress(0);
      setPreviewUrl(user?.avatarUrl || '');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    });

    xhr.open('POST', `${API_BASE}/media/upload-avatar-file`);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }
    xhr.send(formData);
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
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Profile & Authentication Settings
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Manage your account security and Cloudflare CDN profile picture.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowChangePasswordModal(true)}
          className="btn btn-secondary"
          style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>🔒</span>
          Change Password
        </button>
      </div>

      {/* Modal Popup for Change Password Card */}
      {showChangePasswordModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '20px'
          }}
          onClick={() => setShowChangePasswordModal(false)}
        >
          <div
            style={{ position: 'relative', width: '100%', maxWidth: '520px' }}
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
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: '800',
                gap: '4px'
              }}
            >
              <div>⚡ {progress}%</div>
            </div>
          )}

          {/* Camera Emoji Badge Button */}
          {!uploading && (
            <button
              onClick={triggerFileSelect}
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
                cursor: 'pointer',
                boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                transition: 'transform 0.2s, background-color 0.2s',
                zIndex: 10
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              📷
            </button>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelectAndUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
            {user?.fullName || 'User Profile'}
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {user?.email}
          </div>

          {uploading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '700' }}>
                Uploading: {progress}%
              </span>
              <button
                type="button"
                onClick={handleCancelUpload}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid #ef4444',
                  color: '#ef4444',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                🚫 Cancel
              </button>
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', marginTop: '2px' }}>
              Click 📷 camera icon to select and instant-upload
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePhotoUploader;
