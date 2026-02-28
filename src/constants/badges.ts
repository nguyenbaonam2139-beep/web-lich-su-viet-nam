export interface BadgeInfo {
    title: string;
    desc: string;
    icon: string;
}

export const BADGE_INFO: Record<string, BadgeInfo> = {
    'milestone-1-complete': {
        title: 'Chiến Lược Gia Điện Biên',
        desc: 'Đã hoàn thành xuất sắc toàn bộ cột mốc Kháng chiến chống Pháp (1945 - 1954).',
        icon: '/badges/milestone1.png'
    },
    'milestone-2-complete': {
        title: 'Nhà Kiến Tạo Độc Lập',
        desc: 'Đã hoàn thành xuất sắc toàn bộ cột mốc Kháng chiến chống Mỹ (1954 - 1975).',
        icon: '/badges/milestone2.png'
    },
    'milestone-3-complete': {
        title: 'Người Tiên Phong Đổi Mới',
        desc: 'Đã hoàn thành xuất sắc toàn bộ cột mốc Đổi Mới (1986).',
        icon: '/badges/milestone3.png'
    }
};
