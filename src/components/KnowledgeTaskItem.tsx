import React from 'react';

interface KnowledgeTaskItemProps {
    icon: string;
    title: React.ReactNode;
    description: string[];
    isCompleted: boolean;
    onClick: () => void;
}

export const KnowledgeTaskItem: React.FC<KnowledgeTaskItemProps> = ({
    icon,
    title,
    description,
    isCompleted,
    onClick
}) => {
    return (
        <div
            onClick={onClick}
            className={`knowledge-task-item ${isCompleted ? 'completed' : ''}`}
        >
            <div className="task-icon">
                {icon}
            </div>

            <div className="task-content">
                <div className="task-title">
                    {title}
                </div>
                {description && description.length > 0 && (
                    <div className="task-description">
                        {description[0]}
                    </div>
                )}
            </div>

            <div className="task-status">
                {isCompleted ? '✓' : ''}
            </div>
        </div>
    );
};
