import React from 'react';

const LessonList = ({ lessons = [], onSelectLesson }) => {
  return (
    <div className="card">
      <h3>Course Lessons</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {lessons.map((lesson, idx) => (
          <li key={lesson.id || idx} onClick={() => onSelectLesson && onSelectLesson(lesson)} style={{ padding: '12px', background: '#0f172a', borderRadius: '6px', cursor: 'pointer' }}>
            {idx + 1}. {lesson.title}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LessonList;
