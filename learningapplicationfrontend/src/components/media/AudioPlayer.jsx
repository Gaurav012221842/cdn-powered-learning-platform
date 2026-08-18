import React from 'react';

const AudioPlayer = ({ src }) => {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <audio controls src={src} style={{ width: '100%' }}>
        Your browser does not support audio elements.
      </audio>
    </div>
  );
};

export default AudioPlayer;
