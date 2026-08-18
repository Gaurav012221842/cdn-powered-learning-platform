import React from 'react';
import Navbar from '../../../components/layout/Navbar';

const EditCampaign = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <h1>Edit Campaign Config</h1>
      </main>
    </div>
  );
};

export default EditCampaign;
