import React from 'react';
import { useAdmin } from '../contexts/AdminContext';
import './UserProfileTopBar.css';

interface UserProfileTopBarProps {
    onBadgeClick?: () => void;
    onLogout?: () => void;
}

export const UserProfileTopBar: React.FC<UserProfileTopBarProps> = ({ onBadgeClick, onLogout }) => {
    const { user, tokens, badges, isEditMode } = useAdmin();

    if (!user) return null;

    return (
        <div className={`user-profile-topbar ${isEditMode ? 'admin-mode' : ''}`}>
            <div className="profile-info">
                <div className="avatar">👤</div>
                <div className="user-details">
                    <span className="user-name">{user.name || user.username}</span>
                    <span className="user-role">{isEditMode ? 'Chế độ Chỉnh sửa (Quản trị)' : 'Học viên'}</span>
                </div>
                {onLogout && (
                    <button className="btn-logout-icon" onClick={onLogout} title="Đăng xuất">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </button>
                )}
            </div>

            <div className="gamification-stats">
                <div className="stat-item tokens" title="Điểm thưởng (Dùng để đổi quà/tính năng)">
                    <span className="stat-icon">🪙</span>
                    <span className="stat-value">{tokens}</span>
                    <span className="stat-label">Token</span>
                </div>

                <div
                    className="stat-item badges"
                    title="Huy hiệu sưu tập được"
                    onClick={onBadgeClick}
                    style={{ cursor: onBadgeClick ? 'pointer' : 'default' }}
                >
                    <span className="stat-icon">🎖️</span>
                    <span className="stat-value">{badges.length}</span>
                    <span className="stat-label">Huy hiệu</span>
                </div>
            </div>
        </div>
    );
};
