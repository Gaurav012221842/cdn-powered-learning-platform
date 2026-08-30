import React, { useState, useRef } from 'react';
import { API_V1_URL } from '../../services/api';

const DirectR2Uploader = ({ mediaType = 'IMAGE', onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedBytes, setUploadedBytes] = useState(null); // { loaded, total }
  const [error, setError] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [uploadedAsset, setUploadedAsset] = useState(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setStatusMessage(null);
      setProgress(0);
      setUploadedBytes(null);
      setUploadedAsset(null);
    }
  };

  const handleClearSelectedFile = () => {
    setFile(null);
    setError(null);
    setStatusMessage(null);
    setProgress(0);
    setUploadedBytes(null);
    setUploadedAsset(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setUploading(false);
    setProgress(0);
    setUploadedBytes(null);
    setStatusMessage('⚠️ Upload was cancelled.');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setProgress(0);
    setUploadedBytes({ loaded: 0, total: file.size });
    setError(null);
    setStatusMessage(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', mediaType);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    // Real-time Upload Progress (0% to 100%)
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setProgress(percentComplete);
        setUploadedBytes({ loaded: event.loaded, total: event.total });
      }
    });

    xhr.addEventListener('load', () => {
      xhrRef.current = null;
      setUploading(false);

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const uploadData = JSON.parse(xhr.responseText);
          const { mediaId, cdnUrl } = uploadData.data || {};

          setProgress(100);

          const assetInfo = {
            mediaId,
            cdnUrl,
            filename: file.name,
            type: mediaType,
            size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
            uploadedAt: new Date().toLocaleDateString(),
            uploadedTime: new Date().toLocaleTimeString()
          };

          setUploadedAsset(assetInfo);
          setStatusMessage('✅ File uploaded successfully!');
          if (onUploadComplete) {
            onUploadComplete(assetInfo);
          }
        } catch (err) {
          setError('Failed to parse upload response from server.');
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          setError(errData.message || `Upload failed with status code ${xhr.status}`);
        } catch {
          setError(`Upload failed with status code ${xhr.status}`);
        }
      }
    });

    xhr.addEventListener('error', () => {
      xhrRef.current = null;
      setUploading(false);
      setError('Direct R2 Upload failed. Please check your network connection.');
    });

    xhr.addEventListener('abort', () => {
      xhrRef.current = null;
      setUploading(false);
      setProgress(0);
      setUploadedBytes(null);
      setStatusMessage('Upload cancelled.');
    });

    const token = localStorage.getItem('token');
    xhr.open('POST', `${API_V1_URL}/media/upload-file`);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.send(formData);
  };

  const copyUrl = () => {
    if (uploadedAsset?.cdnUrl) {
      navigator.clipboard.writeText(uploadedAsset.cdnUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 MB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
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
            High-speed Cloudflare R2 direct stream uploader with real-time percentage progress.
          </p>
        </div>
        <span className="badge badge-primary">{mediaType}</span>
      </div>

      {error && (
        <div style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '12px', borderRadius: '10px', fontSize: '14px' }}>
          ⚠️ {error}
        </div>
      )}

      {statusMessage && !error && (
        <div style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary)', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: '600' }}>
          {statusMessage}
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
          cursor: uploading ? 'not-allowed' : 'pointer'
        }}
      >
        <input
          type="file"
          ref={fileInputRef}
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
          style={{ width: '100%', cursor: uploading ? 'not-allowed' : 'pointer', color: 'var(--text-primary)' }}
        />

        {file && (
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '14px', color: 'var(--primary)', fontWeight: '700' }}>
              📁 Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
            </span>
            {!uploading && (
              <button
                type="button"
                onClick={handleClearSelectedFile}
                className="btn btn-secondary"
                style={{ padding: '4px 10px', fontSize: '12px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                title="Cancel file selection"
              >
                ✖ Clear / Select Another
              </button>
            )}
          </div>
        )}
      </div>

      {/* Upload Progress Bar with Real-time 0% to 100% Tracking */}
      {uploading && (
        <div style={{ background: 'var(--bg-card)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '700', marginBottom: '8px' }}>
            <span style={{ color: 'var(--text-primary)' }}>
              ⚡ Uploading to Cloudflare R2...
            </span>
            <span style={{ color: 'var(--primary)', fontSize: '15px' }}>{progress}%</span>
          </div>

          <div style={{ width: '100%', background: 'var(--bg-tertiary)', borderRadius: '9999px', height: '12px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                height: '100%',
                transition: 'width 0.15s ease-out'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            <span>
              {uploadedBytes ? `${formatBytes(uploadedBytes.loaded)} / ${formatBytes(uploadedBytes.total)}` : 'Preparing upload stream...'}
            </span>
            <span>{progress === 100 ? 'Finalizing with CDN storage...' : `${100 - progress}% remaining`}</span>
          </div>
        </div>
      )}

      {/* Action Buttons: Start Upload & Cancel Upload */}
      <div style={{ display: 'flex', gap: '12px' }}>
        {uploading ? (
          <button
            type="button"
            onClick={handleCancelUpload}
            className="btn btn-secondary"
            style={{
              flex: 1,
              padding: '14px',
              fontSize: '15px',
              fontWeight: '700',
              color: '#ffffff',
              background: '#ef4444',
              borderColor: '#dc2626',
              cursor: 'pointer'
            }}
          >
            🚫 Cancel Upload ({progress}%)
          </button>
        ) : (
          <button
            type="button"
            onClick={handleUpload}
            className="btn btn-primary"
            style={{ flex: 1, padding: '14px', fontSize: '15px', fontWeight: '700' }}
            disabled={!file}
          >
            📤 Start Upload ({mediaType})
          </button>
        )}
      </div>

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
              ✅ Asset Uploaded Successfully! (100%)
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{uploadedAsset.uploadedAt} {uploadedAsset.uploadedTime}</span>
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
            <button type="button" onClick={copyUrl} className="btn btn-secondary" style={{ padding: '8px 16px', fontSize: '13px', whiteSpace: 'nowrap' }}>
              {copied ? 'Copied! ✓' : '📋 Copy URL'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectR2Uploader;
