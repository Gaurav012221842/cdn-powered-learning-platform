import React, { useState } from 'react';
import { API_V1_URL } from '../../services/api';

const StudentQuizViewer = ({ quizData, courseId, lessonId, onComplete }) => {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [submitError, setSubmitError] = useState(null);

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

  if (!quizObj || !Array.isArray(quizObj.questions) || quizObj.questions.length === 0) {
    return (
      <div className="card" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color, #334155)', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' }}>
        <p style={{ margin: 0 }}>📝 No quiz questions found for this lesson.</p>
      </div>
    );
  }

  const totalQuestions = quizObj.questions.length;
  const passingScore = quizObj.passingScore || 70;
  const answeredCount = Object.keys(quizAnswers).length;

  const handleOptionSelect = (qIdx, oIdx) => {
    if (isSubmitted || isSubmitting) return; // Freeze selection post-submission
    setQuizAnswers((prev) => ({
      ...prev,
      [qIdx]: oIdx
    }));
  };

  const handleSubmit = async () => {
    if (answeredCount < totalQuestions) {
      const confirmSubmit = window.confirm(
        `⚠️ You have answered ${answeredCount} of ${totalQuestions} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    if (courseId) {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_V1_URL}/courses/${courseId}/quiz/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            lessonId: lessonId || undefined,
            answers: quizAnswers
          })
        });

        const data = await res.json();
        if (res.ok && data?.data) {
          const evalData = data.data;
          const isPassed = Boolean(
            evalData.isPassed !== undefined
              ? evalData.isPassed
              : evalData.passed !== undefined
              ? evalData.passed
              : evalData.scorePercentage >= (evalData.passingScore || 70)
          );

          const resultObj = {
            score: evalData.correctCount,
            total: evalData.totalQuestions,
            pct: evalData.scorePercentage,
            isPassed: isPassed,
            passingScore: evalData.passingScore || 70,
            results: evalData.results
          };

          setQuizResult(resultObj);
          setIsSubmitted(true);

          if (onComplete) {
            onComplete(isPassed, evalData.scorePercentage, evalData.correctCount, evalData.totalQuestions);
          }
          setIsSubmitting(false);
          return;
        } else {
          throw new Error(data.message || 'Failed to submit quiz to backend');
        }
      } catch (err) {
        console.warn('Backend quiz evaluation failed, using client fallback:', err);
        setSubmitError('Backend evaluation error: ' + err.message);
      }
    }

    // Client fallback if offline or preview mode
    let score = 0;
    const results = quizObj.questions.map((q, idx) => {
      const selected = quizAnswers[idx];
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

    const pct = Math.round((score / totalQuestions) * 100);
    const isPassed = pct >= passingScore;

    const resultObj = {
      score,
      total: totalQuestions,
      pct,
      isPassed,
      passingScore,
      results
    };

    setQuizResult(resultObj);
    setIsSubmitted(true);
    setIsSubmitting(false);

    if (onComplete) {
      onComplete(isPassed, pct, score, totalQuestions);
    }
  };

  const handleRetake = () => {
    setQuizAnswers({});
    setIsSubmitted(false);
    setQuizResult(null);
    setSubmitError(null);
  };

  return (
    <div
      className="card"
      style={{
        padding: '28px',
        borderRadius: '20px',
        border: '1px solid var(--border-color, #334155)',
        background: 'var(--bg-card, #0f172a)',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px'
      }}
    >
      {/* Quiz Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color, #334155)', paddingBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary, #f8fafc)', margin: 0 }}>
            📝 {quizObj.title || 'Knowledge Assessment & Quiz'}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
            Answer all questions below and submit to evaluate your test result.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', padding: '6px 12px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
            🎯 Passing Score: {passingScore}%
          </span>
          <span style={{ fontSize: '12px', fontWeight: '700', padding: '6px 12px', borderRadius: '20px', background: 'var(--bg-secondary, #1e293b)', color: 'var(--text-secondary, #94a3b8)', border: '1px solid var(--border-color, #334155)' }}>
            📋 {answeredCount} / {totalQuestions} Answered
          </span>
        </div>
      </div>

      {/* POST-SUBMISSION SCORE & EVALUATION HEADER */}
      {isSubmitted && quizResult && (
        <div
          style={{
            padding: '24px',
            borderRadius: '16px',
            background: quizResult.isPassed ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: quizResult.isPassed ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid rgba(239, 68, 68, 0.4)',
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '28px' }}>{quizResult.isPassed ? '🎉' : '⚠️'}</span>
              <div>
                <h4 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: quizResult.isPassed ? '#10b981' : '#ef4444' }}>
                  {quizResult.isPassed ? 'PASSED! Great Job!' : 'Test Complete - Needs Improvement'}
                </h4>
                <p style={{ margin: '2px 0 0 0', fontSize: '14px', fontWeight: '600', color: 'var(--text-primary, #f8fafc)' }}>
                  Your Score: {quizResult.score} out of {quizResult.total} Correct ({quizResult.pct}%)
                </p>
              </div>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: 'var(--text-secondary, #94a3b8)' }}>
              {quizResult.isPassed
                ? 'You have successfully satisfied the passing requirements for this lesson.'
                : `You scored ${quizResult.pct}%, which is below the passing threshold of ${passingScore}%. Review the answer comparisons below and try again!`}
            </p>
          </div>

          <button
            onClick={handleRetake}
            className="btn btn-secondary"
            style={{
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: '700',
              borderRadius: '10px',
              background: 'var(--bg-secondary, #1e293b)',
              color: 'var(--text-primary, #f8fafc)',
              border: '1px solid var(--border-color, #334155)',
              cursor: 'pointer'
            }}
          >
            🔄 Retake Quiz
          </button>
        </div>
      )}

      {/* QUESTIONS & ANSWER MATCHING LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {quizObj.questions.map((q, qIdx) => {
          const studentSelection = quizAnswers[qIdx] !== undefined ? Number(quizAnswers[qIdx]) : null;
          const evalDetail = quizResult?.results?.[qIdx];
          const correctIndex = evalDetail?.correctIndex !== undefined
            ? Number(evalDetail.correctIndex)
            : (q.correctIndex !== undefined ? Number(q.correctIndex) : undefined);
          const isCorrect = isSubmitted && (
            evalDetail != null
              ? Boolean(evalDetail.isCorrect ?? evalDetail.correct ?? (studentSelection !== null && correctIndex !== undefined && studentSelection === correctIndex))
              : (studentSelection !== null && correctIndex !== undefined && studentSelection === correctIndex)
          );
          const explanation = evalDetail?.explanation || q.explanation || '';

          return (
            <div
              key={qIdx}
              style={{
                background: 'var(--bg-secondary, #1e293b)',
                padding: '20px',
                borderRadius: '16px',
                border: isSubmitted
                  ? isCorrect
                    ? '1px solid rgba(16, 185, 129, 0.5)'
                    : '1px solid rgba(239, 68, 68, 0.5)'
                  : '1px solid var(--border-color, #334155)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              {/* Question Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)', margin: 0, flex: 1 }}>
                  {qIdx + 1}. {q.question}
                </h4>

                {/* Submission Feedback Badge */}
                {isSubmitted && (
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
                )}
              </div>

              {/* Options List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {q.options && q.options.map((optText, oIdx) => {
                  const isUserChosen = studentSelection !== null && studentSelection === oIdx;
                  const isCorrectAnswer = isSubmitted && (correctIndex !== undefined && correctIndex === oIdx);

                  // Determine post-submission styling logic
                  let bg = 'var(--bg-card, #0f172a)';
                  let border = '1px solid var(--border-color, #334155)';
                  let textColor = 'var(--text-primary, #f8fafc)';
                  let badge = null;

                  if (!isSubmitted) {
                    if (isUserChosen) {
                      bg = 'rgba(99, 102, 241, 0.15)';
                      border = '1px solid var(--primary, #6366f1)';
                    }
                  } else {
                    // Post-submission answer comparison & matching
                    if (isUserChosen && isCorrectAnswer) {
                      bg = 'rgba(16, 185, 129, 0.25)';
                      border = '2px solid #10b981';
                      textColor = '#ffffff';
                      badge = <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>✅ Your Choice & Correct Answer</span>;
                    } else if (isUserChosen && !isCorrectAnswer) {
                      bg = 'rgba(239, 68, 68, 0.25)';
                      border = '2px solid #ef4444';
                      textColor = '#ffffff';
                      badge = <span style={{ fontSize: '11px', fontWeight: '800', color: '#ef4444', background: 'rgba(239, 68, 68, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>❌ Your Selection (Incorrect)</span>;
                    } else if (!isUserChosen && isCorrectAnswer) {
                      bg = 'rgba(16, 185, 129, 0.15)';
                      border = '2px dashed #10b981';
                      badge = <span style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '6px' }}>💡 Correct Answer</span>;
                    } else {
                      bg = 'var(--bg-card, #0f172a)';
                      border = '1px solid var(--border-color, #334155)';
                      textColor = 'var(--text-muted, #64748b)';
                    }
                  }

                  return (
                    <label
                      key={oIdx}
                      onClick={() => handleOptionSelect(qIdx, oIdx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        background: bg,
                        border: border,
                        cursor: isSubmitted ? 'default' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: textColor,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <input
                          type="radio"
                          name={`student_q_${qIdx}`}
                          checked={isUserChosen}
                          onChange={() => handleOptionSelect(qIdx, oIdx)}
                          disabled={isSubmitted || isSubmitting}
                          style={{ width: '16px', height: '16px', cursor: isSubmitted ? 'default' : 'pointer' }}
                        />
                        <span>{optText}</span>
                      </div>

                      {badge}
                    </label>
                  );
                })}
              </div>

              {/* ANSWER EXPLANATION CALLOUT (Shown after submitting from backend result) */}
              {isSubmitted && explanation && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderLeft: '4px solid #6366f1',
                    fontSize: '13px',
                    color: 'var(--text-primary, #f8fafc)'
                  }}
                >
                  <strong style={{ color: '#818cf8', display: 'block', marginBottom: '2px' }}>
                    💡 Explanation & Learning Note:
                  </strong>
                  {explanation}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SUBMIT BUTTON */}
      {!isSubmitted && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              padding: '14px 28px',
              fontWeight: '800',
              fontSize: '15px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.7 : 1
            }}
          >
            {isSubmitting ? '⏳ Evaluating on Server...' : '🚀 Submit Test & Check Answers'}
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentQuizViewer;
