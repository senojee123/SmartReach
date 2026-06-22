import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  Activity, 
  Tv, 
  Cpu, 
  HardDrive, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

const BoardHealth = () => {
  const [data, setData] = useState(null);
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHealthData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const healthRes = await api.get('/analytics/health');
      const boardsRes = await api.get('/boards?limit=100');

      setData(healthRes.data);
      setBoards(boardsRes.data.boards);
    } catch (err) {
      console.error('Failed to load board health logs:', err);
      setError('Failed to fetch system diagnostics data from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();

    // Auto refresh telemetry diagnostics every 10 seconds
    const interval = setInterval(loadHealthData, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Gathering hardware diagnostics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-red-700 flex items-center space-x-3">
        <AlertCircle className="w-6 h-6 shrink-0" />
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  const { metrics, alerts } = data;

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <Activity className="w-8 h-8 text-blue-600 mr-2.5 stroke-[2.2]" />
            <span>System Health & Diagnostics</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time hardware telemetry, CPU load, memory, and sync metrics</p>
        </div>

        <button
          onClick={loadHealthData}
          className="inline-flex items-center justify-center p-2.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
          title="Refresh Telemetry"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Overview hardware cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Terminals Online */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Availability</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-2 block">{metrics.active} / {metrics.total} Online</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Tv className="w-6 h-6" />
          </div>
        </div>

        {/* Average CPU */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Avg CPU Load</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-2 block">{metrics.avgCpu}%</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Cpu className="w-6 h-6" />
          </div>
        </div>

        {/* Average RAM */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Avg RAM Usage</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-2 block">{metrics.avgRam}%</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Average Storage */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Avg Storage Filled</span>
            <span className="text-2xl font-extrabold text-slate-800 mt-2 block">{metrics.avgStorage}%</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <HardDrive className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Critical Alerts Center */}
      {alerts.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-800 flex items-center">
            <AlertCircle className="w-5 h-5 text-rose-500 mr-2" />
            <span>Active Diagnostics Alerts ({alerts.length})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map((alert, idx) => (
              <div 
                key={idx} 
                className={`p-3.5 border rounded-lg flex items-start space-x-3 text-xs ${
                  alert.type === 'Critical' 
                    ? 'bg-rose-50/50 border-rose-100 text-rose-700' 
                    : alert.type === 'Offline'
                      ? 'bg-slate-50 border-slate-200 text-slate-700'
                      : 'bg-amber-50/50 border-amber-100 text-amber-700'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">{alert.boardName} ({alert.boardId})</span>
                  <p className="mt-0.5 font-medium">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Telemetry Grid of Smartboard Cards */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-800">Terminal Node Telemetry Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boards.map(b => {
            const isOnline = b.status === 'Active';
            return (
              <div 
                key={b._id} 
                className={`bg-white border rounded-xl p-5 shadow-sm flex flex-col justify-between space-y-4 transition-all ${
                  isOnline 
                    ? 'border-slate-200 hover:shadow-md' 
                    : 'border-slate-200/60 opacity-70'
                }`}
              >
                {/* Header info */}
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs truncate max-w-[170px]" title={b.boardName}>
                      {b.boardName}
                    </h4>
                    <span className="font-mono text-[9px] text-slate-400 mt-0.5 block">{b.boardId}</span>
                  </div>
                  {isOnline ? (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-50 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                      <Wifi className="w-3.5 h-3.5 mr-0.5" />
                      <span>Online</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-500 border border-slate-200">
                      <WifiOff className="w-3.5 h-3.5 mr-0.5" />
                      <span>Offline</span>
                    </span>
                  )}
                </div>

                {/* Simulated health status items */}
                {isOnline ? (
                  <div className="space-y-3 text-xs">
                    {/* CPU gauge representation */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase">CPU Load</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              b.cpuUsage > 80 ? 'bg-rose-500' : b.cpuUsage > 50 ? 'bg-amber-500' : 'bg-blue-600'
                            }`} 
                            style={{ width: `${b.cpuUsage}%` }} 
                          />
                        </div>
                        <span className="font-bold text-slate-700 w-8 text-right">{b.cpuUsage}%</span>
                      </div>
                    </div>

                    {/* RAM gauge representation */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase">RAM Allocation</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${b.memoryUsage}%` }} />
                        </div>
                        <span className="font-bold text-slate-700 w-8 text-right">{b.memoryUsage}%</span>
                      </div>
                    </div>

                    {/* Storage progress */}
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 font-semibold text-[10px] uppercase">Disk capacity</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              b.storageUsage > 85 ? 'bg-amber-500' : 'bg-purple-600'
                            }`} 
                            style={{ width: `${b.storageUsage}%` }} 
                          />
                        </div>
                        <span className="font-bold text-slate-700 w-8 text-right">{b.storageUsage}%</span>
                      </div>
                    </div>

                    {/* Sync status and Uptime footer */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold">
                      <div className="flex items-center space-x-1">
                        <span className="text-slate-400">Sync:</span>
                        <span className={b.syncStatus === 'Error' ? 'text-rose-600' : b.syncStatus === 'Syncing' ? 'text-amber-500' : 'text-emerald-600'}>
                          {b.syncStatus}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        Uptime: {Math.round((b.uptime || 0) / 3600)}h
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                    <span>No telemetry feed (Node offline)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BoardHealth;
