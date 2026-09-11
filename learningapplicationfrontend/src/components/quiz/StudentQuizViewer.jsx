import React, { useState, useEffect, useRef, useCallback } from 'react';
import { API_V1_URL, getCookie } from '../../services/api';

const MAX_VIOLATION_STRIKES = 3;

const StudentQuizViewer = ({ quizData, courseId, lessonId, onComplete }) => {
  // Quiz Stages: 'IDLE' (Security Briefing) | 'ACTIVE' (Proctored Fullscreen Exam) | 'SUBMITTED' (Results Review)
  const [quizState, setQuizState] = useState('IDLE');
  const [quizAnswers, setQuizAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Security Proctoring States
  const [violations, setViolations] = useState([]);
  const [strikes, setStrikes] = useState(0);
  const [activeViolationModal, setActiveViolationModal] = useState(null);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [securityNotice, setSecurityNotice] = useState(null);

  const containerRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const strikesRef = useRef(0);
  const quizAnswersRef = useRef({});
  const endTimeRef = useRef(null);
  const executeSubmissionRef = useRef(null);

  // Keep refs synchronized with state for event listeners
  useEffect(() => {
    strikesRef.current = strikes;
  }, [strikes]);

  useEffect(() => {
    quizAnswersRef.current = quizAnswers;
  }, [quizAnswers]);

  // Safely parse quiz data
  const parseQuizObj = () => {
    try {
      if (!quizData) return null;
      if (typeof quizData === 'object') return quizData;
      return JSON.parse(quizData);
    } catch (e) {
      return null;
    }
  };

  const quizObj = parseQuizObj();

  const totalQuestions = quizObj?.questions?.length || 0;
  const passingScore = quizObj?.passingScore || 70;
  const answeredCount = Object.keys(quizAnswers).length;

  // Compute allocated time: default 90 seconds per question or minimum 3 minutes
  const allocatedSeconds = quizObj?.timeLimitMinutes
    ? quizObj.timeLimitMinutes * 60
    : Math.max(180, totalQuestions * 90);

  // Fullscreen Helper targeting the dedicated exam container
  const enterFullscreen = async () => {
    try {
      const elem = containerRef.current || document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (err) {
      console.warn('Fullscreen request bypassed or denied:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
      }
      setIsFullscreen(false);
    } catch (err) {
      console.warn('Exit fullscreen error:', err);
    }
  };

  // Submit Handler (Can be triggered manually or automatically upon strike limit / timer expiration)
  const executeSubmission = useCallback(async (isDisqualified = false, disqualificationReason = '') => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    setActiveViolationModal(null);
    setShowExitConfirmModal(false);

    const currentAnswers = quizAnswersRef.current;
    const currentStrikes = strikesRef.current;

    // Exit fullscreen cleanly on submit
    await exitFullscreen();

    if (courseId) {
      try {
        const token = getCookie('token');
        const res = await fetch(`${API_V1_URL}/courses/${courseId}/quiz/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            lessonId: lessonId || undefined,
            answers: currentAnswers,
            strikes: currentStrikes,
            isDisqualified
          })
        });

        const data = await res.json();
        if (res.ok && data?.data) {
          const evalData = data.data;
          const isPassed = !isDisqualified && Boolean(
            evalData.isPassed !== undefined
              ? evalData.isPassed
              : evalData.passed !== undefined
              ? evalData.passed
              : evalData.scorePercentage >= (evalData.passingScore || passingScore)
          );

          const resultObj = {
            score: evalData.correctCount || 0,
            total: evalData.totalQuestions || totalQuestions,
            pct: evalData.scorePercentage || 0,
            isPassed: isPassed,
            passingScore: evalData.passingScore || passingScore,
            results: evalData.results,
            isDisqualified,
            disqualificationReason,
            recordedStrikes: currentStrikes
          };

          setQuizResult(resultObj);
          setQuizState('SUBMITTED');
          setIsSubmitting(false);

          if (onComplete) {
            onComplete(isPassed, evalData.scorePercentage || 0, evalData.correctCount || 0, evalData.totalQuestions || totalQuestions);
          }
          return;
        }
      } catch (err) {
        console.warn('Backend quiz evaluation failed, using client fallback:', err);
      }
    }

    // Client fallback evaluation
    let score = 0;
    const results = (quizObj?.questions || []).map((q, idx) => {
      const selected = currentAnswers[idx];
      const correctIdx = q.correctIndex !== undefined ? q.correctIndex : 0;
      const isCorrect = selected === correctIdx;
      if (isCorrect) score++;
      return {
        questionIndex: idx,
        question: q.question,
        options: q.options,
        selectedOption: selected,
        correctIndex: correctIdx,
        isCorrect,
        explanation: q.explanation || ''
      };
    });

    const pct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const isPassed = !isDisqualified && pct >= passingScore;

    const resultObj = {
      score,
      total: totalQuestions,
      pct,
      isPassed,
      passingScore,
      results,
      isDisqualified,
      disqualificationReason,
      recordedStrikes: currentStrikes
    };

    setQuizResult(resultObj);
    setQuizState('SUBMITTED');
    setIsSubmitting(false);

    if (onComplete) {
      onComplete(isPassed, pct, score, totalQuestions);
    }
  }, [courseId, lessonId, passingScore, totalQuestions, quizObj]);

  // Keep executeSubmissionRef synced
  useEffect(() => {
    executeSubmissionRef.current = executeSubmission;
  }, [executeSubmission]);

  // Record a security violation (Tab switch, window blur, or exit fullscreen)
  const registerViolation = useCallback((type, description) => {
    if (quizState !== 'ACTIVE' || isSubmittingRef.current) return;

    const newStrikeCount = strikesRef.current + 1;
    setStrikes(newStrikeCount);
    strikesRef.current = newStrikeCount;

    const incident = {
      id: Date.now(),
      type,
      description,
      time: new Date().toLocaleTimeString(),
      strikeNumber: newStrikeCount
    };

    setViolations((prev) => [...prev, incident]);

    if (newStrikeCount >= MAX_VIOLATION_STRIKES) {
      // 🚨 Auto-lock and auto-submit upon reaching strike limit
      setActiveViolationModal({
        type: 'LOCKOUT',
        strike: newStrikeCount,
        title: '🚨 Max Security Violations Exceeded',
        message: `You have triggered ${newStrikeCount} security violations (Tab Switching / Window Focus Loss). As per anti-cheating policy, your exam has been auto-submitted.`
      });
      setTimeout(() => {
        executeSubmission(true, `Exceeded maximum allowed security violations (${newStrikeCount} strikes)`);
      }, 3000);
    } else {
      // ⚠️ Show warning modal
      setActiveViolationModal({
        type: 'WARNING',
        strike: newStrikeCount,
        title: `⚠️ Security Violation Recorded (Strike ${newStrikeCount} of ${MAX_VIOLATION_STRIKES})`,
        message: `Tab switching, minimizing the browser, or leaving full-screen is strictly forbidden. Please stay on this screen to maintain honest exam integrity.`
      });
    }
  }, [quizState, executeSubmission]);

  // Listeners for Proctored Anti-Cheat System
  useEffect(() => {
    if (quizState !== 'ACTIVE') return;

    // Check initial fullscreen state
    const checkFullscreen = () => {
      const inFull = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(inFull);
      return inFull;
    };
    checkFullscreen();

    // 1. Tab Switch / Window Minimize Detection
    const handleVisibilityChange = () => {
      if (document.hidden && !isSubmittingRef.current) {
        registerViolation('TAB_SWITCH', 'Switched browser tab or minimized window');
      }
    };

    // 2. Window Blur (Focus Loss) Detection
    const handleWindowBlur = () => {
      if (!isSubmittingRef.current) {
        registerViolation('WINDOW_BLUR', 'Focus moved away from exam browser');
      }
    };

    // 3. Fullscreen Exit Detection
    const handleFullscreenChange = () => {
      const inFull = checkFullscreen();
      if (!inFull && !isSubmittingRef.current) {
        registerViolation('FULLSCREEN_EXIT', 'Exited secure full-screen examination mode');
      }
    };

    // 4. Keyboard Shortcuts Blocker (F12, DevTools, Copy, Paste, PrintScreen, etc.)
    const handleKeyDown = (e) => {
      // F12 or Ctrl+Shift+I / Cmd+Opt+I (DevTools)
      if (
        e.key === 'F12' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'u' || e.key === 'U')) ||
        ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P'))
      ) {
        e.preventDefault();
        setSecurityNotice('🔒 Developer tools and printing are disabled during secure examination.');
        setTimeout(() => setSecurityNotice(null), 3500);
        return false;
      }

      // Block Copy / Paste shortcuts
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C' || e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        setSecurityNotice('🔒 Copying and pasting are disabled to ensure test authenticity.');
        setTimeout(() => setSecurityNotice(null), 3500);
        return false;
      }
    };

    // 5. Right Click Context Menu Blocker
    const handleContextMenu = (e) => {
      e.preventDefault();
      setSecurityNotice('🔒 Right-click context menu is locked during examination.');
      setTimeout(() => setSecurityNotice(null), 3500);
      return false;
    };

    // 6. Selection / Copy Blocker
    const handleCopyCut = (e) => {
      e.preventDefault();
      setSecurityNotice('🔒 Question copying is disabled.');
      setTimeout(() => setSecurityNotice(null), 3500);
      return false;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyCut);
    document.addEventListener('cut', handleCopyCut);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyCut);
      document.removeEventListener('cut', handleCopyCut);
    };
  }, [quizState, registerViolation]);

  // Live Countdown Exam Timer with drift-proof timestamp tracking
  useEffect(() => {
    if (quizState !== 'ACTIVE') return;

    const updateTimer = () => {
      if (!endTimeRef.current) return;
      const now = Date.now();
      const remaining = Math.max(0, Math.ceil((endTimeRef.current - now) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        if (executeSubmissionRef.current) {
          executeSubmissionRef.current(false, 'Time expired');
        }
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [quizState]);

  // Format Timer Display
  const formatTime = (seconds) => {
    if (seconds == null) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartExam = async () => {
    // 1. Immediately request fullscreen synchronously on direct user gesture
    await enterFullscreen();

    setViolations([]);
    setStrikes(0);
    strikesRef.current = 0;
    setQuizAnswers({});
    quizAnswersRef.current = {};
    setQuizResult(null);
    setSubmitError(null);
    setActiveViolationModal(null);
    setShowExitConfirmModal(false);
    endTimeRef.current = Date.now() + allocatedSeconds * 1000;
    setTimeRemaining(allocatedSeconds);
    setQuizState('ACTIVE');
  };

  const handleExitQuiz = async () => {
    await exitFullscreen();
    setQuizState('IDLE');
    setQuizAnswers({});
    quizAnswersRef.current = {};
    setQuizResult(null);
    setSubmitError(null);
    setViolations([]);
    setStrikes(0);
    strikesRef.current = 0;
    setShowExitConfirmModal(false);
    setActiveViolationModal(null);
  };

  const handleOptionSelect = (qIdx, oIdx) => {
    if (quizState !== 'ACTIVE' || isSubmitting) return;
    setQuizAnswers((prev) => {
      const updated = { ...prev, [qIdx]: oIdx };
      quizAnswersRef.current = updated;
      return updated;
    });
  };

  const handleManualSubmit = () => {
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `⚠️ You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to finalize and submit?`
      );
      if (!confirmSubmit) return;
    }
    executeSubmission(false);
  };

  const handleRetakeExam = () => {
    setQuizState('IDLE');
    setQuizAnswers({});
    quizAnswersRef.current = {};
    setQuizResult(null);
    setSubmitError(null);
    setViolations([]);
    setStrikes(0);
    strikesRef.current = 0;
    setShowExitConfirmModal(false);
  };

  const handleResumeAfterWarning = async () => {
    setActiveViolationModal(null);
    await enterFullscreen();
  };

  if (!quizObj || !Array.isArray(quizObj.questions) || quizObj.questions.length === 0) {
    return (
      <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color, #334155)', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
        <p style={{ margin: 0 }}>📝 No quiz questions found for this lesson.</p>
      </div>
    );
  }

  // =========================================================================
  // 1. PRE-EXAM ONBOARDING & PROCTORING SECURITY BRIEFING SCREEN
  // =========================================================================
  if (quizState === 'IDLE') {
    return (
      <div
        className="card"
        style={{
          padding: '36px 32px',
          borderRadius: '24px',
          border: '1px solid var(--border-color, #334155)',
          background: 'linear-gradient(180deg, var(--bg-card, #0f172a) 0%, var(--bg-secondary, #1e293b) 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', borderBottom: '1px solid var(--border-color, #334155)', paddingBottom: '20px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 8px 16px rgba(99, 102, 241, 0.35)'
            }}
          >
            🛡️
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '4px 8px', borderRadius: '6px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                🔒 Proctored Exam Environment
              </span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)', margin: '4px 0 0 0' }}>
              {quizObj.title || 'Knowledge Assessment & Certification Quiz'}
            </h3>
          </div>
        </div>

        {/* Exam Specifications Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontWeight: '600' }}>📋 Total Questions</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)' }}>{totalQuestions} Questions</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontWeight: '600' }}>🎯 Passing Grade</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#10b981' }}>{passingScore}% Score</span>
          </div>

          <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted, #94a3b8)', fontWeight: '600' }}>⏱️ Allocated Time</span>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#fbbf24' }}>{Math.round(allocatedSeconds / 60)} Minutes</span>
          </div>
        </div>

        {/* Security & Anti-Cheating Protocol Notice */}
        <div
          style={{
            padding: '20px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f87171', fontWeight: '800', fontSize: '14px' }}>
            <span>⚠️</span>
            <span>MANDATORY EXAMINATION SECURITY RULES & INTEGRITY CHECKS:</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary, #cbd5e1)', lineHeight: 1.7 }}>
            <li><strong>🖥️ Mandatory Fullscreen Mode:</strong> The quiz automatically launches in Fullscreen. Exiting full-screen triggers an immediate security alert.</li>
            <li><strong>🚫 No Tab Switching / Window Loss:</strong> Switching to other browser tabs, minimizing the window, or focusing other apps is actively recorded.</li>
            <li><strong>⚠️ 3 Strikes Policy:</strong> Accumulating 3 security strikes will automatically lock and disqualify the examination.</li>
            <li><strong>🔒 Copy-Paste & Right-Click Locked:</strong> Context menus, developer tools, and clipboard operations are strictly disabled.</li>
          </ul>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', paddingTop: '10px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>
            💡 Ensure a stable connection and close background tabs before starting.
          </div>

          <button
            onClick={handleStartExam}
            className="btn btn-primary"
            style={{
              padding: '16px 36px',
              fontSize: '16px',
              fontWeight: '800',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              border: 'none'
            }}
          >
            <span>🛡️</span>
            <span>Start Secure Exam in Fullscreen</span>
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. POST-SUBMISSION RESULTS & INTEGRITY REPORT SCREEN
  // =========================================================================
  if (quizState === 'SUBMITTED' && quizResult) {
    const isPassed = quizResult.isPassed;
    const isDisqualified = quizResult.isDisqualified;
    const integrityScore = Math.max(0, 100 - (quizResult.recordedStrikes || 0) * 33);

    return (
      <div
        className="card"
        style={{
          padding: '32px',
          borderRadius: '24px',
          border: isPassed ? '2px solid rgba(16, 185, 129, 0.5)' : '2px solid rgba(239, 68, 68, 0.5)',
          background: 'var(--bg-card, #0f172a)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
        }}
      >
        {/* Score & Integrity Banner */}
        <div
          style={{
            padding: '24px',
            borderRadius: '18px',
            background: isPassed ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.1) 100%)' : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.1) 100%)',
            border: isPassed ? '1px solid #10b981' : '1px solid #ef4444',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '48px' }}>
              {isDisqualified ? '🚨' : isPassed ? '🎉' : '⚠️'}
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.08em', color: isPassed ? '#10b981' : '#ef4444' }}>
                {isDisqualified ? 'EXAMINATION DISQUALIFIED' : isPassed ? 'PASSED & CERTIFIED' : 'TEST COMPLETE - NEEDS REVIEW'}
              </div>
              <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)', margin: '4px 0 0 0' }}>
                {quizResult.score} / {quizResult.total} Correct ({quizResult.pct}%)
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
                {isDisqualified
                  ? `Exam was terminated due to anti-cheating violations (${quizResult.disqualificationReason}).`
                  : isPassed
                  ? `Congratulations! You scored ${quizResult.pct}%, exceeding the ${passingScore}% requirement.`
                  : `You scored ${quizResult.pct}%, which is below the ${passingScore}% threshold. Review your answers and retake.`}
              </p>
            </div>
          </div>

          <button
            onClick={handleRetakeExam}
            className="btn btn-secondary"
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '800',
              borderRadius: '12px',
              background: 'var(--bg-secondary, #1e293b)',
              color: 'var(--text-primary, #f8fafc)',
              border: '1px solid var(--border-color, #334155)',
              cursor: 'pointer'
            }}
          >
            🔄 Retake Quiz in Secure Mode
          </button>
        </div>

        {/* Proctoring Integrity Summary */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '14px 20px', borderRadius: '14px', background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '18px' }}>🛡️</span>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
              Proctoring Verification:
            </span>
            <span style={{ fontSize: '13px', fontWeight: '800', color: quizResult.recordedStrikes === 0 ? '#10b981' : quizResult.recordedStrikes <= 1 ? '#fbbf24' : '#ef4444' }}>
              {quizResult.recordedStrikes === 0
                ? '✅ 100% Honest & Verified (0 Security Violations)'
                : `⚠️ ${quizResult.recordedStrikes} Violations Recorded (Integrity: ${integrityScore}%)`}
            </span>
          </div>

          {quizResult.recordedStrikes > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
              Tab switches & window blur events logged with timestamps
            </span>
          )}
        </div>

        {/* Question Review & Detailed Explanations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)', margin: 0 }}>
            📝 Question Breakdown & Answer Analysis
          </h4>

          {quizObj.questions.map((q, qIdx) => {
            const studentSelection = quizAnswers[qIdx] !== undefined ? Number(quizAnswers[qIdx]) : null;
            const evalDetail = quizResult?.results?.[qIdx];
            const correctIndex = evalDetail?.correctIndex !== undefined
              ? Number(evalDetail.correctIndex)
              : (q.correctIndex !== undefined ? Number(q.correctIndex) : 0);
            const isCorrect = evalDetail != null
              ? Boolean(evalDetail.isCorrect ?? evalDetail.correct ?? (studentSelection !== null && studentSelection === correctIndex))
              : (studentSelection !== null && studentSelection === correctIndex);
            const explanation = evalDetail?.explanation || q.explanation || '';

            return (
              <div
                key={qIdx}
                style={{
                  background: 'var(--bg-secondary, #1e293b)',
                  padding: '20px',
                  borderRadius: '16px',
                  border: isCorrect ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <h5 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)', margin: 0, flex: 1 }}>
                    {qIdx + 1}. {q.question}
                  </h5>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: '800',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      background: isCorrect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: isCorrect ? '#10b981' : '#ef4444',
                      border: isCorrect ? '1px solid #10b981' : '1px solid #ef4444',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}
                  </span>
                </div>

                {/* Options Comparison */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {q.options && q.options.map((optText, oIdx) => {
                    const isUserChosen = studentSelection !== null && studentSelection === oIdx;
                    const isCorrectAnswer = correctIndex === oIdx;

                    let bg = 'var(--bg-card, #0f172a)';
                    let border = '1px solid var(--border-color, #334155)';
                    let badge = null;

                    if (isUserChosen && isCorrectAnswer) {
                      bg = 'rgba(16, 185, 129, 0.25)';
                      border = '2px solid #10b981';
                      badge = <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981' }}>✅ Your Selection & Correct</span>;
                    } else if (isUserChosen && !isCorrectAnswer) {
                      bg = 'rgba(239, 68, 68, 0.25)';
                      border = '2px solid #ef4444';
                      badge = <span style={{ fontSize: '11px', fontWeight: '800', color: '#ef4444' }}>❌ Your Selection (Incorrect)</span>;
                    } else if (!isUserChosen && isCorrectAnswer) {
                      bg = 'rgba(16, 185, 129, 0.15)';
                      border = '2px dashed #10b981';
                      badge = <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981' }}>💡 Correct Answer</span>;
                    }

                    return (
                      <div
                        key={oIdx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          background: bg,
                          border: border,
                          fontSize: '13px',
                          fontWeight: '600',
                          color: 'var(--text-primary, #f8fafc)'
                        }}
                      >
                        <span>{optText}</span>
                        {badge}
                      </div>
                    );
                  })}
                </div>

                {explanation && (
                  <div style={{ marginTop: '4px', padding: '12px 14px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', borderLeft: '4px solid #6366f1', fontSize: '13px', color: 'var(--text-primary, #f8fafc)' }}>
                    <strong style={{ color: '#818cf8', display: 'block', marginBottom: '2px' }}>💡 Learning Explanation:</strong>
                    {explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. ACTIVE PROCTORED FULLSCREEN EXAMINATION ENVIRONMENT
  // =========================================================================
  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 999999,
        background: '#0b0f19',
        color: 'var(--text-primary, #f8fafc)',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        padding: '24px 32px',
        boxSizing: 'border-box'
      }}
    >
      {/* Dynamic Security Notice Toast */}
      {securityNotice && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(10px)',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: '800',
            fontSize: '14px',
            zIndex: 9999,
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            border: '1px solid rgba(255,255,255,0.2)'
          }}
        >
          <span>⚠️</span>
          <span>{securityNotice}</span>
        </div>
      )}

      {/* Confirmation Modal to Exit/Cancel Exam */}
      {showExitConfirmModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(11, 15, 25, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '24px'
          }}
        >
          <div
            style={{
              maxWidth: '460px',
              width: '100%',
              borderRadius: '24px',
              padding: '32px',
              background: '#0f172a',
              border: '1px solid #ef4444',
              boxShadow: '0 25px 50px rgba(0,0,0,0.6)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            <div style={{ fontSize: '48px' }}>🚪</div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', margin: 0, color: '#f8fafc' }}>
              Exit & Cancel Examination?
            </h3>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
              Are you sure you want to exit the quiz? Your answered progress will not be submitted.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '8px' }}>
              <button
                onClick={() => setShowExitConfirmModal(false)}
                type="button"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#f8fafc',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Resume Exam
              </button>
              <button
                onClick={handleExitQuiz}
                type="button"
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  border: 'none',
                  color: '#ffffff',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                Yes, Exit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Security Incident Emergency Modal Overlay */}
      {activeViolationModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(11, 15, 25, 0.92)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '24px'
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              borderRadius: '24px',
              padding: '36px 32px',
              background: '#0f172a',
              border: activeViolationModal.type === 'LOCKOUT' ? '2px solid #ef4444' : '2px solid #f59e0b',
              boxShadow: '0 25px 60px rgba(239, 68, 68, 0.4)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}
          >
            <div style={{ fontSize: '56px', animation: 'pulse 1s infinite' }}>
              {activeViolationModal.type === 'LOCKOUT' ? '🚨' : '⚠️'}
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: activeViolationModal.type === 'LOCKOUT' ? '#ef4444' : '#fbbf24' }}>
              {activeViolationModal.title}
            </h3>

            <p style={{ fontSize: '14px', color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
              {activeViolationModal.message}
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  style={{
                    width: '32px',
                    height: '8px',
                    borderRadius: '4px',
                    background: s <= strikes ? '#ef4444' : 'rgba(255,255,255,0.2)'
                  }}
                />
              ))}
            </div>

            {activeViolationModal.type !== 'LOCKOUT' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={handleResumeAfterWarning}
                  style={{
                    padding: '14px 28px',
                    fontSize: '15px',
                    fontWeight: '800',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(245, 158, 11, 0.4)'
                  }}
                >
                  🖥️ Return to Fullscreen & Resume Exam
                </button>
                <button
                  onClick={handleExitQuiz}
                  type="button"
                  style={{
                    padding: '10px 20px',
                    fontSize: '13px',
                    fontWeight: '700',
                    borderRadius: '10px',
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #334155',
                    cursor: 'pointer'
                  }}
                >
                  🚪 Cancel & Exit Quiz
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Proctored Exam HUD Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--border-color, #334155)',
          padding: '16px 24px',
          borderRadius: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '24px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.4)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '20px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              fontSize: '12px',
              fontWeight: '800'
            }}
          >
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', animation: 'pulse 1.5s infinite' }} />
            <span>PROCTORING ACTIVE</span>
          </div>

          <span style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)' }}>
            {quizObj.title || 'Exam Session'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Strikes Counter */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: strikes === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.15)',
              border: strikes === 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #ef4444',
              color: strikes === 0 ? '#10b981' : '#f87171',
              fontSize: '12px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⚠️</span>
            <span>Strikes: {strikes} / {MAX_VIOLATION_STRIKES}</span>
          </div>

          {/* Live Countdown Timer */}
          <div
            style={{
              padding: '6px 14px',
              borderRadius: '20px',
              background: timeRemaining < 120 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(99, 102, 241, 0.15)',
              border: timeRemaining < 120 ? '1px solid #ef4444' : '1px solid rgba(99, 102, 241, 0.4)',
              color: timeRemaining < 120 ? '#ef4444' : '#818cf8',
              fontSize: '13px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>⏱️</span>
            <span>Time Left: {formatTime(timeRemaining)}</span>
          </div>

          {/* Progress Tracker */}
          <div style={{ padding: '6px 14px', borderRadius: '20px', background: 'var(--bg-secondary, #1e293b)', border: '1px solid var(--border-color, #334155)', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary, #94a3b8)' }}>
            📋 {answeredCount} / {totalQuestions}
          </div>

          {!isFullscreen && (
            <button
              onClick={enterFullscreen}
              type="button"
              style={{
                padding: '6px 12px',
                fontSize: '11px',
                fontWeight: '700',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.4)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              🖥️ Lock Fullscreen
            </button>
          )}

          {/* Exit Quiz Button */}
          <button
            onClick={() => setShowExitConfirmModal(true)}
            type="button"
            style={{
              padding: '6px 12px',
              borderRadius: '10px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              color: '#f87171',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🚪</span>
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Notice Banner if browser is not in fullscreen */}
      {!isFullscreen && (
        <div
          style={{
            maxWidth: '840px',
            width: '100%',
            margin: '0 auto 20px auto',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.15) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            padding: '12px 20px',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '13px', fontWeight: '700' }}>
            <span>🖥️</span>
            <span>Fullscreen mode is required to maintain exam security.</span>
          </div>
          <button
            onClick={enterFullscreen}
            type="button"
            style={{
              padding: '8px 16px',
              background: '#fbbf24',
              color: '#0f172a',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '800',
              fontSize: '12px',
              cursor: 'pointer'
            }}
          >
            Enter Fullscreen
          </button>
        </div>
      )}

      {submitError && (
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '13px', marginBottom: '20px' }}>
          ⚠️ {submitError}
        </div>
      )}

      {/* Questions List */}
      <div style={{ maxWidth: '840px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1 }}>
        {quizObj.questions.map((q, qIdx) => {
          const studentSelection = quizAnswers[qIdx] !== undefined ? Number(quizAnswers[qIdx]) : null;

          return (
            <div
              key={qIdx}
              style={{
                background: 'var(--bg-card, #0f172a)',
                padding: '24px',
                borderRadius: '18px',
                border: '1px solid var(--border-color, #334155)',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <span
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: studentSelection !== null ? '#4f46e5' : 'var(--bg-secondary, #1e293b)',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '800',
                    fontSize: '13px',
                    flexShrink: 0
                  }}
                >
                  {qIdx + 1}
                </span>
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)', margin: 0, lineHeight: 1.5, flex: 1 }}>
                  {q.question}
                </h4>
              </div>

              {/* Radio Options */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options && q.options.map((optText, oIdx) => {
                  const isSelected = studentSelection === oIdx;

                  return (
                    <label
                      key={oIdx}
                      onClick={() => handleOptionSelect(qIdx, oIdx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '14px 18px',
                        borderRadius: '12px',
                        background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'var(--bg-secondary, #1e293b)',
                        border: isSelected ? '2px solid #6366f1' : '1px solid var(--border-color, #334155)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? '#ffffff' : 'var(--text-secondary, #cbd5e1)',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <input
                        type="radio"
                        name={`secure_q_${qIdx}`}
                        checked={isSelected}
                        onChange={() => handleOptionSelect(qIdx, oIdx)}
                        style={{ width: '18px', height: '18px', accentColor: '#6366f1', cursor: 'pointer' }}
                      />
                      <span>{optText}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Submit Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0 48px 0', flexWrap: 'wrap', gap: '16px' }}>
          <button
            onClick={() => setShowExitConfirmModal(true)}
            type="button"
            style={{
              padding: '12px 24px',
              fontWeight: '700',
              fontSize: '14px',
              borderRadius: '12px',
              background: 'transparent',
              border: '1px solid #334155',
              color: '#94a3b8',
              cursor: 'pointer'
            }}
          >
            🚪 Cancel & Exit Exam
          </button>

          <button
            onClick={handleManualSubmit}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              padding: '16px 36px',
              fontWeight: '800',
              fontSize: '16px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1,
              border: 'none',
              color: '#ffffff'
            }}
          >
            {isSubmitting ? '⏳ Submitting Secure Exam...' : '🚀 Finalize & Submit Exam'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StudentQuizViewer;
