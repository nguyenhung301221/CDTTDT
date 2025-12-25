
import React, { useState, useEffect } from 'react';
import { User, Issue, TaskStatus } from '../types';
import { mockService } from '../services/mockService';
import { SlaTimer } from '../components/SlaTimer';

interface TaskListProps {
  user: User;
  onViewDetail: (id: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ user, onViewDetail }) => {
  const [filter, setFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [issues, setIssues] = useState<Issue[]>([]);

  // Fix: Fetch issues asynchronously using useEffect
  useEffect(() => {
    const fetchIssues = async () => {
      const data = await mockService.getIssues();
      setIssues(data);
    };
    fetchIssues();
  }, []);

  const filteredIssues = issues.filter(issue => {
    // 1. Filter by Status
    let matchStatus = true;
    if (filter === 'ALL') matchStatus = true;
    else if (filter === 'OPEN') matchStatus = [TaskStatus.NEW, TaskStatus.RECEIVED, TaskStatus.PROCESSING].includes(issue.status);
    else if (filter === 'WAITING') matchStatus = issue.status === TaskStatus.RESOLVED; // Waiting for PC06
    else if (filter === 'CLOSED') matchStatus = issue.status === TaskStatus.CONFIRMED || issue.status === TaskStatus.CLOSED;

    // 2. Filter by Date
    let matchDate = true;
    if (dateFilter) {
        const issueDate = new Date(issue.createdTime);
        const selectedDate = new Date(dateFilter);
        
        // So sánh ngày/tháng/năm (bỏ qua giờ phút)
        // Lưu ý: new Date(dateFilter) từ input type=date thường là UTC 00:00,
        // Cần đảm bảo so sánh chính xác theo ngày địa phương hoặc ngày tuyệt đối.
        // Cách đơn giản nhất là so sánh chuỗi YYYY-MM-DD của issue trong local time với giá trị input
        const issueDateString = `${issueDate.getFullYear()}-${String(issueDate.getMonth() + 1).padStart(2, '0')}-${String(issueDate.getDate()).padStart(2, '0')}`;
        matchDate = issueDateString === dateFilter;
    }

    return matchStatus && matchDate;
  });

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.NEW: return 'bg-blue-100 text-blue-800';
      case TaskStatus.PROCESSING: return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.RESOLVED: return 'bg-purple-100 text-purple-800';
      case TaskStatus.CONFIRMED: return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="bg-white rounded shadow">
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <h3 className="font-bold text-lg text-slate-700">Danh sách nhiệm vụ</h3>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            {/* Date Filter */}
            <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500">Ngày:</span>
                <input 
                    type="date" 
                    className="border border-slate-300 rounded px-2 py-1 text-xs focus:ring-blue-500 focus:border-blue-500"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                />
                {dateFilter && (
                    <button 
                        onClick={() => setDateFilter('')}
                        className="text-xs text-red-500 hover:underline"
                    >
                        Xóa
                    </button>
                )}
            </div>

            <div className="h-4 w-px bg-slate-300 hidden md:block"></div>

            {/* Status Filter */}
            <div className="flex space-x-2">
            {['ALL', 'OPEN', 'WAITING', 'CLOSED'].map(f => (
                <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                    filter === f ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                >
                {f === 'ALL' ? 'Tất cả' : f === 'OPEN' ? 'Đang xử lý' : f === 'WAITING' ? 'Chờ xác nhận' : 'Đã xong'}
                </button>
            ))}
            </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mã / Thời gian</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Đơn vị / Vị trí</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vi phạm</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">SLA (45p)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Hành động</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {filteredIssues.map((issue) => (
              <tr key={issue.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-900">{issue.id}</div>
                  <div className="text-xs text-slate-500">{new Date(issue.createdTime).toLocaleTimeString('vi-VN')}</div>
                  <div className="text-xs text-slate-400">{new Date(issue.createdTime).toLocaleDateString('vi-VN')}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900">{issue.wardName}</div>
                  <div className="text-xs text-slate-500 truncate max-w-xs" title={issue.locationDescription}>{issue.locationDescription}</div>
                </td>
                <td className="px-6 py-4">
                   <div className="text-sm text-slate-900">{issue.violationCode}</div>
                   <div className="text-xs text-slate-500">Điểm: {issue.penaltyPoints}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <SlaTimer deadline={issue.deadlineTime} status={issue.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(issue.status)}`}>
                    {issue.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    onClick={() => onViewDetail(issue.id)}
                    className="text-blue-600 hover:text-blue-900 font-semibold"
                  >
                    Chi tiết
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredIssues.length === 0 && (
            <div className="p-8 text-center text-slate-500">
                {dateFilter ? `Không có nhiệm vụ nào trong ngày ${new Date(dateFilter).toLocaleDateString('vi-VN')}` : 'Không có dữ liệu'}
            </div>
        )}
      </div>
    </div>
  );
};
