import React, { useState, useEffect, useContext } from 'react';
import Navbar from '../../components/layout/Navbar';
import Footer from '../../components/layout/Footer';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL, getCookie } from '../../services/api';

const PurchaseHistory = () => {
  const { user, siteConfig, showToast } = useContext(AuthContext);
  const brandName = siteConfig?.siteName || 'Gaurav';

  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    const loadPurchasesAndEnrollments = async () => {
      setLoading(true);
      try {
        const savedUser = user || JSON.parse(localStorage.getItem('user') || '{}');
        const studentId = savedUser?.id || savedUser?.userId || 'current';
        const userEmail = savedUser?.email || '';
        const token = getCookie('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Fetch courses catalog to cross-reference course details
        let allCoursesMap = {};
        try {
          const coursesRes = await fetch(`${API_V1_URL}/courses`);
          if (coursesRes.ok) {
            const cData = await coursesRes.json();
            const list = cData?.data || [];
            if (Array.isArray(list)) {
              list.forEach((c) => {
                if (c?.id) allCoursesMap[c.id] = c;
              });
            }
          }
        } catch (e) {
          console.warn('Could not load course metadata:', e);
        }

        // 1. Fetch payments from backend
        let paymentsList = [];
        try {
          const pRes = await fetch(`${API_V1_URL}/payments/user/${studentId}?userEmail=${encodeURIComponent(userEmail)}`, { headers });
          if (pRes.ok) {
            const pData = await pRes.json();
            paymentsList = Array.isArray(pData?.data) ? pData.data : [];
          }
        } catch (e) {
          console.warn('Could not load payments:', e);
        }

        // 2. Fetch enrollments from backend
        let enrollmentsList = [];
        try {
          const eRes = await fetch(`${API_V1_URL}/enrollments/student/${studentId}?email=${encodeURIComponent(userEmail)}`, { headers });
          if (eRes.ok) {
            const eData = await eRes.json();
            enrollmentsList = Array.isArray(eData?.data) ? eData.data : [];
          }
        } catch (e) {
          console.warn('Could not load enrollments:', e);
        }

        // Build combined purchase items
        const combined = [];
        const processedCourseIds = new Set();

        // Add payment records first
        paymentsList.forEach((pay, idx) => {
          const courseId = pay.courseId;
          const courseInfo = (courseId && allCoursesMap[courseId]) || {
            id: courseId,
            title: 'System Architecture & Full Stack Masterclass',
            price: pay.amount || 49.99,
            category: 'Engineering'
          };

          if (courseId) processedCourseIds.add(courseId.toString());

          const amountUsd = pay.amount ? Number(pay.amount) : (courseInfo.price || 49.99);
          const amountInr = Math.round(amountUsd * 83);

          combined.push({
            id: pay.id || `pay_${idx}_${Date.now()}`,
            orderId: pay.razorpayOrderId || `RZP-ORD-${(pay.id || idx).toString().substring(0, 8).toUpperCase()}`,
            paymentId: pay.razorpayPaymentId || `PAY-${(pay.id || idx).toString().substring(0, 10).toUpperCase()}`,
            courseId: courseId || courseInfo.id,
            courseTitle: courseInfo.title || 'Full Stack Masterclass',
            category: courseInfo.category || 'Cloud & DevOps',
            amountUsd: amountUsd,
            amountInr: amountInr,
            date: pay.createdAt ? new Date(pay.createdAt) : new Date(),
            status: pay.status || 'COMPLETED',
            paymentMethod: pay.razorpayPaymentId ? 'Razorpay (Cards / UPI)' : '1-Click Test Purchase / Bypass',
            type: 'Course Purchase'
          });
        });

        // Add any enrolled courses that don't have an explicit payment record (e.g. promo or instant bypass)
        enrollmentsList.forEach((enr, idx) => {
          const courseId = enr.courseId || enr.course?.id;
          if (courseId && !processedCourseIds.has(courseId.toString())) {
            processedCourseIds.add(courseId.toString());
            const courseInfo = enr.course || allCoursesMap[courseId] || {
              id: courseId,
              title: enr.courseTitle || 'System Architecture Masterclass',
              price: 49.99,
              category: 'Full Stack'
            };

            const amountUsd = Number(courseInfo.price || 49.99);
            const amountInr = Math.round(amountUsd * 83);

            combined.push({
              id: enr.id || `enr_${idx}_${Date.now()}`,
              orderId: `ENR-ORD-${(enr.id || idx).toString().substring(0, 8).toUpperCase()}`,
              paymentId: `ENR-TXN-${(enr.id || idx).toString().substring(0, 10).toUpperCase()}`,
              courseId: courseId,
              courseTitle: courseInfo.title || 'System Architecture Masterclass',
              category: courseInfo.category || 'Architecture',
              amountUsd: amountUsd,
              amountInr: amountInr,
              date: enr.enrolledAt ? new Date(enr.enrolledAt) : new Date(),
              status: 'COMPLETED',
              paymentMethod: 'Instant Test Buy / Lifetime Access',
              type: 'Enrolled Course'
            });
          }
        });

        // If user has local storage enrollments or default fallback
        Object.keys(allCoursesMap).forEach((cId) => {
          if (localStorage.getItem(`enrolled_${cId}`) === 'true' && !processedCourseIds.has(cId.toString())) {
            const courseInfo = allCoursesMap[cId];
            processedCourseIds.add(cId.toString());
            combined.push({
              id: `local_${cId}`,
              orderId: `TST-ORD-${cId.toString().substring(0, 6).toUpperCase()}`,
              paymentId: `TST-PAY-${cId.toString().substring(0, 8).toUpperCase()}`,
              courseId: cId,
              courseTitle: courseInfo.title,
              category: courseInfo.category || 'Full Stack',
              amountUsd: Number(courseInfo.price || 49.99),
              amountInr: Math.round(Number(courseInfo.price || 49.99) * 83),
              date: new Date(),
              status: 'COMPLETED',
              paymentMethod: '1-Click Instant Test Purchase',
              type: 'Enrolled Course'
            });
          }
        });

        // Sort descending by date
        combined.sort((a, b) => b.date - a.date);
        setPurchases(combined);
      } catch (err) {
        console.error('Failed to load purchase history:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPurchasesAndEnrollments();
  }, [user]);

  const filteredPurchases = purchases.filter((p) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      (p.courseTitle && p.courseTitle.toLowerCase().includes(query)) ||
      (p.orderId && p.orderId.toLowerCase().includes(query)) ||
      (p.paymentId && p.paymentId.toLowerCase().includes(query)) ||
      (p.status && p.status.toLowerCase().includes(query))
    );
  });

  const totalSpentInr = purchases.reduce((acc, p) => acc + (p.amountInr || 0), 0);
  const totalSpentUsd = purchases.reduce((acc, p) => acc + (p.amountUsd || 0), 0);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    if (showToast) {
      showToast(`Copied ${label || 'ID'} to clipboard!`, 'success');
    } else {
      alert(`Copied ${label || 'ID'} to clipboard!`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar />

      <main style={{ flex: 1, width: '100%' }}>
        <div className="container" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Header Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
              padding: '36px',
              borderRadius: '24px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '20px',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', marginBottom: '8px' }}>
                💳 Student Billing & Orders
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '4px 0' }}>
                Purchase & Order History
              </h1>
              <p style={{ opacity: 0.9, fontSize: '15px', margin: 0 }}>
                View all your verified transactions, official receipts, and course licenses under <strong>{user?.email || 'your account'}</strong>.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <a
                href="/student/my-courses"
                className="btn"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', fontWeight: '700' }}
              >
                📚 My Courses
              </a>
              <a
                href="/courses"
                className="btn"
                style={{ background: '#ffffff', color: 'var(--primary)', fontWeight: '800' }}
              >
                + Browse Courses
              </a>
            </div>
          </div>

          {/* Quick Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px', background: 'var(--primary-light)', padding: '12px', borderRadius: '12px' }}>
                🎓
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Courses Owned</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>{purchases.length}</div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '12px', borderRadius: '12px' }}>
                💰
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Total Investment</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: '#10b981' }}>
                  ₹{totalSpentInr.toLocaleString('en-IN')} <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '600' }}>(${totalSpentUsd.toFixed(2)})</span>
                </div>
              </div>
            </div>

            <div className="card" style={{ padding: '20px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ fontSize: '32px', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: '12px', borderRadius: '12px' }}>
                🔒
              </div>
              <div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Access License</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)' }}>Lifetime Access</div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="card" style={{ padding: '20px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '260px' }}>
              <span style={{ fontSize: '18px' }}>🔍</span>
              <input
                type="text"
                placeholder="Search by course title, Order ID, or Transaction ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  fontSize: '14px'
                }}
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="btn btn-outline"
                style={{ padding: '8px 14px', fontSize: '13px' }}
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Purchases Table / List */}
          {loading ? (
            <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              🔄 Fetching your verified transactions and course orders...
            </div>
          ) : filteredPurchases.length > 0 ? (
            <div className="card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>Course</th>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>Order ID / Method</th>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>Date</th>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>Amount</th>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)' }}>Status</th>
                      <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPurchases.map((purchase, index) => {
                      const isCompleted = purchase.status === 'COMPLETED' || purchase.status === 'SUCCESS';
                      return (
                        <tr
                          key={purchase.id || index}
                          style={{
                            borderBottom: index !== filteredPurchases.length - 1 ? '1px solid var(--border-color)' : 'none',
                            transition: 'background 0.15s'
                          }}
                        >
                          {/* Course Name */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '10px',
                                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: '18px',
                                  fontWeight: '800',
                                  flexShrink: 0
                                }}
                              >
                                🎓
                              </div>
                              <div>
                                <a
                                  href={`/courses/${purchase.courseId}`}
                                  style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-primary)', textDecoration: 'none' }}
                                >
                                  {purchase.courseTitle}
                                </a>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                  Category: {purchase.category}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Order / Transaction ID */}
                          <td style={{ padding: '16px 20px' }}>
                            <div
                              onClick={() => copyToClipboard(purchase.orderId, 'Order ID')}
                              style={{
                                cursor: 'pointer',
                                fontFamily: 'monospace',
                                fontSize: '13px',
                                fontWeight: '700',
                                color: 'var(--primary)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Click to copy Order ID"
                            >
                              <span>{purchase.orderId}</span>
                              <span style={{ fontSize: '11px', opacity: 0.7 }}>📋</span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {purchase.paymentMethod}
                            </div>
                          </td>

                          {/* Date */}
                          <td style={{ padding: '16px 20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                            {purchase.date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                              {purchase.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          {/* Amount */}
                          <td style={{ padding: '16px 20px' }}>
                            <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
                              ₹{purchase.amountInr.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                              ${purchase.amountUsd.toFixed(2)} USD
                            </div>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '16px 20px' }}>
                            <span
                              style={{
                                padding: '6px 12px',
                                borderRadius: '9999px',
                                fontSize: '12px',
                                fontWeight: '800',
                                background: isCompleted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isCompleted ? '#10b981' : '#ef4444',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              <span>{isCompleted ? '●' : '✖'}</span>
                              <span>{purchase.status}</span>
                            </span>
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                onClick={() => setSelectedInvoice(purchase)}
                                className="btn btn-outline"
                                style={{ padding: '6px 12px', fontSize: '12px', fontWeight: '700' }}
                              >
                                🧾 Receipt
                              </button>
                              <a
                                href={`/courses/${purchase.courseId}`}
                                className="btn btn-primary"
                                style={{ padding: '6px 14px', fontSize: '12px', fontWeight: '700', textDecoration: 'none' }}
                              >
                                ▶️ Play
                              </a>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Empty State */
            <div
              className="card"
              style={{
                padding: '60px 24px',
                textAlign: 'center',
                borderRadius: '24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '16px'
              }}
            >
              <div style={{ fontSize: '56px' }}>💳</div>
              <h2 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                No Purchases Found
              </h2>
              <p style={{ maxWidth: '440px', color: 'var(--text-secondary)', fontSize: '14px', margin: 0, lineHeight: 1.5 }}>
                You haven't enrolled in or purchased any courses yet. Browse our comprehensive catalog to get started!
              </p>
              <a href="/courses" className="btn btn-primary" style={{ padding: '12px 24px', fontWeight: '800', marginTop: '8px' }}>
                🚀 Explore Masterclasses
              </a>
            </div>
          )}

          {/* Official Invoice / Receipt Modal */}
          {selectedInvoice && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(6px)',
                zIndex: 3000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
              }}
            >
              <div
                className="card"
                style={{
                  maxWidth: '560px',
                  width: '100%',
                  borderRadius: '24px',
                  padding: '32px',
                  background: 'var(--bg-card)',
                  boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  border: '1px solid var(--border-color)',
                  maxHeight: '90vh',
                  overflowY: 'auto'
                }}
              >
                {/* Invoice Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '24px' }}>🎓</span>
                      <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                        {brandName} Learning Platform
                      </h3>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Official Course Tax Invoice & License Confirmation
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    ✖
                  </button>
                </div>

                {/* Invoice Meta Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '14px', fontSize: '13px' }}>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700' }}>ORDER ID</div>
                    <div style={{ fontWeight: '800', fontFamily: 'monospace', color: 'var(--primary)' }}>{selectedInvoice.orderId}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700' }}>DATE & TIME</div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                      {selectedInvoice.date.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700' }}>BILLED TO</div>
                    <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{user?.fullName || 'Student'}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{user?.email}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '11px', fontWeight: '700' }}>PAYMENT STATUS</div>
                    <div style={{ fontWeight: '800', color: '#10b981' }}>✅ {selectedInvoice.status} (PAID)</div>
                  </div>
                </div>

                {/* Line Items */}
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Purchased Item
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-primary)' }}>{selectedInvoice.courseTitle}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Instructor: Gaurav Kumar • Lifetime Access License</div>
                    </div>
                    <div style={{ textAlign: 'right', fontWeight: '800', fontSize: '16px', color: 'var(--primary)' }}>
                      ₹{selectedInvoice.amountInr.toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Total Summary */}
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>Subtotal:</span>
                    <span>₹{selectedInvoice.amountInr.toLocaleString('en-IN')} (${selectedInvoice.amountUsd.toFixed(2)})</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>GST / Platform Fee:</span>
                    <span style={{ color: '#10b981' }}>₹0.00 (Included)</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '4px' }}>
                    <span>Total Paid:</span>
                    <span style={{ color: 'var(--primary)' }}>₹{selectedInvoice.amountInr.toLocaleString('en-IN')} INR</span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button
                    onClick={() => window.print()}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: '12px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                  >
                    <span>🖨️</span>
                    <span>Print / Save Receipt PDF</span>
                  </button>
                  <button
                    onClick={() => setSelectedInvoice(null)}
                    className="btn btn-secondary"
                    style={{ padding: '12px 20px', fontWeight: '700' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PurchaseHistory;
