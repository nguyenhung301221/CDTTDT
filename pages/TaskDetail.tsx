
import React, { useState, useEffect, useRef } from 'react';
import { User, Role, Issue, TaskStatus, IssueVersion, MediaItem } from '../types';
import { mockService } from '../services/mockService';
import { VIOLATION_CODES, OFFICERS_LIST } from '../constants';
import { SlaTimer } from '../components/SlaTimer';

const compressImage = (base64: string, maxWidth = 800, quality = 0.7): Promise<string> => {
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
      resolve(canvas.toDataURL('image/jpeg', quality));
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

interface LocalMedia {
    file: File;
    preview: string;
    description: string;
    type: 'IMAGE' | 'VIDEO';
}

export const TaskDetail: React.FC<{ user: User; taskId: string; onBack: () => void; onUpdate: () => void }> = ({ user, taskId, onBack, onUpdate }) => {
  // Fix: Move issue fetching into useEffect
  const [issue, setIssue] = useState<Issue | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'INFO' | 'HISTORY'>('INFO');
  const [reportData, setReportData] = useState({ bbNumber: '', bbTime: new Date().toTimeString().slice(0, 5), operator: '' });
  const [reportMediaList, setReportMediaList] = useState<LocalMedia[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pc06Reason, setPc06Reason] = useState('');

  useEffect(() => {
    const fetchIssue = async () => {
      const data = await mockService.getIssueById(taskId);
      setIssue(data || null);
      setIsLoading(false);
    };
    fetchIssue();
  }, [taskId]);

  if (isLoading) return <div className="p-10 text-center animate-pulse">ĐANG TẢI...</div>;
  if (!issue) return <div>Không tìm thấy nhiệm vụ.</div>;

  const handleReportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'IMAGE' | 'VIDEO') => {
      if (!e.target.files?.length) return;
      setIsSubmitting(true);
      const newFiles = Array.from(e.target.files) as File[];
      for (const file of newFiles) {
          try {
              let base64 = await fileToBase64(file);
              if (type === 'IMAGE') base64 = await compressImage(base64);
              setReportMediaList(prev => [...prev, { file, preview: base64, description: '', type }]);
          } catch (err) { console.error(err); }
      }
      setIsSubmitting(false);
      e.target.value = '';
  };

  const handleWardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportData.operator || !reportData.bbNumber) { alert("Nhập đủ thông tin!"); return; }
    if (reportMediaList.length === 0) { alert("Đính kèm chứng cứ sau xử lý!"); return; }

    setIsSubmitting(true);
    const evidence: MediaItem[] = reportMediaList.map((m, idx) => ({
        id: `rep_${Date.now()}_${idx}`,
        type: m.type,
        url: m.preview,
        description: m.description || `Sau xử lý #${idx + 1}`
    }));

    const content = `Đã lập biên bản xử phạt số ${reportData.bbNumber} lúc ${reportData.bbTime}; Đã giải tỏa vi phạm.`;
    
    try {
        // Fix: Await updateIssue
        await mockService.updateIssue(issue.id, {
            status: TaskStatus.RESOLVED,
            reportContent: content,
            reportBBN: reportData.bbNumber,
            reportTime: reportData.bbTime,
            reportEvidence: evidence
        }, 'Báo cáo hoàn thành', reportData.operator);
        onUpdate();
    } catch (err) {
        alert("Lỗi khi lưu báo cáo.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handlePC06Action = async (action: 'CONFIRM' | 'REJECT') => {
      // Fix: Await updateIssue
      await mockService.updateIssue(issue.id, {
          status: action === 'CONFIRM' ? TaskStatus.CONFIRMED : TaskStatus.REJECTED,
          note: pc06Reason ? `[Ghi chú QLHC]: ${pc06Reason}` : ''
      }, action === 'CONFIRM' ? 'Xác nhận' : 'Yêu cầu bổ sung', user.email);
      onUpdate();
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <button onClick={onBack} className="text-sm text-slate-500 hover:text-blue-600">← Quay lại</button>
      
      <div className="bg-white rounded shadow border overflow-hidden">
        <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
            <div>
                <h1 className="text-xl font-bold">{issue.customName || `Nhiệm vụ: ${issue.id}`}</h1>
                <div className="text-sm text-slate-500">{issue.wardName} | {new Date(issue.createdTime).toLocaleString('vi-VN')}</div>
            </div>
            <div className="text-right">
                <div className="text-xs text-slate-400 mb-1">SLA 45 phút</div>
                <SlaTimer deadline={issue.deadlineTime} status={issue.status} />
            </div>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <h3 className="font-bold text-slate-700 uppercase text-xs">Chứng cứ ban đầu</h3>
                <div className="grid grid-cols-1 gap-2">
                    {issue.evidence.map((ev, i) => (
                        <div key={i} className="border rounded overflow-hidden">
                            <img src={ev.url} className="w-full aspect-video object-cover" />
                            <div className="p-2 text-xs italic">"{ev.description}"</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                {user.role === Role.WARD && issue.status !== TaskStatus.CONFIRMED && issue.status !== TaskStatus.RESOLVED && (
                    <form onSubmit={handleWardSubmit} className="bg-blue-50 p-4 rounded border border-blue-200 space-y-4">
                        <h3 className="font-bold text-blue-800 text-sm">BÁO CÁO XỬ LÝ</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="text" placeholder="Số Biên bản..." required className="p-2 border rounded text-sm" value={reportData.bbNumber} onChange={e => setReportData({...reportData, bbNumber: e.target.value})} />
                            <input type="time" required className="p-2 border rounded text-sm" value={reportData.bbTime} onChange={e => setReportData({...reportData, bbTime: e.target.value})} />
                        </div>
                        <select required className="w-full p-2 border rounded text-sm" value={reportData.operator} onChange={e => setReportData({...reportData, operator: e.target.value})}>
                            <option value="">-- Chọn Cán bộ xử lý --</option>
                            {OFFICERS_LIST[issue.wardId]?.map(o => <option key={o} value={o}>{o}</option>) || <option value="Cán bộ trực">Cán bộ trực</option>}
                        </select>
                        <div className="flex gap-2 items-center">
                            <input type="file" accept="image/*" multiple className="text-xs" onChange={e => handleReportFileSelect(e, 'IMAGE')} />
                            {isSubmitting && <span className="text-xs text-blue-500">Đang nén...</span>}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {reportMediaList.map((m, idx) => (
                                <img key={idx} src={m.preview} className="w-12 h-12 object-cover border rounded" />
                            ))}
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50">Gửi báo cáo</button>
                    </form>
                )}

                {(issue.status === TaskStatus.RESOLVED || issue.status === TaskStatus.CONFIRMED) && (
                    <div className="bg-green-50 p-4 rounded border border-green-200 space-y-4">
                         <h3 className="font-bold text-green-800 text-sm">KẾT QUẢ XỬ LÝ</h3>
                         <div className="text-sm italic">"{issue.reportContent}"</div>
                         <div className="grid grid-cols-2 gap-2">
                            {issue.reportEvidence?.map((ev, i) => (
                                <img key={i} src={ev.url} className="w-full aspect-video object-cover border rounded" />
                            ))}
                         </div>
                         {(user.role === Role.ADMIN || user.role === Role.REVIEWER) && issue.status === TaskStatus.RESOLVED && (
                             <div className="pt-4 border-t space-y-2">
                                <textarea placeholder="Ghi chú phê duyệt..." className="w-full p-2 text-xs border rounded" value={pc06Reason} onChange={e => setPc06Reason(e.target.value)} />
                                <div className="flex gap-2">
                                    <button onClick={() => handlePC06Action('REJECT')} className="flex-1 bg-white border border-red-500 text-red-500 py-1 rounded text-sm">Yêu cầu lại</button>
                                    <button onClick={() => handlePC06Action('CONFIRM')} className="flex-1 bg-green-600 text-white py-1 rounded text-sm font-bold">Xác nhận hoàn thành</button>
                                </div>
                             </div>
                         )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
