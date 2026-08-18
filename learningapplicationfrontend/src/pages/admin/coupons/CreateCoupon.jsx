import React from 'react';
import Navbar from '../../../components/layout/Navbar';

const CreateCoupon = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <h1>Generate Promo Coupon Code</h1>
      </main>
    </div>
  );
};

export default CreateCoupon;
