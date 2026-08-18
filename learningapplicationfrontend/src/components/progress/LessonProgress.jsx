import React from 'react';
import ProgressBar from './ProgressBar';

const LessonProgress = ({ completedLessons = 5, totalLessons = 10 }) => {
  const percentage = Math.round((completedLessons / totalLessons) * 100);

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span>Course Progress</span>
        <span>{percentage}%</span>
      </div>
      <ProgressBar percentage={percentage} />
      <span style={{ fontSize: '12px', color: '#94a3b8' }}>{completedLessons} of {totalLessons} lessons completed</span>
    </div>
  );
};

export default LessonProgress;
