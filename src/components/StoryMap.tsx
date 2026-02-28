import React from 'react';
import './StoryMap.css';

interface StoryMapProps { milestoneId: number; }

export const StoryMap: React.FC<StoryMapProps> = () => {
    return (
        <div className="sm-coming-soon">
            <div className="sm-cs-card">
                <div className="sm-cs-icon">🗺️</div>
                <h2 className="sm-cs-title">Đang Phát Triển</h2>
                <div className="sm-cs-divider" />
                <p className="sm-cs-desc">
                    Tính năng <strong>Bản Đồ Câu Chuyện</strong> đang được xây dựng.
                    Bạn sẽ bớt có thể khám phá các cứ điểm lịch sử trên bản đồ
                    Việt Nam và đọc câu chuyện từng vùng đất.
                </p>
                <div className="sm-cs-tags">
                    <span className="sm-cs-tag">🎯 Bản đồ tương tác</span>
                    <span className="sm-cs-tag">📖 Câu chuyện theo địa danh</span>
                    <span className="sm-cs-tag">✨ Hiệu ứng cứ điểm</span>
                </div>
                <div className="sm-cs-badge">
                    <span className="sm-cs-dot" />
                    Sắp ra mắt
                </div>
            </div>
        </div>
    );
};
