import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, 
  UploadCloud, 
  Film, 
  Image as ImageIcon, 
  Trash2, 
  Eye, 
  Loader2, 
  AlertCircle, 
  CheckCircle,
  X,
  Plus,
  Play,
  Monitor
} from 'lucide-react';

const AssetLibrary = () => {
  // Data states
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search/Filter states
  const [search, setSearch] = useState('');
  const [assetType, setAssetType] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Upload modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  // Preview modal states
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewAsset, setPreviewAsset] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch all assets
  const fetchAssets = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search,
        assetType,
        page: page.toString(),
        limit: '12'
      });
      const { data } = await api.get(`/assets?${queryParams.toString()}`);
      setAssets(data.assets);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      console.error('Error fetching assets:', err);
      setError('Failed to retrieve library assets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, assetType, page]);

  // File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setUploadError('');
    if (!file) return;

    // Type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Unsupported format. Only JPG, PNG, WEBP, and MP4 are allowed.');
      return;
    }

    // Size validation (10MB limit)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError('File exceeds 10MB size limit.');
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadError('');
    setUploadProgress(10); // Start progress bar indicators

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      setUploadProgress(40);
      await api.post('/assets/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setUploadProgress(100);
      setSuccess('Asset uploaded successfully!');
      setSelectedFile(null);
      setUploadModalOpen(false);
      fetchAssets(); // Refresh grid
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err.response?.data?.message || 'Failed to upload asset.');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Open Preview Modal (performs fetch with usage metrics details)
  const handleOpenPreview = async (assetId) => {
    setPreviewModalOpen(true);
    setPreviewLoading(true);
    setPreviewAsset(null);
    try {
      const { data } = await api.get(`/assets/${assetId}`);
      setPreviewAsset(data);
    } catch (err) {
      console.error('Error loading asset details:', err);
      alert('Failed to load asset details.');
      setPreviewModalOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  // Delete Asset handler
  const handleDeleteAsset = async (assetId) => {
    const confirmDelete = window.confirm('Are you sure you want to permanently delete this media asset? It will be removed from all associated campaigns.');
    if (!confirmDelete) return;

    try {
      await api.delete(`/assets/${assetId}`);
      setPreviewModalOpen(false);
      setSuccess('Asset deleted successfully.');
      fetchAssets();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting asset:', err);
      alert('Failed to delete asset.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Media Library</h1>
          <p className="text-sm text-slate-500 mt-1">Manage physical displays advertising content</p>
        </div>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <UploadCloud className="w-4 h-4 mr-2" />
          <span>Upload Media</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-md text-emerald-700 flex items-center space-x-3 max-w-7xl mx-auto">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {/* Toolbar - Search & Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute inset-y-0 left-0 pl-3.5 h-full w-5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
          />
        </div>

        {/* Type selector */}
        <div className="flex items-center space-x-2 w-full md:w-auto shrink-0 justify-end">
          <button
            onClick={() => setAssetType('')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              assetType === ''
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Formats
          </button>
          <button
            onClick={() => setAssetType('Image')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              assetType === 'Image'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Images
          </button>
          <button
            onClick={() => setAssetType('Video')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
              assetType === 'Video'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Videos
          </button>
        </div>
      </div>

      {/* Media Library Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="mt-3 text-sm text-slate-500 font-medium">Loading asset library files...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-red-500">
          <p>{error}</p>
        </div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20 bg-white border border-slate-200 rounded-xl">
          <p className="font-semibold text-slate-600">Media Library is empty</p>
          <p className="text-sm text-slate-400 mt-1">Click the upload button to add images or videos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {assets.map((asset) => (
            <div 
              key={asset._id}
              onClick={() => handleOpenPreview(asset._id)}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 cursor-pointer transition-all flex flex-col group"
            >
              {/* Media Thumbnail Container */}
              <div className="relative aspect-square w-full bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
                {asset.assetType === 'Image' ? (
                  <img 
                    src={asset.fileUrl} 
                    alt={asset.assetName} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center text-slate-400 bg-slate-900/5">
                    <Film className="w-8 h-8 stroke-[1.5]" />
                    <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-slate-900/70 text-white text-[9px] font-bold">
                      {asset.duration}s
                    </span>
                    <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </div>
                )}
                
                {/* Hover overlay icons */}
                <div className="absolute inset-0 bg-slate-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                  <div className="p-2 bg-white rounded-lg shadow-sm text-slate-700">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="p-3 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate" title={asset.assetName}>
                  {asset.assetName}
                </p>
                <div className="flex items-center justify-between text-[9px] text-slate-400 uppercase font-semibold mt-1">
                  <span>{asset.assetType}</span>
                  <span>{(asset.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && assets.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 pt-4">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page <= 1}
            className="p-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-white disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500 font-semibold">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
            disabled={page >= totalPages}
            className="p-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-white disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}

      {/* File Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center px-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => !uploading && setUploadModalOpen(false)}
          />
          <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl max-w-md w-full p-6 space-y-5">
            <button 
              onClick={() => setUploadModalOpen(false)}
              disabled={uploading}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Upload Media Assets</h3>
              <p className="text-xs text-slate-400 mt-0.5">Supports JPG, PNG, WEBP, and MP4 (max 10MB)</p>
            </div>

            {uploadError && (
              <div className="p-3.5 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start space-x-2 text-xs text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag/Drop area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors relative bg-slate-50/50">
                <input 
                  type="file"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  accept="image/jpeg,image/png,image/webp,video/mp4"
                />
                
                <UploadCloud className="w-10 h-10 text-slate-400" />
                <span className="text-xs font-semibold text-slate-600 mt-3.5">
                  {selectedFile ? selectedFile.name : 'Click to select file'}
                </span>
                <span className="text-[10px] text-slate-400 mt-1">
                  {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'or drag and drop here'}
                </span>
              </div>

              {/* Progress Bar */}
              {uploading && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold uppercase">
                    <span>Uploading file...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  disabled={uploading}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  <span>Upload</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Preview Modal */}
      {previewModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center px-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={() => setPreviewModalOpen(false)}
          />
          <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl max-w-2xl w-full p-6 space-y-6">
            <button 
              onClick={() => setPreviewModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {previewLoading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                <p className="mt-3 text-sm text-slate-400">Loading asset brief...</p>
              </div>
            ) : previewAsset ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Left - Media Content View */}
                <div className="border border-slate-200 rounded-lg bg-slate-900 overflow-hidden flex items-center justify-center aspect-square max-h-[300px] md:max-h-none">
                  {previewAsset.assetType === 'Image' ? (
                    <img 
                      src={previewAsset.fileUrl} 
                      alt={previewAsset.assetName} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <video 
                      src={previewAsset.fileUrl} 
                      controls 
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>

                {/* Right - Metadata & Usage Details */}
                <div className="flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                        ID: {previewAsset.assetId}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-2 truncate" title={previewAsset.assetName}>
                        {previewAsset.assetName}
                      </h3>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Uploaded: {new Date(previewAsset.uploadedAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Metadata attributes */}
                    <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 grid grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">File Format</span>
                        <span className="font-semibold text-slate-700">{previewAsset.assetType}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">File Size</span>
                        <span className="font-semibold text-slate-700">
                          {(previewAsset.fileSize / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      {previewAsset.assetType === 'Video' && (
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Playback Length</span>
                          <span className="font-semibold text-slate-700">{previewAsset.duration} seconds</span>
                        </div>
                      )}
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block">Uploader</span>
                        <span className="font-semibold text-slate-700 truncate block">Admin Node</span>
                      </div>
                    </div>

                    {/* Usage Tracking details */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                        Campaign Associations
                      </h4>
                      <div className="max-h-24 overflow-y-auto space-y-1">
                        {previewAsset.campaignsUsedIn?.length === 0 ? (
                          <p className="text-[11px] text-slate-400 font-medium">Not currently used in any campaigns.</p>
                        ) : (
                          previewAsset.campaignsUsedIn?.map(cmp => (
                            <Link 
                              key={cmp._id}
                              to={`/dashboard/campaigns/${cmp._id}`}
                              className="block p-1.5 bg-blue-50/20 hover:bg-blue-50/50 border border-blue-50 rounded text-[11px] text-blue-700 font-semibold transition-colors truncate"
                            >
                              {cmp.campaignName} ({cmp.campaignId})
                            </Link>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions inside Preview */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => handleDeleteAsset(previewAsset._id)}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-xs font-semibold rounded-lg text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm"
                    >
                      <Trash2 className="w-4 h-4 mr-1.5" />
                      <span>Delete File</span>
                    </button>
                  </div>

                </div>

              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetLibrary;
