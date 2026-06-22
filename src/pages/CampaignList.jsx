import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  ArrowUpDown,
  Loader2,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Monitor
} from 'lucide-react';

const CampaignList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state derived from searchParams
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const campaignType = searchParams.get('campaignType') || '';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const order = searchParams.get('order') || 'desc';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = 10;

  // Pagination stats
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalItems: 0
  });

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch campaigns
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search,
        status,
        campaignType,
        sortBy,
        order,
        page: page.toString(),
        limit: limit.toString()
      });
      
      const { data } = await api.get(`/campaigns?${queryParams.toString()}`);
      setCampaigns(data.campaigns);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error loading campaigns:', err);
      setError('Failed to retrieve campaigns list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [search, status, campaignType, sortBy, order, page]);

  // Update query params helper
  const updateQueryParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
  };

  // Toggle sorting helper
  const handleSort = (field) => {
    let nextOrder = 'asc';
    if (sortBy === field) {
      nextOrder = order === 'asc' ? 'desc' : 'asc';
    }
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sortBy', field);
    newParams.set('order', nextOrder);
    setSearchParams(newParams);
  };

  // Delete handler
  const openDeleteModal = (campaign) => {
    setCampaignToDelete(campaign);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setCampaignToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!campaignToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/campaigns/${campaignToDelete._id}`);
      closeDeleteModal();
      fetchCampaigns(); // Reload list
    } catch (err) {
      console.error('Error deleting campaign:', err);
      alert(err.response?.data?.message || 'Failed to delete campaign.');
      setDeleting(false);
    }
  };

  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'Active':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
      case 'Draft':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-700 border border-slate-200">Draft</span>;
      case 'Scheduled':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Scheduled</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Completed</span>;
      case 'Paused':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Paused</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">Unknown</span>;
    }
  };

  const getCampaignTypeBadge = (typeVal) => {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-50 text-slate-700 border border-slate-200">
        {typeVal}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-sm text-slate-500 mt-1">Create and schedule content delivery parameters</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/campaigns/new')}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Create Campaign</span>
        </button>
      </div>

      {/* Search and Filters panel */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-2">
            <Search className="absolute inset-y-0 left-0 pl-3.5 h-full w-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by campaign ID, name, or description..."
              value={search}
              onChange={(e) => updateQueryParam('search', e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={campaignType}
              onChange={(e) => updateQueryParam('campaignType', e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer bg-white"
            >
              <option value="">All Types</option>
              <option value="Sports">Sports</option>
              <option value="Religious & Cultural">Religious & Cultural</option>
              <option value="Entertainment">Entertainment</option>
              <option value="Public Information">Public Information</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => updateQueryParam('status', e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer bg-white"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Active">Active</option>
              <option value="Completed">Completed</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Fetching campaigns...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="font-semibold text-slate-600">No campaigns found</p>
            <p className="text-sm text-slate-400 mt-1">Try clearing filters or defining a new campaign.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Campaign ID</th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('campaignName')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Campaign Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4">Type</th>
                  <th scope="col" className="px-6 py-4">Status</th>
                  <th scope="col" className="px-6 py-4">Duration</th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('createdAt')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Created Date</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {campaigns.map((campaign) => (
                  <tr key={campaign._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                      {campaign.campaignId}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      <div>{campaign.campaignName}</div>
                      <div className="text-xs text-slate-400 font-normal truncate max-w-xs mt-0.5">{campaign.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getCampaignTypeBadge(campaign.campaignType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(campaign.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      <div className="flex items-center space-x-1 text-xs">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(campaign.startDate).toLocaleDateString()} - {new Date(campaign.endDate).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/dashboard/campaigns/${campaign._id}`)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                          title="View Details & Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/campaigns/${campaign._id}/edit`)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Edit Settings"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/campaigns/${campaign._id}/targeting`)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Select Boards & Schedule"
                        >
                          <Monitor className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(campaign)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && campaigns.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(page * limit, pagination.totalItems)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{pagination.totalItems}</span> campaigns
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => updateQueryParam('page', (page - 1).toString())}
                disabled={page <= 1}
                className="inline-flex items-center justify-center p-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => updateQueryParam('page', pageNum.toString())}
                  className={`inline-flex items-center justify-center w-9 h-9 border rounded-lg text-sm font-semibold transition-colors ${
                    pageNum === page
                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                      : 'border-slate-300 text-slate-600 hover:bg-white'
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                onClick={() => updateQueryParam('page', (page + 1).toString())}
                disabled={page >= pagination.totalPages}
                className="inline-flex items-center justify-center p-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-white transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center px-4">
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
            onClick={closeDeleteModal}
          />
          <div className="relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xl max-w-md w-full p-6 space-y-4">
            <button 
              onClick={closeDeleteModal}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start space-x-3.5">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-lg">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Delete Campaign</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to permanently delete campaign{' '}
                  <span className="font-semibold text-slate-800">{campaignToDelete?.campaignName}</span> ({campaignToDelete?.campaignId})? This will also remove targeting board assignments.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={deleting}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                {deleting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : null}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignList;
