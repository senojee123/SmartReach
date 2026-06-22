import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { 
  FileText, 
  DownloadCloud, 
  Loader2, 
  AlertCircle,
  Megaphone,
  Tv,
  CheckCircle,
  MousePointerClick,
  Award
} from 'lucide-react';

const SponsorReporting = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [campaignData, setCampaignData] = useState(null);
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  // 1. Fetch campaigns list on mount
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoadingList(true);
        const res = await api.get('/campaigns?limit=100');
        setCampaigns(res.data.campaigns || []);
      } catch (err) {
        console.error('Error fetching campaigns list:', err);
        setError('Failed to load campaigns list.');
      } finally {
        setLoadingList(false);
      }
    };

    fetchCampaigns();
  }, []);

  // 2. Fetch campaign specific report when selection changes
  useEffect(() => {
    if (!selectedCampaignId) {
      setCampaignData(null);
      return;
    }

    const fetchCampaignReport = async () => {
      try {
        setLoadingReport(true);
        setError('');
        const res = await api.get(`/analytics/campaign/${selectedCampaignId}`);
        setCampaignData(res.data);
      } catch (err) {
        console.error('Error loading campaign report:', err);
        setError('Failed to compile report for the selected campaign.');
      } finally {
        setLoadingReport(false);
      }
    };

    fetchCampaignReport();
  }, [selectedCampaignId]);

  const handleExport = async (type) => {
    if (!selectedCampaignId) return;

    try {
      setExporting(true);
      const res = await api.get(`/analytics/export/${type}`, { responseType: 'blob' });
      
      const blob = new Blob([res.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = `smartreach_${type}_report_${selectedCampaignId}.csv`;
      link.click();
      window.URL.revokeObjectURL(link.href);
    } catch (err) {
      console.error(`Export failed for ${type}:`, err);
      alert(`Export failed for ${type} logs. Please try again.`);
    } finally {
      setExporting(false);
    }
  };

  if (loadingList) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Loading campaigns index...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center">
            <FileText className="w-8 h-8 text-blue-600 mr-2.5 stroke-[2.2]" />
            <span>Sponsor & Delivery Reporting</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">Audit reports, play verifications, and scan conversion metrics</p>
        </div>

        {selectedCampaignId && (
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
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-red-700 flex items-center space-x-3">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      )}

      {/* Select Campaign Dropdown selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm max-w-xl">
        <label htmlFor="campaignSelect" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Select Campaign to Generate Report
        </label>
        <div className="relative">
          <select
            id="campaignSelect"
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="block w-full px-4 py-3 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
          >
            <option value="">Choose a Campaign</option>
            {campaigns.map(c => (
              <option key={c._id} value={c._id}>
                {c.campaignName} ({c.campaignId} - {c.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report details view */}
      {loadingReport ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-4 text-xs text-slate-500 font-semibold uppercase tracking-wider">Generating campaign audit...</p>
        </div>
      ) : campaignData ? (
        <div className="space-y-8 animate-fade-in">
          
          {/* Campaign summary card header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-950/40 border border-blue-900/40 px-3 py-1 rounded-full">
                  Campaign Report
                </span>
                <h2 className="text-xl font-bold tracking-tight text-slate-100 pt-2">{campaignData.campaign.name}</h2>
                <p className="text-xs text-slate-400 font-normal">Campaign ID: {campaignData.campaign.id} | Category: {campaignData.campaign.type}</p>
              </div>

              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold shrink-0 self-start sm:self-center ${
                campaignData.campaign.status === 'Active' 
                  ? 'bg-emerald-950/40 border border-emerald-900/40 text-emerald-400' 
                  : 'bg-slate-800/40 border border-slate-700/40 text-slate-400'
              }`}>
                {campaignData.campaign.status}
              </span>
            </div>
          </div>

          {/* Aggregations cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Play log counts */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Verified Plays</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{campaignData.stats.plays}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">PoP rate: {campaignData.stats.verifiedRate}%</span>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <CheckCircle className="w-6 h-6" />
              </div>
            </div>

            {/* Total display time */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Display duration</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{campaignData.stats.displayTimeHours}h</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Total screen time volume</span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Tv className="w-6 h-6" />
              </div>
            </div>

            {/* Scans card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">QR Code Scans</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{campaignData.stats.scans}</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Scans logged via player</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                <MousePointerClick className="w-6 h-6" />
              </div>
            </div>

            {/* Conversions rating card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Conversions CTR</span>
                <span className="text-2xl font-extrabold text-slate-800 mt-1 block">{campaignData.stats.ctr}%</span>
                <span className="text-[10px] text-slate-400 mt-1 block">Scan responses: {campaignData.stats.polls}</span>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                <Award className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Asset playback breakdowns */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800">Media Asset Playback Distribution</h3>
            </div>
            
            <div className="overflow-x-auto">
              {campaignData.assetBreakdown.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">No assets mapped to this campaign.</div>
              ) : (
                <table className="min-w-full divide-y divide-slate-100 text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th scope="col" className="px-5 py-3">Asset File Name</th>
                      <th scope="col" className="px-5 py-3">Type</th>
                      <th scope="col" className="px-5 py-3 text-right">Plays Count</th>
                      <th scope="col" className="px-5 py-3 text-right">Play Duration (s)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {campaignData.assetBreakdown.map(asset => (
                      <tr key={asset.name} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-800 truncate max-w-[200px]" title={asset.name}>
                          {asset.name}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          <span className={`px-2 py-0.5 text-[9px] font-semibold rounded ${
                            asset.type === 'Video' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                          }`}>
                            {asset.type}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-slate-800 whitespace-nowrap">
                          {asset.plays}
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-500 whitespace-nowrap">
                          {asset.duration}s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* Empty Prompt State */
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-400 max-w-xl mx-auto space-y-3 shadow-sm">
          <FileText className="w-12 h-12 text-slate-300 mx-auto stroke-[1.5]" />
          <p className="font-semibold text-slate-600">No Campaign Selected</p>
          <p className="text-xs text-slate-400">Select a campaign from the selector above to compile proof-of-play metrics and download auditor CSV logs.</p>
        </div>
      )}
    </div>
  );
};

export default SponsorReporting;
