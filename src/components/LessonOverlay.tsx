import React, { useState, useEffect } from "react";
import { TimelineEvent, Chapter, ChapterPage } from "../types";
import { Quiz } from "./Quiz";
import { CharacterGuess } from "./CharacterGuess";
import { KnowledgeAccordionLayout } from "./KnowledgeAccordionLayout";
import { ChapterReadingPage } from "./ChapterReadingPage";
import { VideoPage } from "./VideoPage";
import { useAdmin } from "../contexts/AdminContext";

export type LessonSection = "knowledge" | "quiz" | "character" | "chapter";

interface LessonOverlayProps {
    event: TimelineEvent;
    section?: LessonSection; // Legacy, kept for compatibility
    onBack: () => void;
    onComplete: (section: LessonSection, chapterId?: string) => void;
    onUpdate?: (event: TimelineEvent) => void;
    completedChapters?: string[];
}

export const LessonOverlay: React.FC<LessonOverlayProps> = ({ event, section: initialSection, onBack, onComplete, onUpdate, completedChapters = [] }) => {
    const { isEditMode } = useAdmin();
    // Memoize synthetic chapters to avoid recreation on every render
    const effectiveChapters = React.useMemo(() => {
        return (event.chapters && event.chapters.length > 0)
            ? event.chapters
            : [{
                id: 'legacy-chapter',
                title: 'Chương khởi đầu',
                icon: '📜',
                description: ['Khám phá nội dung sự kiện.'],
                pages: [
                    ...(event.knowledgeSections?.[0]?.pages.map((p, i) => ({
                        id: `legacy-km-${i}`,
                        type: 'knowledge' as const,
                        content: p,
                        title: event.knowledgeSections?.[0]?.title || event.title
                    })) || [{
                        id: 'legacy-km-0',
                        type: 'knowledge' as const,
                        content: event.detail,
                        title: event.title
                    }]),
                    ...(event.questions && event.questions.length > 0 ? [{
                        id: 'legacy-quiz',
                        type: 'quiz' as const,
                    }] : []),
                    ...(event.interactionId ? [{
                        id: 'legacy-character',
                        type: 'character' as const,
                        interactionId: event.interactionId
                    }] : []),
                ]
            } as Chapter];
    }, [event.id, event.chapters, event.knowledgeSections, event.questions, event.interactionId, event.detail, event.title]);

    // Always start with no chapter selected — session-only state.
    // Do NOT read from localStorage: stale chapter IDs cause an invisible
    // fixed-position blocking div that makes the UI completely unresponsive.
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(() => {
        // If an initial section is provided (e.g. from Timeline menu), use it for legacy chapters
        if (initialSection && initialSection !== 'chapter' && effectiveChapters[0]?.id === 'legacy-chapter') {
            return 'legacy-chapter';
        }
        return null;
    });

    const [currentPageIndex, setCurrentPageIndex] = useState(() => {
        // Jump to correct page if initialSection is provided
        if (initialSection && initialSection !== 'chapter' && effectiveChapters[0]?.id === 'legacy-chapter') {
            const index = effectiveChapters[0].pages.findIndex(p => p.type === initialSection);
            if (index !== -1) return index;
        }
        return 0;
    });

    // NOTE: selectedChapterId and currentPageIndex are intentionally NOT persisted to localStorage.
    // Persisting them caused stale chapter IDs to be restored, creating an invisible
    // blocking overlay on the next session.

    useEffect(() => {
        // If someone clicks a different section from the menu after it's already open
        if (initialSection && initialSection !== 'chapter' && effectiveChapters[0].id === 'legacy-chapter') {
            const index = effectiveChapters[0].pages.findIndex(p => p.type === initialSection);
            if (index !== -1) {
                setSelectedChapterId('legacy-chapter');
                setCurrentPageIndex(index);
            }
        }
    }, [initialSection, effectiveChapters]);

    // Validate selectedChapterId against effectiveChapters
    useEffect(() => {
        if (selectedChapterId && !effectiveChapters.find(c => c.id === selectedChapterId)) {
            setSelectedChapterId(null);
            setCurrentPageIndex(0);
        }
    }, [selectedChapterId, effectiveChapters]);

    const selectedChapter = effectiveChapters.find(c => c.id === selectedChapterId) || null;
    const currentPage = selectedChapter?.pages[currentPageIndex];

    const handleChapterSelect = (chapterId: string) => {
        setSelectedChapterId(chapterId);
        setCurrentPageIndex(0);
    };

    const handleNextPage = () => {
        if (!selectedChapter) return;

        if (currentPageIndex < selectedChapter.pages.length - 1) {
            setCurrentPageIndex(prev => prev + 1);
        } else {
            // Chapter complete
            onComplete("chapter", selectedChapter.id);
            setSelectedChapterId(null);
            setCurrentPageIndex(0);
        }
    };

    const handleInteractionComplete = () => {
        handleNextPage();
    };

    // Filtered data for interactions
    const getFilteredQuestions = () => {
        if (currentPage?.interactionData?.questions) return currentPage.interactionData.questions;
        if (currentPage?.interactionId) {
            return (event.questions || []).filter(q => q.id === currentPage.interactionId);
        }
        return event.questions || [];
    };

    const handlePageUpdate = (updatedPage: ChapterPage) => {
        if (!selectedChapterId || !selectedChapter || !onUpdate) return;

        const newPages = [...selectedChapter.pages];
        newPages[currentPageIndex] = updatedPage;

        const newChapter = { ...selectedChapter, pages: newPages };
        const newChapters = effectiveChapters.map(c => c.id === selectedChapterId ? newChapter : c);

        // Call parent update immediately
        onUpdate({ ...event, chapters: newChapters });
    };

    const handleAddPage = (type: ChapterPage['type']) => {
        if (!selectedChapterId || !selectedChapter || !onUpdate) return;

        const newPage: ChapterPage = {
            id: `page-${Date.now()}`,
            type,
            title: type === 'knowledge' ? "Nội dung mới" :
                type === 'video' ? "Video mới" :
                    type === 'quiz' ? "Kiểm tra kiến thức" : "Thử thách nhân vật",
            content: type === 'knowledge' ? "Cập nhật nội dung tại đây..." : ""
        };

        if (type === 'video') {
            newPage.media = [{ url: "", type: 'video', position: 'center' }];
        }

        const newPages = [...selectedChapter.pages, newPage];
        const newChapter = { ...selectedChapter, pages: newPages };
        const newChapters = effectiveChapters.map(c => c.id === selectedChapterId ? newChapter : c);

        onUpdate({ ...event, chapters: newChapters });

        // Jump to the new page
        setCurrentPageIndex(newPages.length - 1);
    };

    // Base Wrapper logic: Render NOTHING if we are in an invalid state.
    // This prevents the "transparent trap" where an invisible layer blocks the timeline.

    // CASE 1: No chapter selected -> Show Milestone Overview
    if (!selectedChapterId) {
        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'rgba(15, 23, 42, 0.8)', // Semi-solid background so user knows they are in an overlay
                overflowY: 'auto',
                height: '100vh',
                display: 'block'
            }}>
                <div className="lesson-overlay">
                    <KnowledgeAccordionLayout
                        event={{ ...event, chapters: effectiveChapters }}
                        completedChapterIds={completedChapters}
                        onComplete={() => {/* Milestone complete logic */ }}
                        onBack={onBack}
                        onUpdate={onUpdate}
                        onSectionClick={handleChapterSelect}
                    />
                </div>
            </div>
        );
    }

    // CASE 2: Chapter selected and valid -> Show Chapter Flow
    if (selectedChapter) {
        if (!currentPage) {
            return (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ textAlign: 'center', color: '#fff' }}>
                        <p style={{ marginBottom: '20px', fontSize: '18px', opacity: 0.7 }}>Chương này hiện chưa có nội dung.</p>
                        {isEditMode && (
                            <button
                                className="btn-nav primary"
                                onClick={() => handleAddPage('knowledge')}
                            >
                                + Thêm trang đầu tiên
                            </button>
                        )}
                        {!isEditMode && (
                            <button className="btn-nav secondary" onClick={() => setSelectedChapterId(null)}>
                                Quay lại
                            </button>
                        )}
                    </div>
                </div>
            );
        }

        return (
            <div style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                background: 'transparent', // Flow pages handle their own background
                overflowY: 'auto',
                height: '100vh',
                display: 'block'
            }}>
                <div className="chapter-flow-container">
                    {currentPage.type === 'knowledge' && (
                        <ChapterReadingPage
                            chapter={selectedChapter}
                            currentPageIndex={currentPageIndex}
                            onNext={handleNextPage}
                            onBack={() => {
                                if (currentPageIndex > 0) {
                                    setCurrentPageIndex(prev => prev - 1);
                                } else {
                                    setSelectedChapterId(null);
                                }
                            }}
                            onAddPage={handleAddPage}
                            onClose={() => setSelectedChapterId(null)}
                            onUpdatePage={handlePageUpdate}
                            isLastPage={currentPageIndex === selectedChapter.pages.length - 1}
                        />
                    )}

                    {currentPage.type === 'quiz' && (
                        <div className="quiz-container-wrapper" style={{ position: 'fixed', inset: 0, zIndex: 10001, overflowY: 'auto' }}>
                            <Quiz
                                questions={getFilteredQuestions()}
                                eventId={event.id}
                                chapterId={selectedChapter.id}
                                pageId={currentPage.id}
                                eventTitle={selectedChapter.title}
                                eventYear={event.year}
                                onComplete={handleInteractionComplete}
                                onExit={() => setSelectedChapterId(null)}
                                isLastPage={currentPageIndex === selectedChapter.pages.length - 1}
                                nextPageType={selectedChapter.pages[currentPageIndex + 1]?.type}
                            />
                        </div>
                    )}
                    {currentPage.type === 'character' && (
                        <div className="character-guess-wrapper" style={{ position: 'fixed', inset: 0, zIndex: 10001, overflowY: 'auto' }}>
                            <CharacterGuess
                                event={event}
                                interactionId={currentPage.interactionId}
                                chapterId={selectedChapter.id}
                                pageId={currentPage.id}
                                onComplete={handleInteractionComplete}
                                onBack={() => setSelectedChapterId(null)}
                            />
                        </div>
                    )}

                    {currentPage.type === 'video' && (
                        <VideoPage
                            page={currentPage}
                            onNext={handleNextPage}
                            onBack={() => {
                                if (currentPageIndex > 0) {
                                    setCurrentPageIndex(prev => prev - 1);
                                } else {
                                    setSelectedChapterId(null);
                                }
                            }}
                            onAddPage={handleAddPage}
                            onUpdatePage={handlePageUpdate}
                        />
                    )}
                </div>
            </div>
        );
    }

    // CASE 3: Inconsistent state (selectedChapterId exists but chapter/page not found)
    // Fallback: Clear the ID so CASE 1 can render on next cycle, and return NULL for now to clear the trap.
    return null;
};
