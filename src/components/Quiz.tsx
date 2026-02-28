import React, { useState, useEffect } from "react";
import { Question, TimelineEvent } from "../types";
import { useAdmin } from "../contexts/AdminContext";
import { useContent } from "../contexts/ContentContext";
import { EditableText } from "./admin/EditableText";
import "../quiz.css";

interface QuizProps {
    questions: Question[]; // Fallback questions
    eventId?: number; // Optional to support legacy use
    chapterId?: string; // New: To isolate state within a chapter
    pageId?: string; // New: To isolate state within a page
    eventTitle?: string; // Event title to display
    eventYear?: number; // Event year to display
    onComplete: () => void;
    onExit: () => void;
    isLastPage?: boolean;
    nextPageType?: string;
}

export const Quiz: React.FC<QuizProps> = ({
    questions: initialQuestions,
    eventId,
    chapterId,
    pageId,
    eventTitle,
    eventYear,
    onComplete,
    onExit,
    isLastPage,
    nextPageType
}) => {
    const { user, isEditMode, addTokens } = useAdmin();
    const { getQuiz, updateQuiz } = useContent();

    // Priority: per-page embedded questions (initialQuestions) > event-level context questions
    const contextQuestions = (initialQuestions.length === 0 && eventId) ? getQuiz(eventId) : null;
    const questions = initialQuestions.length > 0 ? initialQuestions : (contextQuestions || []);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [isHydrated, setIsHydrated] = useState(false);

    // --- INCREMENTAL TOKEN SYSTEM ---
    // Lưu điểm cao nhất đã đạt được (bestScore) vào localStorage.
    // Tokens thưởng = (score hiện tại - bestScore trước đó) × 10.
    // Nếu không cải thiện được → không nhận thêm.
    const getBestScoreKey = () =>
        user?.id && eventId
            ? `hiss_quiz_best_${user.id}_${eventId}_${chapterId || 'default'}_${pageId || '0'}`
            : null;

    const [bestScore, setBestScore] = useState<number>(() => {
        if (!user?.id || !eventId) return 0;
        const key = `hiss_quiz_best_${user.id}_${eventId}_${chapterId || 'default'}_${pageId || '0'}`;
        const saved = localStorage.getItem(key);
        return saved ? parseInt(saved, 10) : 0;
    });

    // -------------------------------------------------------------------------
    // 3. Effects (Hooks must be at the top)
    // -------------------------------------------------------------------------

    // Load state
    useEffect(() => {
        if (!isEditMode && user?.id && eventId && !isHydrated) {
            const storageKey = `hiss_quiz_state_${user.id}_${eventId}_${chapterId || 'default'}_${pageId || '0'}`;
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    const { index, score: savedScore } = JSON.parse(saved);
                    setCurrentIndex(index);
                    // Safety: clamp restored score to max questions
                    setScore(Math.min(savedScore, questions.length));
                } catch (e) {
                    console.error("Failed to parse quiz state", e);
                }
            }
            setIsHydrated(true);
        }
    }, [user?.id, eventId, chapterId, pageId, isEditMode, isHydrated]);

    // Persist state
    useEffect(() => {
        if (!isEditMode && user?.id && eventId && isHydrated) {
            const storageKey = `hiss_quiz_state_${user.id}_${eventId}_${chapterId || 'default'}_${pageId || '0'}`;
            localStorage.setItem(storageKey, JSON.stringify({ index: currentIndex, score }));
        }
    }, [currentIndex, score, user?.id, eventId, chapterId, pageId, isEditMode, isHydrated]);

    // Perfect score auto-completion (Legacy or special behavior)
    useEffect(() => {
        if (!isEditMode && showResult && score === questions.length && questions.length > 0) {
            // Clear persistence on full completion
            if (user?.id && eventId) {
                localStorage.removeItem(`hiss_quiz_state_${user.id}_${eventId}_${chapterId || 'default'}_${pageId || '0'}`);
            }
            // Auto-complete if they got everything right
            // but we keep the result screen visible so they can click "Next" manually if they want
        }
    }, [showResult, score, questions.length, isEditMode, user?.id, eventId, chapterId, pageId]);

    // NOTE: Removed auto-complete on questions.length === 0.
    // Previously this caused any empty quiz page to silently mark the chapter complete.
    // Now we show a UI message instead — admin can add questions, user can go back.

    // -------------------------------------------------------------------------
    // 4. Handlers
    // -------------------------------------------------------------------------

    const currentQuestion = questions[currentIndex];

    const handleOptionClick = (index: number) => {
        if (isEditMode) return;
        if (isAnswered) return;
        setSelectedOption(index);
        setIsAnswered(true);

        if (index === currentQuestion?.correctAnswer) {
            setScore((prev) => prev + 1);
        }
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex((prev) => prev + 1);
            setSelectedOption(null);
            setIsAnswered(false);
            setShowHint(false);
        } else {
            setShowResult(true);
        }
    };

    const handleRestart = () => {
        setCurrentIndex(0);
        setScore(0);
        setShowResult(false);
        setSelectedOption(null);
        setIsAnswered(false);
        setShowHint(false);

        if (user?.id && eventId) {
            localStorage.removeItem(`hiss_quiz_state_${user.id}_${eventId}_${chapterId || 'default'}_${pageId || '0'}`);
        }
    };

    const handleChapterComplete = () => {
        if (!isEditMode && user?.id && score > 0) {
            const clampedScore = Math.min(score, questions.length);
            const improvement = clampedScore - bestScore;
            if (improvement > 0) {
                // Chỉ thưởng token cho phần cải thiện so với lần cao nhất trước đó
                const reward = improvement * 10;
                const key = getBestScoreKey();
                if (key) localStorage.setItem(key, String(clampedScore)); // lưu best score mới
                setBestScore(clampedScore);
                if (addTokens) addTokens(reward);
            }
        }

        if (user?.id && eventId) {
            localStorage.removeItem(`hiss_quiz_state_${user.id}_${eventId}_${chapterId || 'default'}_${pageId || '0'}`);
        }
        onComplete();
    };

    // Admin Functions
    const updateQuestion = (index: number, field: string, value: any) => {
        if (!eventId) return;
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], [field]: value };
        updateQuiz(eventId, newQuestions);
    };

    const updateOption = (qIndex: number, oIndex: number, value: string) => {
        if (!eventId) return;
        const newQuestions = [...questions];
        const newOptions = [...newQuestions[qIndex].options];
        newOptions[oIndex] = value;
        newQuestions[qIndex] = { ...newQuestions[qIndex], options: newOptions };
        updateQuiz(eventId, newQuestions);
    };

    const setCorrectAnswer = (qIndex: number, oIndex: number) => {
        if (!eventId) return;
        const newQuestions = [...questions];
        newQuestions[qIndex] = { ...newQuestions[qIndex], correctAnswer: oIndex };
        updateQuiz(eventId, newQuestions);
    };

    const addQuestion = () => {
        if (!eventId) return;
        const newQuestion: Question = {
            id: Date.now(),
            question: "Câu hỏi mới?",
            options: ["Lựa chọn A", "Lựa chọn B", "Lựa chọn C", "Lựa chọn D"],
            correctAnswer: 0
        };
        updateQuiz(eventId, [...questions, newQuestion]);
        setCurrentIndex(questions.length);
    };

    const deleteQuestion = (index: number) => {
        if (!eventId) return;
        if (questions.length <= 1) {
            alert("Không thể xóa câu hỏi cuối cùng!");
            return;
        }
        if (confirm("Xóa câu hỏi này?")) {
            const newQuestions = questions.filter((_, i) => i !== index);
            updateQuiz(eventId, newQuestions);
            if (currentIndex >= newQuestions.length) {
                setCurrentIndex(newQuestions.length - 1);
            }
        }
    };

    // -------------------------------------------------------------------------
    // 5. Render
    // -------------------------------------------------------------------------

    // BUG 1 FIX: Show UI instead of silently completing when no questions exist
    if (questions.length === 0 && !isEditMode) {
        return (
            <div className="quiz-container">
                <div className="quiz-card" style={{ textAlign: 'center', padding: '60px 40px' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
                    <h3 style={{ color: '#94a3b8', marginBottom: '12px' }}>Chương này chưa có câu hỏi</h3>
                    <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '24px' }}>
                        Nội dung đang được cập nhật. Vui lòng quay lại sau.
                    </p>
                    <button className="btn-back-quiz" onClick={onExit}>← Quay lại</button>
                </div>
            </div>
        );
    }

    if (showResult && !isEditMode) {
        return (
            <div className="quiz-container">
                <div className="quiz-card quiz-result">
                    <h2>Kết Quả</h2>
                    <div className="quiz-score">
                        {Math.min(score, questions.length)} / {questions.length}
                    </div>
                    <p className="result-message">
                        {score === questions.length
                            ? "Tuyệt vời! Bạn đã trả lời đúng tất cả!"
                            : score > questions.length / 2
                                ? "Khá lắm! Bạn đã nắm vững kiến thức."
                                : "Hãy thử lại để ôn tập kiến thức nhé!"}
                    </p>

                    {!isEditMode && score > 0 && (() => {
                        const clampedScore = Math.min(score, questions.length);
                        const improvement = clampedScore - bestScore;
                        if (improvement > 0) {
                            return (
                                <div className="token-reward animate-fade-in" style={{ marginTop: '15px', color: '#fbbf24', fontWeight: 'bold', fontSize: '18px', textShadow: '0 0 10px rgba(251, 191, 36, 0.4)' }}>
                                    🎉 Bạn nhận được {improvement * 10} Token! (Điểm mới: {clampedScore}/{questions.length})
                                </div>
                            );
                        }
                        if (clampedScore === questions.length) {
                            return (
                                <div className="token-reward animate-fade-in" style={{ marginTop: '15px', color: '#34d399', fontWeight: 'bold', fontSize: '16px' }}>
                                    ✅ Điểm tối đa! Bạn đã nhận đủ Token cho bài này.
                                </div>
                            );
                        }
                        return (
                            <div className="token-reward animate-fade-in" style={{ marginTop: '15px', color: '#94a3b8', fontWeight: 'bold', fontSize: '16px' }}>
                                💡 Điểm cao nhất: {bestScore}/{questions.length}. Làm tốt hơn để nhận thêm Token!
                            </div>
                        );
                    })()}

                    <div className="quiz-actions">
                        <button className="quiz-next-btn" onClick={handleChapterComplete} style={{ margin: 0, width: 'auto' }}>
                            {(() => {
                                if (nextPageType === 'video') return "Xem Video →";
                                if (nextPageType === 'character') return "Thử thách nhân vật →";
                                if (isLastPage) return "Hoàn thành chương ✓";
                                return "Tiếp tục bài học →";
                            })()}
                        </button>
                        <button className="quiz-hint-btn" onClick={handleRestart} style={{ margin: 0 }}>
                            Thử lại
                        </button>
                        <button className="quiz-hint-btn" onClick={onExit} style={{ margin: 0 }}>
                            Quay lại
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!questions || questions.length === 0 || (!isEditMode && !currentQuestion)) {
        return null;
    }

    const optionLabels = ['A', 'B', 'C', 'D'];
    const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

    return (
        <div className="quiz-container">
            {/* Back Button */}
            <button className="quiz-back-btn" onClick={onExit}>
                ← Quay lại
            </button>

            {/* Title Section */}
            {eventTitle && (
                <div className="quiz-title-section">
                    {eventYear && <div className="quiz-event-year">{eventYear}</div>}
                    <h1 className="quiz-event-title">{eventTitle}</h1>
                </div>
            )}

            {/* Admin Controls */}
            {isEditMode && eventId && (
                <div className="quiz-header">
                    <div className="admin-quiz-controls">
                        <button className="admin-action-btn" onClick={addQuestion}>+ Thêm câu</button>
                        <button className="admin-action-btn delete" onClick={() => deleteQuestion(currentIndex)}>Xóa câu này</button>
                    </div>
                </div>
            )}

            <div className="quiz-card">
                <div className="quiz-card-corner-bl"></div>
                <div className="quiz-card-corner-br"></div>
                <div className="quiz-card-decoration"></div>

                {/* Progress Section */}
                <div className="quiz-progress-section">
                    <div className="quiz-progress-text">
                        CÂU HỎI {currentIndex + 1}/{questions.length}
                    </div>
                    <div className="quiz-progress-bar-container">
                        <div className="quiz-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
                    </div>
                </div>

                <h3 className="quiz-question">
                    {isEditMode ? (
                        <EditableText
                            value={currentQuestion.question}
                            onSave={(val) => updateQuestion(currentIndex, 'question', val)}
                            multiline
                        />
                    ) : currentQuestion.question}
                </h3>

                <div className="quiz-options">
                    {currentQuestion.options.map((option: string, index) => {
                        let className = "quiz-option";
                        if (!isEditMode && isAnswered) {
                            if (index === currentQuestion.correctAnswer) {
                                className += " quiz-option-correct";
                            } else if (index === selectedOption) {
                                className += " quiz-option-incorrect";
                            }
                        } else if (!isEditMode && selectedOption === index) {
                            className += " quiz-option-selected";
                        }

                        if (isEditMode && index === currentQuestion.correctAnswer) {
                            className += " correct-admin-preview";
                        }

                        return (
                            <div
                                key={index}
                                className={className}
                                onClick={() => isEditMode ? setCorrectAnswer(currentIndex, index) : handleOptionClick(index)}
                                style={{ position: 'relative' }}
                            >
                                <div className="quiz-option-label">{optionLabels[index]}</div>
                                <div style={{ flex: 1 }}>
                                    {isEditMode ? (
                                        <EditableText
                                            value={option}
                                            onSave={(val) => updateOption(currentIndex, index, val)}
                                        />
                                    ) : option}
                                </div>

                                {isEditMode && index === currentQuestion.correctAnswer && (
                                    <span style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', color: 'green', fontWeight: 'bold' }}>✔ Correct</span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Hint Button */}
                {!isEditMode && (
                    <button className="quiz-hint-btn" onClick={() => alert(currentQuestion.hint || "Hãy xem những gì nhà sử học nói!")}>
                        <span className="quiz-hint-icon">💡</span>
                        Gợi ý
                    </button>
                )}

                {/* Next Button */}
                {!isEditMode && isAnswered && (
                    <button className="quiz-next-btn" onClick={handleNext}>
                        {currentIndex < questions.length - 1 ? 'Tiếp theo →' : 'Xem kết quả'}
                    </button>
                )}

                {/* Character & Speech Bubble */}
                {(!isEditMode || (isEditMode && currentQuestion.hint)) && (
                    <div className="quiz-character-container">
                        {((isAnswered) || isEditMode) && (
                            <div className="quiz-speech-bubble">
                                <div className="quiz-speech-bubble-header">Nhà sử học gợi ý:</div>
                                <div className="quiz-speech-bubble-text">
                                    {isEditMode ? (
                                        <EditableText
                                            value={currentQuestion.hint || "Nhập gợi ý cho câu hỏi này..."}
                                            onSave={(val) => updateQuestion(currentIndex, 'hint', val)}
                                            multiline
                                        />
                                    ) : (
                                        // BUG 6 fix: điều kiện bị đảo ngược — đúng phải hiện "Chính xác!", sai hiện hint
                                        selectedOption === currentQuestion.correctAnswer
                                            ? "✅ Chính xác! Bạn đã nắm vững kiến thức này."
                                            : (currentQuestion.hint || "Sự kiện này diễn ra vào mùa thu năm 1945 tại Hà Nội.")
                                    )}
                                </div>
                            </div>
                        )}
                        <div style={{ fontSize: '120px', lineHeight: 1, textAlign: 'center' }}>👨‍🏫</div>
                    </div>
                )}

                {isEditMode && (
                    <div className="admin-hint">
                        💡 Click câu trả lời để đặt làm Đáp án đúng. Click văn bản để sửa.
                    </div>
                )}
            </div>

            {isEditMode && (
                <div className="quiz-nav" style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 20 }}>
                    <button disabled={currentIndex === 0} onClick={() => setCurrentIndex(prev => prev - 1)}>← Trước</button>
                    <button disabled={currentIndex === questions.length - 1} onClick={() => setCurrentIndex(prev => prev + 1)}>Sau →</button>
                </div>
            )}
        </div>
    );
};
