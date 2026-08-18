import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

const ProtectedRoute = ({ children, requireRole }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    window.location.href = '/login';
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
