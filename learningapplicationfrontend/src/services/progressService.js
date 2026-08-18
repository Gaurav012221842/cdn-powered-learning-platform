import { apiFetch } from './api';

export const progressService = {
  getProgress: (studentId, courseId) => apiFetch(`/progress/student/${studentId}/course/${courseId}`),
  markCompleted: (studentId, courseId, lessonId) => apiFetch(`/progress/mark-completed?studentId=${studentId}&courseId=${courseId}&lessonId=${lessonId}`, { method: 'POST' }),
};
