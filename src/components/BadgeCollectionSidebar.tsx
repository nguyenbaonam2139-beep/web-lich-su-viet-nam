import React from 'react';
import { BADGE_INFO } from '../constants/badges';
import './BadgeCollectionSidebar.css';

interface BadgeCollectionSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    userBadges: string[];
}

export const BadgeCollectionSidebar: React.FC<BadgeCollectionSidebarProps> = ({ isOpen, onClose, userBadges }) => {
    return (
        <div className={`badge-sidebar-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
            <div className={`badge-sidebar ${isOpen ? 'open' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="badge-sidebar-header">
                    <h2>Bộ sưu tập Huy hiệu</h2>
                    <button className="btn-close-sidebar" onClick={onClose}>×</button>
                </div>
                <div className="badge-sidebar-content">
                    <p className="badge-sidebar-subtitle">
                        Hoàn thành các cột mốc lịch sử để mở khóa huy hiệu danh giá.
                    </p>
                    <div className="badge-grid">
                        {Object.entries(BADGE_INFO).map(([id, info]) => {
                            const isUnlocked = userBadges.includes(id);
                            return (
                                <div key={id} className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}>
                                    <div className="badge-card-icon">
                                        <img src={info.icon} alt={info.title} className="badge-img" />
                                        {!isUnlocked && <div className="lock-overlay">🔒</div>}
                                    </div>
                                    <div className="badge-card-info">
                                        <h3>{info.title}</h3>
                                        <p>{info.desc}</p>
                                    </div>
                                    {isUnlocked && <div className="badge-status-label">Đã mở khóa</div>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
