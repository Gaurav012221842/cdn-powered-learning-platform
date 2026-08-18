import React from 'react';

const CertificateModal = ({ courseTitle, studentName, completionDate, onClose }) => {
  const formattedDate = completionDate || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const certId = `CERT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3000,
        padding: '20px',
        overflowY: 'auto'
      }}
    >
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-certificate, #printable-certificate * {
              visibility: visible;
            }
            #printable-certificate {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              border: none !important;
              box-shadow: none !important;
            }
          }
        `}
      </style>

      <div
        style={{
          maxWidth: '850px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
      >
        {/* Action Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ffffff' }}>
          <div style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
            🏆 Official 100% Course Completion Certificate
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handlePrint}
              className="btn"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontWeight: '800',
                fontSize: '14px',
                padding: '10px 20px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              🖨️ Print / Save PDF Certificate
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#ffffff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* PRINTABLE CERTIFICATE FRAME */}
        <div
          id="printable-certificate"
          style={{
            background: '#ffffff',
            color: '#1e293b',
            borderRadius: '24px',
            padding: '48px 40px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            border: '12px solid #d97706',
            position: 'relative',
            fontFamily: "'Inter', sans-serif",
            textAlign: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Inner Gold Line Border */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              right: '12px',
              bottom: '12px',
              border: '2px solid #f59e0b',
              pointerEvents: 'none'
            }}
          />

          {/* Top Stamp Seal */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.4)'
              }}
            >
              🎓
            </div>
          </div>

          <div
            style={{
              fontSize: '12px',
              fontWeight: '800',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: '#d97706',
              marginBottom: '6px'
            }}
          >
            CDN-POWERED LEARNING PLATFORM
          </div>

          <h1
            style={{
              fontSize: '36px',
              fontWeight: '900',
              color: '#0f172a',
              margin: '0 0 16px 0',
              letterSpacing: '-0.5px'
            }}
          >
            CERTIFICATE OF COMPLETION
          </h1>

          <p style={{ fontSize: '15px', color: '#64748b', margin: '0 0 24px 0' }}>
            THIS IS PROUDLY PRESENTED TO
          </p>

          {/* Student Name */}
          <div
            style={{
              fontSize: '32px',
              fontWeight: '800',
              color: '#4f46e5',
              borderBottom: '2px solid #e2e8f0',
              display: 'inline-block',
              paddingBottom: '8px',
              marginBottom: '24px',
              minWidth: '300px'
            }}
          >
            {studentName || 'Gaurav Student'}
          </div>

          <p style={{ fontSize: '15px', color: '#64748b', maxWidth: '600px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
            for successfully mastering 100% of all lectures, interactive assessments, quizzes, and practical architecture labs in:
          </p>

          {/* Course Name */}
          <div
            style={{
              fontSize: '22px',
              fontWeight: '800',
              color: '#0f172a',
              background: '#f8fafc',
              padding: '12px 24px',
              borderRadius: '12px',
              display: 'inline-block',
              border: '1px solid #e2e8f0',
              marginBottom: '36px'
            }}
          >
            {courseTitle || 'High-Performance System Architecture'}
          </div>

          {/* Footer Signature & Date */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px', padding: '0 20px' }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>DATE ISSUED</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b' }}>{formattedDate}</div>
              <div style={{ fontSize: '11px', color: '#cbd5e1', marginTop: '4px' }}>ID: {certId}</div>
            </div>

            {/* Official Badge */}
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                border: '2px dashed #f59e0b',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
                fontWeight: '800',
                color: '#92400e'
              }}
            >
              <span style={{ fontSize: '18px' }}>🏅</span>
              100% PASS
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'serif', fontSize: '20px', fontStyle: 'italic', fontWeight: 'bold', color: '#4f46e5', marginBottom: '4px' }}>
                Gaurav Kumar
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600', borderTop: '1px solid #cbd5e1', paddingTop: '4px' }}>
                PLATFORM AUTHOR & INSTRUCTOR
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
