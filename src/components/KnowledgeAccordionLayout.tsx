import React, { useState, useEffect } from "react";
import { TimelineEvent, KnowledgeSection, Chapter } from "../types";
import { KnowledgeTaskItem } from "./KnowledgeTaskItem";
import { ProgressBar } from "./ProgressBar";
import { SectionDetailModal } from "./SectionDetailModal";
import { LuxuryExperience } from "./LuxuryExperience";
import { useContent } from "../contexts/ContentContext";
import { useAdmin } from "../contexts/AdminContext";
import { EditableText } from "./admin/EditableText";
import { EditableImage } from "./admin/EditableImage";
import { updateTimelineEvent } from "../api";
import "./LuxuryExperience.css";

interface KnowledgeAccordionLayoutProps {
    event: TimelineEvent;
    onComplete: () => void;
    onBack: () => void;
    onUpdate?: (event: TimelineEvent) => void;
    onSectionClick?: (sectionId: string) => void;
    completedChapterIds?: string[];
    onChapterComplete?: (chapterId: string) => void;
}

export function KnowledgeAccordionLayout({
    event, onComplete, onBack, onUpdate, onSectionClick,
    completedChapterIds = [], onChapterComplete
}: KnowledgeAccordionLayoutProps) {
    const { getHeaders, saveKnowledge } = useContent();
    const { user, isEditMode, isAdmin } = useAdmin();
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [showLuxury, setShowLuxury] = useState(false);

    // Đọc trạng thái luxury từ localStorage để hiện badge "Đã mở khóa"
    const luxuryKey = user?.id ? `hiss_luxury_${user.id}_${event.id}` : null;
    const [isLuxuryUnlocked, setIsLuxuryUnlocked] = useState(false);
    useEffect(() => {
        if (luxuryKey) setIsLuxuryUnlocked(localStorage.getItem(luxuryKey) === 'true');
    }, [luxuryKey]);

    useEffect(() => {
        setChapters(event.chapters || []);
    }, [event.chapters, event.id]);

    const selectedChapter = chapters.find(c => c.id === selectedSectionId) || null;

    const handleSectionClick = (chapter: Chapter) => {
        if (onSectionClick) {
            onSectionClick(chapter.id);
        } else {
            setSelectedSectionId(chapter.id);
        }
    };

    const handleSectionComplete = () => {
        if (selectedSectionId && onChapterComplete) {
            onChapterComplete(selectedSectionId);
            setSelectedSectionId(null);

            if (completedChapterIds.length + 1 >= chapters.length) {
                onComplete();
            }
        }
    };

    const handleCloseModal = () => {
        setSelectedSectionId(null);
    };

    // Helper to sync chapter changes
    const syncChapters = async (newChapters: Chapter[]) => {
        setChapters(newChapters);
        try {
            // Update the whole event object via the API logic
            const updatedEvent = { ...event, chapters: newChapters };
            await updateTimelineEvent(updatedEvent);
            if (onUpdate) onUpdate(updatedEvent);
        } catch (error) {
            console.error("Lỗi khi lưu dữ liệu chương!", error);
            setChapters(event.chapters || []);
        }
    };

    const handleAddChapter = () => {
        const newChapter: Chapter = {
            id: `chapter-${Date.now()}`,
            title: 'Chương mới',
            icon: '📜',
            pages: [
                { id: `page-${Date.now()}`, type: 'knowledge', title: 'Nội dung khởi đầu', content: 'Cập nhật nội dung tại đây...' }
            ],
            description: ['Mô tả ngắn gọn về chương.']
        };
        syncChapters([...chapters, newChapter]);
    };

    const handleDeleteChapter = (chapterId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm("Bạn có chắc chắn muốn xóa chương này?")) {
            syncChapters(chapters.filter(c => c.id !== chapterId));
        }
    };

    // Handle Event Title/Description updates
    const handleEventUpdate = async (field: 'title' | 'description' | 'imageUrl', value: string) => {
        const updatedEvent = { ...event, [field]: value };
        try {
            await updateTimelineEvent(updatedEvent);
            if (onUpdate) onUpdate(updatedEvent);
        } catch (e) {
            console.error("Lỗi lưu sự kiện", e);
        }
    };

    const getChapterSummary = (chapter: Chapter): string[] => {
        let knowledgeCount = 0;
        let quizCount = 0;
        let characterCount = 0;

        chapter.pages.forEach(page => {
            if (page.type === 'knowledge') knowledgeCount++;
            else if (page.type === 'quiz') {
                // Count specifically the questions if present
                if (page.interactionData?.questions) {
                    quizCount += page.interactionData.questions.length;
                } else {
                    quizCount++; // Fallback to 1 question per quiz page
                }
            }
            else if (page.type === 'character') characterCount++;
        });

        const summary = [];
        if (knowledgeCount > 0) summary.push(`${knowledgeCount} kiến thức`);
        if (quizCount > 0) summary.push(`${quizCount} câu hỏi`);
        if (characterCount > 0) summary.push(`${characterCount} thử thách`);

        return summary.length > 0 ? [summary.join(' • ')] : ['Trống'];
    };

    return (
        <>
            <div className="knowledge-accordion-layout">
                {/* Header */}
                <div className="accordion-header">
                    <button className="btn-back" onClick={onBack}>
                        ← Quay lại
                    </button>
                    <div className="accordion-title-section">
                        <div className="accordion-title">
                            <EditableText
                                value={event.title}
                                onSave={(val) => handleEventUpdate('title', val)}
                                tagName="h1"
                            />
                        </div>
                        <p className="accordion-subtitle">Khám phá qua từng chương lịch sử</p>
                        <div className="accordion-description">
                            <EditableText
                                value={event.description || "Mô tả sự kiện..."}
                                onSave={(val) => handleEventUpdate('description', val)}
                                multiline
                            />
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="accordion-content-grid">
                    {/* Left: Event Image */}
                    <div className="accordion-image-section">
                        <EditableImage
                            imageUrl={event.imageUrl || "/placeholder-event.jpg"}
                            alt={event.title}
                            className="accordion-event-image"
                            onSave={(newUrl) => handleEventUpdate('imageUrl', newUrl)}
                        />
                        <p className="image-caption">
                            {event.detail ? event.detail.substring(0, 100) + "..." : event.title}
                        </p>
                    </div>

                    {/* Right: Chapter List */}
                    <div className="accordion-tasks-section">
                        <h3 className="section-title">Danh sách chương học</h3>
                        {chapters.map((chapter) => (
                            <div key={chapter.id} style={{ position: 'relative' }}>
                                <KnowledgeTaskItem
                                    icon={chapter.icon}
                                    title={
                                        isEditMode ? (
                                            <EditableText
                                                value={chapter.title}
                                                onSave={(val) => {
                                                    const updated = chapters.map(c => c.id === chapter.id ? { ...c, title: val } : c);
                                                    syncChapters(updated);
                                                }}
                                            />
                                        ) : chapter.title
                                    }
                                    description={getChapterSummary(chapter)}
                                    isCompleted={completedChapterIds.includes(chapter.id)}
                                    onClick={() => handleSectionClick(chapter)}
                                />
                                {isEditMode && (
                                    <button
                                        className="admin-action-btn delete"
                                        style={{ position: 'absolute', top: 10, right: 10, zIndex: 100 }}
                                        onClick={(e) => handleDeleteChapter(chapter.id, e)}
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* Luxury Experience — same shape as chapters, placed right after last chapter */}
                        {!isEditMode && (
                            <div
                                className={`knowledge-task-item luxury-task-item ${isLuxuryUnlocked ? 'luxury-unlocked' : ''
                                    }`}
                                onClick={() => setShowLuxury(true)}
                            >
                                <div className="task-icon">👑</div>
                                <div className="task-content">
                                    <div className="task-title">Trải Nghiệm Luxury</div>
                                    <div className="task-description">
                                        Giải mã nhân vật &amp; khám phá bản đồ câu chuyện
                                    </div>
                                </div>
                                <div className="task-status luxury-task-badge">
                                    {isLuxuryUnlocked
                                        ? <span className="luxury-entry-unlocked-badge">✓ Đã mở</span>
                                        : <span className="luxury-entry-lock-price">🔒 100 Tokens</span>
                                    }
                                </div>
                            </div>
                        )}

                        {isEditMode && (
                            <button className="admin-add-btn" onClick={handleAddChapter}>
                                + Thêm chương mới
                            </button>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <ProgressBar
                    total={chapters.length}
                    completed={completedChapterIds.filter(id => chapters.some(c => c.id === id)).length}
                />

            </div>

            {/* Luxury fullscreen overlay — render outside chapter list */}
            {
                showLuxury && (
                    <LuxuryExperience
                        event={event}
                        onBack={() => {
                            setShowLuxury(false);
                            // Re-check unlock state sau khi trở về (user vừa unlock)
                            if (luxuryKey) setIsLuxuryUnlocked(localStorage.getItem(luxuryKey) === 'true');
                        }}
                    />
                )
            }
        </>
    );
}
