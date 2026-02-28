import React, { useEffect, useState } from 'react';
import './BadgeCelebration.css';

interface BadgeCelebrationProps {
    badgeId: string;
    onClose: () => void;
}

import { BADGE_INFO } from '../constants/badges';

export const BadgeCelebration: React.FC<BadgeCelebrationProps> = ({ badgeId, onClose }) => {
    const [isVisible, setIsVisible] = useState(false);
    const info = BADGE_INFO[badgeId] || { title: 'Huy hiệu Bí ẩn', desc: 'Bạn vừa nhận được một danh hiệu mới!', icon: '/badges/milestone1.png' };

    useEffect(() => {
        // Slight delay for animation triggers
        const showTimer = setTimeout(() => setIsVisible(true), 100);

        // Auto close after 5 seconds if not interacted
        const closeTimer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 500); // Wait for fade out
        }, 5000);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(closeTimer);
        };
    }, [onClose]);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(onClose, 500);
    };

    return (
        <div className={`badge-celebration-overlay ${isVisible ? 'visible' : ''}`}>
            <div className="badge-celebration-card animate-pop-in">
                <button className="btn-close-badge" onClick={handleClose}>×</button>
                <div className="celebration-particles">✨🎉✨</div>

                <div className="badge-icon-large floating-animation">
                    <img src={info.icon} alt={info.title} className="celebration-badge-img" />
                </div>

                <h2 className="celebration-title">Chúc Mừng!</h2>
                <p className="celebration-sub">Bạn vừa mở khóa một Huy Hiệu mới:</p>

                <div className="badge-info-box">
                    <h3 className="badge-name">{info.title}</h3>
                    <p className="badge-desc">{info.desc}</p>
                </div>

                <button className="btn-collect-badge" onClick={handleClose}>
                    Tuyệt vời!
                </button>
            </div>
        </div>
    );
};
