export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
export const API_V1_URL = `${API_BASE_URL}/api/v1`;
export const R2_CDN_URL = process.env.REACT_APP_R2_CDN_URL || 'https://pub-7bfd051a435d43a480e08281cb9a1b86.r2.dev';

export const isJwtExpired = (token) => {
  if (!token) return true;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
};

export const clearAuthSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('loginTimestamp');
};

export const getStoredUser = () => {
  try {
    const token = localStorage.getItem('token');
    const loginTime = localStorage.getItem('loginTimestamp');
    const MAX_SESSION_MS = 24 * 60 * 60 * 1000; // 24 Hours / 1 Day

    if (!token || isJwtExpired(token) || (loginTime && Date.now() - Number(loginTime) > MAX_SESSION_MS)) {
      clearAuthSession();
      return null;
    }

    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (token && isJwtExpired(token)) {
    clearAuthSession();
    return { 'Content-Type': 'application/json' };
  }
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

  if (response.status === 401) {
    clearAuthSession();
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register') && window.location.pathname !== '/') {
      window.location.href = '/login?expired=1';
    }
  }

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
