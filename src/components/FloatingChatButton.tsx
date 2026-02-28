import React from "react";

interface FloatingChatButtonProps {
    characterAvatar: string;
    onClick: () => void;
}

export function FloatingChatButton({ characterAvatar, onClick }: FloatingChatButtonProps) {
    return (
        <button
            className="floating-chat-btn"
            onClick={onClick}
            aria-label="Chat with historian"
        >
            <div className="chat-avatar">{characterAvatar}</div>
            <div className="chat-pulse"></div>
        </button>
    );
}
