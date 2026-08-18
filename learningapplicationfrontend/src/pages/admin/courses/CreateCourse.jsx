import React, { useState } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Button from '../../../components/common/Button';
import DirectR2Uploader from '../../../components/media/DirectR2Uploader';
import { courseService } from '../../../services/courseService';

const CreateCourse = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('49.99');
  const [accessType, setAccessType] = useState('PAID');
  const [thumbnailMediaId, setThumbnailMediaId] = useState(null);
  const [thumbnailCdnUrl, setThumbnailCdnUrl] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await courseService.createCourse({
        title,
        description,
        price: parseFloat(price),
        accessType,
        thumbnailMediaId,
      });
      alert('Course created successfully!');
      window.location.href = '/admin/courses';
    } catch (err) {
      alert(err.message || 'Failed to create course');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1>Create New Course</h1>
        <form onSubmit={handleSubmit} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Course Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g., Spring Boot & Cloudflare Architecture"
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Course Description</label>
            <textarea
              rows="4"
              required
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed course overview..."
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Access Type</label>
              <select
                value={accessType}
                onChange={e => setAccessType(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
              >
                <option value="FREE">FREE</option>
                <option value="PAID">PAID</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Price ($)</label>
              <input
                type="number"
                step="0.01"
                value={price}
                onChange={e => setPrice(e.target.value)}
                disabled={accessType === 'FREE'}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #334155', background: '#0f172a', color: '#fff' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>Course Thumbnail Image</label>
            <DirectR2Uploader
              mediaType="IMAGE"
              onUploadComplete={(data) => {
                setThumbnailMediaId(data.mediaId);
                setThumbnailCdnUrl(data.cdnUrl);
              }}
            />
            {thumbnailCdnUrl && (
              <div style={{ marginTop: '12px' }}>
                <img src={thumbnailCdnUrl} alt="Thumbnail Preview" style={{ maxHeight: '150px', borderRadius: '8px' }} />
              </div>
            )}
          </div>

          <Button type="submit" disabled={saving}>
            {saving ? 'Creating Course...' : 'Publish Course'}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default CreateCourse;
