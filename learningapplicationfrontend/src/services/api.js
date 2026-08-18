export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';
export const API_V1_URL = `${API_BASE_URL}/api/v1`;
export const R2_CDN_URL = process.env.REACT_APP_R2_CDN_URL || 'https://pub-7bfd051a435d43a480e08281cb9a1b86.r2.dev';

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    ...getAuthHeaders(),
    ...options.headers
  };

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_V1_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || `HTTP error ${response.status}`);
  }
  return data;
};

export const fetchStudentProgress = async (courseId, userObj = null) => {
  const savedUser = userObj || getStoredUser();
  const studentId = savedUser?.id || 'current';
  const email = savedUser?.email || '';

  const endpoint = `/progress/student/${studentId}/course/${courseId}?email=${encodeURIComponent(email)}`;
  return apiFetch(endpoint);
};

export const toggleLessonProgress = async (courseId, lessonId, completed, userObj = null) => {
  const savedUser = userObj || getStoredUser();
  const studentId = savedUser?.id || 'current';
  const email = savedUser?.email || '';

  const endpoint = `/progress/toggle?studentId=${encodeURIComponent(studentId)}&courseId=${encodeURIComponent(
    courseId
  )}&lessonId=${encodeURIComponent(String(lessonId))}&completed=${completed}&email=${encodeURIComponent(email)}`;

  return apiFetch(endpoint, { method: 'POST' });
};
