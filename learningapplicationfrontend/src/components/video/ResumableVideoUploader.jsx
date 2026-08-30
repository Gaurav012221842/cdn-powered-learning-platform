import React, { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { ResumableVideoUpload, getFileFingerprint, getUploadSession, removeUploadSession } from './uploadManager';
import UploadProgress from './UploadProgress';
import { R2_CDN_URL } from '../../services/api';

const ResumableVideoUploader = ({ onUploadSuccess }) => {
  const { showToast } = useContext(AuthContext);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeUpload, setActiveUpload] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('IDLE'); // IDLE | INITIALIZING | UPLOADING | PAUSED | FINALIZING | COMPLETED | ERROR
  const [progressData, setProgressData] = useState(null);
  const [completedAsset, setCompletedAsset] = useState(null);
  const [savedSession, setSavedSession] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Check if selected file has an unfinished session in IndexedDB
  useEffect(() => {
    if (selectedFile && uploadStatus === 'IDLE') {
      const fingerprint = getFileFingerprint(selectedFile);
      getUploadSession(fingerprint).then((session) => {
        if (session && session.completedParts && Object.keys(session.completedParts).length > 0) {
          setSavedSession(session);
        } else {
          setSavedSession(null);
        }
      });
    }
  }, [selectedFile, uploadStatus]);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate video MIME / extension
    const isVideo = file.type.startsWith('video/') || /\.(mp4|mkv|mov|avi|webm)$/i.test(file.name);
    if (!isVideo) {
      showToast('⚠️ Please select a valid video file (.mp4, .mkv, .mov, .avi, .webm)', 'error');
      return;
    }

    setSelectedFile(file);
    setUploadStatus('IDLE');
    setProgressData(null);
    setCompletedAsset(null);
  };

  const handleStartUpload = () => {
    if (!selectedFile) return;

    const uploader = new ResumableVideoUpload(selectedFile, {
      chunkSize: 10 * 1024 * 1024, // 10MB chunk
      concurrency: 4, // 4 parallel uploads
      onStatusChange: (newStatus) => {
        setUploadStatus(newStatus);
      },
      onProgress: (data) => {
        setProgressData(data);
      },
      onComplete: (mediaAsset) => {
        setUploadStatus('COMPLETED');
        setCompletedAsset(mediaAsset);
        showToast('🎉 Video uploaded & queued for multi-bitrate HLS transcoding!', 'success');
        if (onUploadSuccess) {
          onUploadSuccess({
            mediaId: mediaAsset.id,
            filename: mediaAsset.originalFilename || selectedFile.name,
            cdnUrl: `${R2_CDN_URL}/${mediaAsset.objectKey}`,
            type: 'VIDEO',
            size: (selectedFile.size / (1024 * 1024)).toFixed(2) + ' MB',
            uploadedAt: new Date().toLocaleDateString()
          });
        }
      },
      onError: (err) => {
        setUploadStatus('ERROR');
        showToast(err.message || 'Video upload failed. You can resume anytime.', 'error');
      }
    });

    setActiveUpload(uploader);
    uploader.start();
  };

  const handlePause = () => {
    if (activeUpload) {
      activeUpload.pause();
      showToast('⏸️ Upload paused.', 'info');
    }
  };

  const handleResume = () => {
    if (activeUpload) {
      activeUpload.resume();
      showToast('▶️ Resuming chunk upload directly to Cloudflare R2...', 'info');
    }
  };

  const handleCancel = async () => {
    const confirmCancel = window.confirm('Are you sure you want to cancel and delete this upload session?');
    if (!confirmCancel) return;

    if (activeUpload) {
      await activeUpload.cancel();
    }
    setActiveUpload(null);
    setSelectedFile(null);
    setSavedSession(null);
    setUploadStatus('IDLE');
    setProgressData(null);
    showToast('Upload session aborted.', 'info');
  };

  const handleDiscardSavedSession = async () => {
    if (savedSession) {
      await removeUploadSession(savedSession.fileFingerprint);
      setSavedSession(null);
      showToast('Previous partial session cleared.', 'info');
    }
  };

  const resetUploader = () => {
    setSelectedFile(null);
    setActiveUpload(null);
    setUploadStatus('IDLE');
    setProgressData(null);
    setCompletedAsset(null);
    setSavedSession(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. DROPZONE (Shown when no active upload) */}
      {uploadStatus === 'IDLE' && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          style={{
            border: `2px dashed ${isDragOver ? 'var(--primary)' : 'var(--border-color)'}`,
            borderRadius: '20px',
            padding: '48px 24px',
            textAlign: 'center',
            background: isDragOver ? 'rgba(99, 102, 241, 0.05)' : 'var(--bg-secondary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*,.mkv,.mp4,.mov,.avi"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          />

          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎥</div>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
            {selectedFile ? selectedFile.name : 'Select or Drag & Drop Video (Up to 10 GB+)'}
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto 16px' }}>
            Supports ultra-large videos with 10MB chunk streaming, 4× parallel transfers directly to Cloudflare R2, and instant crash recovery.
          </p>

          {selectedFile ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--bg-card)', padding: '6px 16px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}>
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB Ready
              </span>
            </div>
          ) : (
            <button type="button" className="btn btn-primary" style={{ padding: '10px 24px', fontWeight: '700' }}>
              Browse Video File
            </button>
          )}
        </div>
      )}

      {/* 2. SAVED RESUME NOTIFICATION BANNER */}
      {savedSession && uploadStatus === 'IDLE' && (
        <div
          className="animate-fade-in"
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '16px 20px',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <strong style={{ color: '#d97706', fontSize: '14px' }}>
                Incomplete Upload Found for this Video!
              </strong>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              You previously uploaded {Object.keys(savedSession.completedParts || {}).length} of {savedSession.totalParts} chunks. You can resume without re-uploading completed parts!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleStartUpload}
              style={{ fontSize: '13px', padding: '8px 16px', fontWeight: '700' }}
            >
              ▶️ Resume from Failed Chunk
            </button>
            <button
              type="button"
              onClick={handleDiscardSavedSession}
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-muted)',
                cursor: 'pointer'
              }}
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}

      {/* 3. READY TO START BANNER (If file chosen & not uploading) */}
      {selectedFile && uploadStatus === 'IDLE' && !savedSession && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleStartUpload}
            style={{ padding: '12px 28px', fontWeight: '800', fontSize: '15px' }}
          >
            🚀 Start Resumable Upload
          </button>
        </div>
      )}

      {/* 4. ACTIVE PROGRESS VIEW */}
      {uploadStatus !== 'IDLE' && uploadStatus !== 'COMPLETED' && (
        <UploadProgress
          fileName={selectedFile?.name}
          progressData={progressData}
          status={uploadStatus}
          onPause={handlePause}
          onResume={handleResume}
          onCancel={handleCancel}
        />
      )}

      {/* 5. SUCCESS VIEW */}
      {uploadStatus === 'COMPLETED' && (
        <div
          className="card animate-fade-in"
          style={{
            padding: '32px 24px',
            borderRadius: '20px',
            textAlign: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)',
              color: '#22c55e',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}
          >
            ✅
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Video Upload Completed Successfully!
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px', maxWidth: '500px' }}>
              All multipart chunks were assembled in Cloudflare R2 and dispatched to <code>video-worker</code> for adaptive multi-bitrate HLS encoding.
            </p>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              padding: '12px 18px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              width: '100%',
              maxWidth: '600px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', wordBreak: 'break-all', textAlign: 'left' }}>
              {completedAsset?.objectKey ? `${R2_CDN_URL}/${completedAsset.objectKey}` : 'Ready on Cloudflare CDN'}
            </span>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ fontSize: '12px', padding: '6px 12px', whiteSpace: 'nowrap' }}
              onClick={() => {
                const url = `${R2_CDN_URL}/${completedAsset?.objectKey || ''}`;
                navigator.clipboard.writeText(url);
                showToast('📋 CDN URL copied to clipboard!', 'success');
              }}
            >
              📋 Copy CDN Link
            </button>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={resetUploader}
            style={{ marginTop: '8px', padding: '10px 24px', fontWeight: '700' }}
          >
            ➕ Upload Another Video
          </button>
        </div>
      )}

    </div>
  );
};

export default ResumableVideoUploader;
