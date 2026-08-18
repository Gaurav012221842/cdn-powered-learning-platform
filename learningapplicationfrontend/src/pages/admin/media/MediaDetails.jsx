import React from 'react';
import Navbar from '../../../components/layout/Navbar';

const MediaDetails = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1>Media Transcoding Details</h1>
      </main>
    </div>
  );
};

export default MediaDetails;
