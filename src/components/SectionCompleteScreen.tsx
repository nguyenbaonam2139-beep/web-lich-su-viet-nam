import React from "react";
import { LessonSection } from "./LessonOverlay";
import "../section-complete.css";

interface SectionCompleteScreenProps {
    section: LessonSection;
    eventTitle: string;
    eventYear: string | number;
    nextSection: LessonSection | null;
    chapterTitle?: string;
    nextChapterTitle?: string;
    onNext: (section: LessonSection) => void;
    onReturn: () => void;
}

const sectionMeta: Record<LessonSection, { icon: string; label: string; className: string; successMsg: string }> = {
    knowledge: {
        icon: "📖",
        label: "Kiến thức Lịch sử",
        className: "section-complete-icon--knowledge",
        successMsg: "Bạn đã đọc xong phần Kiến thức. Hãy thử sức với bài kiểm tra tiếp theo!",
    },
    quiz: {
        icon: "⚔️",
        label: "Kiểm tra",
        className: "section-complete-icon--quiz",
        successMsg: "Xuất sắc! Bạn đã vượt qua bài kiểm tra. Giờ là lúc khám phá nhân vật lịch sử!",
    },
    character: {
        icon: "👑",
        label: "Nhân vật Lịch sử",
        className: "section-complete-icon--character",
        successMsg: "Tuyệt vời! Bạn đã hoàn thành toàn bộ bài học của sự kiện này.",
    },
    chapter: {
        icon: "📜",
        label: "Chương",
        className: "section-complete-icon--chapter",
        successMsg: "Bạn đã hoàn thành nội dung chương!",
    },
};

const nextSectionMeta: Record<LessonSection, { icon: string; label: string }> = {
    knowledge: { icon: "📖", label: "Kiến thức" },
    quiz: { icon: "⚔️", label: "Bài kiểm tra" },
    character: { icon: "👑", label: "Nhân vật Lịch sử" },
    chapter: { icon: "🚀", label: "Chương tiếp theo" },
};

export const SectionCompleteScreen: React.FC<SectionCompleteScreenProps> = ({
    section,
    eventTitle,
    eventYear,
    nextSection,
    chapterTitle,
    nextChapterTitle,
    onNext,
    onReturn,
}) => {
    const meta = sectionMeta[section];
    const isAllDone = !nextSection;

    return (
        <div className="section-complete-overlay">
            <div className="section-complete-card">
                <div className={`section-complete-icon ${meta.className}`}>
                    {isAllDone ? "🏆" : "✓"}
                </div>

                <div className="section-complete-badge">
                    {eventYear} · {chapterTitle ? `Chương: ${chapterTitle}` : meta.label}
                </div>

                <h2 className="section-complete-title">
                    {isAllDone ? "🎉 Hoàn thành bài học!" : chapterTitle ? `Hoàn thành ${chapterTitle}!` : "Hoàn thành!"}
                </h2>

                <p className="section-complete-subtitle">
                    {isAllDone
                        ? `Bạn đã hoàn thành tất cả nội dung của "${eventTitle}". Xuất sắc!`
                        : `Bạn đã hoàn thành nội dung này. Quay lại để tiếp tục khám phá nhé!`
                    }
                </p>

                <div className="section-complete-actions">
                    {nextSection && (
                        <button
                            className="btn-next-section btn-next-section--primary"
                            onClick={() => onNext(nextSection)}
                        >
                            <span className="btn-icon">{nextSectionMeta[nextSection]?.icon || "🚀"}</span>
                            {nextSection === 'chapter' ? (nextChapterTitle || "Chương tiếp theo") : nextSectionMeta[nextSection]?.label}
                            <span className="btn-arrow">→</span>
                        </button>
                    )}
                    <button
                        className={`btn-next-section ${nextSection ? 'btn-next-section--secondary' : 'btn-next-section--primary'}`}
                        onClick={onReturn}
                    >
                        {nextSection ? "Quay lại tổng quan" : "Hoàn thành bài học"}
                    </button>
                </div>
            </div>
        </div>
    );
};
