import React, { useState, useEffect } from "react";
import { EditableText } from "./admin/EditableText";
import { useAdmin } from "../contexts/AdminContext";

interface KnowledgeSection {
    id: string;
    title: string;
    icon: string;
    pages: string[];
}

interface SectionDetailModalProps {
    section: KnowledgeSection;
    onComplete: (sectionId: string) => void;
    onClose: () => void;
    onUpdate?: (field: string, value: any) => void;
}

export const SectionDetailModal: React.FC<SectionDetailModalProps> = ({
    section,
    onComplete,
    onClose,
    onUpdate
}) => {
    const { isEditMode, isAdmin } = useAdmin();
    const [currentPage, setCurrentPage] = useState(0);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [canComplete, setCanComplete] = useState(false);

    useEffect(() => {
        // Reset timer when page changes
        setTimeElapsed(0);

        if (isAdmin) {
            setCanComplete(true);
            return;
        }

        setCanComplete(false);

        // Start 5-second timer
        const interval = setInterval(() => {
            setTimeElapsed(prev => {
                const newTime = prev + 1;
                if (newTime >= 5) {
                    setCanComplete(true);
                    clearInterval(interval);
                    return 5;
                }
                return newTime;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [currentPage]);

    const isLastPage = currentPage === section.pages.length - 1;
    const showCompleteButton = isLastPage && canComplete;
    const remainingTime = 5 - timeElapsed;

    const handleNext = () => {
        if (currentPage < section.pages.length - 1) {
            setCurrentPage(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    };

    const handleComplete = () => {
        onComplete(section.id);
    };

    const handleAddPage = () => {
        if (onUpdate) {
            const newPages = [...section.pages, "New page content..."];
            onUpdate('pages', newPages);
            setCurrentPage(newPages.length - 1);
        }
    };

    const handleDeletePage = () => {
        if (onUpdate && section.pages.length > 0) {
            const newPages = section.pages.filter((_, i) => i !== currentPage);
            onUpdate('pages', newPages);
            if (currentPage >= newPages.length) {
                setCurrentPage(Math.max(0, newPages.length - 1));
            }
        }
    };

    return (
        <div className="section-detail-overlay" onClick={onClose}>
            <div className="section-detail-modal" onClick={(e) => e.stopPropagation()}>
                {/* ... existing header ... */}
                <div className="modal-header">
                    <div className="modal-title">
                        <span className="modal-icon">{section.icon}</span>
                        <div style={{ flex: 1 }}>
                            <EditableText
                                value={section.title}
                                onSave={(val) => onUpdate && onUpdate('title', val)}
                                tagName="h2"
                            />
                        </div>
                    </div>
                    <button className="btn-close-modal" onClick={onClose}>✕</button>
                </div>

                <div className="page-indicator">
                    Trang {section.pages.length > 0 ? currentPage + 1 : 0} / {section.pages.length}
                </div>

                <div className="modal-content">
                    {section.pages.length > 0 ? (
                        <EditableText
                            value={section.pages[currentPage]}
                            onSave={(val) => {
                                if (onUpdate) {
                                    const newPages = [...section.pages];
                                    newPages[currentPage] = val;
                                    onUpdate('pages', newPages);
                                }
                            }}
                            multiline
                            className="page-content-editable"
                            placeholder="Click to edit content..."
                        />
                    ) : (
                        <div className="empty-state">No pages defined. Add one below.</div>
                    )}
                </div>

                <div className="modal-footer">
                    <div className="footer-left">
                        {isEditMode && (
                            <div className="admin-page-controls">
                                <button className="btn-admin-action add" onClick={handleAddPage}>+ Page</button>
                                {section.pages.length > 0 && (
                                    <button className="btn-admin-action delete" onClick={handleDeletePage}>🗑️ Page</button>
                                )}
                            </div>
                        )}
                        {!isEditMode && !canComplete && isLastPage && (
                            <div className="reading-timer">
                                <div className="timer-icon">⏱️</div>
                                <div className="timer-text">Đang đọc... {remainingTime}s</div>
                                <div className="timer-progress" style={{ width: `${(timeElapsed / 5) * 100}%` }}></div>
                            </div>
                        )}
                    </div>

                    <div className="footer-right">
                        {currentPage > 0 && (
                            <button className="btn-nav-page" onClick={handlePrevious}>
                                ← Trang trước
                            </button>
                        )}

                        {!isLastPage && section.pages.length > 0 && (
                            <button className="btn-nav-page btn-next" onClick={handleNext}>
                                Trang tiếp →
                            </button>
                        )}

                        {showCompleteButton && !isEditMode && (
                            <button className="btn-complete-section" onClick={handleComplete}>
                                ✓ Đánh dấu hoàn thành
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
