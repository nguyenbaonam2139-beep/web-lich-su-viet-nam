import React, { useState, useEffect } from "react";
import { TimelineEvent } from "../types";
import { Quiz } from "./Quiz";

interface LessonModalProps {
    event: TimelineEvent;
    onClose: () => void;
    onComplete: () => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({ event, onClose, onComplete }) => {
    const [expandedSection, setExpandedSection] = useState<"theory" | "quiz" | null>("theory");
    const [canTakeQuiz, setCanTakeQuiz] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15);

    useEffect(() => {
        if (timeLeft > 0) {
            const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setCanTakeQuiz(true);
        }
    }, [timeLeft]);

    const toggleSection = (section: "theory" | "quiz") => {
        if (section === "quiz" && !canTakeQuiz) return;
        setExpandedSection(prev => prev === section ? null : section);
    };

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal lesson-modal" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>×</button>

                <div className="modal-header">
                    <span className="modal-year">{event.year}</span>
                    <h2>{event.title}</h2>
                </div>

                <div className="mission-container">
                    {/* Mission 1: Theory */}
                    <div className={`mission-item ${expandedSection === 'theory' ? 'expanded' : ''} ${timeLeft === 0 ? 'completed' : ''}`}>
                        <div className="mission-header" onClick={() => toggleSection('theory')}>
                            <div className="mission-title">
                                <span className="mission-icon">📖</span>
                                <span>Nhiệm vụ 1: Khám phá Lịch sử</span>
                            </div>
                            <div className="mission-status">
                                {timeLeft > 0 ? (
                                    <span className="timer-badge">{timeLeft}s...</span>
                                ) : (
                                    <span className="status-icon">✓</span>
                                )}
                            </div>
                        </div>
                        {expandedSection === 'theory' && (
                            <div className="mission-body">
                                <div className="modal-body">
                                    {event.imageUrl && (
                                        <div className="modal-image-wrapper">
                                            <img src={event.imageUrl} alt={event.title} className="modal-image" />
                                        </div>
                                    )}
                                    <div className="modal-detail">
                                        {event.detail.split("\n\n").map((paragraph, idx) => (
                                            <p key={idx} style={{ marginBottom: '15px' }}>{paragraph}</p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Mission 2: Quiz */}
                    <div className={`mission-item ${expandedSection === 'quiz' ? 'expanded' : ''} ${!canTakeQuiz ? 'locked' : ''}`}>
                        <div className="mission-header" onClick={() => toggleSection('quiz')}>
                            <div className="mission-title">
                                <span className="mission-icon">⚔️</span>
                                <span>Nhiệm vụ 2: Thử thách</span>
                            </div>
                            <div className="mission-status">
                                {!canTakeQuiz ? (
                                    <span className="lock-icon">🔒</span>
                                ) : (
                                    <span className="status-text">Sẵn sàng</span>
                                )}
                            </div>
                        </div>
                        {expandedSection === 'quiz' && (
                            <div className="mission-body">
                                <div className="lesson-quiz">
                                    {event.questions && event.questions.length > 0 ? (
                                        <Quiz questions={event.questions} onComplete={onComplete} onExit={onClose} />
                                    ) : (
                                        <div className="no-questions">
                                            <p>Chưa có câu hỏi cho bài học này.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
