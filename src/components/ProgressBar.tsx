import React from "react";

interface ProgressBarProps {
    total: number;
    completed: number;
    label?: string;
}

export function ProgressBar({ total, completed, label = "Tiến độ bài học" }: ProgressBarProps) {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return (
        <div className="progress-container">
            <div className="progress-header">
                <span className="progress-label">{label}</span>
                <span className="progress-percentage">{percentage}%</span>
            </div>
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${percentage}%` }}
                />
            </div>
            <div className="progress-count">
                {completed}/{total} tasks hoàn thành
            </div>
        </div>
    );
}
