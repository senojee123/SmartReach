import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShieldAlert, 
  Tv, 
  Activity, 
  Wifi, 
  Cpu, 
  Database, 
  Sparkles, 
  Clock, 
  PlaySquare, 
  ChevronRight,
  TrendingUp,
  MapPin,
  RefreshCw,
  X
} from 'lucide-react';

const LiveNetworkDemo = () => {
  const [systemBoards, setSystemBoards] = useState(null);
  const [selectedBoardIds, setSelectedBoardIds] = useState(() => {
    const saved = localStorage.getItem('demoSelectedBoardIds');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return [null, null, null, null];
  });
  const [stats, setStats] = useState({
    totalBoards: 0,
    onlineBoards: 0,
    activeCampaigns: 0,
    activeAlerts: 0,
    currentDeliveries: 0,
    boards: []
  });
  const [playlists, setPlaylists] = useState({});
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  // Fetch all system boards once on mount
  useEffect(() => {
    const fetchSystemBoards = async () => {
      try {
        const { data } = await axios.get('/api/demo/boards');
        const sorted = (data || []).sort((a, b) => a.boardName.localeCompare(b.boardName));
        setSystemBoards(sorted);
      } catch (err) {
        console.error('Error fetching system boards:', err);
        setSystemBoards([]);
      }
    };
    fetchSystemBoards();
  }, []);

  // Validate selected board IDs against system boards once they are loaded
  useEffect(() => {
    if (systemBoards !== null) {
      setSelectedBoardIds(prev => {
        const cleaned = prev.map(id => (id && systemBoards.some(sb => sb._id === id)) ? id : null);
        // If changed, save to localStorage will trigger via the next useEffect
        return cleaned;
      });
    }
  }, [systemBoards]);

  // Save selection choices to localStorage
  useEffect(() => {
    localStorage.setItem('demoSelectedBoardIds', JSON.stringify(selectedBoardIds));
  }, [selectedBoardIds]);

  // Poll general stats and board telemetries
  const fetchStats = async () => {
    try {
      const activeIds = selectedBoardIds.filter(id => id !== null);

      if (activeIds.length === 0) {
        setStats({
          totalBoards: 0,
          onlineBoards: 0,
          activeCampaigns: 0,
          activeAlerts: 0,
          currentDeliveries: 0,
          boards: []
        });
        setPlaylists({});
        setLoading(false);
        return;
      }

      const queryStr = `?boardIds=${activeIds.join(',')}`;
      const { data } = await axios.get(`/api/demo/stats${queryStr}`);
      setStats(data);
      
      // Fetch playlists for each selected board to display active contents
      const playlistPromises = activeIds.map(
        id => axios.get(`/api/demo/playlist/${id}`)
      );
      const playlistResults = await Promise.all(playlistPromises);
      const newPlaylists = {};
      playlistResults.forEach((res, index) => {
        const boardId = activeIds[index];
        newPlaylists[boardId] = res.data.playlist || [];
      });
      setPlaylists(newPlaylists);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching demo parameters:', err);
    }
  };

  useEffect(() => {
    fetchStats();
    // Real-time polling every 2 seconds for high response feedback
    const statsInterval = setInterval(fetchStats, 2000);
    return () => clearInterval(statsInterval);
  }, [selectedBoardIds]);

  // Trigger Colombo Flood Warning alert
  const handleTriggerAlert = async () => {
    try {
      setTriggering(true);
      await axios.post('/api/demo/trigger');
      fetchStats();
    } catch (err) {
      console.error('Failed to trigger flood warning:', err);
    } finally {
      setTriggering(false);
    }
  };

  // Cancel Colombo Flood Warning alert manually
  const handleCancelAlert = async () => {
    try {
      setTriggering(true);
      await axios.post('/api/demo/cancel');
      fetchStats();
    } catch (err) {
      console.error('Failed to cancel flood warning:', err);
    } finally {
      setTriggering(false);
    }
  };

  if (loading && selectedBoardIds.filter(id => id !== null).length > 0) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-400 flex flex-col items-center justify-center space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
        <p className="text-sm font-semibold tracking-wide uppercase">Assembling Demo Environment...</p>
      </div>
    );
  }

  // If loading empty selectors, bypass spinner
  const isAllEmpty = selectedBoardIds.filter(id => id !== null).length === 0;
  if (loading && isAllEmpty) {
    // Let page mount immediately so user can select boards
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 select-none font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 space-y-4 md:space-y-0">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-xs uppercase font-extrabold tracking-widest text-blue-500">Live Smartboard Simulation</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white mt-1">
              SmartReach Demonstration Environment
            </h1>
            <p className="text-sm text-slate-400">
              Interactive 2x2 grid representing virtual smartboards, content targeting, and priority overrides.
            </p>
          </div>

          <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Telemetry update interval: 2s</span>
          </div>
        </div>

        {/* Real-time Monitoring Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-slate-900/50 border border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between space-y-2 shadow-lg">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Total Boards</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-white">{stats.totalBoards}</span>
              <span className="text-[10px] text-slate-500">Nodes</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 w-full" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between space-y-2 shadow-lg">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Online Boards</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-emerald-400">{stats.onlineBoards}</span>
              <span className="text-[10px] text-slate-500">/{stats.totalBoards} Active</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(stats.onlineBoards / stats.totalBoards) * 100}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between space-y-2 shadow-lg">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Active Campaigns</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-violet-400">{stats.activeCampaigns}</span>
              <span className="text-[10px] text-slate-500">Assigned</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-violet-500 w-full" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between space-y-2 shadow-lg">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Active Alerts</span>
            <div className="flex items-baseline space-x-1.5">
              <span className={`text-2xl font-black ${stats.activeAlerts > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
                {stats.activeAlerts}
              </span>
              <span className="text-[10px] text-slate-500">Overrides</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 transition-all" style={{ width: `${stats.activeAlerts > 0 ? 100 : 0}%` }} />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-850 p-4.5 rounded-2xl flex flex-col justify-between space-y-2 col-span-2 md:col-span-1 shadow-lg">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">Active Deliveries</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-black text-cyan-400">{stats.currentDeliveries}</span>
              <span className="text-[10px] text-slate-500">Streams</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500" style={{ width: `${(stats.currentDeliveries / stats.totalBoards) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Emergency Alert Control Panel Card */}
        <div className={`border rounded-3xl p-6 transition-all duration-500 ${
          stats.activeAlerts > 0 
            ? 'bg-red-950/20 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]' 
            : 'bg-slate-900/30 border-slate-800/80 shadow-md'
        }`}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-2">
                <ShieldAlert className={`w-5 h-5 ${stats.activeAlerts > 0 ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
                <span className="text-sm font-bold tracking-wide text-slate-200">
                  {stats.activeAlerts > 0 ? 'ACTIVE BROADCASTING EVENT (MANUAL CANCEL REQUIRED)' : 'Emergency Override Control'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white">Colombo Flash Flood Advisory Advisory Simulation</h2>
              <p className="text-sm text-slate-400 max-w-3xl">
                Test the priority engine's geo-targeting by broadcasting a Priority 100 alert to the "Colombo" region. Colombo Stadium (Board 01) and Colombo Public Display (Board 04) will override immediately. Kandy Temple (Board 02) and Galle Event Hall (Board 03) will continue playing their targeted loops.
              </p>
            </div>

            <div className="flex items-center space-x-4 shrink-0">
              {stats.activeAlerts > 0 ? (
                <button
                  disabled={triggering}
                  onClick={handleCancelAlert}
                  className="bg-slate-800 hover:bg-slate-700 active:bg-slate-900 border border-slate-700 text-white font-extrabold px-6 py-3.5 rounded-2xl transition-all shadow-md disabled:opacity-50 flex items-center space-x-2 text-sm uppercase tracking-wider"
                >
                  {triggering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Canceling...</span>
                    </>
                  ) : (
                    <>
                      <X className="w-4 h-4 text-red-500" />
                      <span>Cancel Flood Warning</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled={triggering}
                  onClick={handleTriggerAlert}
                  className="bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-extrabold px-6 py-3.5 rounded-2xl transition-all shadow-[0_4px_14px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.4)] disabled:opacity-50 flex items-center space-x-2 text-sm uppercase tracking-wider"
                >
                  {triggering ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Triggering...</span>
                    </>
                  ) : (
                    <>
                      <span>Trigger Colombo Flood Warning</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
          
          {/* Visual Alert Pulsing Status Bar */}
          {stats.activeAlerts > 0 && (
            <div className="mt-5 space-y-1.5 animate-fade-in">
              <div className="w-full h-1.5 bg-red-950/40 rounded-full overflow-hidden border border-red-500/20">
                <div className="h-full bg-red-500 rounded-full w-full animate-pulse" />
              </div>
              <div className="flex justify-between text-[10px] text-red-400 font-bold uppercase tracking-wider font-mono">
                <span>Alert Active: Priority 100 Override in Effect</span>
                <span>Requires Manual Cancellation to Resume Loop</span>
              </div>
            </div>
          )}
        </div>

        {/* 2x2 Virtual Smartboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[0, 1, 2, 3].map(slotIndex => {
            const id = selectedBoardIds[slotIndex];
            const boardData = stats.boards?.find(b => b._id === id);
            const playlist = id ? (playlists[id] || []) : [];
            const activeItem = playlist[0]; // Priority Override Engine sorts descending, so index 0 is playing
            
            const displayName = boardData?.boardName;
            const displayType = boardData?.boardType;
            const displayRegion = boardData?.region;
            const isOnline = boardData?.status === 'Active';

            // Filter out already selected boards in other slots to avoid duplicate choices
            const availableBoards = (systemBoards || []).filter(sb => 
              sb._id === id || !selectedBoardIds.includes(sb._id)
            );

            if (!id) {
              return (
                <div key={`empty-slot-${slotIndex}`} className="bg-slate-900/40 border border-slate-850 rounded-3xl p-8 shadow-xl flex flex-col items-center justify-center min-h-[380px] space-y-6">
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50 text-blue-500">
                    <Tv className="w-10 h-10 animate-pulse" />
                  </div>
                  <div className="text-center space-y-1.5">
                    <h3 className="text-base font-bold text-white">Smartboard Slot {slotIndex + 1}</h3>
                    <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                      Choose a smartboard screen from your system network to monitor in this simulation block.
                    </p>
                  </div>
                  <div className="w-full max-w-xs">
                    <select
                      value=""
                      onChange={(e) => {
                        const val = e.target.value;
                        const newIds = [...selectedBoardIds];
                        newIds[slotIndex] = val || null;
                        setSelectedBoardIds(newIds);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <option value="">Select a Smartboard...</option>
                      {availableBoards.map(sb => (
                        <option key={sb._id} value={sb._id}>
                          {sb.boardName} ({sb.boardId})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            }

            return (
              <div key={id} className="bg-slate-900/40 border border-slate-850 rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-350 flex flex-col justify-between">
                
                {/* Board Card Header */}
                <div className="bg-slate-900/70 border-b border-slate-800 p-4.5 flex justify-between items-center select-none">
                  <div className="text-left space-y-0.5 max-w-[65%]">
                    <div className="flex items-center space-x-1.5">
                      <Tv className="w-4 h-4 text-blue-500 shrink-0" />
                      <select
                        value={id}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newIds = [...selectedBoardIds];
                          newIds[slotIndex] = val || null;
                          setSelectedBoardIds(newIds);
                        }}
                        className="bg-transparent border-0 text-sm font-extrabold text-white focus:outline-none pr-6 cursor-pointer hover:text-blue-400 transition-colors max-w-full truncate"
                      >
                        <option value="" className="bg-slate-900 text-white">Remove Board</option>
                        {availableBoards.map(sb => (
                          <option key={sb._id} value={sb._id} className="bg-slate-900 text-white">
                            {sb.boardName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      <span>{displayRegion || 'N/A'}</span>
                      <span>•</span>
                      <span>{displayType || 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Priority Indicator Badge */}
                    {activeItem && (
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest ${
                        activeItem.priority === 100
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : activeItem.priority >= 80
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : activeItem.priority === 70
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : activeItem.priority === 60
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        P-{activeItem.priority}
                      </div>
                    )}

                    {/* Online Status */}
                    {isOnline ? (
                      <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>Online</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1.5 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest text-rose-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span>Offline</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Embedded Live Player Screen (Iframe) */}
                <div className="relative aspect-video bg-black flex items-center justify-center border-b border-slate-800">
                  {isOnline ? (
                    <iframe 
                      src={`/player/${id}`} 
                      title={displayName} 
                      className="w-full h-full border-0 select-none pointer-events-none" 
                      sandbox="allow-scripts allow-same-origin"
                    />
                  ) : (
                    <div className="text-center space-y-2 p-6">
                      <Wifi className="w-10 h-10 text-slate-600 mx-auto animate-pulse" />
                      <p className="text-slate-500 text-xs font-semibold tracking-wide uppercase">Waiting for terminal handshake...</p>
                    </div>
                  )}
                </div>

                {/* Telemetry Footer Info */}
                <div className="p-5 bg-slate-900/20 grid grid-cols-2 gap-4 text-xs select-none">
                  {/* Left Column: Playing Metadata */}
                  <div className="space-y-3.5 border-r border-slate-850 pr-4 text-left">
                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">Active Content</span>
                      <span className="font-bold text-slate-200 block truncate" title={activeItem?.title || 'None'}>
                        {activeItem?.title ? activeItem.title.split(' - ').pop() : 'Standard Placeholder'}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">Campaign Context</span>
                      <span className="font-semibold text-slate-400 block truncate" title={activeItem?.title ? activeItem.title.split(' - ')[0] : 'None'}>
                        {activeItem?.title ? activeItem.title.split(' - ')[0] : 'Fallback Loop'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Telemetry Performance */}
                  <div className="space-y-3 pl-2 text-left">
                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Cpu className="w-3 h-3 text-blue-400" />
                        <span>CPU Load</span>
                      </span>
                      <span className="font-mono text-white">{boardData?.cpuUsage || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${boardData?.cpuUsage || 0}%` }} />
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-semibold text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Database className="w-3 h-3 text-purple-400" />
                        <span>Memory</span>
                      </span>
                      <span className="font-mono text-white">{boardData?.memoryUsage || 0}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: `${boardData?.memoryUsage || 0}%` }} />
                    </div>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-semibold tracking-wider uppercase pt-1">
                      <span>Last Seen</span>
                      <span className="font-mono text-slate-400">
                        {boardData?.lastSeen ? new Date(boardData.lastSeen).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
};

export default LiveNetworkDemo;
