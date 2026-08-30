import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { isJwtExpired, clearAuthSession } from '../../services/api';

const ProtectedRoute = ({ children, requireRole }) => {
  const { user } = useContext(AuthContext);
  const token = localStorage.getItem('token');
  const loginTime = localStorage.getItem('loginTimestamp');
  const MAX_SESSION_MS = 24 * 60 * 60 * 1000; // 24 Hours / 1 Day

  const isExpired = !token || isJwtExpired(token) || (loginTime && Date.now() - Number(loginTime) > MAX_SESSION_MS);

  if (!user || isExpired) {
    clearAuthSession();
    window.location.href = '/login?expired=1';
    return null;
  }

  if (requireRole && user.role !== requireRole) {
    // Redirect students attempting to access admin routes to student dashboard, and vice versa
    window.location.href = user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard';
    return null;
  }

  return children;
};

export default ProtectedRoute;
