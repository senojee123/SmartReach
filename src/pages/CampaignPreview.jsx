import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Tag, 
  Film, 
  Image as ImageIcon, 
  Monitor,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Edit,
  FolderOpen,
  Trash2
} from 'lucide-react';

const CampaignPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Data states
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchCampaignDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/campaigns/${id}`);
        setCampaign(data);
      } catch (err) {
        console.error('Error loading campaign summary:', err);
        setError('Failed to fetch campaign brief details.');
      } finally {
        setLoading(false);
      }
    };
    fetchCampaignDetails();
  }, [id]);

  const handlePublish = async () => {
    setError('');
    setSuccess('');
    try {
      setPublishing(true);
      
      // Determine next status: if start date is in the future, set to 'Scheduled', else 'Active'
      const start = new Date(campaign.startDate);
      const now = new Date();
      const targetStatus = start > now ? 'Scheduled' : 'Active';

      await api.put(`/campaigns/${id}`, {
        status: targetStatus
      });

      setSuccess(`Campaign successfully published! Status updated to ${targetStatus}.`);
      setTimeout(() => {
        navigate('/dashboard/campaigns');
      }, 1500);
    } catch (err) {
      console.error('Error publishing campaign:', err);
      setError(err.response?.data?.message || 'Failed to publish campaign.');
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete campaign "${campaign.campaignName}"?`)) return;
    setError('');
    setSuccess('');
    try {
      setPublishing(true);
      await api.delete(`/campaigns/${id}`);
      setSuccess('Campaign deleted successfully.');
      setTimeout(() => {
        navigate('/dashboard/campaigns');
      }, 1500);
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError(err.response?.data?.message || 'Failed to delete campaign.');
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Retrieving campaign brief...</p>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-red-700 flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="font-medium">{error || 'Unable to display campaign.'}</p>
        </div>
        <div className="text-center">
          <Link to="/dashboard/campaigns" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Back to Campaigns List
          </Link>
        </div>
      </div>
    );
  }

  // Calculate campaign metrics
  const imageAssetsCount = campaign.assets.filter(a => a.assetType === 'Image').length;
  const videoAssetsCount = campaign.assets.filter(a => a.assetType === 'Video').length;
  
  // Extract unique regions and types of targeted boards
  const targetedRegions = [...new Set(campaign.targets.map(t => t.region))];
  const targetedTypes = [...new Set(campaign.targets.map(t => t.boardType))];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <Link 
          to="/dashboard/campaigns" 
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to Campaigns</span>
        </Link>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate(`/dashboard/campaigns/${campaign._id}/edit`)}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Edit className="w-4 h-4 mr-2" />
            <span>Edit Details</span>
          </button>
          <button
            onClick={() => navigate(`/dashboard/campaigns/${campaign._id}/targeting`)}
            className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Monitor className="w-4 h-4 mr-2" />
            <span>Modify Targeting</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={publishing}
            className="inline-flex items-center justify-center px-4 py-2 border border-red-200 rounded-lg text-sm font-semibold text-red-600 bg-white hover:bg-red-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4 mr-2 text-red-500" />
            <span>Delete Campaign</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-md flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 font-medium">{success}</p>
        </div>
      )}

      {/* Campaign brief summary wrapper */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden divide-y divide-slate-100">
        
        {/* Header section with blue design */}
        <div className="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-8 sm:px-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                ID: {campaign.campaignId}
              </span>
              <h1 className="text-2xl font-bold tracking-tight mt-2.5">{campaign.campaignName}</h1>
              <p className="text-sm text-blue-100 mt-1 max-w-2xl">{campaign.description || 'No description provided'}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-white text-blue-800 border border-transparent uppercase tracking-wider">
                {campaign.status}
              </span>
            </div>
          </div>
        </div>

        {/* Section 1: Campaign details */}
        <div className="p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
            Campaign Settings
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Duration Timeline</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Tag className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Campaign Category</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">{campaign.campaignType}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Monitor className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Target Delivery Network</span>
                <p className="text-sm font-semibold text-slate-800 mt-1">{campaign.targets.length} screens assigned</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Media Assets */}
        <div className="p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5 flex items-center justify-between">
            <span>Linked Media Assets</span>
            <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {campaign.assets.length} Files
            </span>
          </h2>
          {campaign.assets.length === 0 ? (
            <p className="text-sm text-slate-400">No media assets linked. Please edit details to upload/attach content.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {campaign.assets.map(asset => (
                <div key={asset._id} className="border border-slate-200 rounded-lg p-2.5 flex items-center space-x-2.5 bg-slate-50">
                  <div className="w-10 h-10 rounded overflow-hidden border border-slate-200 bg-white flex items-center justify-center shrink-0">
                    {asset.assetType === 'Image' ? (
                      <img src={asset.fileUrl} alt={asset.assetName} className="w-full h-full object-cover" />
                    ) : (
                      <Film className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={asset.assetName}>
                      {asset.assetName}
                    </p>
                    <p className="text-[9px] text-slate-400 uppercase mt-0.5">
                      {asset.assetType === 'Video' ? `Video • ${asset.duration}s` : 'Image'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Targeting Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2.5">
            Targeting Summary
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {/* Regions list */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Targeted Regions</h3>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {targetedRegions.length === 0 ? (
                  <span className="text-xs text-slate-400">No specific regions matched.</span>
                ) : (
                  targetedRegions.map(region => (
                    <span key={region} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded border border-blue-100 uppercase tracking-wide">
                      {region}
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Board Types list */}
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Targeted Board Categories</h3>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {targetedTypes.length === 0 ? (
                  <span className="text-xs text-slate-400">No specific board categories matched.</span>
                ) : (
                  targetedTypes.map(typeVal => (
                    <span key={typeVal} className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded border border-slate-200 uppercase tracking-wide">
                      {typeVal}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Targeted Smartboards List */}
          <div className="border-t border-slate-100 pt-5 mt-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Targeted Smartboards</h3>
            {campaign.targets.length === 0 ? (
              <p className="text-xs text-slate-400">No smartboards targeted yet. Click "Modify Targeting" to select boards.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {campaign.targets.map(board => (
                  <div key={board._id} className="flex items-center space-x-2.5 p-2 border border-slate-150 rounded-lg bg-slate-50/50 text-xs">
                    <Monitor className="w-3.5 h-3.5 text-blue-600" />
                    <div>
                      <p className="font-semibold text-slate-700">{board.boardName}</p>
                      <p className="text-[10px] text-slate-400 uppercase">{board.boardId} • {board.region}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Estimated Delivery & Publish Confirmation */}
        <div className="p-6 sm:p-8 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Publish Confirmation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Review all details. Estimated delivery reaches{' '}
              <span className="font-semibold text-slate-700">{campaign.targets.length} screens</span>.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {campaign.status === 'Draft' || campaign.status === 'Paused' ? (
              <button
                onClick={handlePublish}
                disabled={publishing || campaign.assets.length === 0 || campaign.targets.length === 0}
                className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  campaign.assets.length === 0 
                    ? 'Attach at least one asset to publish' 
                    : campaign.targets.length === 0 
                      ? 'Target at least one board to publish' 
                      : 'Publish campaign'
                }
              >
                {publishing ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-1.5" />
                )}
                <span>Publish Campaign</span>
              </button>
            ) : (
              <div className="text-sm font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg flex items-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Campaign is Published & {campaign.status}</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CampaignPreview;
