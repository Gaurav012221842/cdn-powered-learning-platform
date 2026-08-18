import React from 'react';
import Navbar from '../../../components/layout/Navbar';
import Button from '../../../components/common/Button';

const CourseManagement = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1>Course Management</h1>
          <Button onClick={() => window.location.href = '/admin/courses/create'}>Create New Course</Button>
        </div>
        <div className="card">
          <p>List of all catalog courses with publish/draft toggles.</p>
        </div>
      </main>
    </div>
  );
};

export default CourseManagement;
