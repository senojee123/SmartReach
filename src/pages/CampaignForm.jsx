import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Save, Loader2, AlertCircle, Calendar, Film, Image as ImageIcon, Trash2 } from 'lucide-react';

const CampaignForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  // Form fields state
  const [campaignName, setCampaignName] = useState('');
  const [description, setDescription] = useState('');
  const [campaignText, setCampaignText] = useState('');
  const [campaignType, setCampaignType] = useState('');
  const [status, setStatus] = useState('Draft');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedAssets, setSelectedAssets] = useState([]);

  // Data states
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  // Fetch available assets & campaign details if editing
  useEffect(() => {
    const loadData = async () => {
      try {
        setFetching(true);
        // Load all library assets to choose from
        const assetRes = await api.get('/assets?limit=100');
        setAvailableAssets(assetRes.data.assets);

        if (isEditMode) {
          const { data } = await api.get(`/campaigns/${id}`);
          setCampaignName(data.campaignName);
          setDescription(data.description || '');
          setCampaignText(data.campaignText || '');
          setCampaignType(data.campaignType);
          setStatus(data.status);
          
          // Format dates for HTML date input: YYYY-MM-DD
          setStartDate(data.startDate ? data.startDate.split('T')[0] : '');
          setEndDate(data.endDate ? data.endDate.split('T')[0] : '');
          
          // Store selected asset MongoDB IDs
          setSelectedAssets(data.assets.map(a => a._id));
        }
      } catch (err) {
        console.error('Error fetching form details:', err);
        setError('Failed to retrieve campaign configurations or media asset list.');
      } finally {
        setFetching(false);
      }
    };
    loadData();
  }, [id, isEditMode]);

  const handleAssetToggle = (assetId) => {
    setSelectedAssets(prev => 
      prev.includes(assetId) 
        ? prev.filter(item => item !== assetId) 
        : [...prev, assetId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Field Validations
    if (!campaignName.trim() || !campaignType || !startDate || !endDate) {
      setError('Please fill in all required fields');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setError('Campaign End Date must be equal to or after the Start Date');
      return;
    }

    const payload = {
      campaignName: campaignName.trim(),
      description: description.trim(),
      campaignText: campaignText.trim(),
      campaignType,
      status,
      startDate,
      endDate,
      assetIds: selectedAssets
    };

    try {
      setLoading(true);
      if (isEditMode) {
        await api.put(`/campaigns/${id}`, payload);
        navigate(`/dashboard/campaigns/${id}/targeting`); // Redirect to targeting page
      } else {
        const { data } = await api.post('/campaigns', payload);
        // Redirect directly to targeting assignment for the new campaign
        navigate(`/dashboard/campaigns/${data._id}/targeting`);
      }
    } catch (err) {
      console.error('Error saving campaign:', err);
      setError(err.response?.data?.message || 'An error occurred while saving the campaign.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete campaign "${campaignName}"?`)) return;
    setError('');
    try {
      setLoading(true);
      await api.delete(`/campaigns/${id}`);
      navigate('/dashboard/campaigns');
    } catch (err) {
      console.error('Error deleting campaign:', err);
      setError(err.response?.data?.message || 'Failed to delete campaign.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Loading form details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back button and title */}
      <div className="flex items-center space-x-4">
        <Link 
          to="/dashboard/campaigns" 
          className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Campaign' : 'Create New Campaign'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEditMode ? 'Modify campaign parameters and media assets' : 'Define new campaign timeline and connect media'}
          </p>
        </div>
      </div>

      {/* Form Grid */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns - Campaign Settings Form (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* Campaign Name */}
            <div>
              <label htmlFor="campaignName" className="block text-sm font-medium text-slate-700">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="campaignName"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. Summer Sports Fest Ad"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                Description / Memo
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details about the campaign purpose..."
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors resize-none"
              />
            </div>

            {/* Campaign Text Content */}
            <div>
              <label htmlFor="campaignText" className="block text-sm font-medium text-slate-700">
                Campaign Text (Optional)
              </label>
              <textarea
                id="campaignText"
                rows={3}
                value={campaignText}
                onChange={(e) => setCampaignText(e.target.value)}
                placeholder="Enter text to display directly on kiosk display screens..."
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors resize-none"
              />
            </div>

            {/* Type & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="campaignType" className="block text-sm font-medium text-slate-700">
                  Campaign Type <span className="text-red-500">*</span>
                </label>
                <select
                  id="campaignType"
                  value={campaignType}
                  onChange={(e) => setCampaignType(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Sports">Sports</option>
                  <option value="Religious & Cultural">Religious & Cultural</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Public Information">Public Information</option>
                </select>
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-slate-700">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Paused">Paused</option>
                </select>
              </div>
            </div>

            {/* Start & End Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-slate-700">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    id="startDate"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-slate-700">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    id="endDate"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Media Selection Panel (1/3 width) */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 flex flex-col h-[410px]">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Attach Media Assets</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {selectedAssets.length} Selected
              </span>
            </h3>

            {/* Scrollable list of available assets */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1.5">
              {availableAssets.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <p>No media files found in library.</p>
                  <Link to="/dashboard/assets" target="_blank" className="text-blue-600 hover:underline font-semibold mt-1 block">
                    Upload Assets first
                  </Link>
                </div>
              ) : (
                availableAssets.map((asset) => {
                  const isChecked = selectedAssets.includes(asset._id);
                  return (
                    <div 
                      key={asset._id}
                      onClick={() => handleAssetToggle(asset._id)}
                      className={`flex items-center space-x-3 p-2.5 border rounded-lg cursor-pointer transition-colors hover:bg-slate-50 select-none ${
                        isChecked ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200'
                      }`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}} // Controlled by outer div click
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 pointer-events-none cursor-pointer"
                      />
                      
                      {/* Thumbnail/Icon */}
                      <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                        {asset.assetType === 'Image' ? (
                          <img 
                            src={asset.fileUrl} 
                            alt={asset.assetName} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Film className="w-5 h-5" />
                            <span className="text-[8px] font-semibold mt-0.5">{asset.duration}s</span>
                          </div>
                        )}
                      </div>

                      <div className="overflow-hidden min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-800 truncate">{asset.assetName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                          {asset.assetType} • {(asset.fileSize / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Action buttons footer inside card */}
            <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between shrink-0">
              <div>
                {isEditMode && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={loading}
                    className="inline-flex items-center justify-center px-3.5 py-2 border border-red-200 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5 text-red-500" />
                    <span>Delete</span>
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <Link
                  to="/dashboard/campaigns"
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  <span>Next: Targeting & Scheduling</span>
                </button>
              </div>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default CampaignForm;
