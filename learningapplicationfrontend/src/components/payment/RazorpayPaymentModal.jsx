import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { API_V1_URL } from '../../services/api';

const RazorpayPaymentModal = ({ course, onClose, onSuccess }) => {
  const { user, showToast } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  let claimedCampaign = null;
  try {
    const raw = localStorage.getItem('claimedCampaign');
    if (raw) claimedCampaign = JSON.parse(raw);
  } catch (e) {}

  const discountPct = course?.discountPercentage || claimedCampaign?.discountPercentage || 0;
  const rawPriceUsd = course?.originalPrice || course?.price || 49.99;
  const priceUsd = discountPct > 0 ? Math.max(1, rawPriceUsd * (1 - discountPct / 100)) : rawPriceUsd;
  const priceInr = Math.round(priceUsd * 83);
  const rawPriceInr = Math.round(rawPriceUsd * 83);
  const savingsUsd = rawPriceUsd - priceUsd;

  const razorpayKeyId = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_mockkey123';

  // Load Official Razorpay JS SDK Checkout script dynamically
  useEffect(() => {
    if (window.Razorpay) {
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onerror = () => console.warn('Failed to load Razorpay official JS SDK script');
    document.body.appendChild(script);
  }, []);

  // If user is not logged in, block payment and prompt sign in
  if (!user) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '24px'
        }}
      >
        <div
          className="card"
          style={{
            maxWidth: '440px',
            width: '100%',
            borderRadius: '24px',
            padding: '32px',
            background: 'var(--bg-card)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            border: '1px solid var(--border-color)'
          }}
        >
          <div style={{ fontSize: '48px' }}>🔒</div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Authentication Required
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            You must be logged into your student account to enroll in <strong>{course?.title || 'this masterclass'}</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
            <a
              href={`/login?redirect=/courses/${course?.id}`}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontWeight: '700' }}
            >
              🔑 Sign In to Your Account
            </a>
            <a
              href={`/register?redirect=/courses/${course?.id}`}
              className="btn btn-secondary"
              style={{ width: '100%', padding: '12px', fontWeight: '700' }}
            >
              ✨ Create Free Account
            </a>
            <button
              onClick={onClose}
              className="btn btn-outline"
              style={{ width: '100%', padding: '10px', fontSize: '13px' }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Complete enrollment in backend
  const completeEnrollmentInBackend = async (orderId, paymentId, signature) => {
    const studentId = user?.id || '';
    const userEmail = user?.email || '';
    const token = localStorage.getItem('token');
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // Step 1: Verify payment in Spring Boot
    const verifyUrl = `${API_V1_URL}/payments/verify?razorpayOrderId=${orderId}&razorpayPaymentId=${paymentId}&signature=${signature}&courseId=${course?.id}&amount=${priceUsd.toFixed(2)}${studentId ? `&userId=${studentId}` : ''}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
    const verifyRes = await fetch(verifyUrl, { method: 'POST', headers: authHeaders });
    if (!verifyRes.ok) {
      throw new Error(`Server payment verification error: ${verifyRes.status}`);
    }

    // Step 2: Register student enrollment in PostgreSQL database
    const enrollUrl = `${API_V1_URL}/enrollments?courseId=${course?.id}${studentId ? `&studentId=${studentId}` : ''}${userEmail ? `&studentEmail=${encodeURIComponent(userEmail)}` : ''}`;
    const enrollRes = await fetch(enrollUrl, { method: 'POST', headers: authHeaders });
    if (!enrollRes.ok) {
      throw new Error(`Server enrollment creation error: ${enrollRes.status}`);
    }

    showToast(`🎉 Payment Verified! Enrolled ${userEmail} in ${course?.title}`, 'success');
    if (onSuccess) onSuccess();
  };

  // Launch Official Razorpay Popup Window with Cards, UPI QR, Netbanking
  const handleLaunchOfficialRazorpay = async () => {
    setLoading(true);
    showToast('💳 Launching official Razorpay Checkout...', 'info');

    try {
      const studentId = user?.id || '';
      const userEmail = user?.email || '';
      const token = localStorage.getItem('token');
      const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

      // Initiate Order in Spring Boot
      const initiateUrl = `${API_V1_URL}/payments/initiate?courseId=${course?.id}&amount=${priceUsd.toFixed(2)}${studentId ? `&userId=${studentId}` : ''}${userEmail ? `&userEmail=${encodeURIComponent(userEmail)}` : ''}`;
      const initiateRes = await fetch(initiateUrl, { method: 'POST', headers: authHeaders });
      let realOrderId = `rzp_order_${Date.now()}`;
      if (initiateRes.ok) {
        const initiateData = await initiateRes.json();
        if (initiateData?.data?.razorpayOrderId) {
          realOrderId = initiateData.data.razorpayOrderId;
        }
      }

      // Open Official Razorpay Checkout Popup Window
      if (window.Razorpay) {
        const options = {
          key: razorpayKeyId,
          amount: priceInr * 100, // Amount in paise
          currency: 'INR',
          name: "Gaurav's CDN Platform",
          description: course?.title || 'Course Access',
          image: '/serversidelog.jpg',
          prefill: {
            name: user?.fullName || userEmail.split('@')[0] || 'Student',
            email: userEmail || 'student@example.com',
            contact: '9999999999'
          },
          notes: {
            course_id: course?.id,
            user_email: userEmail,
            campaign_discount: `${discountPct}%`
          },
          theme: {
            color: '#4f46e5'
          },
          handler: async function (response) {
            try {
              setLoading(true);
              showToast('✅ Payment received by Razorpay! Verifying with backend...', 'info');
              await completeEnrollmentInBackend(
                response.razorpay_order_id || realOrderId,
                response.razorpay_payment_id || `pay_${Date.now()}`,
                response.razorpay_signature || `sig_${Date.now()}`
              );
            } catch (err) {
              showToast(`❌ Verification Error: ${err.message}`, 'error');
            } finally {
              setLoading(false);
            }
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              showToast('Payment window closed by user', 'info');
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          showToast(`❌ Payment Failed: ${resp.error.description}`, 'error');
          setLoading(false);
        });
        rzp.open();
      } else {
        throw new Error('Razorpay SDK not loaded. Please refresh the page.');
      }
    } catch (err) {
      console.error('Razorpay Error:', err);
      showToast(`❌ Payment Error: ${err.message}`, 'error');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        padding: '24px'
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '480px',
          width: '100%',
          borderRadius: '24px',
          padding: '28px',
          background: 'var(--bg-card)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          border: '1px solid var(--border-color)'
        }}
      >
        {/* Header Branding */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>⚡</span>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
                Official Razorpay Checkout
              </h3>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '700' }}>
                🔒 256-Bit SSL Official Window (Cards, UPI, Netbanking)
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            ✖
          </button>
        </div>

        {/* User Account Info */}
        <div style={{ fontSize: '13px', background: 'var(--primary-light)', padding: '10px 14px', borderRadius: '10px', color: 'var(--primary)', fontWeight: '700' }}>
          👤 Enrolling as: <span style={{ color: 'var(--text-primary)' }}>{user?.fullName || user?.email} ({user?.email})</span>
        </div>

        {/* Course Summary Box */}
        <div
          style={{
            background: 'var(--bg-secondary)',
            padding: '16px',
            borderRadius: '14px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700' }}>PURCHASING COURSE:</div>
          <div style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>
            {course?.title || 'System Architecture Masterclass'}
          </div>

          {discountPct > 0 && (
            <div style={{ fontSize: '12px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '6px 10px', borderRadius: '8px', fontWeight: '700' }}>
              🔥 Promo Applied: {course?.campaignName || claimedCampaign?.name || 'Active Offer'} ({discountPct}% OFF) — You save ${savingsUsd.toFixed(2)}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Instructor: Gaurav Kumar</span>
            <div style={{ textAlign: 'right' }}>
              {discountPct > 0 && (
                <div style={{ fontSize: '12px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                  ₹{rawPriceInr} (${rawPriceUsd.toFixed(2)})
                </div>
              )}
              <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--primary)' }}>
                ₹{priceInr} INR <span style={{ fontSize: '12px', opacity: 0.8 }}>(${priceUsd.toFixed(2)})</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleLaunchOfficialRazorpay}
            disabled={loading}
            className="btn btn-primary"
            style={{
              padding: '14px',
              fontSize: '15px',
              fontWeight: '800',
              background: 'linear-gradient(135deg, #072654 0%, #0052cc 100%)',
              color: '#ffffff',
              borderRadius: '12px'
            }}
          >
            {loading ? '🔄 Opening Official Razorpay Window...' : `🚀 Open Official Razorpay Window (Cards, UPI, Netbanking)`}
          </button>
        </div>

        <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.4 }}>
          Key ID: <code style={{ color: 'var(--primary)' }}>{razorpayKeyId}</code><br />
          Opens Razorpay's official checkout popup with Card Number, UPI QR, and Netbanking fields.
        </div>
      </div>
    </div>
  );
};

export default RazorpayPaymentModal;
