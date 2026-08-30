import React, { useState, useEffect, useRef, useContext } from 'react';
import Hls from 'hls.js';
import { AuthContext } from '../../context/AuthContext';

const SecureVideoPlayer = ({
  videoUrl,
  hlsUrl,
  posterUrl,
  title = 'Protected Lecture Stream'
}) => {
  const { user } = useContext(AuthContext);
  const videoRef = useRef(null);
  const hlsRef = useRef(null);

  const [watermarkPos, setWatermarkPos] = useState({ top: '15%', left: '20%' });
  const [qualities, setQualities] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
  const [isHlsActive, setIsHlsActive] = useState(false);
  const [stats, setStats] = useState({ bandwidth: 'Auto', chunkCount: 0 });

  // Floating Watermark position animator to deter screen recorders
  useEffect(() => {
    const interval = setInterval(() => {
      const top = Math.floor(Math.random() * 70 + 10) + '%';
      const left = Math.floor(Math.random() * 60 + 10) + '%';
      setWatermarkPos({ top, left });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Initialize HLS.js adaptive chunk streaming (Prevents loading full 2GB into memory)
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const sourceUrl = hlsUrl || videoUrl;
    if (!sourceUrl) return;

    const isHlsStream = sourceUrl.includes('.m3u8') || sourceUrl.includes('/hls/');

    if (isHlsStream && Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60, // keeps backbuffer small to conserve RAM
        maxBufferLength: 30,  // only buffers up to 30 seconds ahead (2-5MB per segment)
        maxBufferSize: 30 * 1024 * 1024 // max 30MB buffer in browser RAM
      });

      hls.loadSource(sourceUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        setIsHlsActive(true);
        const levels = data.levels.map((level, idx) => {
          let label = `${level.height || 720}p`;
          if (level.height >= 1080) label = '1080p (Full HD)';
          else if (level.height >= 720) label = '720p (HD)';
          else if (level.height >= 480) label = '480p (SD)';
          else if (level.height >= 360) label = '360p (Data Saver)';
          else if (level.height > 0) label = `${level.height}p`;

          return {
            id: idx,
            height: level.height,
            bitrate: level.bitrate ? `${(level.bitrate / 1000000).toFixed(1)} Mbps` : '',
            label: label
          };
        });
        setQualities(levels);
      });

      hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
        setStats((prev) => ({
          ...prev,
          chunkCount: prev.chunkCount + 1,
          bandwidth: (hls.bandwidthEstimate / 1000000).toFixed(2) + ' Mbps'
        }));
      });

      hlsRef.current = hls;

      return () => {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple Safari HLS support
      video.src = sourceUrl;
      setIsHlsActive(true);
    } else {
      // Standard Direct Video Stream
      video.src = sourceUrl;
      setIsHlsActive(false);
    }
  }, [videoUrl, hlsUrl]);

  const handleQualityChange = (e) => {
    const levelIndex = parseInt(e.target.value, 10);
    setCurrentQuality(levelIndex);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIndex;
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: '16px',
        overflow: 'hidden',
        background: '#000000',
        boxShadow: 'var(--shadow-xl)'
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        ref={videoRef}
        poster={posterUrl}
        controls
        controlsList="nodownload"
        disablePictureInPicture
        playsInline
        style={{ width: '100%', display: 'block', maxHeight: '540px' }}
      >
        Your browser does not support HTML5 adaptive video player.
      </video>

      {/* Floating Dynamic Security Watermark Overlay */}
      <div
        style={{
          position: 'absolute',
          top: watermarkPos.top,
          left: watermarkPos.left,
          color: 'rgba(255, 255, 255, 0.45)',
          fontSize: '13px',
          fontWeight: '700',
          pointerEvents: 'none',
          userSelect: 'none',
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '4px 10px',
          borderRadius: '6px',
          backdropFilter: 'blur(4px)',
          transition: 'all 1.5s ease-in-out',
          zIndex: 10
        }}
      >
        🔒 {user?.email || 'student@gauravlearn.com'}
      </div>

      {/* HLS Adaptive Chunk Connected Indicator & Quality Selector */}
      {isHlsActive && (
        <div
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 15
          }}
        >
          {/* Minimal Live Connected Green Dot Indicator */}
          <div
            title="Stream Connected (Adaptive HLS)"
            style={{
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'default'
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e'
              }}
            />
          </div>

          <select
            value={currentQuality}
            onChange={handleQualityChange}
            style={{
              background: 'rgba(0, 0, 0, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: '700',
              padding: '4px 8px',
              borderRadius: '8px',
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value={-1}>⚙️ Auto (Adaptive)</option>
            {qualities.length > 0 ? (
              qualities.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label} {q.bitrate ? `(${q.bitrate})` : ''}
                </option>
              ))
            ) : (
              <>
                <option value={0}>1080p (Full HD)</option>
                <option value={1}>720p (HD)</option>
                <option value={2}>480p (SD)</option>
                <option value={3}>360p (Data Saver)</option>
              </>
            )}
          </select>
        </div>
      )}
    </div>
  );
};

export default SecureVideoPlayer;
