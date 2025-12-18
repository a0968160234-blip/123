
import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { User, signOut } from 'firebase/auth';
import { auth, isOfflineMode } from '../services/firebase';
import { LayoutDashboard, Wallet, ArrowLeftRight, BarChart3, LogOut, ShieldAlert } from 'lucide-react';

interface LayoutProps {
  user: User;
}

const Layout: React.FC<LayoutProps> = ({ user }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (isOfflineMode) {
      window.location.reload();
      return;
    }
    if (auth) {
      await signOut(auth);
      navigate('/login');
    }
  };

  const navItems = [
    { path: '/', icon: <LayoutDashboard className="w-5 h-5" />, label: '總覽' },
    { path: '/accounts', icon: <Wallet className="w-5 h-5" />, label: '帳戶管理' },
    { path: '/transactions', icon: <ArrowLeftRight className="w-5 h-5" />, label: '收支紀錄' },
    { path: '/analysis', icon: <BarChart3 className="w-5 h-5" />, label: 'AI 分析' },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
            <span className="text-3xl">🧘</span> ZenFinance
          </h1>
        </div>

        {isOfflineMode && (
          <div className="mx-4 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-amber-800 text-xs">
            <ShieldAlert className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold">離線展示模式</p>
              <p>資料僅存於本地，重新整理後將重置。</p>
            </div>
          </div>
        )}

        <nav className="px-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-slate-100 hidden md:block">
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
              {user.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
              <p className="text-xs text-slate-500">基本會員</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            登出系統
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 p-4 md:hidden flex justify-between items-center">
           <h1 className="text-xl font-bold text-blue-600">ZenFinance</h1>
           <button onClick={handleLogout} className="p-2 text-slate-600"><LogOut className="w-6 h-6"/></button>
        </header>
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
