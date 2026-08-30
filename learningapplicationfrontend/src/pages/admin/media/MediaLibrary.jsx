import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import Button from '../../../components/common/Button';
import { API_V1_URL, R2_CDN_URL } from '../../../services/api';

const MediaLibrary = () => {
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateSortOrder, setDateSortOrder] = useState('desc'); // 'desc' = Newest first, 'asc' = Oldest first

  const fetchMedia = () => {
    setLoading(true);
    fetch(`${API_V1_URL}/media`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.data && Array.isArray(data.data)) {
          const formatted = data.data.map((item) => ({
            id: item.id,
            filename: item.originalFilename || item.objectKey,
            type: item.mediaType || 'ASSET',
            cdnUrl: `${R2_CDN_URL}/${item.objectKey}`,
            size: item.fileSize ? (item.fileSize / (1024 * 1024)).toFixed(2) + ' MB' : 'Active',
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Active',
            timestamp: item.createdAt ? new Date(item.createdAt).getTime() : 0
          }));
          setMediaList(formatted);
        }
      })
      .catch((err) => console.warn('Could not fetch media list from backend:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  const handleDelete = async (id, filename) => {
    const confirmDelete = window.confirm(
      `🗑️ Are you sure you want to permanently delete "${filename || 'this media asset'}" from Cloudflare R2?`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/media/${id}`, {
        method: 'DELETE',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!res.ok && res.status !== 404) {
        throw new Error('Failed to delete media asset from storage');
      }

      setMediaList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      alert(err.message || 'Error deleting media asset.');
    }
  };

  const filterTabs = ['ALL', 'VIDEO', 'IMAGE', 'PDF', 'AUDIO', 'DOCUMENT'];

  const filteredMedia = mediaList
    .filter((item) => {
      const matchesType = filterType === 'ALL' || item.type === filterType;
      const matchesSearch = searchTerm === '' || (item.filename || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    })
    .sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return dateSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '48px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                📁 Storage Manager
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Media Asset Library
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', marginTop: '4px' }}>
                Manage all videos, images, PDFs, and files uploaded across Cloudflare R2 storage.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={() => (window.location.href = '/admin/media/upload')}>
                📤 Upload New Asset
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {filterTabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilterType(tab)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: filterType === tab ? 'var(--primary)' : 'var(--bg-card)',
                    color: filterType === tab ? '#ffffff' : 'var(--text-primary)',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="form-input"
              placeholder="🔍 Search file name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ maxWidth: '280px', fontSize: '13px' }}
            />
          </div>

          {/* Media Table */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>
                All Assets ({filteredMedia.length})
              </h3>
              <button
                type="button"
                onClick={fetchMedia}
                className="btn btn-secondary"
                style={{ padding: '4px 12px', fontSize: '12px' }}
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px auto' }} />
                Loading media assets from Cloudflare R2...
              </div>
            ) : filteredMedia.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No media assets found.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
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
                          <span>Uploaded Date</span>
                          <span style={{ display: 'inline-flex', flexDirection: 'column', fontSize: '9px', lineHeight: '8px', marginLeft: '2px' }}>
                            <span style={{ color: dateSortOrder === 'asc' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold' }}>▲</span>
                            <span style={{ color: dateSortOrder === 'desc' ? 'var(--primary)' : 'var(--text-muted)', fontWeight: 'bold' }}>▼</span>
                          </span>
                        </span>
                      </th>
                      <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMedia.map((asset) => (
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
                              onClick={() => handleDelete(asset.id, asset.filename)}
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
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MediaLibrary;
