import { Role, ViolationCode, ViolationGroup, ScoringType, User, BonusCriteria } from './types';

export const VIOLATION_CODES: ViolationCode[] = [
  // NHÓM A - TTATGT
  { code: 'VP_ATGT_01', group: ViolationGroup.ATGT, name: 'Đỗ/để xe ô tô ở vỉa hè trái quy định', legalBasis: 'Điểm e Khoản 3 Điều 6', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_ATGT_02', group: ViolationGroup.ATGT, name: 'Đỗ/để xe máy chuyên dùng ở vỉa hè trái phép', legalBasis: 'Điểm đ Khoản 2 Điều 8', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_ATGT_03', group: ViolationGroup.ATGT, name: 'Để xe đạp/xe thô sơ ở vỉa hè gây cản trở', legalBasis: 'Điểm k Khoản 1 Điều 9', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_ATGT_04', group: ViolationGroup.ATGT, name: 'Dừng xe nơi có biển Cấm dừng/đỗ', legalBasis: 'Điểm đ Khoản 2 Điều 6', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_ATGT_05', group: ViolationGroup.ATGT, name: 'Đỗ xe nơi có biển Cấm đỗ', legalBasis: 'Điểm e Khoản 3 Điều 6', scoringType: ScoringType.RATIO, active: true },

  // NHÓM B - TTĐT
  { code: 'VP_TTDT_01', group: ViolationGroup.TTDT, name: 'Bán hàng rong/nhỏ lẻ phố cấm', legalBasis: 'Điểm e Khoản 2 Điều 12', scoringType: ScoringType.DIRECT, directDeductionFactor: 0.1, active: true },
  
  { code: 'VP_TTDT_02', group: ViolationGroup.TTDT, name: 'Phơi thóc/lúa/rơm rạ trên đường bộ', legalBasis: 'Điểm g Khoản 2 Điều 12', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_TTDT_03', group: ViolationGroup.TTDT, name: 'Tập trung đông người/nằm ngồi cản trở', legalBasis: 'Điểm a Khoản 2 Điều 12', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_TTDT_04', group: ViolationGroup.TTDT, name: 'Đá bóng/cầu lông/patin dưới lòng đường', legalBasis: 'Điểm b Khoản 2 Điều 12', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_TTDT_05', group: ViolationGroup.TTDT, name: 'Chiếm dụng dải phân cách', legalBasis: 'Điểm d Khoản 6 Điều 12', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_TTDT_06', group: ViolationGroup.TTDT, name: 'Sử dụng trái phép lòng/hè để kinh doanh', legalBasis: 'Khoản 7 Điều 12', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_TTDT_07', group: ViolationGroup.TTDT, name: 'Bày bán vật tư/sản xuất trên hè phố', legalBasis: 'Khoản 9 Điều 12', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_TTDT_08A', group: ViolationGroup.TTDT, name: 'Trông giữ xe không phép', legalBasis: 'Khoản 10 Điều 12', scoringType: ScoringType.DIRECT, directDeductionFactor: 5, active: true },
  { code: 'VP_TTDT_08B', group: ViolationGroup.TTDT, name: 'Trông giữ xe sai phép', legalBasis: 'Khoản 10 Điều 12', scoringType: ScoringType.DIRECT, directDeductionFactor: 2, active: true },

  // NHÓM C - VSMT
  { code: 'VP_VSMT_01', group: ViolationGroup.VSMT, name: 'Vứt rác không đúng nơi (công cộng)', legalBasis: 'Điểm c Khoản 1 Điều 25 NĐ 45', scoringType: ScoringType.RATIO, active: true },
  { code: 'VP_VSMT_02', group: ViolationGroup.VSMT, name: 'Vứt rác vỉa hè/hệ thống thoát nước', legalBasis: 'Điểm d Khoản 1 Điều 25 NĐ 45', scoringType: ScoringType.RATIO, active: true },
];

// === BONUS CRITERIA ===
export const BONUS_CRITERIA_LIST: BonusCriteria[] = [
    { id: 'B1', content: 'Không phát sinh tái vi phạm trong kỳ đánh giá', maxPoints: 3, isFixed: true },
    { id: 'B2', content: 'Xóa bỏ dứt điểm điểm nóng tồn tại kéo dài theo ĐTCB', maxPoints: 2, isFixed: false }, // +2 điểm/điểm nóng
    { id: 'B3', content: 'Duy trì ổn định ≥ 30 ngày tại khu vực phức tạp', maxPoints: 2, isFixed: true },
    { id: 'B4', content: 'Triển khai đầy đủ các văn bản chỉ đạo của UBND TP, Công an TP', maxPoints: 2, isFixed: false },
    { id: 'B5', content: 'Chủ động tham mưu, phối hợp với UBND cấp xã, đoàn thể', maxPoints: 2, isFixed: false },
    { id: 'B6', content: 'Xây dựng kế hoạch, tuyên truyền, sáng kiến, cách làm hay', maxPoints: 2, isFixed: false },
];

const WARD_NAMES = [
  "Hoàn Kiếm", "Cửa Nam", "Ba Đình", "Ngọc Hà", "Giảng Võ", "Hai Bà Trưng", "Vĩnh Tuy", "Bạch Mai", "Đống Đa", "Kim Liên",
  "Văn Miếu - Quốc Tử Giám", "Láng", "Ô Chợ Dừa", "Hồng Hà", "Lĩnh Nam", "Hoàng Mai", "Vĩnh Hưng", "Tương Mai", "Định Công",
  "Hoàng Liệt", "Yên Sở", "Thanh Xuân", "Khương Đình", "Phương Liệt", "Cầu Giấy", "Nghĩa Đô", "Yên Hòa", "Tây Hồ", "Phú Thượng",
  "Tây Tựu", "Xuân Đỉnh", "Đông Ngạc", "Thượng Cát", "Phú Diễn", "Từ Liêm", "Tây Mỗ", "Đại Mỗ", "Xuân Phương", "Long Biên",
  "Bồ Đề", "Việt Hưng", "Phúc Lợi", "Hà Đông", "Dương Nội", "Yên Nghĩa", "Phú Lương", "Kiến Hưng", "Thanh Liệt", "Chương Mỹ",
  "Tùng Thiện", "Sơn Tây", "Thanh Trì", "Đại Thanh", "Ngọc Hồi", "Nam Phủ", "Thường Tín", "Thượng Phúc", "Chương Dương", "Hồng Vân",
  "Phương Dực", "Phú Xuyên", "Chuyên Mỹ", "Đại Xuyên", "Thanh Oai", "Bình Minh", "Tam Hưng", "Dân Hòa", "Ứng Thiên", "Vân Đình",
  "Hoà Xá", "Ứng Hoà", "Phúc Sơn", "Hồng Sơn", "Mỹ Đức", "Hương Sơn", "Phú Nghĩa", "Xuân Mai", "Trần Phú", "Hoà Phú", "Quảng Bị",
  "Quảng Oai", "Vật Lại", "Cổ Đô", "Bất Bạt", "Suối Hai", "Ba Vì", "Yên Bài", "Minh Châu", "Đoài Phương", "Phúc Thọ", "Phúc Lộc",
  "Hát Môn", "Thạch Thất", "Hạ Bằng", "Tây Phương", "Hòa Lạc", "Yên Xuân", "Quốc Oai", "Kiều Phú", "Phú Cát", "Hưng Đạo", "Hoài Đức",
  "Dương Hòa", "Sơn Đồng", "An Khánh", "Đan Phượng", "Ô Diên", "Liên Minh", "Phù Đổng", "Thuận An", "Gia Lâm", "Bát Tràng", "Đông Anh",
  "Thư Lâm", "Phúc Thịnh", "Thiên Lộc", "Vĩnh Thanh", "Mê Linh", "Yên Lãng", "Tiên Thắng", "Quang Minh", "Sóc Sơn", "Nội Bài",
  "Kim Anh", "Đa Phúc", "Trung Giã"
];

// Helper to convert string to slug
const toSlug = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]/g, "");
};

// === CENTRALIZED SCORING CONFIGURATION ===
export const getAreaConfig = (points: number) => {
    if (points >= 1200) return { coefficient: 1, baseScore: 1200, label: "Loại 1 - Rất phức tạp (≥ 1.200 điểm)" };
    if (points >= 1000) return { coefficient: 2, baseScore: 1000, label: "Loại 2 - Phức tạp (1.000 - < 1.200 điểm)" };
    if (points >= 450) return { coefficient: 3, baseScore: 450, label: "Loại 3 - Ít phức tạp (450 - < 1.000 điểm)" };
    return { coefficient: 4, baseScore: 50, label: "Loại 4 - Không phức tạp (< 450 điểm)" };
};

// Generate User objects for each ward
const WARD_USERS: User[] = WARD_NAMES.map((name, index) => {
    // Generate some variety for testing based on index
    let initialPoints = 1000;
    if (index % 5 === 0) initialPoints = 1300; // Type 1
    else if (index % 5 === 1) initialPoints = 500; // Type 3
    else if (index % 5 === 2) initialPoints = 200; // Type 4
    
    const config = getAreaConfig(initialPoints);

    return {
        id: `u_${index + 1}`,
        // New format: p.[name]@pol.vn
        email: `p.${toSlug(name)}@pol.vn`,
        role: Role.WARD,
        unitName: name,
        phoneNumber: '09xxxxxxxx',
        areaCoefficient: config.coefficient as 1|2|3|4, 
        baseScore: config.baseScore, 
        totalViolationPoints: initialPoints
    };
});

export const MOCK_USERS: User[] = [
  {
    id: 'u_admin',
    email: 'admin@qlhc.hanoi.vn', // Correct domain
    role: Role.ADMIN,
    unitName: 'Phòng QLHC',
    phoneNumber: '0988xxxxxx',
    areaCoefficient: 1,
    baseScore: 1200,
  },
  {
    id: 'u_reviewer',
    email: 'canbo1@qlhc.hanoi.vn', // Correct domain
    role: Role.REVIEWER,
    unitName: 'Tổ công tác QLHC',
    phoneNumber: '0977xxxxxx',
    areaCoefficient: 1,
    baseScore: 1200,
  },
  ...WARD_USERS
];

export const OFFICERS_LIST: Record<string, string[]> = {
  'u_1': ['Đ/c Nguyễn Văn A', 'Đ/c Trần Văn B'],
};