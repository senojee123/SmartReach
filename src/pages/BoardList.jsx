import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Eye, 
  Edit2, 
  Trash2, 
  ArrowUpDown,
  Loader2,
  AlertTriangle,
  X
} from 'lucide-react';

const BoardList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state derived from searchParams or defaults
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';
  const boardType = searchParams.get('boardType') || '';
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
  const [boardToDelete, setBoardToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch boards
  const fetchBoards = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        search,
        status,
        boardType,
        sortBy,
        order,
        page: page.toString(),
        limit: limit.toString()
      });
      
      const { data } = await api.get(`/boards?${queryParams.toString()}`);
      setBoards(data.boards);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error loading boards:', err);
      setError('Failed to retrieve smartboards list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, [search, status, boardType, sortBy, order, page]);

  // Update query params helper
  const updateQueryParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset to page 1 when filter/search changes
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
  const openDeleteModal = (board) => {
    setBoardToDelete(board);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setBoardToDelete(null);
    setDeleteModalOpen(false);
  };

  const handleDeleteConfirm = async () => {
    if (!boardToDelete) return;
    try {
      setDeleting(true);
      await api.delete(`/boards/${boardToDelete._id}`);
      closeDeleteModal();
      fetchBoards(); // Reload list
    } catch (err) {
      console.error('Error deleting board:', err);
      alert(err.response?.data?.message || 'Failed to delete board.');
      setDeleting(false);
    }
  };

  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'Active':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
      case 'Offline':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Offline</span>;
      case 'Maintenance':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Maintenance</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">Unknown</span>;
    }
  };

  const getBoardTypeBadge = (typeVal) => {
    return (
      <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">
        {typeVal}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Smartboards</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and monitor physical display nodes</p>
        </div>
        <button
          onClick={() => navigate('/dashboard/boards/new')}
          className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span>Add Smartboard</span>
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
              placeholder="Search by board ID, name, location or region..."
              value={search}
              onChange={(e) => updateQueryParam('search', e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <select
              value={boardType}
              onChange={(e) => updateQueryParam('boardType', e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm appearance-none cursor-pointer bg-white"
            >
              <option value="">All Board Types</option>
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
              <option value="Active">Active</option>
              <option value="Offline">Offline</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="mt-3 text-sm text-slate-500 font-medium">Fetching board records...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
          </div>
        ) : boards.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <p className="font-semibold text-slate-600">No boards match your criteria</p>
            <p className="text-sm text-slate-400 mt-1">Try clearing filters or checking other query criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-4">Board ID</th>
                  <th 
                    scope="col" 
                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors select-none"
                    onClick={() => handleSort('boardName')}
                  >
                    <div className="flex items-center space-x-1.5">
                      <span>Board Name</span>
                      <ArrowUpDown className="w-3.5 h-3.5" />
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-4">Location</th>
                  <th scope="col" className="px-6 py-4">Type</th>
                  <th scope="col" className="px-6 py-4">Status</th>
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
                {boards.map((board) => (
                  <tr key={board._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                      {board.boardId}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {board.boardName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-slate-800 font-medium">{board.location}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{board.region}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getBoardTypeBadge(board.boardType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(board.status)}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {new Date(board.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => navigate(`/dashboard/boards/${board._id}`)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/boards/${board._id}/edit`)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                          title="Edit Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(board)}
                          className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors"
                          title="Delete Board"
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
        {!loading && boards.length > 0 && (
          <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
            <div className="text-sm text-slate-500">
              Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-semibold text-slate-800">
                {Math.min(page * limit, pagination.totalItems)}
              </span>{' '}
              of <span className="font-semibold text-slate-800">{pagination.totalItems}</span> smartboards
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
                <h3 className="text-lg font-bold text-slate-900">Delete Smartboard</h3>
                <p className="text-sm text-slate-500 mt-1">
                  Are you sure you want to permanently delete board{' '}
                  <span className="font-semibold text-slate-800">{boardToDelete?.boardName}</span> ({boardToDelete?.boardId})?
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

export default BoardList;
