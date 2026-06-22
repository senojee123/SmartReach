import React, { useContext, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Monitor, 
  LogOut, 
  User, 
  Menu, 
  X, 
  Tv,
  Megaphone,
  FolderOpen,
  Radio,
  BarChart3,
  FileText,
  Activity,
  ShieldAlert
} from 'lucide-react';

const DashboardLayout = () => {
  const { user, logout } = useContext(AuthContext);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      exact: true
    },
    {
      name: 'Smartboards',
      path: '/dashboard/boards',
      icon: Monitor,
      exact: false
    },
    {
      name: 'Campaigns',
      path: '/dashboard/campaigns',
      icon: Megaphone,
      exact: false
    },
    {
      name: 'Media Library',
      path: '/dashboard/assets',
      icon: FolderOpen,
      exact: false
    },
    {
      name: 'Live Monitoring',
      path: '/dashboard/monitoring',
      icon: Radio,
      exact: false
    },
    {
      name: 'Analytics',
      path: '/dashboard/analytics',
      icon: BarChart3,
      exact: false
    },
    {
      name: 'Sponsor Reports',
      path: '/dashboard/reporting',
      icon: FileText,
      exact: false
    },
    {
      name: 'Live Demo Mode',
      path: '/demo/live-network',
      icon: Tv,
      exact: false
    }
  ];

  const isActive = (link) => {
    if (link.exact) {
      return location.pathname === link.path;
    }
    return location.pathname.startsWith(link.path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-2 text-blue-600">
              <Tv className="w-6 h-6 stroke-[2.5]" />
              <span className="font-bold text-xl tracking-tight text-slate-800">SmartReach</span>
            </Link>
            <button 
              className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link);
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    active 
                      ? 'bg-blue-50 text-blue-600' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer User Info & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center space-x-3 px-4 py-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <User className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between lg:justify-end">
          <button
            className="lg:hidden p-1.5 rounded-md hover:bg-slate-100 text-slate-500"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* User profile dropdown/display */}
          <div className="flex items-center space-x-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-slate-700">{user?.name}</p>
              <span className="text-[10px] font-semibold tracking-wider text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-full">
                {user?.role}
              </span>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
              <span className="text-sm font-semibold">{user?.name ? user.name[0].toUpperCase() : 'A'}</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
