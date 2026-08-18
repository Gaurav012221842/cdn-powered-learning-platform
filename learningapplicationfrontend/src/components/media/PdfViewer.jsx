import React from 'react';

const PdfViewer = ({ src }) => {
  return (
    <div style={{ width: '100%', height: '600px', borderRadius: '8px', overflow: 'hidden' }}>
      <iframe src={src} title="PDF Viewer" width="100%" height="100%" style={{ border: 'none' }} />
    </div>
  );
};

export default PdfViewer;
