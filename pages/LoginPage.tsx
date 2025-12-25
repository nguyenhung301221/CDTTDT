
import React, { useState } from 'react';
import { mockService } from '../services/mockService';
import { User } from '../types';
import { getApiUrl, setApiUrl } from '../services/apiConfig';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(false);
  const [tempUrl, setTempUrl] = useState(getApiUrl());
  const [diagStep, setDiagStep] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  // Hàm chuẩn hóa email để tránh lỗi nhập liệu
  const normalizeEmail = (input: string) => {
    let clean = input.trim().toLowerCase();
    if (!clean) return "";
    
    // Nếu chỉ nhập "hoankiem", tự chuyển thành "p.hoankiem@pol.vn"
    if (!clean.includes('@')) {
        clean = `p.${clean}@pol.vn`;
    } 
    // Nếu nhập "hoankiem@pol.vn", tự thêm "p." nếu thiếu
    else if (clean.endsWith('@pol.vn') && !clean.startsWith('p.') && !clean.includes('admin') && !clean.includes('canbo')) {
        clean = `p.${clean}`;
    }
    return clean;
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const finalEmail = normalizeEmail(email);
    
    if (!finalEmail) {
        setError("Vui lòng nhập email hoặc tên đơn vị.");
        return;
    }

    const result = await mockService.login(finalEmail);
    if (result.success) {
        setEmail(finalEmail); // Cập nhật lại email đã chuẩn hóa vào state
        setStep(2);
    } else {
        setError(`Không tìm thấy tài khoản: ${finalEmail}\n\nGợi ý: Thử nhập 'hoankiem' hoặc 'p.hoankiem@pol.vn'`);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const user = await mockService.verifyOTP(email, otp);
    if (user) {
        onLoginSuccess(user);
    } else {
        setError('Mã xác thực không chính xác. Vui lòng thử lại với mã 123456');
        setOtp(''); // Clear OTP để nhập lại
    }
  };

  const runDiagnostic = async () => {
    setIsTesting(true);
    setError('');
    setDiagStep('1. Kiểm tra định dạng URL...');
    
    if (!tempUrl.includes('/exec')) {
        setError('URL sai định dạng. Phải kết thúc bằng /exec');
        setIsTesting(false);
        return;
    }

    setDiagStep('2. Đang gửi tín hiệu PING tới Cloud...');
    const oldUrl = getApiUrl();
    setApiUrl(tempUrl);
    
    try {
        const res = await mockService.testApiConnection();
        if (res.ok) {
            setDiagStep('3. Phản hồi thành công! Dữ liệu JSON hợp lệ.');
            alert("✅ KẾT NỐI HOÀN HẢO!\n\nBạn đã cấu hình đúng 'Anyone' và 'Me'. Ứng dụng sẽ hoạt động ổn định trên mọi máy tính.");
        } else {
            throw new Error(res.error || "Máy chủ không phản hồi JSON");
        }
    } catch (e: any) {
        setDiagStep('❌ LỖI KẾT NỐI');
        setError(`Lỗi: ${e.message}\n\nHãy chắc chắn bạn đã: \n- Chọn Deploy -> New Deployment\n- Chọn 'Anyone' (Bất kỳ ai)\n- Chọn Execute as: 'Me'`);
        setApiUrl(oldUrl);
    } finally {
        setIsTesting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 relative overflow-hidden">
        
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-40 h-40 bg-blue-600/5 rounded-full"></div>

        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">PC06 HÀ NỘI</h1>
          <p className="text-[10px] text-blue-600 mt-2 font-black uppercase tracking-[0.2em]">Hệ thống quản lý chỉ tiêu</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 text-[11px] font-bold p-4 rounded-2xl mb-6 border border-red-100 flex items-start whitespace-pre-line">
            <svg className="w-4 h-4 mr-2 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {!showConfig ? (
          <>
            {step === 1 ? (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tài khoản đơn vị</label>
                  <input
                    type="text"
                    required
                    className="w-full px-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:outline-none focus:border-blue-600 focus:bg-white font-bold text-slate-700 transition-all text-sm"
                    placeholder="Nhập 'hoankiem' hoặc email..."
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-blue-600 transition-all active:scale-[0.98]"
                >
                  Tiếp tục
                </button>
                <div className="pt-4 text-center">
                   <button type="button" onClick={() => setShowConfig(true)} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600">
                        ⚙️ Cấu hình liên máy tính
                   </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="text-center mb-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Đang đăng nhập:</p>
                    <p className="text-sm font-black text-blue-600">{email}</p>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Nhập mã xác thực (123456)</label>
                   <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    className="w-full px-5 py-6 border-2 border-slate-100 rounded-3xl focus:outline-none focus:border-blue-600 text-center text-4xl font-black tracking-[0.4em] text-blue-600 bg-slate-50 shadow-inner"
                    placeholder="000000"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                   />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/30 hover:bg-blue-700 transition-all"
                >
                  Xác nhận OTP
                </button>
                <button type="button" onClick={() => setStep(1)} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest">Dùng tài khoản khác</button>
              </form>
            )}
          </>
        ) : (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Chuẩn đoán kết nối</h3>
                  <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded-lg text-[9px] font-black">ULTRA-RESILIENT</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dán link <b>Apps Script</b> của bạn vào đây để đồng bộ dữ liệu giữa các máy tính.
              </p>
              
              <textarea 
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[10px] font-mono focus:outline-none focus:border-blue-600" 
                rows={4}
                value={tempUrl}
                onChange={e => setTempUrl(e.target.value)}
                placeholder="Dán link Google Web App /exec vào đây..."
              />

              {diagStep && <div className="text-[10px] font-mono text-blue-600 bg-blue-50 p-2 rounded-lg italic">{diagStep}</div>}

              <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={runDiagnostic} 
                    disabled={isTesting}
                    className="py-4 bg-blue-50 text-blue-600 rounded-2xl font-black text-[10px] uppercase hover:bg-blue-100 transition-all disabled:opacity-50"
                  >
                    {isTesting ? "ĐANG CHẨN ĐOÁN..." : "CHẨN ĐOÁN LỖI"}
                  </button>
                  <button 
                    onClick={() => { setApiUrl(tempUrl); setShowConfig(false); window.location.reload(); }} 
                    className="py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-600/20"
                  >
                    LƯU CẤU HÌNH
                  </button>
              </div>
              <button onClick={() => setShowConfig(false)} className="w-full text-slate-400 text-[10px] font-black uppercase tracking-widest pt-2">Quay lại</button>
          </div>
        )}
      </div>
    </div>
  );
};
