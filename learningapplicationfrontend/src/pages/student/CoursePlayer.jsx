import React, { useEffect, useContext } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL } from '../../services/api';

const CoursePlayer = () => {
  const { user, showToast } = useContext(AuthContext);

  useEffect(() => {
    if (!user?.id) {
      if (showToast) showToast('Please log in to view your courses', 'warning');
      window.location.href = '/login';
      return;
    }

    fetch(`${API_V1_URL}/enrollments/student/${user.id}`)
      .then((res) => res.json())
      .then((data) => {
        const enrollments = data?.data || [];
        if (enrollments.length > 0) {
          const firstCourseId = enrollments[0].courseId || enrollments[0].course?.id;
          window.location.href = `/courses/${firstCourseId}`;
        } else {
          alert("🔒 You have not purchased any course yet! Redirecting you to explore available courses...");
          window.location.href = '/courses';
        }
      })
      .catch(() => {
        alert("🔒 You have not purchased any course yet! Redirecting you to explore available courses...");
        window.location.href = '/courses';
      });
  }, [user, showToast]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="spinner" style={{ margin: '0 auto 16px auto' }} />
          <h3>Checking your course enrollments...</h3>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CoursePlayer;
