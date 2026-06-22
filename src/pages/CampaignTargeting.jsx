import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Tag, 
  CheckSquare, 
  Square,
  Monitor,
  CheckCircle,
  X,
  Calendar
} from 'lucide-react';

const CampaignTargeting = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Data states
  const [campaign, setCampaign] = useState(null);
  const [allBoards, setAllBoards] = useState([]);
  const [selectedBoards, setSelectedBoards] = useState([]); // Array of Board MongoDB _id strings
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('23:59');

  // Page states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dynamic filter state (applied client-side for immediate responsive experience)
  const [selectedRegions, setSelectedRegions] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  const regionsList = ['Colombo', 'Kandy', 'Galle', 'Jaffna', 'North Region', 'West Region', 'East Region', 'South Region', 'Central Region'];
  const typesList = ['Sports', 'Religious & Cultural', 'Entertainment', 'Public Information'];

  // Load campaign targets and all boards
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Load campaign
        const campaignRes = await api.get(`/campaigns/${id}`);
        const camp = campaignRes.data;
        setCampaign(camp);
        setStartDate(camp.startDate ? camp.startDate.split('T')[0] : '');
        setEndDate(camp.endDate ? camp.endDate.split('T')[0] : '');
        setStartTime(camp.startTime || '00:00');
        setEndTime(camp.endTime || '23:59');

        // Load all smartboards in the system
        const boardsRes = await api.get('/boards?limit=100');
        setAllBoards(boardsRes.data.boards);

        // Pre-populate currently targeted boards
        const targetsRes = await api.get(`/campaigns/${id}/targets`);
        setSelectedBoards(targetsRes.data.map(b => b._id));
      } catch (err) {
        console.error('Error fetching targeting data:', err);
        setError('Failed to load campaign targeting records or boards library.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  // Handle region filter toggle
  const handleRegionToggle = (region) => {
    setSelectedRegions(prev =>
      prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]
    );
  };

  // Handle board type filter toggle
  const handleTypeToggle = (typeVal) => {
    setSelectedTypes(prev =>
      prev.includes(typeVal) ? prev.filter(t => t !== typeVal) : [...prev, typeVal]
    );
  };

  // Dynamic client-side board filtering
  const filteredBoards = allBoards.filter(board => {
    // Search keyword
    const matchesSearch = 
      board.boardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.boardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      board.location.toLowerCase().includes(searchTerm.toLowerCase());

    // Region matches (OR relationship if multiple regions checked, show all if none checked)
    const matchesRegion = 
      selectedRegions.length === 0 || 
      selectedRegions.includes(board.region);

    // Board Type matches (OR relationship if multiple checked)
    const matchesType = 
      selectedTypes.length === 0 || 
      selectedTypes.includes(board.boardType);

    return matchesSearch && matchesRegion && matchesType;
  });

  // Handle individual board checkbox select
  const handleBoardSelectToggle = (boardId) => {
    setSelectedBoards(prev =>
      prev.includes(boardId) ? prev.filter(id => id !== boardId) : [...prev, boardId]
    );
  };

  // Quick actions: Select all currently filtered boards
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredBoards.map(b => b._id);
    setSelectedBoards(prev => {
      // Union of previous selection and currently filtered boards
      const newSelection = [...prev];
      filteredIds.forEach(id => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  // Quick actions: Deselect all currently filtered boards
  const handleDeselectAllFiltered = () => {
    const filteredIds = filteredBoards.map(b => b._id);
    setSelectedBoards(prev => prev.filter(id => !filteredIds.includes(id)));
  };

  const handleSave = async () => {
    setError('');
    setSuccess('');

    if (!startDate || !endDate) {
      setError('Please provide start and end dates.');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      setError('Campaign End Date must be equal to or after the Start Date.');
      return;
    }

    try {
      setSaving(true);
      
      // Save campaign timing settings
      await api.put(`/campaigns/${id}`, {
        startDate,
        endDate,
        startTime,
        endTime
      });

      // Save campaign board assignments
      await api.post(`/campaigns/${id}/assign-boards`, {
        boardIds: selectedBoards
      });

      setSuccess('Targeting configuration saved successfully.');
      setTimeout(() => {
        navigate(`/dashboard/campaigns/${id}`); // Redirect to Summary/Preview page
      }, 1500);
    } catch (err) {
      console.error('Error saving targets:', err);
      setError(err.response?.data?.message || 'An error occurred while saving assignments.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Loading targeting parameters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button and title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <Link 
            to={`/dashboard/campaigns/${id}`} 
            className="p-2 border border-slate-200 rounded-lg bg-white text-slate-500 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaign Targeting</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Assign campaign <span className="font-semibold text-slate-800">"{campaign?.campaignName}"</span> to smartboard nodes
            </p>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
          ) : (
            <Save className="w-4 h-4 mr-1.5" />
          )}
          <span>Save Targeting</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md flex items-start space-x-3 max-w-4xl mx-auto">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-md flex items-start space-x-3 max-w-4xl mx-auto">
          <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <p className="text-sm text-emerald-700 font-medium">{success}</p>
        </div>
      )}

      {/* Main Filter and Targeting Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        
        {/* Left column - Filter Panel (1/4 width) */}
        <div className="space-y-6">
          
          {/* Campaign Schedule Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center border-b border-slate-100 pb-2">
              <Calendar className="w-4 h-4 mr-1.5 text-blue-600" />
              <span>Campaign Schedule</span>
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs transition-colors bg-slate-50/50"
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs transition-colors bg-slate-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs transition-colors bg-slate-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs transition-colors bg-slate-50/50"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
            
            {/* Real-time statistics counters */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Targeting Statistics</h3>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Selected</p>
                  <p className="text-2xl font-extrabold text-blue-600 mt-1">{selectedBoards.length}</p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-center">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase">Matching</p>
                  <p className="text-2xl font-extrabold text-slate-800 mt-1">{filteredBoards.length}</p>
                </div>
              </div>
            </div>

            {/* Region Filters */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center mb-3">
                <MapPin className="w-4 h-4 mr-1.5 text-slate-400" />
                <span>Target Regions</span>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {regionsList.map((region) => {
                  const isChecked = selectedRegions.includes(region);
                  return (
                    <label key={region} className="flex items-center space-x-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleRegionToggle(region)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>{region}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Type Filters */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center mb-3">
                <Tag className="w-4 h-4 mr-1.5 text-slate-400" />
                <span>Board Types</span>
              </h3>
              <div className="space-y-2">
                {typesList.map((typeVal) => {
                  const isChecked = selectedTypes.includes(typeVal);
                  return (
                    <label key={typeVal} className="flex items-center space-x-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleTypeToggle(typeVal)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span>{typeVal}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Reset Filters action */}
            {(selectedRegions.length > 0 || selectedTypes.length > 0) && (
              <button
                onClick={() => {
                  setSelectedRegions([]);
                  setSelectedTypes([]);
                }}
                className="w-full py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
              >
                Reset Filters
              </button>
            )}

          </div>
        </div>

        {/* Right column - Board Selection Grid (3/4 width) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Header toolbar for listing */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <input
              type="text"
              placeholder="Search boards within filtered list..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full sm:max-w-xs px-3.5 py-2 border border-slate-300 rounded-lg text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs transition-colors bg-slate-50/50"
            />

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleSelectAllFiltered}
                disabled={filteredBoards.length === 0}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Select All Matching
              </button>
              <button
                onClick={handleDeselectAllFiltered}
                disabled={filteredBoards.length === 0}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40"
              >
                Clear Matching
              </button>
            </div>
          </div>

          {/* List of Smartboards */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            {filteredBoards.length === 0 ? (
              <div className="text-center py-20 text-slate-400 text-sm">
                <p className="font-semibold">No smartboards match your filter settings</p>
                <p className="text-xs text-slate-400 mt-1">Try resetting the region or type filters on the left panel.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[460px] overflow-y-auto">
                {filteredBoards.map((board) => {
                  const isSelected = selectedBoards.includes(board._id);
                  return (
                    <div 
                      key={board._id}
                      onClick={() => handleBoardSelectToggle(board._id)}
                      className={`p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors select-none ${
                        isSelected ? 'bg-blue-50/10' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3.5 min-w-0">
                        {/* Select checkbox */}
                        <div className="shrink-0 text-blue-600">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 stroke-[2.2]" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 stroke-[1.8]" />
                          )}
                        </div>

                        {/* Smartboard Details */}
                        <div className="shrink-0 p-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-400">
                          <Monitor className="w-5 h-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800">{board.boardName}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-wider">
                            ID: {board.boardId} • {board.boardType}
                          </p>
                        </div>
                      </div>

                      {/* Location details */}
                      <div className="text-right shrink-0">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 uppercase tracking-wide">
                          {board.region}
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]">{board.location}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default CampaignTargeting;
