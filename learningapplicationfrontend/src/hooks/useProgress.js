import { useState, useEffect } from 'react';
import { progressService } from '../services/progressService';

export const useProgress = (studentId, courseId) => {
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studentId || !courseId) return;
    progressService.getProgress(studentId, courseId)
      .then(res => setProgress(res.data))
      .finally(() => setLoading(false));
  }, [studentId, courseId]);

  return { progress, loading };
};
