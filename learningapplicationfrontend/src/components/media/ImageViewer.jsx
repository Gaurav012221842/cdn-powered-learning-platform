import React from 'react';

const ImageViewer = ({ src, alt = 'Media Image' }) => {
  return (
    <div style={{ textAlign: 'center', padding: '16px' }}>
      <img src={src} alt={alt} style={{ maxWidth: '100%', maxHeight: '600px', borderRadius: '8px' }} />
    </div>
  );
};

export default ImageViewer;
