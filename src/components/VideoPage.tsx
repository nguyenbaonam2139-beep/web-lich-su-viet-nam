import React from "react";
import { ChapterPage } from "../types";
import { useAdmin } from "../contexts/AdminContext";
import { EditableText } from "./admin/EditableText";
import "./VideoPage.css";

interface VideoPageProps {
    page: ChapterPage;
    onNext: () => void;
    onBack: () => void;
    onAddPage?: (type: ChapterPage['type']) => void;
    onUpdatePage?: (updatedPage: ChapterPage) => void;
}

export const VideoPage: React.FC<VideoPageProps> = ({
    page,
    onNext,
    onBack,
    onAddPage,
    onUpdatePage
}) => {
    const { isEditMode } = useAdmin();
    const [showAddMenu, setShowAddMenu] = React.useState(false);

    const videoMedia = page.media?.find(m => m.type === 'video');
    const videoUrl = videoMedia?.url || "";

    const handleUrlUpdate = (newUrl: string) => {
        if (!onUpdatePage || !page.media) return;
        const newMedia = page.media.map(m =>
            m.type === 'video' ? { ...m, url: newUrl } : m
        );
        onUpdatePage({ ...page, media: newMedia });
    };

    const handleTitleUpdate = (newTitle: string) => {
        if (!onUpdatePage) return;
        onUpdatePage({ ...page, title: newTitle });
    };

    const handleDescriptionUpdate = (newContent: string) => {
        if (!onUpdatePage) return;
        onUpdatePage({ ...page, content: newContent });
    };

    // Helper to convert YouTube URL to Embed URL
    const getEmbedUrl = (url: string) => {
        if (!url) return "";
        let videoId = "";
        if (url.includes("youtube.com/watch?v=")) {
            videoId = url.split("v=")[1].split("&")[0];
        } else if (url.includes("youtu.be/")) {
            videoId = url.split("youtu.be/")[1].split("?")[0];
        } else if (url.includes("youtube.com/embed/")) {
            return url;
        }

        if (videoId) {
            return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0`;
        }
        return url;
    };

    const embedUrl = getEmbedUrl(videoUrl);

    return (
        <div className="video-page-overlay animate-fade-in">
            <div className="video-page-container">
                <header className="video-header">
                    <button className="btn-back-video" onClick={onBack}>
                        ← Quay lại
                    </button>
                    <div className="video-title-area">
                        <EditableText
                            value={page.title || "Tư liệu lịch sử"}
                            onSave={handleTitleUpdate}
                            tagName="h2"
                            className="video-main-title"
                        />
                    </div>
                    <div className="video-header-spacer"></div>
                </header>

                <div className="video-content-layout">
                    <div className="video-player-frame">
                        <div className="video-aspect-ratio">
                            {embedUrl ? (
                                <iframe
                                    src={embedUrl}
                                    title={page.title}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            ) : (
                                <div className="video-placeholder">
                                    <span>Chưa có video được thiết lập</span>
                                </div>
                            )}
                        </div>
                        {isEditMode && (
                            <div className="admin-video-controls">
                                <label>URL Video (YouTube):</label>
                                <input
                                    type="text"
                                    value={videoUrl}
                                    onChange={(e) => handleUrlUpdate(e.target.value)}
                                    placeholder="https://www.youtube.com/watch?v=..."
                                />
                            </div>
                        )}
                    </div>

                    <aside className="video-description">
                        <div className="description-scroll">
                            <h3 className="description-label">Về đoạn phim này</h3>
                            <EditableText
                                value={page.content || "Cung cấp thêm thông tin về tư liệu hình ảnh này để người học dễ dàng nắm bắt."}
                                onSave={handleDescriptionUpdate}
                                multiline
                                className="video-description-text"
                            />
                        </div>
                        <div className="video-actions">
                            {isEditMode && onAddPage && (
                                <div className="admin-add-page-container inline">
                                    <button
                                        className={`btn-add-page small ${showAddMenu ? 'active' : ''}`}
                                        onClick={() => setShowAddMenu(!showAddMenu)}
                                        title="Thêm trang mới"
                                    >
                                        <span className="add-icon">+</span>
                                    </button>

                                    {showAddMenu && (
                                        <div className="add-page-menu left animate-slide-up">
                                            <button onClick={() => { onAddPage('knowledge'); setShowAddMenu(false); }}>📖 Kiến thức</button>
                                            <button onClick={() => { onAddPage('video'); setShowAddMenu(false); }}>🎬 Video</button>
                                            <button onClick={() => { onAddPage('quiz'); setShowAddMenu(false); }}>❓ Câu hỏi</button>
                                            <button onClick={() => { onAddPage('character'); setShowAddMenu(false); }}>👤 Nhân vật</button>
                                        </div>
                                    )}
                                </div>
                            )}
                            <button className="btn-video-next" onClick={onNext}>
                                Tiếp tục bài học →
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
};
