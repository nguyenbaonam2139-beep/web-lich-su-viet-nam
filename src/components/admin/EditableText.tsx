import React, { useState, useEffect, useRef } from "react";
import { useAdmin } from "../../contexts/AdminContext";

interface EditableTextProps {
    value: string;
    onSave: (newValue: string) => void;
    className?: string;
    tagName?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
    multiline?: boolean;
    placeholder?: string;
}

export function EditableText({
    value,
    onSave,
    className = "",
    tagName = 'span',
    multiline = false,
    placeholder = "Click to edit..."
}: EditableTextProps) {
    const { isEditMode } = useAdmin();
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setTempValue(value);
    }, [value]);

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const handleBlur = () => {
        setIsEditing(false);
        if (tempValue !== value) {
            onSave(tempValue);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline) {
            handleBlur();
        }
        if (e.key === 'Escape') {
            setTempValue(value);
            setIsEditing(false);
        }
    };

    const Tag = tagName as any;

    if (isEditMode) {
        if (isEditing) {
            return multiline ? (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    className={`editable-input textarea ${className}`}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                />
            ) : (
                <input
                    ref={inputRef as React.RefObject<HTMLInputElement>}
                    type="text"
                    className={`editable-input text ${className}`}
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    onClick={(e) => e.stopPropagation()}
                />
            );
        }

        return (
            <Tag
                className={`editable-element ${className}`}
                onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    setIsEditing(true);
                }}
            >
                {value}
                <span className="edit-icon">✎</span>
            </Tag>
        );
    }

    return <Tag className={className}>{value}</Tag>;
}
