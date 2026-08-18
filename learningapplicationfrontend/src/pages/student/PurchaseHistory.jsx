import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const PurchaseHistory = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <h1>Purchase History</h1>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#1e293b', borderRadius: '8px', overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#0f172a' }}>
              <th style={{ padding: '12px' }}>Date</th>
              <th style={{ padding: '12px' }}>Course</th>
              <th style={{ padding: '12px' }}>Amount</th>
              <th style={{ padding: '12px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '12px' }}>2026-08-16</td>
              <td style={{ padding: '12px' }}>High-Performance System Architecture</td>
              <td style={{ padding: '12px' }}>$99.99</td>
              <td style={{ padding: '12px', color: '#4ade80' }}>COMPLETED</td>
            </tr>
          </tbody>
        </table>
      </main>
      <Footer />
    </div>
  );
};

export default PurchaseHistory;
