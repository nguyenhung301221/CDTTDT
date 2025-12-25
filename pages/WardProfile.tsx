
import React, { useState, useEffect } from 'react';
import { User, WardRegistration, RegistrationStatus, BonusStatus, BonusRequest } from '../types';
import { mockService } from '../services/mockService';
import { dataStore } from '../storage/store';
import { getAreaConfig, BONUS_CRITERIA_LIST } from '../constants';

export const WardProfile: React.FC<{ user: User; onUpdateSuccess: (u: User) => void }> = ({ user, onUpdateSuccess }) => {
  const [points, setPoints] = useState<number>(user.totalViolationPoints || 0);
  const [previewConfig, setPreviewConfig] = useState(getAreaConfig(user.totalViolationPoints || 0));
  const [registrations, setRegistrations] = useState<WardRegistration[]>([]);
  const [bonusRequests, setBonusRequests] = useState<BonusRequest[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [storageInfo, setStorageInfo] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
        const [regs, bonuses, usage] = await Promise.all([
            mockService.getRegistrations(user.id),
            mockService.getBonusRequests(user.id),
            dataStore.getStorageUsage()
        ]);
        setRegistrations(regs);
        setBonusRequests(bonuses);
        setStorageInfo(usage);
    };
    fetchData();
  }, [user]);

  const handleArchive = async () => {
      if (!confirm("Hệ thống sẽ nén tất cả ảnh cũ (trên 1 năm) thành dạng thu nhỏ (thumbnail) để giải phóng bộ nhớ. Bạn có chắc chắn?")) return;
      setIsArchiving(true);
      const result = await dataStore.archiveOldData(365);
      const usage = await dataStore.getStorageUsage();
      setStorageInfo(usage);
      setIsArchiving(false);
      alert(`Đã tối ưu hóa ${result.count} bản ghi cũ!`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* QUẢN LÝ BỘ NHỚ */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center space-x-5">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center border border-blue-500/30">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
              </div>
              <div>
                  <h3 className="text-lg font-black uppercase tracking-tight">Trung tâm lưu trữ Đơn vị</h3>
                  <div className="flex items-center space-x-3 mt-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Dung lượng sử dụng:</span>
                      <span className="text-sm font-black text-blue-400">{storageInfo}</span>
                  </div>
              </div>
          </div>
          <button 
            onClick={handleArchive}
            disabled={isArchiving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold text-sm transition-all flex items-center shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
              {isArchiving ? (
                  <span className="flex items-center">
                      <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      ĐANG TỐI ƯU...
                  </span>
              ) : (
                  "NÉN DỮ LIỆU CŨ (>1 NĂM)"
              )}
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form đăng ký và các phần cũ giữ nguyên... */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="font-black text-slate-800 uppercase text-sm mb-4">Đăng ký rà soát tháng</h3>
              {/* Giữ nguyên logic form cũ ở đây */}
              <input 
                type="number" 
                className="w-full p-4 border-2 border-slate-100 rounded-xl mb-4 font-bold text-xl" 
                value={points} 
                onChange={e => setPoints(Number(e.target.value))}
              />
              <div className="p-4 bg-blue-50 rounded-xl mb-4">
                  <div className="text-[10px] font-bold text-blue-400 uppercase">Phân loại dự kiến</div>
                  <div className="text-blue-900 font-bold">{previewConfig.label}</div>
              </div>
              <button 
                onClick={async () => {
                    setIsSaving(true);
                    await mockService.submitRegistration(points, "12/2025");
                    setIsSaving(false);
                    alert("Đã gửi đăng ký thành công!");
                }}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-black shadow-lg"
              >
                  XÁC NHẬN ĐĂNG KÝ
              </button>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border overflow-hidden">
              <h3 className="font-black text-slate-800 uppercase text-sm mb-4">Lịch sử hoạt động</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {registrations.map(reg => (
                      <div key={reg.id} className="p-4 border-l-4 border-blue-500 bg-slate-50 rounded-r-xl">
                          <div className="flex justify-between font-bold text-xs uppercase text-slate-400 mb-1">
                              <span>Tháng {reg.month}</span>
                              <span className="text-blue-600">{reg.status}</span>
                          </div>
                          <div className="text-lg font-black text-slate-800">{reg.points} điểm</div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
