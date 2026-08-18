import React from 'react';
import { formatPrice } from '../../utils/formatPrice';
import Button from '../common/Button';

const CourseDetails = ({ course }) => {
  if (!course) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h1>{course.title}</h1>
      <p style={{ color: '#94a3b8', fontSize: '18px' }}>{course.description}</p>
      <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{formatPrice(course.price)}</div>
      <Button onClick={() => alert('Enroll initiated!')}>Enroll Now</Button>
    </div>
  );
};

export default CourseDetails;
