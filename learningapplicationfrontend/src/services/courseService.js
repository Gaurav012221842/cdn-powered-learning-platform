import { apiFetch } from './api';

export const courseService = {
  getAllCourses: () => apiFetch('/courses'),
  getCourseById: (id) => apiFetch(`/courses/${id}`),
  createCourse: (courseData) => apiFetch('/courses', { method: 'POST', body: JSON.stringify(courseData) }),
  updateCourse: (id, courseData) => apiFetch(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(courseData) }),
};
