import React from "react";
import { Chapter, ChapterPage } from "../types";
import { useAdmin } from "../contexts/AdminContext";
import { EditableImage } from "./admin/EditableImage";
import { EditableText } from "./admin/EditableText";
import "./ChapterReadingPage.css";

interface ChapterReadingPageProps {
    chapter: Chapter;
    currentPageIndex: number;
    onNext: () => void;
    onBack: () => void;
    onClose: () => void;
    onUpdatePage?: (updatedPage: ChapterPage) => void;
    onAddPage?: (type: ChapterPage['type']) => void;
    isLastPage: boolean;
}

export const ChapterReadingPage: React.FC<ChapterReadingPageProps> = ({
    chapter,
    currentPageIndex,
    onNext,
    onBack,
    onClose,
    onUpdatePage,
    onAddPage,
    isLastPage
}) => {
    const page = chapter.pages[currentPageIndex];
    const { isEditMode } = useAdmin();
    const [showAddMenu, setShowAddMenu] = React.useState(false);

    if (!page || page.type !== 'knowledge') return null;

    const handleMediaUpdate = (index: number, newUrl: string) => {
        if (!page.media || !onUpdatePage) return;
        const newMedia = [...page.media];
        newMedia[index] = { ...newMedia[index], url: newUrl };
        onUpdatePage({ ...page, media: newMedia });
    };

    const handleTitleUpdate = (newTitle: string) => {
        if (!onUpdatePage) return;
        onUpdatePage({ ...page, title: newTitle });
    };

    const handleContentUpdate = (newContent: string) => {
        if (!onUpdatePage) return;
        onUpdatePage({ ...page, content: newContent });
    };

    return (
        <div className="chapter-reading-overlay">
            <div className="chapter-reading-container animate-fade-in">
                {/* Header */}
                <header className="chapter-header">
                    <button className="btn-back-chapter" onClick={onClose}>
                        <span className="back-icon">←</span> Quay lại
                    </button>
                    <div className="chapter-info">
                        <span className="chapter-icon">{chapter.icon}</span>
                        <div className="chapter-titles">
                            <span className="chapter-breadcrumb">{chapter.title}</span>
                            <div className="page-title">
                                <EditableText
                                    value={page.title || "Chi tiết nội dung"}
                                    onSave={handleTitleUpdate}
                                    tagName="h2"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="page-progress">
                        Trang {currentPageIndex + 1} / {chapter.pages.length}
                    </div>
                </header>

                {/* Main Scrollable Content */}
                <main className="chapter-content-scroll">
                    <div className="reading-layout">
                        {/* Left Side Media */}
                        <div className="side-media left">
                            {page.media?.map((m, i) => m.position === 'left' && (
                                <div key={i} className="media-item">
                                    <EditableImage
                                        imageUrl={m.url}
                                        alt={m.caption || "Minh họa"}
                                        onSave={(url) => handleMediaUpdate(i, url)}
                                    />
                                    {m.caption && <p className="media-caption">{m.caption}</p>}
                                </div>
                            ))}
                        </div>

                        {/* Center Text */}
                        <article className="center-text">
                            <EditableText
                                value={page.content || ""}
                                onSave={handleContentUpdate}
                                multiline
                                className="content-paragraph"
                                tagName="div"
                            />

                            {/* Center Media (Inline) */}
                            <div className="inline-media">
                                {page.media?.map((m, i) => m.position === 'center' && (
                                    <div key={i} className="media-item center">
                                        <EditableImage
                                            imageUrl={m.url}
                                            alt={m.caption || "Minh họa"}
                                            onSave={(url) => handleMediaUpdate(i, url)}
                                        />
                                        {m.caption && <p className="media-caption">{m.caption}</p>}
                                    </div>
                                ))}
                            </div>
                        </article>

                        {/* Right Side Media */}
                        <div className="side-media right">
                            {page.media?.map((m, i) => m.position === 'right' && (
                                <div key={i} className="media-item">
                                    <EditableImage
                                        imageUrl={m.url}
                                        alt={m.caption || "Minh họa"}
                                        onSave={(url) => handleMediaUpdate(i, url)}
                                    />
                                    {m.caption && <p className="media-caption">{m.caption}</p>}
                                </div>
                            ))}
                        </div>
                    </div>
                </main>

                {/* Footer Navigation */}
                <footer className="chapter-footer">
                    <button
                        className="btn-nav secondary"
                        onClick={onBack}
                        disabled={currentPageIndex === 0}
                    >
                        ← Trang trước
                    </button>

                    {isEditMode && onAddPage && (
                        <div className="admin-add-page-container">
                            <button
                                className={`btn-add-page ${showAddMenu ? 'active' : ''}`}
                                onClick={() => setShowAddMenu(!showAddMenu)}
                                title="Thêm trang mới"
                            >
                                <span className="add-icon">+</span>
                            </button>

                            {showAddMenu && (
                                <div className="add-page-menu animate-slide-up">
                                    <button onClick={() => { onAddPage('knowledge'); setShowAddMenu(false); }}>
                                        📖 Kiến thức
                                    </button>
                                    <button onClick={() => { onAddPage('video'); setShowAddMenu(false); }}>
                                        🎬 Video
                                    </button>
                                    <button onClick={() => { onAddPage('quiz'); setShowAddMenu(false); }}>
                                        ❓ Câu hỏi
                                    </button>
                                    <button onClick={() => { onAddPage('character'); setShowAddMenu(false); }}>
                                        👤 Nhân vật
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <button className="btn-nav primary" onClick={onNext}>
                        {(() => {
                            if (isLastPage) return "Hoàn thành chương ✓";
                            const nextPageIndex = currentPageIndex + 1;
                            const nextPage = chapter.pages[nextPageIndex];

                            if (nextPage?.type === 'quiz') return "Kiểm tra kiến thức →";
                            if (nextPage?.type === 'character') return "Thử thách nhân vật →";
                            if (nextPage?.type === 'video') return "Xem Video →";
                            return "Trang tiếp theo →";
                        })()}
                    </button>
                </footer>
            </div>
        </div>
    );
};
