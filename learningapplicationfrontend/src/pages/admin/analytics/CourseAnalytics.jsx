import React from 'react';
import Navbar from '../../../components/layout/Navbar';

const CourseAnalytics = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <h1>Course Retention & Completion Rates</h1>
      </main>
    </div>
  );
};

export default CourseAnalytics;
