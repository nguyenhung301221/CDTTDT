
import React, { useState, useEffect } from 'react';
import { User, Role } from './types';
import { mockService } from './services/mockService';
import { dataStore } from './storage/store';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/LoginPage';
import { TaskList } from './pages/TaskList';
import { CreateIssue } from './pages/CreateIssue';
import { TaskDetail } from './pages/TaskDetail';
import { WardProfile } from './pages/WardProfile';
import { RegistrationReview } from './pages/RegistrationReview';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<string>('login');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [syncStatus, setSyncStatus] = useState('Đang khởi tạo hệ thống...');

  useEffect(() => {
    const init = async () => {
      try {
        setSyncStatus('Đang mở két sắt dữ liệu cục bộ...');
        await dataStore.init();
        
        setSyncStatus('Đang kết nối Đám mây Google...');
        // Lấy dữ liệu mây ngay khi mở app
        await mockService.pullFromCloud(); 

        const current = mockService.getCurrentUser();
        if (current) {
          setUser(current);
          setCurrentPage('dashboard');
        }
      } catch (err) {
        console.error("Init Error:", err);
        setSyncStatus('Lỗi khởi tạo. Vui lòng kiểm tra mạng.');
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // TỰ ĐỘNG ĐỒNG BỘ NỀN (Tăng lên 15 giây/lần)
  useEffect(() => {
      if (user) {
          const syncInterval = setInterval(() => {
              console.log("Background sync triggered...");
              mockService.pullFromCloud();
          }, 15000); 
          return () => clearInterval(syncInterval);
      }
  }, [user]);

  const handleLoginSuccess = (u: User) => {
    setUser(u);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    mockService.logout();
    setUser(null);
    setCurrentPage('login');
  };

  const navigateTo = (page: string, taskId?: string) => {
    if (taskId) setSelectedTaskId(taskId);
    setCurrentPage(page);
  };

  if (isInitializing) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-10">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-6"></div>
              <div className="text-2xl font-black tracking-widest animate-pulse uppercase text-center">PC06 HÀ NỘI</div>
              <div className="text-sm text-blue-400 mt-4 font-mono text-center max-w-xs">{syncStatus}</div>
              <div className="mt-10 text-[10px] text-slate-500 uppercase tracking-widest">Hệ thống đồng bộ thời gian thực v3.2</div>
          </div>
      );
  }

  if (!user || currentPage === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentPage={currentPage} 
      onNavigate={navigateTo}
    >
      {currentPage === 'dashboard' && <Dashboard user={user} />}
      {currentPage === 'ward_profile' && <WardProfile user={user} onUpdateSuccess={setUser} />}
      {currentPage === 'approvals' && <RegistrationReview user={user} />}
      {currentPage === 'tasks' && <TaskList user={user} onViewDetail={(id) => navigateTo('task_detail', id)} />}
      {currentPage === 'create' && <CreateIssue user={user} onCreated={() => navigateTo('tasks')} />}
      {currentPage === 'task_detail' && selectedTaskId && (
        <TaskDetail 
          user={user} 
          taskId={selectedTaskId} 
          onBack={() => navigateTo('tasks')} 
          onUpdate={() => navigateTo('tasks')}
        />
      )}
    </Layout>
  );
};

export default App;
