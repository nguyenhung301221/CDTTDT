
import React, { useState } from 'react';
import { User, Role, MediaItem } from '../types';
import { mockService } from '../services/mockService';
import { MOCK_USERS, VIOLATION_CODES } from '../constants';

// Cải tiến hàm nén: Sử dụng WebP cho các trình duyệt hiện đại
const compressImage = (base64: string, maxWidth = 1200, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; }
      } else {
        if (height > maxWidth) { width *= maxWidth / height; height = maxWidth; }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      // Ưu tiên WebP để dung lượng nhỏ nhất mà vẫn rõ nét
      resolve(canvas.toDataURL('image/webp', quality));
    };
  });
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

interface ViolationEntry {
    tempId: string;
    violationCode: string;
    locationDescription: string;
    previews: string[];
}

export const CreateIssue: React.FC<{ user: User; onCreated: () => void }> = ({ user, onCreated }) => {
  const [wardId, setWardId] = useState('');
  const [source, setSource] = useState('Tuần tra trực tiếp');
  const [entries, setEntries] = useState<ViolationEntry[]>([
      { tempId: Date.now().toString(), violationCode: '', locationDescription: '', previews: [] }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const addNewEntry = () => {
      setEntries([...entries, { tempId: Date.now().toString(), violationCode: '', locationDescription: '', previews: [] }]);
  };

  const removeEntry = (tempId: string) => {
      if (entries.length > 1) setEntries(entries.filter(e => e.tempId !== tempId));
  };

  const updateEntry = (tempId: string, field: keyof ViolationEntry, value: any) => {
      setEntries(entries.map(e => e.tempId === tempId ? { ...e, [field]: value } : e));
  };

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>, tempId: string) => {
      if (!e.target.files?.length) return;
      setIsLoading(true);
      const files = Array.from(e.target.files) as File[];
      const newB64s: string[] = [];
      for (const f of files) {
          let b64 = await fileToBase64(f);
          b64 = await compressImage(b64);
          newB64s.push(b64);
      }
      setEntries(entries.map(e => e.tempId === tempId ? { ...e, previews: [...e.previews, ...newB64s] } : e));
      setIsLoading(false);
      e.target.value = '';
  };

  const handleSubmitAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wardId) { alert("Vui lòng chọn đơn vị!"); return; }
    const isValid = entries.every(e => e.violationCode && e.locationDescription && e.previews.length > 0);
    if (!isValid) { alert("Vui lòng nhập đủ thông tin cho tất cả các mục!"); return; }

    setIsLoading(true);
    const ward = MOCK_USERS.find(u => u.id === wardId);
    try {
        for (const entry of entries) {
            const evidence: MediaItem[] = entry.previews.map((url, i) => ({
                id: `ev_${Date.now()}_${entry.tempId}_${i}`,
                type: 'IMAGE',
                url,
                description: entry.locationDescription
            }));
            await mockService.createIssue({
                wardId,
                wardName: ward?.unitName,
                violationCode: entry.violationCode,
                locationDescription: entry.locationDescription,
                source,
                evidence
            }, user.email);
        }
        onCreated();
    } catch (err) {
        alert("Lỗi khi lưu dữ liệu.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-2xl p-8 border border-slate-100">
        <div className="flex justify-between items-center mb-10">
            <h2 className="text-3xl font-black text-slate-800 tracking-tight flex items-center">
                <span className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white mr-4 shadow-xl shadow-blue-500/20">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </span>
                Ghi nhận mới
            </h2>
            <div className="bg-green-50 px-4 py-2 rounded-xl border border-green-100 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-ping mr-3"></div>
                <span className="text-xs font-black text-green-700 uppercase tracking-widest">WebP Compression ON</span>
            </div>
        </div>

        <form onSubmit={handleSubmitAll} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Đơn vị địa bàn</label>
                  <select 
                    required 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm focus:ring-4 ring-blue-500/10" 
                    value={wardId} 
                    onChange={e => setWardId(e.target.value)}
                  >
                      <option value="">-- Chọn Phường/Xã --</option>
                      {MOCK_USERS.filter(u => u.role === Role.WARD).map(u => (<option key={u.id} value={u.id}>{u.unitName}</option>))}
                  </select>
              </div>
              <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nguồn tin</label>
                  <select 
                    className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm" 
                    value={source} 
                    onChange={e => setSource(e.target.value)}
                  >
                      <option>Tuần tra trực tiếp</option>
                      <option>Camera thông minh</option>
                      <option>Phản ánh nhân dân</option>
                  </select>
              </div>
          </div>

          <div className="space-y-6">
              {entries.map((entry, index) => (
                  <div key={entry.tempId} className="group relative bg-white border-2 border-slate-50 rounded-3xl p-6 shadow-sm hover:shadow-xl transition-all">
                      {entries.length > 1 && (
                          <button type="button" onClick={() => removeEntry(entry.tempId)} className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                          </button>
                      )}
                      <div className="flex flex-col md:flex-row gap-6">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 shrink-0">{index + 1}</div>
                          <div className="flex-1 space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <select required className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" value={entry.violationCode} onChange={e => updateEntry(entry.tempId, 'violationCode', e.target.value)}>
                                      <option value="">-- Chọn hành vi --</option>
                                      {VIOLATION_CODES.map(v => <option key={v.code} value={v.code}>[{v.code}] {v.name}</option>)}
                                  </select>
                                  <input required type="text" placeholder="Địa chỉ cụ thể..." className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-bold" value={entry.locationDescription} onChange={e => updateEntry(entry.tempId, 'locationDescription', e.target.value)} />
                              </div>
                              <div className="flex items-center space-x-4">
                                  <label className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-blue-500/30 hover:bg-blue-700 transition-colors">
                                      CHỤP ẢNH
                                      <input type="file" className="hidden" accept="image/*" multiple onChange={e => handleFiles(e, entry.tempId)} />
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                      {entry.previews.map((p, pi) => (
                                          <div key={pi} className="w-14 h-14 rounded-lg overflow-hidden border-2 border-white shadow-sm hover:scale-105 transition-transform"><img src={p} className="w-full h-full object-cover" /></div>
                                      ))}
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              ))}
              <button type="button" onClick={addNewEntry} className="w-full py-5 border-4 border-dashed border-slate-100 rounded-3xl text-slate-400 font-black hover:border-blue-200 hover:text-blue-600 hover:bg-blue-50/50 transition-all uppercase tracking-widest text-xs">
                  + Thêm hành vi tại vị trí này
              </button>
          </div>

          <div className="pt-8">
              <button type="submit" disabled={isLoading} className="w-full py-6 bg-slate-900 text-white rounded-3xl font-black text-lg shadow-2xl hover:bg-black transition-all disabled:opacity-50 uppercase tracking-[0.2em]">
                  {isLoading ? "Đang xử lý dữ liệu..." : `Xác nhận & Gửi ${entries.length} mục`}
              </button>
              <p className="text-center text-[10px] text-slate-400 mt-6 font-bold uppercase italic tracking-wider">Hệ thống tự động sử dụng định dạng WebP để tối ưu bộ nhớ</p>
          </div>
        </form>
      </div>
    </div>
  );
};
