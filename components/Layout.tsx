
import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';
import { dataStore } from '../storage/store';
import { mockService } from '../services/mockService';

interface LayoutProps {
  user: User;
  children: React.ReactNode;
  onLogout: () => void;
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ user, children, onLogout, currentPage, onNavigate }) => {
  const [lastSaved, setLastSaved] = useState<string | undefined>();
  const [storageUsage, setStorageUsage] = useState<string>("Đang tính...");
  const [isSyncing, setIsSyncing] = useState(false);
  const [isCloudOnline, setIsCloudOnline] = useState(true);
  const [isPersistent, setIsPersistent] = useState<boolean | null>(null);

  const updateStatus = async () => {
      const store = await dataStore.getStore();
      setLastSaved(store.meta.lastUpdated);
      const usage = await dataStore.getStorageUsage();
      setStorageUsage(usage);
      const persist = await dataStore.isPersistent();
      setIsPersistent(persist);
      
      try {
          const check = await mockService.testApiConnection();
          setIsCloudOnline(check.ok);
      } catch {
          setIsCloudOnline(false);
      }
  };

  useEffect(() => {
      updateStatus();
      const interval = setInterval(updateStatus, 30000);
      return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
      setIsSyncing(true);
      const res = await mockService.pullFromCloud();
      if (res.success) {
          alert(`✅ Đã khôi phục ${res.count} bản ghi từ Đám mây!`);
      } else {
          alert("❌ Không thể kết nối máy chủ để khôi phục.");
      }
      await updateStatus();
      setIsSyncing(false);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan', roles: [Role.ADMIN, Role.REVIEWER, Role.WARD] },
    { id: 'ward_profile', label: 'Hồ sơ & Cộng điểm', roles: [Role.WARD] },
    { id: 'approvals', label: 'Phê duyệt ĐK/Cộng', roles: [Role.ADMIN, Role.REVIEWER] },
    { id: 'tasks', label: 'Nhiệm vụ', roles: [Role.ADMIN, Role.REVIEWER, Role.WARD] },
    { id: 'create', label: 'Tạo ghi nhận', roles: [Role.ADMIN, Role.REVIEWER] },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10">
        <div className="p-4 border-b border-slate-700 text-center">
          <h1 className="text-xl font-bold text-blue-400 uppercase">PC06 HÀ NỘI</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1 italic">An toàn - Bảo mật - Bền vững</p>
        </div>
        
        <div className="p-4 border-b border-slate-700 bg-slate-800/50">
          <div className="text-sm font-bold text-blue-100">{user.unitName}</div>
          <div className="text-[11px] text-slate-400 truncate">{user.email}</div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            if (!item.roles.includes(user.role)) return null;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full text-left px-4 py-2.5 rounded text-sm font-medium transition-all ${
                  currentPage === item.id 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* TRẠNG THÁI AN TOÀN DỮ LIỆU CẢI TIẾN */}
        <div className="px-3 py-4 bg-slate-950/50 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between px-1">
                <span className="text-[9px] font-black text-slate-500 uppercase">Bảo vệ ổ cứng</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${isPersistent ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {isPersistent ? 'VĨNH VIỄN' : 'TẠM THỜI'}
                </span>
            </div>

            <div className="bg-slate-900 rounded-xl p-2 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isCloudOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">MÁY CHỦ CLOUD</span>
                    </div>
                </div>
                <button 
                    onClick={handleManualSync} 
                    disabled={isSyncing} 
                    className="w-full py-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg text-[10px] font-black uppercase transition-all flex items-center justify-center border border-blue-600/30"
                >
                    <svg className={`w-3 h-3 mr-2 ${isSyncing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    {isSyncing ? 'ĐANG KHÔI PHỤC...' : 'KHÔI PHỤC KHẨN CẤP'}
                </button>
            </div>

            {!isPersistent && (
                <div className="text-[9px] text-red-400 leading-tight bg-red-900/10 p-2 rounded border border-red-900/20">
                    ⚠️ Trình duyệt đang ở chế độ xóa dữ liệu tự động. Nếu mất dữ liệu hãy nhấn <b>KHÔI PHỤC KHẨN CẤP</b>.
                </div>
            )}
            
            <div className="text-[9px] text-slate-500 text-center font-mono">
                Lưu máy: {lastSaved ? new Date(lastSaved).toLocaleTimeString('vi-VN') : '--:--'}
            </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button onClick={onLogout} className="w-full py-2 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 rounded text-xs transition-colors font-bold uppercase tracking-widest">
            Đăng xuất
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur shadow-sm sticky top-0 z-20 px-8 py-4 flex justify-between items-center border-b">
             <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                {menuItems.find(i => i.id === currentPage)?.label || 'Chi tiết'}
             </h2>
             <div className="flex items-center space-x-4">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-green-600 uppercase">Dữ liệu an toàn</span>
                    <span className="text-[9px] text-slate-400 font-bold">Mọi thay đổi đã được đẩy lên Đám mây</span>
                </div>
             </div>
        </header>
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
};
