export interface MapHotspot {
    id: string;
    name: string;
    x: number; // % từ trái (0-100), relative to .story-map-svg-container
    y: number; // % từ trên (0-100), relative to .story-map-svg-container
    story: string;
    milestoneId: number;
    icon?: string;
}

/*
 * Tọa độ địa lý → SVG pixels (viewBox 220x560):
 *   x = (lon - 102) * 25
 *   y = (23.5 - lat) * 33.5
 * Rồi chuyển sang % so với container (220x560)
 */
export const hotspotsM1: MapHotspot[] = [
    {
        id: 'viet-bac',
        name: 'Việt Bắc',
        x: 40, y: 6,
        icon: '🌿',
        story: 'Chiến khu Việt Bắc — trái tim của cuộc kháng chiến. Năm 1947, thực dân Pháp huy động hơn 12.000 quân tấn công lên Việt Bắc hòng tiêu diệt đầu não kháng chiến. Quân và dân ta đã đánh bại hoàn toàn chiến dịch này, bảo toàn lực lượng lãnh đạo cách mạng để tiếp tục cuộc kháng chiến trường kỳ.',
        milestoneId: 1,
    },
    {
        id: 'cao-bang',
        name: 'Cao Bằng',
        x: 52, y: 5,
        icon: '🏔️',
        story: 'Chiến dịch Biên giới Thu Đông 1950 — chiến thắng lớn đầu tiên. Quân ta tiến công tiêu diệt hàng loạt vị trí địch dọc biên giới Việt–Trung, giải phóng vùng đất rộng lớn, khai thông hành lang liên lạc với các nước xã hội chủ nghĩa. Địch thiệt hại hơn 8.000 tên, thu hàng nghìn tấn vũ khí.',
        milestoneId: 1,
    },
    {
        id: 'ha-noi',
        name: 'Hà Nội',
        x: 44, y: 15,
        icon: '🏛️',
        story: 'Ngày 2/9/1945, tại Quảng trường Ba Đình, Chủ tịch Hồ Chí Minh đọc Tuyên ngôn Độc lập, khai sinh nước Việt Nam Dân chủ Cộng hòa. Mùa đông 1946, quân dân Hà Nội chiến đấu 60 ngày đêm bảo vệ Thủ đô, tạo điều kiện cho Trung ương rút lên Việt Bắc tiếp tục lãnh đạo kháng chiến.',
        milestoneId: 1,
    },
    {
        id: 'dien-bien-phu',
        name: 'Điện Biên Phủ',
        x: 14, y: 12,
        icon: '⚔️',
        story: 'Ngày 7/5/1954, chiến dịch Điện Biên Phủ kết thúc toàn thắng sau 56 ngày đêm chiến đấu kiên cường. Quân và dân ta tiêu diệt và bắt sống toàn bộ tập đoàn cứ điểm của Pháp, bắt sống tướng De Castries. Đây là chiến thắng "lừng lẫy năm châu, chấn động địa cầu", chấm dứt 80 năm thực dân Pháp tại Đông Dương.',
        milestoneId: 1,
    },
    {
        id: 'nghe-an',
        name: 'Nghệ An',
        x: 42, y: 30,
        icon: '🌟',
        story: 'Nghệ An — quê hương của Chủ tịch Hồ Chí Minh. Mảnh đất địa linh nhân kiệt này sản sinh ra nhiều người con kiệt xuất. Phong trào Xô Viết Nghệ Tĩnh (1930–1931) là cuộc đấu tranh cách mạng tiêu biểu đầu tiên dưới ngọn cờ của Đảng Cộng sản Việt Nam, thể hiện ý chí bất khuất của nhân dân.',
        milestoneId: 1,
    },
    {
        id: 'hue',
        name: 'Huế',
        x: 62, y: 43,
        icon: '👑',
        story: 'Ngày 25/8/1945, tại Ngọ Môn — Huế, Hoàng đế Bảo Đại trao ấn kiếm cho đại diện Chính phủ lâm thời. Câu nói lịch sử "Trẫm muốn làm dân một nước độc lập còn hơn làm vua một nước nô lệ" đã đi vào lịch sử, đánh dấu sự cáo chung của chế độ phong kiến và khẳng định sức mạnh của Cách mạng Tháng Tám.',
        milestoneId: 1,
    },
];

export const HOTSPOTS_BY_MILESTONE: Record<number, MapHotspot[]> = {
    1: hotspotsM1,
};

export function getHotspotsForMilestone(milestoneId: number): MapHotspot[] {
    return HOTSPOTS_BY_MILESTONE[milestoneId] || [];
}
