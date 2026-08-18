import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import DirectR2Uploader from '../../../components/media/DirectR2Uploader';
import { API_V1_URL, R2_CDN_URL } from '../../../services/api';

const UploadMedia = () => {
  const [selectedMediaType, setSelectedMediaType] = useState('VIDEO');
  const [uploadedList, setUploadedList] = useState([]);

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
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Active'
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
        date: newAsset.uploadedAt || 'Just now'
      },
      ...prev
    ]);
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

          {/* Direct R2 Uploader Component */}
          <DirectR2Uploader
            mediaType={selectedMediaType}
            onUploadComplete={handleUploadComplete}
          />

          {/* Recent Uploads Table */}
          <div className="card">
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '16px' }}>
              Recently Uploaded Media Assets ({uploadedList.length})
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '12px' }}>File Name</th>
                    <th style={{ padding: '12px' }}>Type</th>
                    <th style={{ padding: '12px' }}>Size</th>
                    <th style={{ padding: '12px' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {uploadedList.map((asset) => (
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
                      <td style={{ padding: '12px', textAlign: 'right' }}>
                        <a
                          href={asset.cdnUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                        >
                          View / Stream ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default UploadMedia;
