import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  BarChart3, 
  Tv, 
  Activity, 
  DownloadCloud, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  Megaphone,
  MousePointerClick,
  FolderOpen
} from 'lucide-react';

const AnalyticsDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/analytics/overview');
      setData(res.data);
    } catch (err) {
      console.error('Error fetching analytics overview:', err);
      setError('Failed to fetch platform analytics. Verify server status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExport = async (type) => {
    try {
      setExporting(true);
      const res = await api.get(`/analytics/export/${type}`, { responseType: 'blob' });
      
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `smartreach_${type}_logs.csv`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(`Failed to export ${type} data:`, err);
      alert(`Export failed for ${type} logs. Please check server connection.`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Compiling platform metrics...</p>
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

  const { summary, regionalPlays, topCampaigns, topAssets, dailyTrend } = data;

  // Custom SVG line coordinates helper for Plays / Scans Trend
  const maxTrendVal = Math.max(...dailyTrend.map(t => Math.max(t.plays, t.scans)), 10);
  const svgWidth = 600;
  const svgHeight = 200;
  const padding = 30;
  const chartWidth = svgWidth - padding * 2;
  const chartHeight = svgHeight - padding * 2;

  const getPointsPath = (dataKey) => {
    if (dailyTrend.length === 0) return '';
    return dailyTrend.map((t, idx) => {
      const x = padding + (idx / (dailyTrend.length - 1)) * chartWidth;
      const y = padding + chartHeight - (t[dataKey] / maxTrendVal) * chartHeight;
      return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  // Custom SVG bar coordinates helper for Regions
  const regionNames = Object.keys(regionalPlays);
  const regionValues = Object.values(regionalPlays);
  const maxRegionVal = Math.max(...regionValues, 5);
  const barSvgWidth = 500;
  const barSvgHeight = 200;
  const barPadding = 40;
  const barChartWidth = barSvgWidth - barPadding * 2;
  const barChartHeight = barSvgHeight - barPadding * 2;
  const barWidth = 35;

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <BarChart3 className="w-8 h-8 text-blue-600 mr-2.5 stroke-[2.2]" />
            <span>Platform Analytics</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Proof-of-play delivery logs, scans, and regional distributions</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('playback')}
            disabled={exporting}
            className="inline-flex items-center justify-center px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-800 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <DownloadCloud className="w-4 h-4 mr-1.5" />
            <span>Plays CSV</span>
          </button>
          <button
            onClick={() => handleExport('engagement')}
            disabled={exporting}
            className="inline-flex items-center justify-center px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-slate-600 hover:text-slate-800 text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
          >
            <DownloadCloud className="w-4 h-4 mr-1.5" />
            <span>Scans CSV</span>
          </button>
          <button
            onClick={loadAnalytics}
            className="inline-flex items-center justify-center p-2.5 border border-slate-300 bg-white hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition-colors"
            title="Refresh Stats"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Aggregate metrics grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Plays card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Total Plays</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-2 block">{summary.totalPlays}</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Tv className="w-6 h-6" />
          </div>
        </div>

        {/* Display hours card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Screen Time</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-2 block">{summary.displayTimeHours}h</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <FolderOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Availability card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Avg Uptime</span>
            <span className="text-3xl font-extrabold text-emerald-600 mt-2 block">{summary.availabilityRate}%</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        {/* Scan conversions card */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">Engagement CTR</span>
            <span className="text-3xl font-extrabold text-slate-800 mt-2 block">{summary.ctr}%</span>
            <span className="text-[10px] text-slate-400 mt-1 block">Total Scans: {summary.scans}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <MousePointerClick className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Plays & Scans over Time Line Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Playback & Scan Trends</h3>
            <p className="text-xs text-slate-400 mt-0.5">Audience engagement vs campaign loops (past 7 days)</p>
          </div>

          <div className="w-full overflow-x-auto flex justify-center py-2">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full max-w-[600px] h-auto font-sans select-none">
              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                const y = padding + r * chartHeight;
                const gridVal = Math.round(maxTrendVal * (1 - r));
                return (
                  <g key={i}>
                    <line x1={padding} y1={y} x2={svgWidth - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x={padding - 8} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{gridVal}</text>
                  </g>
                );
              })}

              {/* Plays Path */}
              <path d={getPointsPath('plays')} fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              {/* Scans Path */}
              <path d={getPointsPath('scans')} fill="none" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="3 3" />

              {/* Data points */}
              {dailyTrend.map((t, idx) => {
                const x = padding + (idx / (dailyTrend.length - 1)) * chartWidth;
                const playsY = padding + chartHeight - (t.plays / maxTrendVal) * chartHeight;
                const scansY = padding + chartHeight - (t.scans / maxTrendVal) * chartHeight;
                return (
                  <g key={idx}>
                    {/* Plays circle */}
                    <circle cx={x} cy={playsY} r="3.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.2" />
                    {/* Scans circle */}
                    <circle cx={x} cy={scansY} r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.2" />
                    
                    {/* Day label */}
                    <text x={x} y={svgHeight - padding + 15} textAnchor="middle" fontSize="9" fill="#64748b">{t.date}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-center space-x-6 text-[10px] uppercase font-bold text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-blue-600 block" />
              <span>Playback Loops</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-0.5 bg-amber-500 block border-dashed border-t border-amber-500" style={{ borderStyle: 'dashed' }} />
              <span>QR Code Scans</span>
            </div>
          </div>
        </div>

        {/* Region Bar Chart (1/3 width) */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Regional Distribution</h3>
            <p className="text-xs text-slate-400 mt-0.5">Media playback volume by geo region</p>
          </div>

          <div className="w-full flex justify-center py-2">
            <svg viewBox={`0 0 ${barSvgWidth} ${barSvgHeight}`} className="w-full max-w-[320px] h-auto font-sans select-none">
              {/* Grid Lines */}
              {[0, 0.5, 1].map((r, i) => {
                const y = barPadding + r * barChartHeight;
                const gridVal = Math.round(maxRegionVal * (1 - r));
                return (
                  <g key={i}>
                    <line x1={barPadding} y1={y} x2={barSvgWidth - barPadding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
                    <text x={barPadding - 8} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{gridVal}</text>
                  </g>
                );
              })}

              {/* Render Bars */}
              {regionValues.map((val, idx) => {
                const x = barPadding + (idx / (regionNames.length - 1)) * barChartWidth - barWidth / 2;
                const barHeight = (val / maxRegionVal) * barChartHeight;
                const y = barPadding + barChartHeight - barHeight;
                const label = regionNames[idx].split(' ')[0]; // Take first word e.g. 'North'
                return (
                  <g key={idx}>
                    <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 3)} fill="#4f46e5" rx="4" />
                    {/* Value text above bar */}
                    {val > 0 && (
                      <text x={x + barWidth / 2} y={y - 5} textAnchor="middle" fontSize="9" fontWeight="bold" fill="#4f46e5">{val}</text>
                    )}
                    {/* Label below bar */}
                    <text x={x + barWidth / 2} y={barSvgHeight - barPadding + 15} textAnchor="middle" fontSize="9" fill="#64748b">{label}</text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="text-[10px] text-center text-slate-400 pt-2 border-t border-slate-100">
            Smartboards playback volume comparison.
          </div>
        </div>
      </div>

      {/* Grid: 2 Column - Top Assets Progress and Top Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Performing Campaigns listing */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-2">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Top Performing Campaigns</h3>
          </div>

          <div className="p-5 flex-1 divide-y divide-slate-100">
            {topCampaigns.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No campaign plays recorded yet.</div>
            ) : (
              topCampaigns.map((camp, idx) => (
                <div key={camp.id} className="py-3 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 truncate">
                    <span className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-500 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800 truncate" title={camp.name}>
                      {camp.name}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-slate-500 shrink-0 font-medium">
                    <span>{camp.plays} plays</span>
                    <span className="text-[10px] text-slate-400">({Math.round(camp.duration / 60)} min)</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Assets Share */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Top Media Assets</h3>
          </div>

          <div className="p-5 flex-1 space-y-4">
            {topAssets.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No asset playbacks recorded yet.</div>
            ) : (
              topAssets.map((asset, idx) => {
                const totalAssetPlays = topAssets.reduce((sum, a) => sum + a.plays, 0);
                const percentage = totalAssetPlays > 0 ? Math.round((asset.plays / totalAssetPlays) * 100) : 0;
                return (
                  <div key={asset.name} className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 truncate max-w-[250px]">{asset.name}</span>
                      <span className="text-slate-500 font-medium shrink-0">{asset.plays} plays ({percentage}%)</span>
                    </div>
                    {/* Simulated progress bar */}
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          idx === 0 
                            ? 'bg-blue-600' 
                            : idx === 1 
                              ? 'bg-indigo-600' 
                              : idx === 2 
                                ? 'bg-purple-600' 
                                : 'bg-slate-400'
                        }`} 
                        style={{ width: `${percentage}%` }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AnalyticsDashboard;
