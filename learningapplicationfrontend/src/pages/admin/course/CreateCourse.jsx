import React, { useState, useContext } from 'react';
import Navbar from '../../../components/layout/Navbar';
import Footer from '../../../components/layout/Footer';
import DirectR2Uploader from '../../../components/media/DirectR2Uploader';
import { AuthContext } from '../../../context/AuthContext';
import { API_V1_URL } from '../../../services/api';

const CreateCourse = () => {
  const { showToast } = useContext(AuthContext);

  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [category, setCategory] = useState('Fullstack Development');
  const [price, setPrice] = useState('49.99');
  const [coverThumbnailUrl, setCoverThumbnailUrl] = useState('');
  const [showR2Modal, setShowR2Modal] = useState(false);
  const [uploadTargetKey, setUploadTargetKey] = useState(null); // { chapIdx, lesIdx, field: 'contentUrl' | 'videoThumbnailUrl' | 'cover' }

  const [chapters, setChapters] = useState([
    {
      id: String(Date.now()),
      title: 'Chapter 1: Getting Started & Fundamentals',
      lessons: [
        {
          id: String(Date.now() + 1),
          title: 'Lesson 1: Platform Overview',
          lessonType: 'VIDEO',
          contentUrl: '',
          videoThumbnailUrl: '',
          quizData: JSON.stringify({
            questions: [
              {
                question: 'What is the primary benefit of CDN-powered video streaming?',
                options: ['Global Low-Latency', 'Offline ONLY', 'Manual Tape Delivery', 'Single Server Cap'],
                correctIndex: 0
              }
            ]
          })
        }
      ]
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [createdCourseId, setCreatedCourseId] = useState(null);

  // Chapter Handlers
  const addChapter = () => {
    setChapters((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        title: `Chapter ${prev.length + 1}: New Module`,
        lessons: [
          {
            id: String(Date.now() + 1),
            title: 'Lesson 1: Introduction',
            lessonType: 'VIDEO',
            contentUrl: '',
            videoThumbnailUrl: '',
            quizData: ''
          }
        ]
      }
    ]);
  };

  const removeChapter = (chapIdx) => {
    setChapters((prev) => prev.filter((_, idx) => idx !== chapIdx));
  };

  const updateChapterTitle = (chapIdx, title) => {
    setChapters((prev) => {
      const copy = [...prev];
      copy[chapIdx].title = title;
      return copy;
    });
  };

  // Lesson Handlers
  const addLesson = (chapIdx) => {
    setChapters((prev) => {
      const copy = [...prev];
      const nextLesNum = copy[chapIdx].lessons.length + 1;
      copy[chapIdx].lessons.push({
        id: String(Date.now()),
        title: `Lesson ${nextLesNum}: New Lesson`,
        lessonType: 'VIDEO',
        contentUrl: '',
        videoThumbnailUrl: '',
        quizData: ''
      });
      return copy;
    });
  };

  const removeLesson = (chapIdx, lesIdx) => {
    setChapters((prev) => {
      const copy = [...prev];
      copy[chapIdx].lessons = copy[chapIdx].lessons.filter((_, idx) => idx !== lesIdx);
      return copy;
    });
  };

  const updateLessonField = (chapIdx, lesIdx, field, val) => {
    setChapters((prev) => {
      const copy = [...prev];
      copy[chapIdx].lessons[lesIdx][field] = val;
      return copy;
    });
  };

  const handleOpenR2Upload = (target) => {
    setUploadTargetKey(target);
    setShowR2Modal(true);
  };

  const handleR2Complete = (assetInfo) => {
    if (!uploadTargetKey) return;

    if (uploadTargetKey.field === 'cover') {
      setCoverThumbnailUrl(assetInfo.cdnUrl);
      showToast('Course cover image updated!', 'success');
    } else {
      const { chapIdx, lesIdx, field } = uploadTargetKey;
      updateLessonField(chapIdx, lesIdx, field, assetInfo.cdnUrl);
      showToast(`Asset link updated for Lesson ${lesIdx + 1}!`, 'success');
    }
    setShowR2Modal(false);
  };

  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    if (!courseTitle.trim()) {
      showToast('Please enter a course title.', 'error');
      return;
    }

    setLoading(true);

    try {
      const formattedChapters = chapters.map((c, cIdx) => ({
        title: c.title,
        sequenceOrder: cIdx + 1,
        lessons: c.lessons.map((l, lIdx) => ({
          title: l.title,
          lessonType: l.lessonType,
          contentUrl: l.contentUrl,
          videoThumbnailUrl: l.videoThumbnailUrl,
          quizData: l.quizData,
          sequenceOrder: l.lIdx + 1
        }))
      }));

      const payload = {
        title: courseTitle,
        description: courseDescription,
        price: parseFloat(price) || 0,
        thumbnailUrl: coverThumbnailUrl,
        chapters: formattedChapters
      };

      const token = localStorage.getItem('token');
      const res = await fetch(`${API_V1_URL}/courses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.success) {
        showToast('🎉 Course with Chapters, Videos & Quizzes created successfully!', 'success');
        setCreatedCourseId(data.data?.id);
      } else {
        showToast(data.message || 'Failed to create course', 'error');
      }
    } catch (err) {
      showToast('Connection error creating course', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, width: '100%', padding: '40px 24px' }}>
        <div className="container" style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
                🎓 Admin Course Architect
              </span>
              <h1 style={{ fontSize: '30px', fontWeight: '800', color: 'var(--text-primary)' }}>
                Create New Course Curriculum
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                Organize chapters, videos with thumbnails, PDFs, images, and interactive quizzes.
              </p>
            </div>
            <a href="/admin/dashboard" className="btn btn-secondary">
              ← Back to Admin Dashboard
            </a>
          </div>

          {createdCourseId && (
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '16px 20px', borderRadius: '12px', color: '#10b981', fontWeight: '700' }}>
              ✅ Course Published Successfully! Course ID: {createdCourseId}. <a href="/courses/1" style={{ textDecoration: 'underline', color: '#10b981', marginLeft: '12px' }}>View Course →</a>
            </div>
          )}

          <form onSubmit={handleSubmitCourse} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Section 1: Course Basic Info */}
            <div className="card" style={{ padding: '28px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                1. Basic Course Details
              </h2>

              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Microservices & Distributed Systems with Java & Cloudflare R2"
                  className="form-input"
                  value={courseTitle}
                  onChange={(e) => setCourseTitle(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows={3}
                  placeholder="Detailed course description, learning outcomes, and prerequisites..."
                  className="form-input"
                  style={{ resize: 'vertical' }}
                  value={courseDescription}
                  onChange={(e) => setCourseDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                    <option>Fullstack Development</option>
                    <option>Cloud Infrastructure & CDN</option>
                    <option>Backend Engineering</option>
                    <option>DevOps & Microservices</option>
                    <option>DSA</option>
                    <option> AI/ML</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Course Cover Thumbnail URL</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="https://pub-7bfd.../cover.jpg"
                      className="form-input"
                      value={coverThumbnailUrl}
                      onChange={(e) => setCoverThumbnailUrl(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenR2Upload({ field: 'cover' })}
                      className="btn btn-secondary"
                      style={{ whiteSpace: 'nowrap', fontSize: '12px' }}
                    >
                      ☁️ Pick R2
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Chapter & Lesson Curriculum Builder */}
            <div className="card" style={{ padding: '28px', borderRadius: '18px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
                    2. Curriculum Builder (Chapters & Content Items)
                  </h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                    Add chapters, specify lesson types (Video, Image, PDF, Quiz), and assign Cloudflare CDN links & thumbnails.
                  </p>
                </div>
                <button type="button" onClick={addChapter} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>
                  ➕ Add New Chapter
                </button>
              </div>

              {chapters.map((chap, cIdx) => (
                <div
                  key={chap.id}
                  style={{
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '14px' }}>
                        Chapter {cIdx + 1}:
                      </span>
                      <input
                        type="text"
                        required
                        className="form-input"
                        style={{ fontWeight: '700', fontSize: '15px' }}
                        value={chap.title}
                        onChange={(e) => updateChapterTitle(cIdx, e.target.value)}
                      />
                    </div>
                    {chapters.length > 1 && (
                      <button type="button" onClick={() => removeChapter(cIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}>
                        🗑️ Delete Chapter
                      </button>
                    )}
                  </div>

                  {/* Lessons List inside Chapter */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingLeft: '12px', borderLeft: '3px solid var(--primary-light)' }}>
                    {chap.lessons.map((les, lIdx) => (
                      <div
                        key={les.id}
                        style={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '12px',
                          padding: '14px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                          <input
                            type="text"
                            required
                            placeholder="Lesson Title"
                            className="form-input"
                            style={{ flex: 2, fontSize: '14px', fontWeight: '600' }}
                            value={les.title}
                            onChange={(e) => updateLessonField(cIdx, lIdx, 'title', e.target.value)}
                          />

                          {/* Lesson Type Dropdown requested by user */}
                          <select
                            className="form-input"
                            style={{ flex: 1, fontSize: '13px', fontWeight: '700', color: 'var(--primary)' }}
                            value={les.lessonType}
                            onChange={(e) => updateLessonField(cIdx, lIdx, 'lessonType', e.target.value)}
                          >
                            <option value="VIDEO">🎥 Video Lecture</option>
                            <option value="PDF">📄 PDF Document</option>
                            <option value="IMAGE">🖼️ Diagram / Image</option>
                            <option value="QUIZ">📝 Interactive Quiz</option>
                          </select>

                          <button type="button" onClick={() => removeLesson(cIdx, lIdx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px' }}>
                            ✖ Remove
                          </button>
                        </div>

                        {/* Content Fields according to Selected Lesson Type */}
                        {les.lessonType === 'VIDEO' && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Video CDN Stream URL</label>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                <input
                                  type="text"
                                  placeholder="https://pub-7bfd.../video.mp4"
                                  className="form-input"
                                  style={{ fontSize: '13px' }}
                                  value={les.contentUrl}
                                  onChange={(e) => updateLessonField(cIdx, lIdx, 'contentUrl', e.target.value)}
                                />
                                <button type="button" onClick={() => handleOpenR2Upload({ chapIdx: cIdx, lesIdx: lIdx, field: 'contentUrl' })} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                  ☁️ R2
                                </button>
                              </div>
                            </div>

                            {/* Custom Video Thumbnail requested by user */}
                            <div>
                              <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Custom Video Thumbnail URL</label>
                              <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                                <input
                                  type="text"
                                  placeholder="https://pub-7bfd.../thumb.jpg"
                                  className="form-input"
                                  style={{ fontSize: '13px' }}
                                  value={les.videoThumbnailUrl}
                                  onChange={(e) => updateLessonField(cIdx, lIdx, 'videoThumbnailUrl', e.target.value)}
                                />
                                <button type="button" onClick={() => handleOpenR2Upload({ chapIdx: cIdx, lesIdx: lIdx, field: 'videoThumbnailUrl' })} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                  ☁️ R2
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {(les.lessonType === 'PDF' || les.lessonType === 'IMAGE') && (
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Asset CDN Link</label>
                            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                              <input
                                type="text"
                                placeholder="https://pub-7bfd.../file"
                                className="form-input"
                                style={{ fontSize: '13px' }}
                                value={les.contentUrl}
                                onChange={(e) => updateLessonField(cIdx, lIdx, 'contentUrl', e.target.value)}
                              />
                              <button type="button" onClick={() => handleOpenR2Upload({ chapIdx: cIdx, lesIdx: lIdx, field: 'contentUrl' })} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '11px', whiteSpace: 'nowrap' }}>
                                ☁️ Upload Asset
                              </button>
                            </div>
                          </div>
                        )}

                        {les.lessonType === 'QUIZ' && (
                          <div>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)' }}>Quiz Data JSON (Questions & Answers)</label>
                            <textarea
                              rows={2}
                              className="form-input"
                              style={{ fontSize: '12px', fontFamily: 'monospace', marginTop: '4px' }}
                              placeholder='{"questions": [{"question": "Q1 text?", "options": ["A", "B", "C", "D"], "correctIndex": 0}]}'
                              value={les.quizData}
                              onChange={(e) => updateLessonField(cIdx, lIdx, 'quizData', e.target.value)}
                            />
                          </div>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addLesson(cIdx)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '12px', alignSelf: 'flex-start' }}
                    >
                      ➕ Add Lesson to Chapter {cIdx + 1}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Course Button */}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: '800' }}
              disabled={loading}
            >
              {loading ? 'Publishing Course Curriculum...' : '🚀 Publish Complete Course'}
            </button>
          </form>

          {/* Cloudflare R2 Selection Modal */}
          {showR2Modal && (
            <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }}>
              <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '28px', maxWidth: '540px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>
                    ☁️ Upload Asset to Cloudflare R2
                  </h3>
                  <button onClick={() => setShowR2Modal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>
                    ✖
                  </button>
                </div>
                <DirectR2Uploader onUploadComplete={handleR2Complete} />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CreateCourse;
