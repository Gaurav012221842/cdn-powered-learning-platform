import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import Button from '../../components/common/Button';

const Certificates = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <h1>Earned Certificates</h1>
        <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3>High-Performance System Architecture</h3>
            <p style={{ color: '#94a3b8', margin: 0 }}>Certificate Code: CERT-88A9F201</p>
          </div>
          <Button onClick={() => alert('Downloading PDF Certificate...')}>Download PDF</Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Certificates;
