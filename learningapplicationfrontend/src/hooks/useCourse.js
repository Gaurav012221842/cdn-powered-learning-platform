import { useState, useEffect } from 'react';
import { courseService } from '../services/courseService';

export const useCourse = (courseId) => {
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) return;
    courseService.getCourseById(courseId)
      .then(res => setCourse(res.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [courseId]);

  return { course, loading, error };
};
