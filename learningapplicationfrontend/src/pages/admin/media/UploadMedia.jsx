import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import DirectR2Uploader from '../../../components/media/DirectR2Uploader';
import ResumableVideoUploader from '../../../components/video/ResumableVideoUploader';
import { API_V1_URL, R2_CDN_URL } from '../../../services/api';

const UploadMedia = () => {
  const [selectedMediaType, setSelectedMediaType] = useState('VIDEO');
  const [uploadedList, setUploadedList] = useState([]);
  const [dateSortOrder, setDateSortOrder] = useState('desc'); // 'desc' = Newest first, 'asc' = Oldest first

  useEffect(() => {
    fetch(`${API_V1_URL}/media`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data)) {
          const formatted = data.data.map((item) => ({
            id: item.id,
            filename: item.originalFilename || item.objectKey,
            type: item.mediaType || 'ASSET',
            cdnUrl: `${R2_CDN_URL}/${item.objectKey}`,
            size: item.fileSize ? (item.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Live CDN',
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Active',
            timestamp: item.createdAt ? new Date(item.createdAt).getTime() : 0
          }));
          setUploadedList(formatted);
        }
      })
      .catch((err) => console.warn('Could not fetch media list from backend:', err));
  }, []);

  const mediaTypes = [
    { key: 'VIDEO', label: '🎥 Videos (.mp4, .mkv)', badge: 'HLS Stream' },
    { key: 'PDF', label: '📄 PDFs (.pdf)', badge: 'Document' },
    { key: 'IMAGE', label: '🖼️ Images (.png, .webp)', badge: 'CDN Image' },
    { key: 'REEL', label: '🎬 Reels & Shorts (.mp4)', badge: 'Short Video' },
    { key: 'AUDIO', label: '🎙️ Audio (.mp3, .wav)', badge: 'Podcast' },
    { key: 'DOCUMENT', label: '📁 Docs (.doc, .pdf)', badge: 'File' }
  ];

  const handleUploadComplete = (newAsset) => {
    setUploadedList((prev) => [
      {
        id: newAsset.mediaId || String(Date.now()),
        filename: newAsset.filename,
        type: newAsset.type,
        cdnUrl: newAsset.cdnUrl,
        size: newAsset.size,
        date: newAsset.uploadedAt || new Date().toLocaleDateString(),
        timestamp: Date.now()
      },
      ...prev
    ]);
  };

  const handleDeleteAsset = async (assetId, filename) => {
    const confirmDelete = window.confirm(
      `🗑️ Are you sure you want to permanently delete "${filename || 'this asset'}" from storage?`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/media/${assetId}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!res.ok && res.status !== 404) {
        throw new Error('Failed to delete media asset from backend');
      }

      setUploadedList((prev) => prev.filter((item) => item.id !== assetId));
    } catch (err) {
      alert(err.message || 'Error deleting media asset.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Header Banner */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                ⚡ Admin Control Center
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Media & File Upload Hub (ServerSide)
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>
                Upload high-definition videos, lecture PDFs, thumbnail images, and short reels directly to Cloudflare R2 storage.
              </p>
            </div>
            <a href="/admin/media" className="btn btn-secondary">
              ← View Media Library
            </a>
          </div>

          {/* Quick Media Type Selector Tabs */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {mediaTypes.map((item) => (
              <button
                key={item.key}
                onClick={() => setSelectedMediaType(item.key)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  background: selectedMediaType === item.key ? 'var(--primary)' : 'var(--bg-card)',
                  color: selectedMediaType === item.key ? '#ffffff' : 'var(--text-primary)',
                  fontWeight: '700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s',
                  boxShadow: selectedMediaType === item.key ? 'var(--shadow-md)' : 'none'
                }}
              >
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Video Resumable Multipart Uploader or Direct Asset Uploader */}
          {selectedMediaType === 'VIDEO' ? (
            <ResumableVideoUploader onUploadSuccess={handleUploadComplete} />
          ) : (
            <DirectR2Uploader
              mediaType={selectedMediaType}
              onUploadComplete={handleUploadComplete}
            />
          )}

          {/* Recent Uploads Table */}
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Recently Uploaded Media Assets ({uploadedList.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              {(() => {
                const sortedList = [...uploadedList].sort((a, b) => {
                  const timeA = a.timestamp || 0;
                  const timeB = b.timestamp || 0;
                  return dateSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
                });

                return (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '12px' }}>File Name</th>
                        <th style={{ padding: '12px' }}>Type</th>
                        <th style={{ padding: '12px' }}>Size</th>
                        <th
                          style={{ padding: '12px', cursor: 'pointer', userSelect: 'none' }}
                          onClick={() => setDateSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                          title="Click to sort Newest / Oldest"
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span>Date</span>
                            <span style={{ display: 'inline-flex', flexDirection: 'column', fontSize: '9px', lineHeight: '8px', marginLeft: '2px' }}>
                              <span style={{ color: dateSortOrder === 'asc' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold' }}>▲</span>
                              <span style={{ color: dateSortOrder === 'desc' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold' }}>▼</span>
                            </span>
                          </span>
                        </th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedList.map((asset) => (
                    <tr key={asset.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                        {asset.filename}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                          {asset.type}
                        </span>
                      </td>
                      <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{asset.size}</td>
                      <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{asset.date}</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
                          <a
                            href={asset.cdnUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                          >
                            View / Stream ↗
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDeleteAsset(asset.id, asset.filename)}
                            title="Delete Asset"
                            style={{
                              padding: '6px 10px',
                              fontSize: '14px',
                              background: 'rgba(239, 68, 68, 0.15)',
                              color: '#ef4444',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                                  </tbody>
                  </table>
                );
              })()}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadMedia;
