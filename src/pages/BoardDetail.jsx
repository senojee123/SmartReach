import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Clock, 
  MapPin, 
  Tag, 
  Loader2, 
  AlertTriangle,
  Monitor 
} from 'lucide-react';

const BoardDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBoardDetails = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/boards/${id}`);
        setBoard(data);
      } catch (err) {
        console.error('Error fetching board details:', err);
        setError('Smartboard not found or failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoardDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Retrieving smartboard records...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="space-y-4 max-w-lg mx-auto">
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md text-red-700 flex items-center space-x-3">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <p className="font-medium">{error || 'Unable to display board.'}</p>
        </div>
        <div className="text-center">
          <Link to="/dashboard/boards" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            Back to Smartboards List
          </Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = (statusVal) => {
    switch (statusVal) {
      case 'Active':
        return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Active</span>;
      case 'Offline':
        return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Offline</span>;
      case 'Maintenance':
        return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Maintenance</span>;
      default:
        return <span className="px-3 py-1 text-sm font-semibold rounded-full bg-slate-100 text-slate-600">Unknown</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <Link 
          to="/dashboard/boards" 
          className="inline-flex items-center text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span>Back to List</span>
        </Link>
        <button
          onClick={() => navigate(`/dashboard/boards/${board._id}/edit`)}
          className="inline-flex items-center justify-center px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Edit className="w-4 h-4 mr-2" />
          <span>Edit Board</span>
        </button>
      </div>

      {/* Main Info Card */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Header section with blue bar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 sm:px-8 text-white">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-xs font-semibold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                ID: {board.boardId}
              </span>
              <h1 className="text-2xl font-bold tracking-tight mt-2">{board.boardName}</h1>
            </div>
            <div className="p-3 bg-white/10 rounded-xl">
              <Monitor className="w-8 h-8 stroke-[1.8]" />
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 space-y-8">
          
          {/* Status highlight bar */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-sm font-medium text-slate-500">Node Connectivity Status</span>
            {getStatusBadge(board.status)}
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Location */}
            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Installation Location</h4>
                <p className="text-sm font-semibold text-slate-800 mt-1">{board.location}</p>
                <p className="text-xs text-slate-500 mt-0.5">{board.region}</p>
              </div>
            </div>

            {/* Board Type */}
            <div className="flex items-start space-x-3">
              <Tag className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Board Category</h4>
                <p className="text-sm font-semibold text-slate-800 mt-1">{board.boardType}</p>
              </div>
            </div>

            {/* Last Seen */}
            <div className="flex items-start space-x-3">
              <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Ping Timestamp</h4>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {new Date(board.lastSeen).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>

            {/* Created At */}
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registration Date</h4>
                <p className="text-sm font-semibold text-slate-800 mt-1">
                  {new Date(board.createdAt).toLocaleString(undefined, {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default BoardDetail;
