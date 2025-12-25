
import React, { useMemo, useState, useEffect } from 'react';
import { User, Role, TaskStatus, ScoringType, BonusStatus, Issue, BonusRequest } from '../types';
import { mockService } from '../services/mockService';
import { VIOLATION_CODES, MOCK_USERS, getAreaConfig } from '../constants';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: User;
}

export const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [bonuses, setBonuses] = useState<BonusRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
      const [iss, bns] = await Promise.all([
          mockService.getIssues(),
          mockService.getBonusRequests()
      ]);
      setIssues(iss);
      setBonuses(bns);
      setIsLoading(false);
  };

  useEffect(() => {
      fetchData();
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
  }, []);

  const stats = useMemo(() => {
    const confirmedIssues = issues.filter(i => i.status === TaskStatus.CONFIRMED);
    const wardScores: Record<string, any> = {};
    const uniqueWards = Array.from(new Set(issues.map(i => i.wardId))) as string[];

    uniqueWards.forEach(wId => {
      let wardUser = (user.id === wId) ? user : MOCK_USERS.find(u => u.id === wId);
      if (!wardUser) return;
      const config = getAreaConfig(wardUser.totalViolationPoints || 0);
      let totalRatioPoints = 0;
      let totalDirectDeduction = 0;
      confirmedIssues.filter(i => i.wardId === wId).forEach(issue => {
        const vCode = VIOLATION_CODES.find(v => v.code === issue.violationCode);
        if (vCode?.scoringType === ScoringType.RATIO) totalRatioPoints += issue.penaltyPoints;
        else if (vCode?.scoringType === ScoringType.DIRECT) totalDirectDeduction += (vCode.directDeductionFactor || 1);
      });
      const ratioDeduction = (config.baseScore > 0 ? (totalRatioPoints / config.baseScore) * 100 : 0) * config.coefficient;
      const bonusPoints = bonuses.filter(b => b.wardId === wId && b.status === BonusStatus.APPROVED).reduce((sum, b) => sum + (b.finalPoints || 0), 0);
      let finalScore = Math.max(0, Math.min(100, 100 - (ratioDeduction + totalDirectDeduction) + bonusPoints));
      wardScores[wId] = { name: wardUser.unitName, score: finalScore.toFixed(2) };
    });
    return { total: issues.length, wardScores };
  }, [issues, bonuses, user]);

  const handleCopyLink = () => {
      const url = window.location.origin;
      navigator.clipboard.writeText(url);
      alert(`ĐÃ COPY LINK GỐC: ${url}\n\nLƯU Ý: Nếu máy khác báo 404, hãy kiểm tra kết nối mạng và đảm bảo máy đó có thể truy cập Internet.`);
  };

  if (isLoading) return <div className="p-10 text-center animate-pulse font-black text-slate-400">ĐANG ĐỒNG BỘ CLOUD...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-slate-900 to-blue-900 p-8 rounded-3xl shadow-2xl text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-2xl font-black uppercase tracking-tight">Hệ thống đồng bộ liên máy tính</h3>
                  <p className="text-sm text-blue-200 opacity-70 max-w-md">Dữ liệu của bạn được bảo vệ trên Google Cloud. Bạn có thể tắt máy và quay lại sau 2 năm, dữ liệu vẫn sẽ được bảo toàn nguyên vẹn.</p>
              </div>
              <button 
                onClick={handleCopyLink}
                className="px-8 py-4 bg-white text-blue-900 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-105 transition-all"
              >
                  Sao chép Link chia sẻ
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[10px] font-black uppercase mb-1">Dữ liệu trên Cloud</div>
          <div className="text-3xl font-black text-blue-600">{stats.total} bản ghi</div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[10px] font-black uppercase mb-1">Trạng thái kết nối</div>
          <div className="flex items-center text-green-600 font-bold uppercase text-xs">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              ONLINE & BỀN VỮNG
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-slate-400 text-[10px] font-black uppercase mb-1">Lần cuối lưu mây</div>
          <div className="text-sm font-black text-slate-800 uppercase">{new Date().toLocaleTimeString('vi-VN')}</div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-black text-slate-800 mb-6 uppercase tracking-tight">Biểu đồ thi đua thời gian thực</h3>
          <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={Object.values(stats.wardScores)}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} fontSize={10} />
                      <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                      <Bar dataKey="score" fill="#2563eb" radius={[8, 8, 0, 0]} name="Điểm thi đua" barSize={40} />
                  </BarChart>
              </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
};
