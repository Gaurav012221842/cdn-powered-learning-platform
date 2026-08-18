import React from 'react';
import Navbar from '../../../components/layout/Navbar';
import Button from '../../../components/common/Button';

const MediaLibrary = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h1>Media Asset Library</h1>
          <Button onClick={() => window.location.href = '/admin/media/upload'}>Upload Asset</Button>
        </div>
      </main>
    </div>
  );
};

export default MediaLibrary;
