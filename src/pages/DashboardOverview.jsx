import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  Megaphone, 
  Activity, 
  FolderOpen, 
  Monitor, 
  PlusCircle, 
  Settings, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState({
    stats: {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalAssets: 0,
      totalAssignedBoards: 0
    },
    recentBoards: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Fetch Phase 2 aggregated statistics
        const statsRes = await api.get('/dashboard/stats');
        
        // Fetch recent boards list for the activity feed
        const boardsRes = await api.get('/boards?limit=5');
        
        setData({
          stats: {
            totalCampaigns: statsRes.data.campaigns.total,
            activeCampaigns: statsRes.data.campaigns.active,
            totalAssets: statsRes.data.assets.total,
            totalAssignedBoards: statsRes.data.assignedBoards.total
          },
          recentBoards: boardsRes.data.boards
        });
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
        setError('Failed to fetch dashboard metrics. Please reload.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleQuickAction = (path) => {
    navigate(path);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Loading dashboard overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-red-700 flex items-center space-x-3">
        <ShieldAlert className="w-6 h-6 shrink-0" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  // Define new dashboard cards for Phase 2 metrics
  const statCards = [
    {
      label: 'Total Campaigns',
      value: data.stats.totalCampaigns,
      icon: Megaphone,
      color: 'text-slate-700',
      bgColor: 'bg-slate-100'
    },
    {
      label: 'Active Campaigns',
      value: data.stats.activeCampaigns,
      icon: Activity,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-50'
    },
    {
      label: 'Total Assets',
      value: data.stats.totalAssets,
      icon: FolderOpen,
      color: 'text-blue-700',
      bgColor: 'bg-blue-50'
    },
    {
      label: 'Assigned Boards',
      value: data.stats.totalAssignedBoards,
      icon: Monitor,
      color: 'text-indigo-700',
      bgColor: 'bg-indigo-50'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Real-time smartboard and media management summary</p>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.label} 
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">{card.label}</span>
                <div className={`p-2.5 rounded-lg ${card.bgColor} ${card.color}`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-900">{card.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout for Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Activity Panel (2/3 width on large) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <Clock className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-slate-800">Recent Smartboard Pings</h2>
            </div>
            <button 
              onClick={() => navigate('/dashboard/boards')} 
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          
          <div className="p-6 flex-1">
            {data.recentBoards.length === 0 ? (
              <div className="text-center py-10 text-slate-400">
                <p>No smartboards found. Register a smartboard to see activity logs.</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {data.recentBoards.map((board, idx) => {
                    const isLast = idx === data.recentBoards.length - 1;
                    return (
                      <li key={board._id}>
                        <div className="relative pb-8">
                          {!isLast && (
                            <span 
                              className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200" 
                              aria-hidden="true" 
                            />
                          )}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                board.status === 'Active' 
                                  ? 'bg-emerald-50 text-emerald-600'
                                  : board.status === 'Offline'
                                    ? 'bg-rose-50 text-rose-600'
                                    : 'bg-amber-50 text-amber-600'
                              }`}>
                                <Activity className="w-4 h-4" />
                              </span>
                            </div>
                            <div className="flex-1 min-w-0 pt-1.5 flex justify-between space-x-4">
                              <div>
                                <p className="text-sm text-slate-600">
                                  Smartboard <span className="font-semibold text-slate-900">{board.boardName}</span> ({board.boardId}) is{' '}
                                  <span className={`font-medium ${
                                    board.status === 'Active' 
                                      ? 'text-emerald-600'
                                      : board.status === 'Offline'
                                        ? 'text-rose-600'
                                        : 'text-amber-600'
                                  }`}>
                                    {board.status.toLowerCase()}
                                  </span>.
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">Location: {board.location}, {board.region}</p>
                              </div>
                              <div className="text-right text-xs whitespace-nowrap text-slate-400">
                                <time dateTime={board.lastSeen}>
                                  {new Date(board.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Panel (1/3 width on large) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800 mb-5 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-slate-400" />
              <span>Quick Actions</span>
            </h2>
            
            <div className="space-y-3">
              <button
                onClick={() => handleQuickAction('/dashboard/campaigns/new')}
                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-blue-50/50 hover:border-blue-200 transition-colors text-left group"
              >
                <div className="flex items-center space-x-3.5">
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Create Campaign</p>
                    <p className="text-xs text-slate-400 mt-0.5">Define metadata and timelines</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleQuickAction('/dashboard/assets')}
                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-blue-50/50 hover:border-blue-200 transition-colors text-left group"
              >
                <div className="flex items-center space-x-3.5">
                  <FolderOpen className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Asset Library</p>
                    <p className="text-xs text-slate-400 mt-0.5">Upload images and video files</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => handleQuickAction('/dashboard/campaigns')}
                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-emerald-50/50 hover:border-emerald-200 transition-colors text-left group"
              >
                <div className="flex items-center space-x-3.5">
                  <Megaphone className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Active Campaigns</p>
                    <p className="text-xs text-slate-400 mt-0.5">Review active media delivery</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-4 text-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block">SmartReach v1.0.0</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;
