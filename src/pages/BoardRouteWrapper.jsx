import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Player from './Player';
import { Loader2 } from 'lucide-react';

const BoardRouteWrapper = ({ boardType }) => {
  const [boardId, setBoardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBoard = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/demo/boards');
        const board = data.find(b => b.boardType === boardType);
        if (board) {
          setBoardId(board._id);
        } else {
          setError(`No board of type "${boardType}" found in the network.`);
        }
      } catch (err) {
        console.error('Error fetching boards:', err);
        setError('Failed to load board telemetry. Verify backend server is reachable.');
      } finally {
        setLoading(false);
      }
    };
    fetchBoard();
  }, [boardType]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-400 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Resolving display configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <p className="text-red-500 font-bold text-lg mb-2">Configuration Error</p>
        <p className="text-sm text-slate-400 max-w-md">{error}</p>
      </div>
    );
  }

  return <Player boardIdProp={boardId} />;
};

export default BoardRouteWrapper;
