import React, { useState, useEffect } from 'react';

interface SlaTimerProps {
  deadline: string;
  status: string;
}

export const SlaTimer: React.FC<SlaTimerProps> = ({ deadline, status }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(deadline).getTime();
      const diff = end - now;

      if (status === 'Đã đóng' || status === 'Đã xác nhận') {
         setTimeLeft('Đã xong');
         setIsOverdue(false);
         return;
      }

      if (diff <= 0) {
        setTimeLeft(`Quá hạn ${Math.abs(Math.floor(diff / 60000))} phút`);
        setIsOverdue(true);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeLeft(`${minutes}p ${seconds}s`);
        setIsOverdue(false);
      }
    };

    calculateTime();
    const timer = setInterval(calculateTime, 1000);

    return () => clearInterval(timer);
  }, [deadline, status]);

  if (status === 'Đã đóng' || status === 'Đã xác nhận') {
      return <span className="text-slate-500 text-sm font-medium">Hoàn thành</span>;
  }

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${
      isOverdue ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-green-100 text-green-700'
    }`}>
      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      {timeLeft}
    </div>
  );
};