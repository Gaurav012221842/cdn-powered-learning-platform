import React from 'react';

const VideoPlayer = ({ src }) => {
  return (
    <div style={{ position: 'relative', width: '100%', background: '#000', borderRadius: '12px', overflow: 'hidden' }}>
      <video controls src={src} style={{ width: '100%', maxHeight: '500px' }}>
        Your browser does not support HTML5 video playback.
      </video>
    </div>
  );
};

export default VideoPlayer;
