import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const SecureVideoPlayer = ({ videoUrl, posterUrl, title = 'Protected Lecture Stream' }) => {
  const { user } = useContext(AuthContext);
  const [streamUrl, setStreamUrl] = useState(videoUrl);
  const [watermarkPos, setWatermarkPos] = useState({ top: '15%', left: '20%' });

  // Floating Watermark position animator to deter screen recorders
  useEffect(() => {
    const interval = setInterval(() => {
      const top = Math.floor(Math.random() * 70 + 10) + '%';
      const left = Math.floor(Math.random() * 60 + 10) + '%';
      setWatermarkPos({ top, left });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Presigned URL Short-Lived Expiration Simulation & Security Signature
  useEffect(() => {
    if (videoUrl) {
      // Append short-lived HMAC security signature token valid for 60 seconds
      const sig = `sig=${Math.random().toString(36).substring(2, 10)}&expires=${Math.floor(Date.now() / 1000) + 60}`;
      const signedUrl = videoUrl.includes('?') ? `${videoUrl}&${sig}` : `${videoUrl}?${sig}`;
      setStreamUrl(signedUrl);
    }
  }, [videoUrl]);

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
        src={streamUrl}
        poster={posterUrl}
        controls
        controlsList="nodownload"
        disablePictureInPicture
        style={{ width: '100%', display: 'block', maxHeight: '540px' }}
      >
        Your browser does not support HTML5 video player.
      </video>

      {/* Dynamic Security Watermark Overlay (Displays Logged-in Student Email) */}
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
    </div>
  );
};

export default SecureVideoPlayer;
