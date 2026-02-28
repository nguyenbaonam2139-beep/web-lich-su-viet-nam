import React, { useState, useEffect, useRef } from "react";
import { useAdmin } from "../../contexts/AdminContext";

interface EditableImageProps {
    imageUrl: string;
    alt: string;
    className?: string;
    onSave: (newUrl: string) => void;
}

export function EditableImage({
    imageUrl,
    alt,
    className = "",
    onSave
}: EditableImageProps) {
    const { isEditMode } = useAdmin();
    const [isEditing, setIsEditing] = useState(false);
    const [tempUrl, setTempUrl] = useState(imageUrl);
    const [previewUrl, setPreviewUrl] = useState(imageUrl);
    const [error, setError] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setTempUrl(imageUrl);
        setPreviewUrl(imageUrl);
    }, [imageUrl]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const validateUrl = (url: string): boolean => {
        if (!url.trim()) return false;

        // Allow data URIs
        if (url.startsWith('data:')) return true;

        // Allow relative paths
        if (url.startsWith('/') || url.startsWith('.') || url.startsWith('./') || url.startsWith('../')) return true;

        // Basic URL validation
        try {
            new URL(url);
            return true;
        } catch {
            // Check if it's a domain-like string (e.g. example.com/img.jpg)
            return url.includes('.');
        }
    };

    const handleUrlChange = (newUrl: string) => {
        setTempUrl(newUrl);
        setError("");

        // Update preview more aggressively - let the browser's onError handle invalid images
        if (newUrl.trim()) {
            setPreviewUrl(newUrl);
        }
    };

    const handleSave = () => {
        if (!tempUrl.trim()) {
            setError("Vui lòng nhập URL ảnh!");
            return;
        }

        setIsEditing(false);
        if (tempUrl !== imageUrl) {
            onSave(tempUrl);
        }
        setError("");
    };

    const handleCancel = () => {
        setTempUrl(imageUrl);
        setPreviewUrl(imageUrl);
        setIsEditing(false);
        setError("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave();
        }
        if (e.key === 'Escape') {
            e.preventDefault();
            handleCancel();
        }
    };

    // Normal mode - just show image
    if (!isEditMode) {
        return (
            <img
                src={imageUrl}
                alt={alt}
                className={className}
            />
        );
    }

    // Edit mode - not editing
    if (!isEditing) {
        return (
            <div
                className="editable-image-container"
                onClick={() => setIsEditing(true)}
                title="Click để thay đổi ảnh"
            >
                <img
                    src={imageUrl}
                    alt={alt}
                    className={className}
                />
                <div className="image-edit-overlay">
                    <span className="image-edit-icon">🖼️ ✎</span>
                    <span className="image-edit-hint">Click để đổi ảnh</span>
                </div>
            </div>
        );
    }

    // Edit mode - editing
    return (
        <div className="editable-image-editing">
            <div className="image-url-input-section">
                <label className="image-url-label">
                    URL ảnh:
                </label>
                <input
                    ref={inputRef}
                    type="text"
                    className="image-url-input"
                    value={tempUrl}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Paste link ảnh (trực tiếp), link Base64 hoặc đường dẫn nội bộ..."
                />
                {error && (
                    <div className="image-url-error">
                        ⚠️ {error}
                    </div>
                )}
                <div className="image-url-buttons">
                    <button
                        className="btn-save-image"
                        onClick={handleSave}
                    >
                        ✓ Lưu
                    </button>
                    <button
                        className="btn-cancel-image"
                        onClick={handleCancel}
                    >
                        ✕ Hủy
                    </button>
                </div>
            </div>

            <div className="image-preview-section">
                <div className="image-preview-label">Preview:</div>
                <img
                    src={previewUrl}
                    alt="Preview"
                    className={`${className} image-preview`}
                    onError={() => setError("Không thể tải ảnh từ URL này")}
                />
            </div>
        </div>
    );
}
