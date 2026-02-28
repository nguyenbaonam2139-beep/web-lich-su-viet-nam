import React from "react";
import { TimelineEvent } from "../types";
import { CharacterGuess } from "./CharacterGuess";

interface ChatOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    event: TimelineEvent;
    onComplete: () => void;
}

export function ChatOverlay({ isOpen, onClose, event, onComplete }: ChatOverlayProps) {
    if (!isOpen) return null;

    return (
        <div className="chat-overlay">
            <div className="chat-overlay-backdrop" onClick={onClose} />
            <div className="chat-overlay-content">
                <button className="chat-close-btn" onClick={onClose}>
                    ✕
                </button>
                <CharacterGuess
                    event={event}
                    onComplete={() => {
                        onComplete();
                        onClose();
                    }}
                    onBack={onClose}
                />
            </div>
        </div>
    );
}
