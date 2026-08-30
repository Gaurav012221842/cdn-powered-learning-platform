import React from 'react';

const formatBytes = (bytes) => {
  if (!bytes || bytes <= 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatSeconds = (sec) => {
  if (!sec || sec <= 0) return '0s';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
};

const UploadProgress = ({
  fileName,
  progressData,
  status,
  onPause,
  onResume,
  onCancel,
  showChunkGrid = true
}) => {
  const {
    percentage = 0,
    uploadedBytes = 0,
    totalBytes = 0,
    speedMBps = 0,
    etaSeconds = 0,
    completedPartsCount = 0,
    totalPartsCount = 1,
    partStatuses = []
  } = progressData || {};

  const isPaused = status === 'PAUSED';
  const isUploading = status === 'UPLOADING';
  const isFinalizing = status === 'FINALIZING';
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED' || status === 'ERROR';

  return (
    <div
      className="card animate-fade-in"
      style={{
        padding: '24px',
        borderRadius: '16px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}
    >
      {/* File Info Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>🎬</span>
            <strong style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
              {fileName || 'Video File'}
            </strong>
          </div>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            {formatBytes(uploadedBytes)} of {formatBytes(totalBytes)} ({completedPartsCount}/{totalPartsCount} Chunks)
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '800',
              textTransform: 'uppercase',
              background: isCompleted
                ? 'rgba(34, 197, 94, 0.15)'
                : isPaused
                ? 'rgba(234, 179, 8, 0.15)'
                : isFailed
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(99, 102, 241, 0.15)',
              color: isCompleted
                ? '#22c55e'
                : isPaused
                ? '#eab308'
                : isFailed
                ? '#ef4444'
                : '#6366f1',
              border: `1px solid ${
                isCompleted
                  ? 'rgba(34, 197, 94, 0.3)'
                  : isPaused
                  ? 'rgba(234, 179, 8, 0.3)'
                  : isFailed
                  ? 'rgba(239, 68, 68, 0.3)'
                  : 'rgba(99, 102, 241, 0.3)'
              }`
            }}
          >
            {isFinalizing ? '⏳ Finalizing & Verifying...' : status}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>
          <span style={{ color: 'var(--text-primary)' }}>Progress</span>
          <span style={{ color: 'var(--primary)' }}>{percentage}%</span>
        </div>
        <div
          style={{
            width: '100%',
            height: '10px',
            background: 'var(--bg-card)',
            borderRadius: '10px',
            overflow: 'hidden',
            border: '1px solid var(--border-color)'
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: '100%',
              background: isCompleted
                ? 'linear-gradient(90deg, #10b981, #22c55e)'
                : isPaused
                ? 'linear-gradient(90deg, #f59e0b, #eab308)'
                : isFailed
                ? '#ef4444'
                : 'linear-gradient(90deg, #6366f1, #a855f7)',
              borderRadius: '10px',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Telemetry Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '12px',
          background: 'var(--bg-card)',
          padding: '12px 16px',
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}
      >
        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
            ⚡ Speed
          </span>
          <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
            {speedMBps > 0 ? `${speedMBps} MB/s` : 'Calculating...'}
          </strong>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
            ⏱️ Remaining ETA
          </span>
          <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
            {etaSeconds > 0 ? formatSeconds(etaSeconds) : isCompleted ? '0s' : 'Estimating...'}
          </strong>
        </div>

        <div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>
            📦 Direct R2 Chunks
          </span>
          <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>
            {completedPartsCount} / {totalPartsCount} Uploaded
          </strong>
        </div>
      </div>

      {/* Visual Chunk Map Matrix */}
      {showChunkGrid && partStatuses && partStatuses.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)' }}>
              Chunk Transfer Map ({partStatuses.length} Parts × 10MB)
            </span>
            <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#22c55e' }} /> Completed
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#6366f1' }} /> Uploading
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: 'var(--border-color)' }} /> Pending
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              maxHeight: '110px',
              overflowY: 'auto',
              padding: '8px',
              background: 'var(--bg-card)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}
          >
            {partStatuses.map((partStatus, idx) => {
              let bg = 'var(--border-color)';
              if (partStatus === 'completed') bg = '#22c55e';
              else if (partStatus === 'uploading') bg = '#6366f1';
              else if (partStatus === 'failed') bg = '#ef4444';

              return (
                <div
                  key={idx}
                  title={`Part #${idx + 1} (${partStatus})`}
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '2px',
                    background: bg,
                    transition: 'background 0.2s'
                  }}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Control Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        {isUploading && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onPause}
            style={{ fontWeight: '700', padding: '8px 16px', fontSize: '13px' }}
          >
            ⏸️ Pause Upload
          </button>
        )}

        {isPaused && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={onResume}
            style={{ fontWeight: '700', padding: '8px 16px', fontSize: '13px' }}
          >
            ▶️ Resume Upload
          </button>
        )}

        {!isCompleted && (
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '8px',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)',
              color: '#ef4444',
              cursor: 'pointer'
            }}
          >
            ❌ Cancel & Abort
          </button>
        )}
      </div>
    </div>
  );
};

export default UploadProgress;
