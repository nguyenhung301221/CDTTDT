
export enum Role {
  ADMIN = 'PC06_ADMIN', // Giữ nguyên key để tránh lỗi logic, chỉ đổi hiển thị
  REVIEWER = 'PC06_REVIEWER', 
  WARD = 'WARD_USER', 
}

export enum ViolationGroup {
  ATGT = 'TTATGT',
  TTDT = 'TTĐT',
  VSMT = 'VSMT',
}

export enum ScoringType {
  RATIO = 'RATIO', // Tính theo tỷ lệ
  DIRECT = 'DIRECT', // Trừ riêng
}

export interface ViolationCode {
  code: string;
  group: ViolationGroup;
  name: string;
  legalBasis: string;
  scoringType: ScoringType;
  directDeductionFactor?: number; // Hệ số trừ riêng
  active: boolean;
}

export enum TaskStatus {
  NEW = 'Mới',
  RECEIVED = 'Đã tiếp nhận',
  PROCESSING = 'Đang xử lý',
  RESOLVED = 'Đã xử lý', // Xã/phường báo xong
  CONFIRMED = 'Đã xác nhận', // PC06 xác nhận (trừ điểm)
  REJECTED = 'Yêu cầu bổ sung',
  CLOSED = 'Đóng',
}

export interface User {
  id: string;
  email: string;
  role: Role;
  unitName: string; // Tên đơn vị (PC06 hoặc tên Phường)
  phoneNumber: string; // Cho 2FA
  areaCoefficient: 1 | 2 | 3 | 4; // Hệ số theo loại địa bàn (1-4)
  baseScore: number; // ĐTCB (Điểm tảng cơ bản - dùng để chia tỷ lệ)
  totalViolationPoints?: number; // Số lượng điểm rà soát vi phạm đã đăng ký (Hiện tại)
}

export enum RegistrationStatus {
  PENDING = 'Chờ duyệt',
  APPROVED = 'Đã duyệt',
  REJECTED = 'Từ chối',
}

export interface WardRegistration {
  id: string;
  wardId: string;
  wardName: string;
  month: string; // MM/YYYY
  points: number; // Số điểm đăng ký mới
  proposedCoefficient: 1 | 2 | 3 | 4; // Hệ số dự kiến
  status: RegistrationStatus;
  createdAt: string;
  approvedAt?: string;
  note?: string; // Ghi chú của PC06 khi duyệt/từ chối
}

// --- BONUS POINTS TYPES ---
export interface BonusCriteria {
    id: string;
    content: string;
    maxPoints: number; // Điểm tối đa cho mục này
    isFixed: boolean; // Nếu true là điểm cố định, false là điểm tối đa (ví dụ +2/điểm nóng)
}

export enum BonusStatus {
    PENDING = 'Chờ QLHC duyệt',
    APPROVED = 'Đã cộng điểm',
    REJECTED = 'Từ chối',
}

export interface BonusRequest {
    id: string;
    wardId: string;
    wardName: string;
    month: string; // MM/YYYY
    criteriaId: string; // Link tới BonusCriteria
    criteriaContent: string; // Snapshot nội dung
    requestedPoints: number;
    description: string; // Ghi chú của Phường
    evidence?: string; // Link ảnh/tài liệu (Optional)
    status: BonusStatus;
    createdAt: string;
    
    // Review info
    reviewedBy?: string;
    reviewedAt?: string;
    reviewerNote?: string; // Lý do đồng ý/từ chối
    finalPoints?: number; // Điểm chốt sau khi duyệt
}
// --------------------------

export interface IssueVersion {
  versionId: string;
  updatedAt: string;
  updatedBy: string; // Email người cập nhật
  operatorName: string; // Tên cán bộ thao tác trực tiếp
  changeReason: string;
  dataSnapshot: Partial<Issue>; // Snapshot dữ liệu tại thời điểm đó
}

export interface MediaItem {
  id: string;
  type: 'IMAGE' | 'VIDEO';
  url: string; // DataURL for mock
  description: string; // Specific location note
  path?: string; // Drive path simulated
}

export interface Issue {
  id: string;
  customName?: string; // Tên gợi nhớ do PC06 đặt
  createdTime: string; // ISO string
  deadlineTime: string; // Created + 45 mins
  wardId: string; // ID đơn vị (User ID)
  wardName: string;
  locationDescription: string;
  violationCode: string; // Link tới ViolationCode
  penaltyPoints: number; // Số điểm tái vi phạm
  source: string; // Nguồn tin
  note?: string;
  
  // Legacy support for lists/dashboards (takes the first image)
  imageBeforePath: string; 
  imageBeforeDataUrl?: string;

  // New Multi-media support (PC06 create)
  evidence: MediaItem[];

  // Report fields (Xã phường nhập)
  reportContent?: string;
  reportBBN?: string; // Số biên bản
  reportTime?: string; // Thời gian lập BB
  resolvedTime?: string; // Thời gian bấm hoàn thành
  
  // New Multi-media support for Report (Ward report)
  reportEvidence?: MediaItem[];
  
  // Legacy support
  imageAfterPath?: string;
  imageAfterDataUrl?: string;

  status: TaskStatus;
  
  versions: IssueVersion[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  targetId: string;
  details: string;
}

export interface DashboardStats {
  totalIssues: number;
  slaBreach: number;
  pendingConfirm: number;
  currentScore: number; // Điểm tháng hiện tại
  rank: string; // HTXSNV, etc.
}
