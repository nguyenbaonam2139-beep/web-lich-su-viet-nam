import React, { createContext, useContext, useState, useEffect } from "react";

import { updateUser } from "../api";

interface AdminContextType {
    user: any;
    isAdmin: boolean;
    isEditMode: boolean;
    toggleAdmin: () => void;
    toggleEditMode: () => void;
    updateBackground: (url: string) => void;
    addTokens: (amount: number) => Promise<void>;
    spendTokens: (amount: number) => Promise<boolean>; // returns false if insufficient
    awardBadge: (badgeId: string) => Promise<void>;
    tokens: number;
    badges: string[];
    earnedBadgeId: string | null;
    clearEarnedBadge: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
    children: React.ReactNode;
    user: any;
}

export function AdminProvider({ children, user: initialUser }: AdminProviderProps) {
    const [user, setUser] = useState(initialUser);
    const [earnedBadgeId, setEarnedBadgeId] = useState<string | null>(null);
    // Admin check based on user role
    const isAdmin = user?.role === 'admin';

    // BUG 2 fix: Sync internal user state khi parent (App.tsx) đổi user prop
    // Ví dụ: sau khi Admin Toggle (Ctrl+Shift+A), initialUser thay đổi nhưng
    // useState chỉ đọc initialUser một lần → phải sync thủ công
    useEffect(() => {
        setUser(initialUser);
    }, [initialUser]);
    const [isEditMode, setIsEditMode] = useState(false);

    // Auto-disable edit mode if user is no longer admin
    useEffect(() => {
        if (!isAdmin) {
            setIsEditMode(false);
        }
    }, [isAdmin]);

    // Ensure user has a profile
    useEffect(() => {
        if (user && !user.profile) {
            setUser({ ...user, profile: { tokens: 0, badges: [] } });
        }
    }, [user]);

    const addTokens = async (amount: number) => {
        if (!user) return;
        const currentTokens = user.profile?.tokens || 0;
        const updatedUser = {
            ...user,
            profile: {
                ...user.profile,
                tokens: currentTokens + amount,
                badges: user.profile?.badges || []
            }
        };
        setUser(updatedUser);
        try {
            await updateUser(updatedUser);
        } catch (e) {
            console.error("Failed to update tokens", e);
        }
    };

    const spendTokens = async (amount: number): Promise<boolean> => {
        if (!user) return false;
        const currentTokens = Number(user.profile?.tokens ?? 0);
        if (currentTokens < amount) return false; // Không đủ token

        const updatedUser = {
            ...user,
            profile: {
                ...user.profile,
                tokens: currentTokens - amount,
                badges: user.profile?.badges || []
            }
        };
        // Optimistic update — cập nhật UI trước, không rollback nếu API lỗi
        setUser(updatedUser);
        try {
            await updateUser(updatedUser);
        } catch (e) {
            console.error("Failed to sync token spend to server:", e);
            // Không rollback UI — preserve UX
        }
        return true; // Luôn return true nếu đủ token
    };


    const awardBadge = async (badgeId: string) => {
        if (!user) return;
        const currentBadges = user.profile?.badges || [];
        if (currentBadges.includes(badgeId)) return; // Already has it — no-op

        // BUG FIX: Removed BONUS_TOKENS from badge award.
        // Tokens are already earned through Quiz scoring (X correct × 10 tokens).
        // Adding tokens here caused double-counting every time a badge was awarded.
        const updatedUser = {
            ...user,
            profile: {
                ...user.profile,
                tokens: user.profile?.tokens || 0, // unchanged
                badges: [...currentBadges, badgeId]
            }
        };
        setUser(updatedUser);
        try {
            await updateUser(updatedUser);
            setEarnedBadgeId(badgeId); // Trigger celebration modal
        } catch (e) {
            console.error("Failed to update badges", e);
        }
    };

    const clearEarnedBadge = () => setEarnedBadgeId(null);

    return (
        <AdminContext.Provider value={{
            user,
            isAdmin,
            isEditMode,
            toggleAdmin: () => { }, // Not used in this version
            toggleEditMode: () => setIsEditMode(prev => !prev),
            updateBackground: () => { }, // Placeholder
            addTokens,
            spendTokens,
            awardBadge,
            tokens: user?.profile?.tokens || 0,
            badges: user?.profile?.badges || [],
            earnedBadgeId,
            clearEarnedBadge
        }}>
            {children}
        </AdminContext.Provider>
    );
}

export function useAdmin() {
    const context = useContext(AdminContext);
    if (context === undefined) {
        throw new Error("useAdmin must be used within an AdminProvider");
    }
    return context;
}
