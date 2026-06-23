import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Player from './Player';
import { Loader2, Tv, AlertCircle } from 'lucide-react';

const ScreenWrapper = ({ typeName, nameKeywords, displayName }) => {
  const [boardId, setBoardId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [allBoards, setAllBoards] = useState([]);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setLoading(true);
        setError('');
        const { data } = await axios.get('/api/demo/boards');
        setAllBoards(data || []);

        // Attempt to find the board matching by type or keyword name
        let matchedBoard = data.find(b => 
          b.boardType && b.boardType.toLowerCase() === typeName.toLowerCase()
        );

        if (!matchedBoard) {
          // Try matching by name keywords
          matchedBoard = data.find(b => 
            b.boardName && nameKeywords.some(kw => b.boardName.toLowerCase().includes(kw.toLowerCase()))
          );
        }

        if (matchedBoard) {
          setBoardId(matchedBoard._id);
        } else {
          // If no matching board, find the first board that is not yet selected by default,
          // or ask the user to configure
          if (data.length > 0) {
            setError(`Could not find a board matching type "${typeName}" or name keywords. Please select one below.`);
          } else {
            setError('No smartboards found in the system database. Please create or seed boards first.');
          }
        }
      } catch (err) {
        console.error('Error fetching boards for wrapper:', err);
        setError('Failed to query smartboard network configurations.');
      } finally {
        setLoading(false);
      }
    };

    fetchBoards();
  }, [typeName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-400 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold tracking-wide uppercase">Resolving {displayName} display parameters...</p>
      </div>
    );
  }

  if (error || !boardId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full text-center space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="flex justify-center text-amber-500">
            <AlertCircle className="w-16 h-16 stroke-[1.8]" />
          </div>
          
          <div className="space-y-2.5">
            <h2 className="text-xl font-bold tracking-tight text-slate-100">{displayName} Configuration</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {error || 'No board selected.'}
            </p>
          </div>

          {allBoards.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-widest font-bold text-slate-400 block text-left">
                Select a Smartboard Screen
              </label>
              <select
                value={boardId || ''}
                onChange={(e) => {
                  setBoardId(e.target.value);
                  setError('');
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="">Select a Smartboard...</option>
                {allBoards.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.boardName} ({b.boardType} • {b.region})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="text-xs text-slate-500 border-t border-slate-800/60 pt-5 text-left leading-relaxed">
            Please make sure that the database seeds are fully loaded or that a smartboard of type <strong>{typeName}</strong> exists.
          </div>
        </div>
      </div>
    );
  }

  return <Player boardIdProp={boardId} />;
};

export const SportsPlayer = () => (
  <ScreenWrapper 
    typeName="Sports" 
    nameKeywords={['sports', 'arena', 'stadium', 'court']} 
    displayName="Sports Screen" 
  />
);

export const FestivalPlayer = () => (
  <ScreenWrapper 
    typeName="Religious & Cultural" 
    nameKeywords={['cultural', 'religious', 'festival', 'shrine']} 
    displayName="Festival Screen" 
  />
);

export const AdsPlayer = () => (
  <ScreenWrapper 
    typeName="Entertainment" 
    nameKeywords={['entertainment', 'ads', 'cinema', 'theater', 'marquis']} 
    displayName="Advertisement Screen" 
  />
);

export const AlertsPlayer = () => (
  <ScreenWrapper 
    typeName="Public Information" 
    nameKeywords={['public', 'info', 'information', 'alert', 'transit', 'hub', 'library']} 
    displayName="Emergency Alert Screen" 
  />
);
