
import React, { useState, useEffect } from 'react';
import { User, WardRegistration, RegistrationStatus, BonusRequest, BonusStatus } from '../types';
import { mockService } from '../services/mockService';

interface RegistrationReviewProps {
  user: User;
}

export const RegistrationReview: React.FC<RegistrationReviewProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'REGISTRATION' | 'BONUS'>('REGISTRATION');
  const [isLoading, setIsLoading] = useState(true);
  
  // Registration Data
  const [registrations, setRegistrations] = useState<WardRegistration[]>([]);
  const [filterReg, setFilterReg] = useState<string>('PENDING');

  // Bonus Data
  const [bonusRequests, setBonusRequests] = useState<BonusRequest[]>([]);
  const [filterBonus, setFilterBonus] = useState<string>('PENDING');

  useEffect(() => {
    const fetchData = async () => {
        setIsLoading(true);
        const [regs, bns] = await Promise.all([
            mockService.getRegistrations(),
            mockService.getBonusRequests()
        ]);
        setRegistrations(regs);
        setBonusRequests(bns);
        setIsLoading(false);
    };
    fetchData();
  }, []);

  // --- Handlers ---
  const handleReviewReg = async (id: string, action: 'APPROVE' | 'REJECT') => {
      const note = prompt(action === 'APPROVE' ? "Ghi chú duyệt (không bắt buộc):" : "Lý do từ chối (Bắt buộc):");
      if (action === 'REJECT' && !note) return; 

      try {
          await mockService.reviewRegistration(id, action, note || '');
          const updated = await mockService.getRegistrations();
          setRegistrations(updated);
      } catch (e) { alert("Lỗi khi xử lý"); }
  };

  const handleReviewBonus = async (id: string, action: 'APPROVE' | 'REJECT') => {
      const note = prompt(action === 'APPROVE' ? "Ghi chú đồng ý (không bắt buộc):" : "Lý do từ chối (Bắt buộc):");
      if (action === 'REJECT' && !note) return;

      try {
          await mockService.reviewBonusRequest(id, action, note || '');
          const updated = await mockService.getBonusRequests();
          setBonusRequests(updated);
      } catch (e) { alert("Lỗi khi xử lý"); }
  };

  // --- Filtering ---
  const filteredRegs = registrations.filter(r => {
      if (filterReg === 'ALL') return true;
      if (filterReg === 'PENDING') return r.status === RegistrationStatus.PENDING;
      return r.status === filterReg;
  });

  const filteredBonus = bonusRequests.filter(b => {
      if (filterBonus === 'ALL') return true;
      if (filterBonus === 'PENDING') return b.status === BonusStatus.PENDING;
      return b.status === filterBonus;
  });

  if (isLoading) return <div className="p-10 text-center animate-pulse">ĐANG TẢI DỮ LIỆU...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
          <h2 className="text-xl font-bold text-slate-800">Phê duyệt Yêu cầu từ Đơn vị</h2>
          <div className="flex bg-slate-200 rounded p-1">
              <button 
                onClick={() => setActiveTab('REGISTRATION')}
                className={`px-4 py-2 text-sm font-bold rounded transition ${activeTab === 'REGISTRATION' ? 'bg-white shadow text-blue-700' : 'text-slate-600'}`}
              >
                  Đăng ký Chỉ tiêu
              </button>
              <button 
                onClick={() => setActiveTab('BONUS')}
                className={`px-4 py-2 text-sm font-bold rounded transition ${activeTab === 'BONUS' ? 'bg-white shadow text-green-700' : 'text-slate-600'}`}
              >
                  Đề xuất Cộng điểm
              </button>
          </div>
      </div>

      {activeTab === 'REGISTRATION' && (
          <div>
             <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-bold text-slate-500 uppercase">Danh sách đăng ký rà soát</div>
                <div className="flex space-x-2">
                    {[
                        {k: 'PENDING', l: 'Chờ duyệt'}, 
                        {k: 'APPROVED', l: 'Đã duyệt'}, 
                        {k: 'REJECTED', l: 'Từ chối'}, 
                        {k: 'ALL', l: 'Tất cả'}
                    ].map(f => (
                        <button key={f.k} onClick={() => setFilterReg(f.k)} className={`px-3 py-1 text-xs rounded-full font-medium ${filterReg === f.k ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                            {f.l}
                        </button>
                    ))}
                </div>
             </div>
             <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Đơn vị</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tháng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Điểm Đăng ký</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Hệ số</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredRegs.map(reg => (
                            <tr key={reg.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">{reg.wardName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{reg.month}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{reg.points}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">Loại {reg.proposedCoefficient}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {reg.status === RegistrationStatus.PENDING && <span className="text-yellow-600 font-bold text-xs">Chờ duyệt</span>}
                                    {reg.status === RegistrationStatus.APPROVED && <span className="text-green-600 font-bold text-xs">Đã duyệt</span>}
                                    {reg.status === RegistrationStatus.REJECTED && <span className="text-red-600 font-bold text-xs">Từ chối</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {reg.status === RegistrationStatus.PENDING && (
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => handleReviewReg(reg.id, 'APPROVE')} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded border border-green-200">Duyệt</button>
                                            <button onClick={() => handleReviewReg(reg.id, 'REJECT')} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded border border-red-200">Từ chối</button>
                                        </div>
                                    )}
                                    {reg.status !== RegistrationStatus.PENDING && <span className="text-slate-400 text-xs italic">{reg.note || '-'}</span>}
                                </td>
                            </tr>
                        ))}
                        {filteredRegs.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">Không có dữ liệu</td></tr>}
                    </tbody>
                </table>
             </div>
          </div>
      )}

      {activeTab === 'BONUS' && (
          <div>
             <div className="flex justify-between items-center mb-4">
                <div className="text-sm font-bold text-slate-500 uppercase">Danh sách đề xuất cộng điểm</div>
                <div className="flex space-x-2">
                    {[
                        {k: 'PENDING', l: 'Chờ duyệt'}, 
                        {k: 'APPROVED', l: 'Đã duyệt'}, 
                        {k: 'REJECTED', l: 'Từ chối'}, 
                        {k: 'ALL', l: 'Tất cả'}
                    ].map(f => (
                        <button key={f.k} onClick={() => setFilterBonus(f.k)} className={`px-3 py-1 text-xs rounded-full font-medium ${filterBonus === f.k ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}>
                            {f.l}
                        </button>
                    ))}
                </div>
             </div>
             <div className="bg-white rounded shadow overflow-hidden">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Đơn vị / Tháng</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nội dung đề xuất</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Điểm đề xuất</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Ghi chú</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {filteredBonus.map(bonus => (
                            <tr key={bonus.id} className="hover:bg-slate-50">
                                <td className="px-6 py-4">
                                    <div className="text-sm font-bold text-slate-900">{bonus.wardName}</div>
                                    <div className="text-xs text-slate-500">{bonus.month}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs font-bold bg-slate-100 px-1 inline rounded">{bonus.criteriaId}</div>
                                    <div className="text-sm text-slate-700 mt-1">{bonus.criteriaContent}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">+{bonus.requestedPoints}</td>
                                <td className="px-6 py-4 text-sm text-slate-500 italic max-w-xs truncate" title={bonus.description}>{bonus.description}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {bonus.status === BonusStatus.PENDING && <span className="text-yellow-600 font-bold text-xs">Chờ duyệt</span>}
                                    {bonus.status === BonusStatus.APPROVED && <span className="text-green-600 font-bold text-xs">Đã cộng</span>}
                                    {bonus.status === BonusStatus.REJECTED && <span className="text-red-600 font-bold text-xs">Từ chối</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {bonus.status === BonusStatus.PENDING && (
                                        <div className="flex justify-end space-x-2">
                                            <button onClick={() => handleReviewBonus(bonus.id, 'APPROVE')} className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded border border-green-200">Đồng ý</button>
                                            <button onClick={() => handleReviewBonus(bonus.id, 'REJECT')} className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded border border-red-200">Từ chối</button>
                                        </div>
                                    )}
                                    {bonus.status !== BonusStatus.PENDING && <span className="text-slate-400 text-xs italic">{bonus.reviewerNote || '-'}</span>}
                                </td>
                            </tr>
                        ))}
                        {filteredBonus.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500 italic">Không có dữ liệu</td></tr>}
                    </tbody>
                </table>
             </div>
          </div>
      )}
    </div>
  );
};
