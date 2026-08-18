import React from 'react';
import Navbar from '../../../components/layout/Navbar';

const AnalyticsDashboard = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <h1>Platform Analytics Overview</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '24px' }}>
          <div className="card">
            <h3>Monthly Active Users</h3>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#06b6d4' }}>4,250</span>
          </div>
          <div className="card">
            <h3>Total Revenue</h3>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#4ade80' }}>$48,920</span>
          </div>
          <div className="card">
            <h3>Video Bandwidth (CDN)</h3>
            <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#a855f7' }}>12.8 TB</span>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AnalyticsDashboard;
