import React from 'react';
import CourseCard from './CourseCard';

const CourseList = ({ courses = [] }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
      {courses.map((course, idx) => (
        <CourseCard key={course.id || idx} course={course} />
      ))}
    </div>
  );
};

export default CourseList;
