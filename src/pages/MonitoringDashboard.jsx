import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Radio, 
  Activity, 
  Tv, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Key, 
  Clock, 
  PlayCircle, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  X,
  ExternalLink
} from 'lucide-react';

const MonitoringDashboard = () => {
  // Data lists
  const [boards, setBoards] = useState([]);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, active: 0, offline: 0 });

  // Page states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pair modal states
  const [activateModalOpen, setActivateModalOpen] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [pairing, setPairing] = useState(false);
  const [pairError, setPairError] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // 1. Fetch dashboard stats to get board connectivity counts
      const statsRes = await api.get('/dashboard/stats');
      setStats({
        total: statsRes.data.boards.total,
        active: statsRes.data.boards.active,
        offline: statsRes.data.boards.offline
      });

      // 2. Fetch all boards to show in status table
      const boardsRes = await api.get('/boards?limit=100');
      setBoards(boardsRes.data.boards);

      // 3. Fetch latest playback logs
      const logsRes = await api.get('/dashboard/logs');
      setLogs(logsRes.data);
    } catch (err) {
      console.error('Error loading monitoring data:', err);
      setError('Failed to load live smartboard feeds or playback audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Auto-refresh feeds every 15 seconds
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handlePairSubmit = async (e) => {
    e.preventDefault();
    setPairError('');
    setSuccess('');

    if (!selectedBoardId) {
      setPairError('Please select a smartboard to pair');
      return;
    }
    if (!activationCode.trim() || activationCode.trim().length !== 6) {
      setPairError('Pairing code must be exactly 6 characters');
      return;
    }

    try {
      setPairing(true);
      await api.post(`/boards/${selectedBoardId}/activate`, {
        code: activationCode.trim().toUpperCase()
      });

      setSuccess('Smartboard successfully activated and paired!');
      setActivateModalOpen(false);
      setActivationCode('');
      setSelectedBoardId('');
      loadData(); // Reload list
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Pairing error:', err);
      setPairError(err.response?.data?.message || 'Pairing failed. Verify activation code is correct.');
    } finally {
      setPairing(false);
    }
  };

  // Helper to format last heartbeat timestamp relatively
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return 'Never';
    const seconds = Math.floor((new Date() - new Date(timestamp)) / 1000);
    
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <Radio className="w-8 h-8 text-blue-600 mr-2.5 stroke-[2.2] animate-pulse" />
            <span>Live Monitoring</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Real-time status check and paired device heartbeat pings</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setActivateModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Key className="w-4 h-4 mr-2" />
            <span>Activate Device</span>
          </button>
          <button
            onClick={loadData}
            className="inline-flex items-center justify-center p-2.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
            title="Force Reload Feed"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-md text-emerald-700 flex items-center space-x-3 max-w-7xl mx-auto">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-red-700 flex items-center space-x-3 max-w-7xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Network health metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {/* Total Screens */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-lg shrink-0">
            <Tv className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Total Terminals</p>
            <p className="text-2xl font-extrabold text-slate-800 mt-1">{stats.total}</p>
          </div>
        </div>

        {/* Online Screens */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
            <Wifi className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Active Online</p>
            <p className="text-2xl font-extrabold text-emerald-600 mt-1">{stats.active}</p>
          </div>
        </div>

        {/* Offline Screens */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center space-x-4">
          <div className="p-3 bg-rose-50 text-rose-600 rounded-lg shrink-0">
            <WifiOff className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase">Offline Node</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{stats.offline}</p>
          </div>
        </div>
      </div>

      {/* Grid: 2 Column - Smartboard status table on left, Playback logs audit on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        
        {/* Board connectivity status list (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center">
              <Activity className="w-4.5 h-4.5 text-blue-600 mr-2" />
              <span>Smartboard Live Status</span>
            </h2>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Auto refreshes every 15s
            </span>
          </div>

          <div className="flex-1 overflow-x-auto">
            {boards.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <p>No smartboards configured yet.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  <tr>
                    <th scope="col" className="px-5 py-3">Terminal ID</th>
                    <th scope="col" className="px-5 py-3">Terminal Name</th>
                    <th scope="col" className="px-5 py-3">Pairing</th>
                    <th scope="col" className="px-5 py-3">Status</th>
                    <th scope="col" className="px-5 py-3">Last Heartbeat</th>
                    <th scope="col" className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {boards.map(board => (
                    <tr key={board._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-medium text-slate-500 whitespace-nowrap">
                        {board.boardId}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                        {board.boardName}
                        <div className="text-[10px] text-slate-400 font-normal mt-0.5">{board.location}, {board.region}</div>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {board.deviceToken ? (
                          <span className="px-2 py-0.5 text-[9px] font-semibold rounded bg-blue-50 text-blue-700 border border-blue-100">Paired</span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-semibold rounded bg-slate-100 text-slate-500">Unpaired</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {board.status === 'Active' ? (
                          <span className="inline-flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                            <span className="w-2 h-2 rounded-full bg-emerald-500 absolute shrink-0" />
                            <span className="font-semibold text-emerald-700 pl-2">Online</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1">
                            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                            <span className="font-semibold text-rose-600 pl-2">Offline</span>
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                        {board.deviceToken ? formatLastSeen(board.lastSeen) : '--'}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to="/player"
                          target="_blank"
                          className="inline-flex items-center justify-center p-1.5 border border-slate-200 bg-white hover:bg-slate-50 hover:text-blue-600 rounded text-slate-500 transition-colors"
                          title="Open Smartboard Player Window"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Playback Logs (1/3 width) */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col h-[480px]">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-2">
            <Clock className="w-4.5 h-4.5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">Recent Playback Logs</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-xs">
                <p>No playback logs recorded yet.</p>
                <p className="text-[10px] mt-0.5 text-slate-500">Launch a paired screen player to begin looping ads.</p>
              </div>
            ) : (
              logs.map(log => (
                <div key={log._id} className="border border-slate-100 p-3 rounded-lg bg-slate-50/50 space-y-2 flex flex-col justify-between text-[11px]">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-slate-800 truncate" title={log.assetId?.assetName}>
                      {log.assetId?.assetName || 'Unknown Asset'}
                    </span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">
                      {log.duration}s play
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="truncate max-w-[100px]" title={log.boardId?.boardName}>
                      Screen: {log.boardId?.boardName || 'Unknown'}
                    </span>
                    <span className="truncate max-w-[100px]" title={log.campaignId?.campaignName}>
                      Ad: {log.campaignId?.campaignName || 'Unknown'}
                    </span>
                  </div>

                  <div className="text-[9px] text-slate-400 border-t border-slate-100 pt-1.5 flex items-center justify-between">
                    <span>Campaign category: {log.campaignId?.campaignType}</span>
                    <span>{new Date(log.playedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Device Activation Modal */}
      {activateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center px-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => !pairing && setActivateModalOpen(false)}
          />
          <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl max-w-md w-full p-6 space-y-5">
            <button 
              onClick={() => setActivateModalOpen(false)}
              disabled={pairing}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Activate Device Pairing</h3>
              <p className="text-xs text-slate-400 mt-0.5">Pair a TV player screen displaying an activation code to a board.</p>
            </div>

            {pairError && (
              <div className="p-3.5 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start space-x-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{pairError}</span>
              </div>
            )}

            <form onSubmit={handlePairSubmit} className="space-y-4">
              {/* Select board */}
              <div>
                <label htmlFor="boardSelect" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Assign to Smartboard
                </label>
                <select
                  id="boardSelect"
                  value={selectedBoardId}
                  onChange={(e) => setSelectedBoardId(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs bg-white"
                  required
                >
                  <option value="">Select Smartboard</option>
                  {boards.map(b => (
                    <option key={b._id} value={b._id}>
                      {b.boardName} ({b.boardId})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pairing code */}
              <div>
                <label htmlFor="pairingCode" className="block text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Activation Code (6 Characters)
                </label>
                <input
                  type="text"
                  id="pairingCode"
                  maxLength={6}
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AX98D2"
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs uppercase font-mono tracking-widest text-center"
                  required
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActivateModalOpen(false)}
                  disabled={pairing}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pairing || !activationCode || !selectedBoardId}
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {pairing ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  <span>Activate Pairing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;
