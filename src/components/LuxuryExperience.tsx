import React, { useState, useEffect } from 'react';
import { TimelineEvent } from '../types';
import { useAdmin } from '../contexts/AdminContext';
import { CharacterGuess } from './CharacterGuess';
import { StoryMap } from './StoryMap';
import './LuxuryExperience.css';

const LUXURY_COST = 100;

interface LuxuryExperienceProps {
    event: TimelineEvent;
    onBack: () => void;
}

type LuxuryTab = 'character' | 'map' | 'complete';

export const LuxuryExperience: React.FC<LuxuryExperienceProps> = ({ event, onBack }) => {
    const { user, tokens, spendTokens } = useAdmin();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [activeTab, setActiveTab] = useState<LuxuryTab>('character');

    const storageKey = user?.id ? `hiss_luxury_${user.id}_${event.id}` : null;

    useEffect(() => {
        if (storageKey) {
            setIsUnlocked(localStorage.getItem(storageKey) === 'true');
        }
    }, [storageKey]);

    const handleUnlock = async () => {
        setErrorMsg('');
        setIsLoading(true);
        const success = await spendTokens(LUXURY_COST);
        if (success) {
            if (storageKey) localStorage.setItem(storageKey, 'true');
            setIsUnlocked(true);
        } else {
            setErrorMsg(`Không đủ Token! Bạn cần ${LUXURY_COST} Token (hiện có ${tokens}).`);
        }
        setIsLoading(false);
    };

    // ─── LOCK SCREEN ───────────────────────────────────────────────
    if (!isUnlocked) {
        return (
            <div className="luxury-lock-screen">
                <div className="luxury-lock-card">
                    <div className="luxury-lock-inner">
                        <span className="luxury-lock-icon">👑</span>
                        <h2 className="luxury-lock-title">Trải Nghiệm Luxury</h2>
                        <p className="luxury-lock-desc">
                            Nội dung cao cấp dành riêng cho giai đoạn lịch sử này.
                            Mở khóa để trải nghiệm đoán nhân vật và khám phá bản đồ cứ điểm.
                        </p>

                        <div className="luxury-price-tag">
                            <span>🪙</span>
                            <span>{LUXURY_COST} Tokens</span>
                        </div>

                        <ul className="luxury-features-list">
                            <li>
                                <span className="feat-icon">🎭</span>
                                <span className="feat-text">Giải mã nhân vật lịch sử qua gợi ý</span>
                            </li>
                            <li>
                                <span className="feat-icon">🗺️</span>
                                <span className="feat-text">Khám phá bản đồ cứ điểm với câu chuyện</span>
                            </li>
                            <li>
                                <span className="feat-icon">♾️</span>
                                <span className="feat-text">Mở khóa vĩnh viễn — không giới hạn lần chơi</span>
                            </li>
                        </ul>

                        <button
                            className="luxury-unlock-btn"
                            onClick={handleUnlock}
                            disabled={isLoading || !user}
                        >
                            {isLoading ? '⏳ Đang xử lý...' : '🔓 Mở Khóa Ngay'}
                        </button>

                        <button className="luxury-cancel-btn" onClick={onBack}>
                            ← Quay lại
                        </button>

                        {errorMsg && <div className="luxury-error-msg">{errorMsg}</div>}
                    </div>
                </div>
            </div>
        );
    }

    // ─── COMPLETION SCREEN ─────────────────────────────────────────
    if (activeTab === 'complete') {
        return (
            <div className="luxury-overlay">
                <div className="luxury-header">
                    <button className="luxury-back-btn" onClick={onBack}>← Quay lại</button>
                    <div className="luxury-title-group">
                        <span className="luxury-crown">👑</span>
                        <h2 className="luxury-heading">Trải Nghiệm Luxury</h2>
                        <div className="luxury-subtitle">{event.year} — {event.title}</div>
                    </div>
                    <div className="luxury-token-badge"><span>🪙</span><span>{tokens}</span></div>
                </div>

                <div className="luxury-complete-screen">
                    <div className="luxury-complete-card">
                        <div className="luxury-complete-fireworks">🎆🎇✨</div>
                        <h2 className="luxury-complete-title">Xuất Sắc!</h2>
                        <p className="luxury-complete-sub">
                            Bạn đã giải mã thành công tất cả nhân vật lịch sử của giai đoạn này.
                        </p>
                        <div className="luxury-complete-divider" />
                        <p className="luxury-complete-hint">
                            Tiếp tục khám phá bản đồ câu chuyện để tìm hiểu thêm về các cứ điểm lịch sử.
                        </p>
                        <div className="luxury-complete-actions">
                            <button
                                className="luxury-unlock-btn"
                                style={{ marginBottom: 0 }}
                                onClick={() => setActiveTab('map')}
                            >
                                🗺️ Khám Phá Bản Đồ
                            </button>
                            <button
                                className="luxury-complete-replay"
                                onClick={() => setActiveTab('character')}
                            >
                                🔄 Chơi Lại
                            </button>
                            <button className="luxury-cancel-btn" onClick={onBack}>
                                ← Hoàn tất &amp; Quay lại
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ─── UNLOCKED — 2-TAB LAYOUT ───────────────────────────────────
    return (
        <div className="luxury-overlay">
            {/* Header */}
            <div className="luxury-header">
                <button className="luxury-back-btn" onClick={onBack}>← Quay lại</button>
                <div className="luxury-title-group">
                    <span className="luxury-crown">👑</span>
                    <h2 className="luxury-heading">Trải Nghiệm Luxury</h2>
                    <div className="luxury-subtitle">{event.year} — {event.title}</div>
                </div>
                <div className="luxury-token-badge"><span>🪙</span><span>{tokens}</span></div>
            </div>

            {/* Tabs */}
            <div className="luxury-tabs">
                <button
                    className={`luxury-tab ${activeTab === 'character' ? 'active' : ''}`}
                    onClick={() => setActiveTab('character')}
                >
                    <span className="tab-icon">🎭</span> Giải Mã Nhân Vật
                </button>
                <button
                    className={`luxury-tab ${activeTab === 'map' ? 'active' : ''}`}
                    onClick={() => setActiveTab('map')}
                >
                    <span className="tab-icon">🗺️</span> Bản Đồ Câu Chuyện
                </button>
            </div>

            {/* Tab Content */}
            <div className="luxury-content" key={activeTab}>
                {activeTab === 'character' && (
                    <CharacterGuess
                        event={event}
                        onComplete={() => setActiveTab('complete')}
                        onBack={() => setActiveTab('map')}
                    />
                )}
                {activeTab === 'map' && (
                    <StoryMap milestoneId={event.id} />
                )}
            </div>
        </div>
    );
};
