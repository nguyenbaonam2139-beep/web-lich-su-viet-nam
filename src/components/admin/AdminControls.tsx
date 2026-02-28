import React from "react";
import { useAdmin } from "../../contexts/AdminContext";

interface AdminControlsProps {
    onUpdateBackground?: (url: string) => void;
    onUpdateBgParams?: (params: any) => void;
}

export function AdminControls({ onUpdateBackground, onUpdateBgParams }: AdminControlsProps) {
    const { isAdmin, isEditMode, toggleEditMode } = useAdmin();

    if (!isAdmin) return null;

    return (
        <div className="admin-controls-fab">
            {isEditMode && onUpdateBackground && (
                <>
                    <button
                        className="admin-action-btn bg-edit"
                        onClick={() => {
                            const url = window.prompt("Nhập link ảnh nền cho Timeline (Google Image Address):");
                            if (url) onUpdateBackground(url);
                        }}
                        title="Đổi ảnh nền Timeline"
                    >
                        🖼️ Đổi Nền
                    </button>
                    {onUpdateBgParams && (
                        <button
                            className="admin-action-btn bg-adjust"
                            onClick={() => {
                                const size = window.prompt("Nhập KÍCH THƯỚC ảnh (Ví dụ: cover, 150%, 1000px):");
                                const pos = window.prompt("Nhập VỊ TRÍ ảnh (Ví dụ: center, top 20%, 50% 50%):");
                                if (size || pos) {
                                    const params: any = {};
                                    if (size) params.backgroundSize = size;
                                    if (pos) params.backgroundPosition = pos;
                                    onUpdateBgParams(params);
                                }
                            }}
                            title="Cân chỉnh ảnh nền"
                        >
                            ⚖️ Cân Chỉnh
                        </button>
                    )}
                </>
            )}
            <button
                className={`admin-toggle-btn ${isEditMode ? 'active' : ''}`}
                onClick={toggleEditMode}
                title="Toggle Admin Edit Mode"
            >
                {isEditMode ? '✏️ Editing On' : '🔒 Admin Mode'}
            </button>
        </div>
    );
}
