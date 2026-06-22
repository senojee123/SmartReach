import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  ShieldAlert, 
  Tv, 
  Activity, 
  Globe, 
  MapPin, 
  Sliders, 
  Plus, 
  Check, 
  Trash2, 
  RefreshCw, 
  Loader2, 
  Clock, 
  History,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';

const PriorityDashboard = () => {
  // Data lists
  const [boards, setBoards] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [campaignsCount, setCampaignsCount] = useState(0);

  // Loading/feedback states
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('Warning');
  const [priority, setPriority] = useState(100); // 100=Emergency, 90=Safety, 80=Operational
  const [isNationwide, setIsNationwide] = useState(true);
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedBoards, setSelectedBoards] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [durationMinutes, setDurationMinutes] = useState(30);

  // Constants
  const regionsList = ['North Region', 'West Region', 'East Region', 'South Region', 'Central Region'];
  const groupsList = ['Sports', 'Religious & Cultural', 'Entertainment', 'Public Information'];

  // Load dashboard data
  const loadData = async () => {
    try {
      setError('');
      const [boardsRes, alertsRes, auditRes, campaignsRes] = await Promise.all([
        api.get('/boards?limit=100'),
        api.get('/alerts'),
        api.get('/alerts/audit'),
        api.get('/campaigns?limit=100')
      ]);

      setBoards(boardsRes.data.boards || []);
      setAlerts(alertsRes.data || []);
      setAuditLogs(auditRes.data || []);
      
      const activeCampaigns = (campaignsRes.data.campaigns || []).filter(c => c.status === 'Active').length;
      setCampaignsCount(activeCampaigns);
    } catch (err) {
      console.error('Error loading priority override dashboard data:', err);
      setError('Failed to fetch monitoring parameters. Verify backend server is reachable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh board active content status every 12 seconds
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  // Handle Form Submit
  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      setError('Please fill in alert title and broadcast message.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const startTime = new Date();
      const expiryTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000);

      const payload = {
        title,
        message,
        severity,
        priority: Number(priority),
        targetBoards: isNationwide ? [] : selectedBoards,
        targetRegions: isNationwide ? [] : selectedRegions,
        targetGroups: isNationwide ? [] : selectedGroups,
        startTime: startTime.toISOString(),
        expiryTime: expiryTime.toISOString()
      };

      await api.post('/alerts', payload);
      setSuccess('Alert created successfully and queued for approval.');
      
      // Reset form
      setTitle('');
      setMessage('');
      setSeverity('Warning');
      setPriority(100);
      setIsNationwide(true);
      setSelectedBoards([]);
      setSelectedRegions([]);
      setSelectedGroups([]);
      setDurationMinutes(30);

      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to dispatch alert to backend.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Alert Approval
  const handleApprove = async (alertId) => {
    try {
      setError('');
      setSuccess('');
      await api.post(`/alerts/${alertId}/approve`);
      setSuccess('Alert approved and pushed to targeted nodes.');
      await loadData();
    } catch (err) {
      setError('Failed to approve alert.');
    }
  };

  // Handle Alert Deactivation/Cancellation
  const handleCancel = async (alertId) => {
    try {
      setError('');
      setSuccess('');
      await api.delete(`/alerts/${alertId}`);
      setSuccess('Alert canceled and removed from active loops.');
      await loadData();
    } catch (err) {
      setError('Failed to terminate alert.');
    }
  };

  // Toggle helpers
  const handleRegionToggle = (region) => {
    setSelectedRegions(prev => 
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  const handleGroupToggle = (group) => {
    setSelectedGroups(prev => 
      prev.includes(group) ? prev.filter(g => g !== group) : [...prev, group]
    );
  };

  const handleBoardToggle = (boardId) => {
    setSelectedBoards(prev => 
      prev.includes(boardId) ? prev.filter(id => id !== boardId) : [...prev, boardId]
    );
  };

  // Calculate Metrics
  const activeAlerts = alerts.filter(a => a.isApproved && new Date(a.expiryTime) > new Date() && a.status !== 'Expired');
  const pendingAlerts = alerts.filter(a => !a.isApproved);
  
  // Calculate display count overrides
  const overriddenBoards = boards.filter(b => {
    // If board status is online, does it have a priority >= 80 alert targeted?
    const hasOverride = activeAlerts.some(a => {
      const isTargeted = 
        (a.targetBoards.length === 0 && a.targetRegions.length === 0 && a.targetGroups.length === 0) ||
        a.targetBoards.some(id => id.toString() === b._id.toString()) ||
        a.targetRegions.some(reg => reg.toLowerCase() === b.region.toLowerCase()) ||
        a.targetGroups.some(g => g.toLowerCase() === b.boardType.toLowerCase());
      return isTargeted;
    });
    return b.status === 'Active' && hasOverride;
  }).length;

  const totalOnlineBoards = boards.filter(b => b.status === 'Active').length;
  const reachPercentage = totalOnlineBoards > 0 ? Math.round((overriddenBoards / totalOnlineBoards) * 100) : 0;

  // Delivery stats success rate (mocked delivery calculation from logs)
  const deliveredLogs = auditLogs.filter(l => l.action === 'Alert Delivered').length;
  const displayedLogs = auditLogs.filter(l => l.action === 'Alert Displayed').length;
  const successRate = deliveredLogs > 0 ? Math.round((displayedLogs / deliveredLogs) * 100) : 95;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Loading priority control system...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center">
            <ShieldAlert className="w-7 h-7 text-red-600 mr-2 shrink-0 stroke-[2.2]" />
            Priority Override Control Center
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Deploy emergency broadcasts, venue safety alerts, and operational bulletins to connected smartboards.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center space-x-2 px-3.5 py-2 border border-slate-200 rounded-lg bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm self-start sm:self-center"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sync Status</span>
        </button>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-red-700 flex items-center space-x-3">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
          <p className="font-semibold text-sm">{error}</p>
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-md text-emerald-700 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-500" />
          <p className="font-semibold text-sm">{success}</p>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-extrabold font-mono">Active Overrides</span>
              <h3 className="text-3xl font-extrabold text-slate-900">{activeAlerts.length}</h3>
            </div>
            <span className="bg-red-50 text-red-700 text-xs px-2.5 py-1 rounded-full font-bold">Priority &gt;= 80</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-extrabold font-mono">Pending Approvals</span>
              <h3 className="text-3xl font-extrabold text-slate-900">{pendingAlerts.length}</h3>
            </div>
            <span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold">Queue</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-extrabold font-mono">Alert Screen Reach</span>
              <h3 className="text-3xl font-extrabold text-slate-900">{reachPercentage}%</h3>
            </div>
            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold">{overriddenBoards}/{totalOnlineBoards} Online</span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-extrabold font-mono">Delivery Success Rate</span>
              <h3 className="text-3xl font-extrabold text-slate-900">{successRate}%</h3>
            </div>
            <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold">Audited</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Form & Queue & Status Table */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Create Alert Override Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <Sliders className="w-5 h-5 text-blue-600 mr-2" />
              Dispatch Priority Override Broadcast
            </h2>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Alert Title / Subject</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Extreme Flash Flood Warning"
                    className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all"
                  />
                </div>

                {/* Priority & Severity */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Priority Level</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(Number(e.target.value))}
                      className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all"
                    >
                      <option value={100}>100 - Emergency</option>
                      <option value={90}>90 - Safety Instruction</option>
                      <option value={80}>80 - Operational Bulletin</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Severity Color</label>
                    <select
                      value={severity}
                      onChange={(e) => setSeverity(e.target.value)}
                      className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all"
                    >
                      <option value="Critical">Critical (Red)</option>
                      <option value="Warning">Warning (Orange)</option>
                      <option value="Info">Info (Blue)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Broadcast Message Details</label>
                <textarea
                  required
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide brief instructions (e.g. Seek higher ground immediately. Transit hub Colombo is suspended.)"
                  className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all resize-none"
                />
              </div>

              {/* Duration and Nationwide toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Broadcast Duration (Minutes)</label>
                  <input
                    type="number"
                    min={1}
                    max={1440}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="block w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all"
                  />
                </div>

                <div className="flex items-center space-x-2 mt-4 md:mt-0 pt-2.5">
                  <input
                    id="nationwide"
                    type="checkbox"
                    checked={isNationwide}
                    onChange={(e) => setIsNationwide(e.target.checked)}
                    className="w-4.5 h-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                  />
                  <label htmlFor="nationwide" className="text-sm font-semibold text-slate-700 cursor-pointer flex items-center">
                    <Globe className="w-4.5 h-4.5 text-slate-400 mr-1.5" />
                    Nationwide Broadcast (Target All Boards)
                  </label>
                </div>
              </div>

              {/* Geo-Targeting selections (Hidden if Nationwide is checked) */}
              {!isNationwide && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/60 space-y-4 animate-fade-in">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider font-mono">Geo-Targeting Filters</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Region list */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Regions</span>
                      <div className="flex flex-wrap gap-2">
                        {regionsList.map(region => {
                          const active = selectedRegions.includes(region);
                          return (
                            <button
                              key={region}
                              type="button"
                              onClick={() => handleRegionToggle(region)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${
                                active 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {region}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Group/Type list */}
                    <div className="space-y-1.5">
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Board Types (Groups)</span>
                      <div className="flex flex-wrap gap-2">
                        {groupsList.map(group => {
                          const active = selectedGroups.includes(group);
                          return (
                            <button
                              key={group}
                              type="button"
                              onClick={() => handleGroupToggle(group)}
                              className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition-all ${
                                active 
                                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {group}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Individual Board Select */}
                  <div className="space-y-1.5">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Specific Boards</span>
                    <div className="max-h-28 overflow-y-auto border border-slate-200 bg-white rounded-lg p-2.5 space-y-1 flex flex-col">
                      {boards.map(b => {
                        const checked = selectedBoards.includes(b._id);
                        return (
                          <label key={b._id} className="flex items-center space-x-2.5 p-1 rounded hover:bg-slate-50 cursor-pointer text-xs">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => handleBoardToggle(b._id)}
                              className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
                            />
                            <span className="font-semibold text-slate-700">{b.boardId}</span>
                            <span className="text-slate-400">- {b.boardName} ({b.region})</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide transition-colors shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-5 h-5" />
                    <span>Create Alert Override</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Pending Approval Queue */}
          {pendingAlerts.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center border-b border-slate-100 pb-3">
                <Clock className="w-5 h-5 text-amber-500 mr-2" />
                Override Approval Queue ({pendingAlerts.length} Pending)
              </h2>
              <div className="space-y-4">
                {pendingAlerts.map(a => (
                  <div key={a._id} className="p-4 bg-amber-50/40 border border-amber-200/60 rounded-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border ${
                          a.severity === 'Critical' ? 'bg-red-100 border-red-200 text-red-700' : 'bg-amber-100 border-amber-200 text-amber-700'
                        }`}>
                          {a.severity}
                        </span>
                        <span className="text-xs font-bold text-slate-400">PRIORITY {a.priority}</span>
                        <span className="text-xs font-mono font-bold text-slate-500">{a.alertId}</span>
                      </div>
                      <h4 className="text-md font-bold text-slate-900">{a.title}</h4>
                      <p className="text-sm text-slate-600 max-w-xl">{a.message}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-medium">
                        <span>Created By: {a.createdBy}</span>
                        <span>•</span>
                        <span>
                          Targets: {a.targetBoards.length === 0 && a.targetRegions.length === 0 && a.targetGroups.length === 0 
                            ? 'Nationwide' 
                            : `${a.targetRegions.length} regions, ${a.targetBoards.length} boards`}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2 self-start md:self-center">
                      <button
                        onClick={() => handleApprove(a._id)}
                        className="flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleCancel(a._id)}
                        className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold transition-all shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Discard</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Override status list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <Tv className="w-5 h-5 text-slate-700 mr-2" />
              Smartboard Nodes Live Feed
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-400 font-extrabold font-mono">
                    <th className="px-5 py-3">Screen ID</th>
                    <th className="px-5 py-3">Location / Name</th>
                    <th className="px-5 py-3">Region</th>
                    <th className="px-5 py-3">Telemetry</th>
                    <th className="px-5 py-3 text-right">Active Content</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {boards.map(b => {
                    // Check what is currently playing
                    // Find active alert targeting this board
                    const matchedAlerts = activeAlerts.filter(a => {
                      return (a.targetBoards.length === 0 && a.targetRegions.length === 0 && a.targetGroups.length === 0) ||
                        a.targetBoards.some(id => id.toString() === b._id.toString()) ||
                        a.targetRegions.some(reg => reg.toLowerCase() === b.region.toLowerCase()) ||
                        a.targetGroups.some(g => g.toLowerCase() === b.boardType.toLowerCase());
                    });

                    // Sort alerts by priority descending
                    matchedAlerts.sort((a, b) => b.priority - a.priority);
                    const topAlert = matchedAlerts[0];

                    let activeContentBadge = (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        [60/70] Campaign Loop
                      </span>
                    );

                    if (topAlert) {
                      activeContentBadge = (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                          topAlert.priority === 100 
                            ? 'bg-red-50 border-red-200 text-red-700 animate-pulse' 
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          [{topAlert.priority}] {topAlert.title.substr(0, 22)}...
                        </span>
                      );
                    } else if (b.status === 'Offline') {
                      activeContentBadge = (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 border border-rose-100 text-rose-600">
                          Offline (Fallback 10)
                        </span>
                      );
                    }

                    return (
                      <tr key={b._id} className="hover:bg-slate-50/50">
                        <td className="px-5 py-3.5 font-mono text-xs font-semibold text-slate-900">{b.boardId}</td>
                        <td className="px-5 py-3.5">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900">{b.boardName}</span>
                            <span className="block text-slate-400 text-xs font-medium">{b.location}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-slate-500 font-semibold">{b.region}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${b.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                            <span className="text-slate-500 font-bold">{b.status === 'Active' ? 'Online' : 'Offline'}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right">{activeContentBadge}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Right 1 Column: Active Overrides & Live Audit Feed */}
        <div className="space-y-6">
          
          {/* Active Broadcasts override monitor list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <Activity className="w-5 h-5 text-red-600 mr-2" />
              Active Broadcasts ({activeAlerts.length})
            </h2>
            <div className="space-y-3.5 max-h-72 overflow-y-auto pr-1">
              {activeAlerts.length === 0 ? (
                <div className="text-center py-6 text-slate-400">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-wider font-mono">No Active Override Alerts</p>
                  <p className="text-[10px] mt-0.5">Commercial loops running at 100% capacity.</p>
                </div>
              ) : (
                activeAlerts.map(a => {
                  const now = new Date();
                  const exp = new Date(a.expiryTime);
                  const remMinutes = Math.max(0, Math.round((exp.getTime() - now.getTime()) / 60000));
                  
                  return (
                    <div key={a._id} className="p-3.5 border border-slate-200 rounded-xl space-y-2 relative overflow-hidden bg-slate-50/50 hover:bg-slate-50 transition-colors">
                      {/* Left stripe indicator */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        a.severity === 'Critical' ? 'bg-red-600 animate-pulse' : a.severity === 'Warning' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      
                      <div className="flex justify-between items-start pl-2">
                        <div>
                          <h4 className="text-sm font-extrabold text-slate-950 leading-snug">{a.title}</h4>
                          <span className="text-[10px] text-slate-400 font-mono font-bold uppercase block mt-0.5">
                            Priority {a.priority} • Rem: {remMinutes} min
                          </span>
                        </div>
                        <button
                          onClick={() => handleCancel(a._id)}
                          title="Deactivate alert override"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Audit Log timeline list */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center">
              <History className="w-5 h-5 text-slate-700 mr-2" />
              Live Audit Log Feed
            </h2>
            <div className="space-y-4 max-h-[440px] overflow-y-auto pr-1 flex flex-col">
              {auditLogs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold uppercase tracking-wider font-mono">No Audit Logs Seeded</p>
                </div>
              ) : (
                auditLogs.map(log => {
                  const date = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  
                  // Color codes for actions
                  let badgeColor = 'bg-slate-100 border-slate-200 text-slate-600';
                  if (log.action.includes('Created')) badgeColor = 'bg-blue-50 border-blue-100 text-blue-700';
                  if (log.action.includes('Approved')) badgeColor = 'bg-indigo-50 border-indigo-100 text-indigo-700';
                  if (log.action.includes('Delivered')) badgeColor = 'bg-purple-50 border-purple-100 text-purple-700';
                  if (log.action.includes('Displayed')) badgeColor = 'bg-orange-50 border-orange-100 text-orange-700';
                  if (log.action.includes('Expired')) badgeColor = 'bg-slate-200 border-slate-300 text-slate-600';
                  if (log.action.includes('Resumed')) badgeColor = 'bg-emerald-50 border-emerald-100 text-emerald-700';

                  return (
                    <div key={log._id} className="text-xs border-b border-slate-100 pb-3 last:border-0 last:pb-0 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-extrabold uppercase font-mono tracking-wider ${badgeColor}`}>
                          {log.action}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">{date}</span>
                      </div>
                      
                      <div className="pl-1 text-slate-600 space-y-0.5">
                        <p className="font-semibold">
                          {log.alertTitle ? (
                            <span>Alert: <strong className="text-slate-800">"{log.alertTitle}"</strong></span>
                          ) : log.details?.reason ? (
                            <span>Reason: <strong className="text-slate-800">{log.details.reason}</strong></span>
                          ) : (
                            <span>Resumed standard campaign loop.</span>
                          )}
                        </p>
                        <div className="text-[10px] text-slate-400 font-bold flex flex-wrap gap-x-2">
                          <span>By: {log.user}</span>
                          {log.boardName && <span>• Target: {log.boardName}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default PriorityDashboard;
