import React from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import LessonProgress from '../../components/progress/LessonProgress';

const Progress = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ padding: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <h1>Detailed Learning Progress</h1>
        <LessonProgress completedLessons={7} totalLessons={10} />
      </main>
      <Footer />
    </div>
  );
};

export default Progress;
