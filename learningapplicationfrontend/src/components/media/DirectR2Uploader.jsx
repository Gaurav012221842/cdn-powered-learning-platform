import React, { useState } from 'react';
import { API_V1_URL } from '../../services/api';

const DirectR2Uploader = ({ mediaType = 'IMAGE', onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedAsset, setUploadedAsset] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setUploadedAsset(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setProgress(25);
    setError(null);

    try {
      // Direct server-side upload of image, video, PDF or doc binary to Cloudflare R2
      const formData = new FormData();
      formData.append('file', file);
      formData.append('mediaType', mediaType);

      setProgress(50);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/media/upload-file`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to upload media asset to Cloudflare R2');
      }

      const uploadData = await res.json();
      const { mediaId, cdnUrl } = uploadData.data;

      setProgress(100);

      const assetInfo = {
        mediaId,
        cdnUrl,
        filename: file.name,
        type: mediaType,
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        uploadedAt: new Date().toLocaleTimeString()
      };

      setUploadedAsset(assetInfo);
      if (onUploadComplete) {
        onUploadComplete(assetInfo);
      }
    } catch (err) {
      setError(err.message || 'Direct R2 Upload failed. Please check network connection.');
    } finally {
      setUploading(false);
    }
  };

  const copyUrl = () => {
    if (uploadedAsset?.cdnUrl) {
      navigator.clipboard.writeText(uploadedAsset.cdnUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="card animate-fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        border: '2px dashed var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '32px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
            Upload Asset ({mediaType})
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            High-speed Cloudflare R2 direct stream uploader.
          </p>
        </div>
        <span className="badge badge-primary">{mediaType}</span>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: '10px', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {/* File Input Box */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '24px',
          textAlign: 'center',
          cursor: 'pointer'
        }}
      >
        <input
          type="file"
          id="file-upload-input"
          onChange={handleFileChange}
          disabled={uploading}
          accept={
            mediaType === 'VIDEO' || mediaType === 'REEL'
              ? 'video/*'
              : mediaType === 'IMAGE'
              ? 'image/*'
              : mediaType === 'PDF' || mediaType === 'DOCUMENT'
              ? '.pdf,.doc,.docx'
              : mediaType === 'AUDIO'
              ? 'audio/*'
              : '*/*'
          }
          style={{ width: '100%', cursor: 'pointer', color: 'var(--text-primary)' }}
        />
        {file && (
          <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--primary)', fontWeight: '600' }}>
            📁 Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </div>
        )}
      </div>

      {/* Upload Progress Bar */}
      {uploading && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: '600', marginBottom: '6px' }}>
            <span>Uploading to Cloudflare R2...</span>
            <span>{progress}%</span>
          </div>
          <div style={{ width: '100%', background: 'var(--bg-tertiary)', borderRadius: '9999px', height: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                height: '100%',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleUpload}
        className="btn btn-primary"
        style={{ width: '100%', padding: '14px', fontSize: '15px' }}
        disabled={uploading || !file}
      >
        {uploading ? `Uploading ${mediaType}... ${progress}%` : `📤 Start Upload (${mediaType})`}
      </button>

      {/* Success Details & Media Preview */}
      {uploadedAsset && (
        <div
          style={{
            background: 'var(--success-bg)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--success)', fontWeight: '700', fontSize: '15px' }}>
              ✅ Asset Uploaded Successfully!
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{uploadedAsset.uploadedAt}</span>
          </div>

          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>Filename:</strong> {uploadedAsset.filename} ({uploadedAsset.size})
          </div>

          {/* Media Preview Player */}
          {mediaType === 'IMAGE' && file && (
            <img
              src={URL.createObjectURL(file)}
              alt="Preview"
              style={{ maxHeight: '200px', borderRadius: '12px', objectFit: 'cover' }}
            />
          )}
          {(mediaType === 'VIDEO' || mediaType === 'REEL') && file && (
            <video
              src={URL.createObjectURL(file)}
              controls
              style={{ width: '100%', maxHeight: '240px', borderRadius: '12px', background: '#000' }}
            />
          )}

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              readOnly
              value={uploadedAsset.cdnUrl}
              className="form-input"
              style={{ fontSize: '13px', padding: '8px 12px' }}
            />
            <button onClick={copyUrl} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
              {copied ? 'Copied! ✓' : '📋 Copy URL'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectR2Uploader;
