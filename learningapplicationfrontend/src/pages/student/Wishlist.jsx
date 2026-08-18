import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';

const Wishlist = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <h1>My Wishlist</h1>
        <p style={{ color: '#94a3b8' }}>Your saved courses will appear here.</p>
      </main>
      <Footer />
    </div>
  );
};

export default Wishlist;
