import React from 'react';
import ProtectedRoute from '../components/auth/ProtectedRoute';
import Home from '../pages/public/Home';
import Courses from '../pages/public/Courses';
import CourseDetails from '../pages/public/CourseDetails';
import Login from '../pages/public/Login';
import Register from '../pages/public/Register';
import ForgotPassword from '../pages/public/ForgotPassword';
import ResetPassword from '../pages/public/ResetPassword';
import StudentDashboard from '../pages/student/Dashboard';
import MyCourses from '../pages/student/MyCourses';
import CoursePlayer from '../pages/student/CoursePlayer';
import Progress from '../pages/student/Progress';
import Certificates from '../pages/student/Certificates';
import Wishlist from '../pages/student/Wishlist';
import PurchaseHistory from '../pages/student/PurchaseHistory';
import AdminDashboard from '../pages/admin/Dashboard';
import MediaLibrary from '../pages/admin/media/MediaLibrary';
import UploadMedia from '../pages/admin/media/UploadMedia';
import CreateCourse from '../pages/admin/course/CreateCourse';
import AdminEnrollments from '../pages/admin/enrollment/AdminEnrollments';
import CampaignManagement from '../pages/admin/campaigns/CampaignManagement';
import CreateCampaign from '../pages/admin/campaigns/CreateCampaign';
import EditCampaign from '../pages/admin/campaigns/EditCampaign';

export const renderRoute = (path) => {
  const cleanPath = path ? path.split('?')[0] : '/';

  if (cleanPath.startsWith('/courses/') && cleanPath !== '/courses') {
    return <CourseDetails />;
  }

  switch (cleanPath) {
    case '/courses':
      return <Courses />;
    case '/login':
      return <Login />;
    case '/register':
      return <Register />;
    case '/forgot-password':
      return <ForgotPassword />;
    case '/reset-password':
      return <ResetPassword />;

    // Protected Student Routes
    case '/student/dashboard':
      return <ProtectedRoute><StudentDashboard /></ProtectedRoute>;
    case '/student/my-courses':
      return <ProtectedRoute><MyCourses /></ProtectedRoute>;
    case '/student/course-player':
      return <ProtectedRoute><CoursePlayer /></ProtectedRoute>;
    case '/student/progress':
      return <ProtectedRoute><Progress /></ProtectedRoute>;
    case '/student/certificates':
      return <ProtectedRoute><Certificates /></ProtectedRoute>;
    case '/student/wishlist':
      return <ProtectedRoute><Wishlist /></ProtectedRoute>;
    case '/student/purchase-history':
      return <ProtectedRoute><PurchaseHistory /></ProtectedRoute>;

    // Protected Admin Routes
    case '/admin':
    case '/admin/dashboard':
      return <ProtectedRoute requireRole="ADMIN"><AdminDashboard /></ProtectedRoute>;
    case '/admin/media':
      return <ProtectedRoute requireRole="ADMIN"><MediaLibrary /></ProtectedRoute>;
    case '/admin/media/upload':
    case '/admin/upload-media':
      return <ProtectedRoute requireRole="ADMIN"><UploadMedia /></ProtectedRoute>;
    case '/admin/course/create':
    case '/admin/courses/new':
      return <ProtectedRoute requireRole="ADMIN"><CreateCourse /></ProtectedRoute>;
    case '/admin/enrollments':
      return <ProtectedRoute requireRole="ADMIN"><AdminEnrollments /></ProtectedRoute>;
    case '/admin/campaigns':
      return <ProtectedRoute requireRole="ADMIN"><CampaignManagement /></ProtectedRoute>;
    case '/admin/campaigns/create':
    case '/admin/campaigns/new':
      return <ProtectedRoute requireRole="ADMIN"><CreateCampaign /></ProtectedRoute>;
    case '/admin/campaigns/edit':
      return <ProtectedRoute requireRole="ADMIN"><EditCampaign /></ProtectedRoute>;

    default:
      return <Home />;
  }
};
