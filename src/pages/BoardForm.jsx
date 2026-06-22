import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react';

const BoardForm = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // if present, we are in Edit mode
  const isEditMode = !!id;

  // Form states
  const [boardName, setBoardName] = useState('');
  const [location, setLocation] = useState('');
  const [region, setRegion] = useState('');
  const [boardType, setBoardType] = useState('');
  const [status, setStatus] = useState('Offline');

  // Page states
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState('');

  // Fetch board details if editing
  useEffect(() => {
    if (isEditMode) {
      const fetchBoard = async () => {
        try {
          setFetching(true);
          const { data } = await api.get(`/boards/${id}`);
          setBoardName(data.boardName);
          setLocation(data.location);
          setRegion(data.region);
          setBoardType(data.boardType);
          setStatus(data.status);
        } catch (err) {
          console.error('Error fetching board details:', err);
          setError('Failed to fetch board details. The board may not exist.');
        } finally {
          setFetching(false);
        }
      };
      fetchBoard();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Form Validation
    if (!boardName.trim() || !location.trim() || !region.trim() || !boardType) {
      setError('Please fill in all required fields');
      return;
    }

    const payload = {
      boardName: boardName.trim(),
      location: location.trim(),
      region: region.trim(),
      boardType,
      status
    };

    try {
      setLoading(true);
      if (isEditMode) {
        await api.put(`/boards/${id}`, payload);
      } else {
        await api.post('/boards', payload);
      }
      navigate('/dashboard/boards');
    } catch (err) {
      console.error('Error saving board:', err);
      setError(err.response?.data?.message || 'An error occurred while saving the board.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Loading smartboard details...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Back button and title */}
      <div className="flex items-center space-x-4">
        <Link 
          to="/dashboard/boards" 
          className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            {isEditMode ? 'Edit Smartboard' : 'Register New Smartboard'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {isEditMode ? 'Modify configuration parameters' : 'Define new physical screen terminal'}
          </p>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden p-6 sm:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Board Name */}
          <div>
            <label htmlFor="boardName" className="block text-sm font-medium text-slate-700">
              Board Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="boardName"
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              placeholder="e.g. Downtown Arena Screen B"
              className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
              required
            />
          </div>

          {/* Location & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-slate-700">
                Location (Street/Venue) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 102 Arena Way, Sector 4"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                required
              />
            </div>
            <div>
              <label htmlFor="region" className="block text-sm font-medium text-slate-700">
                Region <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. North Region"
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-colors"
                required
              />
            </div>
          </div>

          {/* Board Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="boardType" className="block text-sm font-medium text-slate-700">
                Board Type <span className="text-red-500">*</span>
              </label>
              <select
                id="boardType"
                value={boardType}
                onChange={(e) => setBoardType(e.target.value)}
                className="mt-1 block w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                required
              >
                <option value="">Select Board Type</option>
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
                <option value="Active">Active</option>
                <option value="Offline">Offline</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
            <Link
              to="/dashboard/boards"
              className="px-5 py-2.5 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
              ) : (
                <Save className="w-4 h-4 mr-1.5" />
              )}
              <span>{isEditMode ? 'Update' : 'Register'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BoardForm;
