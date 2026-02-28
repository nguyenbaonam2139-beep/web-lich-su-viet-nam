// Historical Character Data Structure
export interface HistoricalCharacter {
    id: string;
    name: string;
    aliases: string[];
    milestoneId: number;
    hints: [string, string, string, string, string, string, string];
    portrait: string;
    bio: string;
    yearBorn?: number;
    yearDied?: number;
    role: string;
}

// Sample character for "Cách mạng Tháng Tám 1945"
export const hoChiMinh: HistoricalCharacter = {
    id: "ho-chi-minh",
    name: "Hồ Chí Minh",
    aliases: ["Bác Hồ", "Nguyễn Ái Quốc", "Người", "Bác", "Chủ tịch Hồ Chí Minh"],
    milestoneId: 1,
    hints: [
        "Người này đã dành cả đời cho độc lập tự do của dân tộc Việt Nam",
        "Sinh ra vào cuối thế kỷ 19, lớn lên ở miền Trung trong gia đình có truyền thống yêu nước",
        "Đã đi nhiều nước trên thế giới để tìm đường cứu nước, từ châu Âu đến châu Á",
        "Là người sáng lập Đảng Cộng sản Việt Nam năm 1930",
        "Đọc Tuyên ngôn Độc lập tại Quảng trường Ba Đình ngày 2/9/1945",
        "Tên thật là Nguyễn Sinh Cung, còn có nhiều bút danh như Nguyễn Ái Quốc, Lý Thụy",
        "Lãnh tụ vĩ đại của dân tộc Việt Nam, được nhân dân kính trọng gọi là Bác"
    ],
    portrait: "👴",
    bio: "Chủ tịch Hồ Chí Minh (1890-1969) là lãnh tụ vĩ đại của Đảng Cộng sản Việt Nam, của dân tộc Việt Nam, danh nhân văn hóa thế giới. Người đã hiến dâng trọn đời cho sự nghiệp giải phóng dân tộc, thống nhất đất nước và xây dựng chủ nghĩa xã hội.",
    yearBorn: 1890,
    yearDied: 1969,
    role: "Lãnh tụ cách mạng, Chủ tịch nước"
};

export const voNguyenGiap: HistoricalCharacter = {
    id: "vo-nguyen-giap",
    name: "Võ Nguyên Giáp",
    aliases: ["Đại tướng Võ Nguyên Giáp", "Anh Cả", "Tướng Giáp"],
    milestoneId: 1,
    hints: [
        "Vị Đại tướng đầu tiên của Quân đội Nhân dân Việt Nam",
        "Được thế giới vinh danh là một trong những thiên tài quân sự lớn nhất thế kỷ 20",
        "Vốn là một thầy giáo dạy lịch sử trước khi trở thành tướng quân",
        "Tổng chỉ huy chiến dịch Điện Biên Phủ lừng lẫy năm 1954",
        "Nổi tiếng với quyết định 'Đánh chắc tiến chắc' tại Điện Biên Phủ",
        "Người chỉ huy trận đánh đánh bại đội quân tinh nhuệ nhất của Pháp",
        "Thường được quân đội và nhân dân gọi thân thương là 'Anh Cả'"
    ],
    portrait: "🎖️",
    bio: "Đại tướng Võ Nguyên Giáp (1911-2013) là Tổng tư lệnh Quân đội Nhân dân Việt Nam, người học trò xuất sắc của Chủ tịch Hồ Chí Minh.",
    yearBorn: 1911,
    yearDied: 2013,
    role: "Đại tướng, Tổng tư lệnh"
};

// Character database by milestone (fallback)
export const charactersByMilestone: Record<number, HistoricalCharacter[]> = {
    1: [hoChiMinh, voNguyenGiap],
};

// Get characters for a specific milestone
export function getCharactersForMilestone(milestoneId: number): HistoricalCharacter[] {
    return charactersByMilestone[milestoneId] || [];
}

// Normalize answer for comparison
export function normalizeAnswer(input: string): string {
    return input
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove Vietnamese accents
        .replace(/[đĐ]/g, 'd')
        .trim();
}

// Check if user's guess is correct
export function checkAnswer(guess: string, character: HistoricalCharacter): boolean {
    const normalized = normalizeAnswer(guess);
    const validAnswers = [
        character.name,
        ...character.aliases
    ].map(normalizeAnswer);

    return validAnswers.some(valid => normalized.includes(valid) || valid.includes(normalized));
}

// Calculate stars based on hint number (0-indexed)
export function calculateStars(hintIndex: number): number {
    if (hintIndex <= 2) return 5; // Hints 1-3
    if (hintIndex === 3) return 4; // Hint 4
    if (hintIndex === 4) return 3; // Hint 5
    if (hintIndex === 5) return 2; // Hint 6
    return 1; // Hint 7
}
