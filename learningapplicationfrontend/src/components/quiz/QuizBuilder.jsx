import React, { useState } from 'react';

const SAMPLE_QUIZ_PRESET = {
  title: 'CDN & High-Performance Architecture Assessment',
  passingScore: 70,
  questions: [
    {
      question: 'What is the primary architectural purpose of a Content Delivery Network (CDN)?',
      options: [
        'To reduce latency by caching assets closer to global users',
        'To replace origin database servers completely',
        'To compress database records offline',
        'To generate server-side Java bytecodes'
      ],
      correctIndex: 0,
      explanation: 'CDNs deploy edge servers around the world to cache static & media assets close to end users, minimizing latency and origin server loads.'
    },
    {
      question: 'Which HTTP header is commonly used by CDNs for browser and proxy cache validation?',
      options: [
        'X-Powered-By',
        'ETag & Cache-Control',
        'Authorization',
        'Content-Disposition'
      ],
      correctIndex: 1,
      explanation: 'ETag and Cache-Control headers specify cache TTL, revalidation strategies, and freshness directives across edge proxies.'
    },
    {
      question: 'What happens when a cache-miss occurs on an edge CDN server?',
      options: [
        'The request fails immediately with a 500 error',
        'The edge server fetches the requested resource from the origin server, caches it, and serves it to the client',
        'The client is forced to restart their browser',
        'The file is deleted from Cloudflare storage'
      ],
      correctIndex: 1,
      explanation: 'On a cache miss, the edge proxy fetches the master file from origin server, stores a copy in edge cache for future requests, and returns it to the user.'
    }
  ]
};

const QuizBuilder = ({ quizData, onChange }) => {
  const [viewMode, setViewMode] = useState('visual'); // 'visual' | 'json'
  const [quiz, setQuiz] = useState(() => {
    try {
      if (quizData && typeof quizData === 'string') {
        const parsed = JSON.parse(quizData);
        if (parsed && Array.isArray(parsed.questions)) {
          return {
            title: parsed.title || 'Lesson Quiz',
            passingScore: parsed.passingScore || 70,
            questions: parsed.questions
          };
        }
      }
    } catch (e) {
      // fallback
    }
    return {
      title: 'Module Knowledge Check',
      passingScore: 70,
      questions: [
        {
          question: 'Sample Question: What is the main benefit of caching?',
          options: ['Fast load times', 'Slower network', 'Higher database load', 'No benefits'],
          correctIndex: 0,
          explanation: 'Caching decreases latency and reduces server processing load.'
        }
      ]
    };
  });

  const [rawJson, setRawJson] = useState(() => {
    return typeof quizData === 'string' && quizData ? quizData : JSON.stringify(quiz, null, 2);
  });

  // Sync upwards when quiz object updates
  const notifyChange = (updatedQuiz) => {
    setQuiz(updatedQuiz);
    const jsonStr = JSON.stringify(updatedQuiz, null, 2);
    setRawJson(jsonStr);
    if (onChange) {
      onChange(jsonStr);
    }
  };

  // Switch modes
  const handleModeToggle = (mode) => {
    if (mode === 'visual' && viewMode === 'json') {
      // try parse raw json
      try {
        const parsed = JSON.parse(rawJson);
        if (parsed && Array.isArray(parsed.questions)) {
          setQuiz({
            title: parsed.title || 'Lesson Quiz',
            passingScore: parsed.passingScore || 70,
            questions: parsed.questions
          });
        }
      } catch (err) {
        alert('⚠️ Invalid JSON format! Please fix JSON errors before switching to Visual Builder.');
        return;
      }
    }
    setViewMode(mode);
  };

  // Question CRUD
  const addQuestion = () => {
    const newQuestions = [
      ...quiz.questions,
      {
        question: `Question ${quiz.questions.length + 1}`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctIndex: 0,
        explanation: ''
      }
    ];
    notifyChange({ ...quiz, questions: newQuestions });
  };

  const removeQuestion = (qIdx) => {
    if (quiz.questions.length <= 1) {
      alert('Quiz must have at least 1 question.');
      return;
    }
    const newQuestions = quiz.questions.filter((_, idx) => idx !== qIdx);
    notifyChange({ ...quiz, questions: newQuestions });
  };

  const updateQuestionField = (qIdx, field, val) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIdx] = { ...newQuestions[qIdx], [field]: val };
    notifyChange({ ...quiz, questions: newQuestions });
  };

  // Option CRUD
  const addOption = (qIdx) => {
    const newQuestions = [...quiz.questions];
    const opts = [...newQuestions[qIdx].options, `Option ${newQuestions[qIdx].options.length + 1}`];
    newQuestions[qIdx] = { ...newQuestions[qIdx], options: opts };
    notifyChange({ ...quiz, questions: newQuestions });
  };

  const updateOptionText = (qIdx, oIdx, val) => {
    const newQuestions = [...quiz.questions];
    const opts = [...newQuestions[qIdx].options];
    opts[oIdx] = val;
    newQuestions[qIdx] = { ...newQuestions[qIdx], options: opts };
    notifyChange({ ...quiz, questions: newQuestions });
  };

  const removeOption = (qIdx, oIdx) => {
    const newQuestions = [...quiz.questions];
    if (newQuestions[qIdx].options.length <= 2) {
      alert('A question must have at least 2 options.');
      return;
    }
    const opts = newQuestions[qIdx].options.filter((_, idx) => idx !== oIdx);
    let correct = newQuestions[qIdx].correctIndex;
    if (correct >= opts.length) correct = 0;
    newQuestions[qIdx] = { ...newQuestions[qIdx], options: opts, correctIndex: correct };
    notifyChange({ ...quiz, questions: newQuestions });
  };

  const setCorrectIndex = (qIdx, oIdx) => {
    const newQuestions = [...quiz.questions];
    newQuestions[qIdx] = { ...newQuestions[qIdx], correctIndex: oIdx };
    notifyChange({ ...quiz, questions: newQuestions });
  };

  const loadPreset = () => {
    notifyChange(SAMPLE_QUIZ_PRESET);
  };

  return (
    <div style={{ background: 'var(--bg-secondary, #1e293b)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-color, #334155)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '18px' }}>📝</span>
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: 'var(--text-primary, #f8fafc)' }}>
            Admin Quiz & Assessment Builder
          </h4>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            type="button"
            onClick={loadPreset}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', border: '1px solid rgba(99, 102, 241, 0.3)' }}
          >
            ⚡ Load Sample Quiz Template
          </button>
          <div style={{ display: 'flex', background: 'var(--bg-primary, #0f172a)', padding: '3px', borderRadius: '8px', border: '1px solid var(--border-color, #334155)' }}>
            <button
              type="button"
              onClick={() => handleModeToggle('visual')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'visual' ? 'var(--primary, #6366f1)' : 'transparent',
                color: viewMode === 'visual' ? '#fff' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer'
              }}
            >
              ✨ Visual Builder
            </button>
            <button
              type="button"
              onClick={() => handleModeToggle('json')}
              style={{
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                background: viewMode === 'json' ? 'var(--primary, #6366f1)' : 'transparent',
                color: viewMode === 'json' ? '#fff' : 'var(--text-muted, #94a3b8)',
                cursor: 'pointer'
              }}
            >
              ⚙️ Raw JSON
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'visual' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Settings bar */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', background: 'var(--bg-card, #0f172a)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color, #334155)' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase' }}>Quiz Title</label>
              <input
                type="text"
                className="form-input"
                style={{ fontSize: '13px', marginTop: '4px', padding: '8px 12px' }}
                value={quiz.title || ''}
                onChange={(e) => notifyChange({ ...quiz, title: e.target.value })}
                placeholder="e.g. Chapter 1 Knowledge Assessment"
              />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-secondary, #94a3b8)', textTransform: 'uppercase' }}>Passing Score (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                className="form-input"
                style={{ fontSize: '13px', marginTop: '4px', padding: '8px 12px' }}
                value={quiz.passingScore || 70}
                onChange={(e) => notifyChange({ ...quiz, passingScore: parseInt(e.target.value) || 70 })}
              />
            </div>
          </div>

          {/* Questions list */}
          {quiz.questions.map((q, qIdx) => (
            <div
              key={qIdx}
              style={{
                background: 'var(--bg-card, #0f172a)',
                padding: '16px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, #334155)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--primary, #6366f1)' }}>
                  Question {qIdx + 1} of {quiz.questions.length}
                </span>
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
                >
                  ✖ Delete Question
                </button>
              </div>

              {/* Question Text */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary, #94a3b8)' }}>Question Prompt</label>
                <input
                  type="text"
                  className="form-input"
                  style={{ fontSize: '13px', marginTop: '4px' }}
                  value={q.question}
                  onChange={(e) => updateQuestionField(qIdx, 'question', e.target.value)}
                  placeholder="Type your question prompt here..."
                />
              </div>

              {/* Options Section */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary, #94a3b8)' }}>
                  Answer Choices (Select the radio button next to the correct answer)
                </label>

                {q.options && q.options.map((optText, oIdx) => {
                  const isCorrect = q.correctIndex === oIdx;
                  return (
                    <div
                      key={oIdx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: isCorrect ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary, #1e293b)',
                        border: isCorrect ? '1px solid #10b981' : '1px solid var(--border-color, #334155)',
                        padding: '6px 12px',
                        borderRadius: '8px'
                      }}
                    >
                      <input
                        type="radio"
                        name={`correct_radio_${qIdx}`}
                        checked={isCorrect}
                        onChange={() => setCorrectIndex(qIdx, oIdx)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#10b981' }}
                      />

                      <input
                        type="text"
                        className="form-input"
                        style={{ flex: 1, fontSize: '13px', background: 'transparent', border: 'none', color: 'var(--text-primary, #f8fafc)' }}
                        value={optText}
                        onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                        placeholder={`Option ${oIdx + 1}`}
                      />

                      {isCorrect && (
                        <span style={{ fontSize: '11px', fontWeight: '700', color: '#10b981', background: 'rgba(16, 185, 129, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                          ✓ Correct Answer
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => removeOption(qIdx, oIdx)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}
                        title="Remove Option"
                      >
                        🗑️
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={() => addOption(qIdx)}
                  style={{
                    alignSelf: 'flex-start',
                    background: 'none',
                    border: '1px dashed var(--border-color, #334155)',
                    color: 'var(--text-secondary, #94a3b8)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ➕ Add Choice / Option
                </button>
              </div>

              {/* Explanation Field */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary, #94a3b8)' }}>
                  💡 Answer Explanation (Shown to students after test submission)
                </label>
                <textarea
                  rows={2}
                  className="form-input"
                  style={{ fontSize: '12px', marginTop: '4px' }}
                  value={q.explanation || ''}
                  onChange={(e) => updateQuestionField(qIdx, 'explanation', e.target.value)}
                  placeholder="Explain why this choice is correct..."
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={addQuestion}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', fontSize: '13px', fontWeight: '700', alignSelf: 'flex-start' }}
          >
            ➕ Add Question to Quiz
          </button>
        </div>
      ) : (
        <div>
          <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary, #94a3b8)' }}>
            Raw JSON Configuration
          </label>
          <textarea
            rows={10}
            className="form-input"
            style={{ fontSize: '12px', fontFamily: 'monospace', marginTop: '6px', width: '100%' }}
            value={rawJson}
            onChange={(e) => {
              setRawJson(e.target.value);
              if (onChange) onChange(e.target.value);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default QuizBuilder;
