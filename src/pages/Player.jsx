import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { 
  Tv, 
  Wifi, 
  WifiOff, 
  Loader2, 
  DownloadCloud, 
  AlertCircle 
} from 'lucide-react';

const CACHE_NAME = 'smartreach-media';

const Player = ({ boardIdProp }) => {
  const { boardId: routeBoardId } = useParams();
  const effectiveBoardId = boardIdProp || routeBoardId;

  // Authentication & Pairing state
  const [deviceToken, setDeviceToken] = useState(() => {
    if (effectiveBoardId) return `demo-token-${effectiveBoardId}`;
    return localStorage.getItem('deviceToken');
  });
  const [boardId, setBoardId] = useState(() => {
    if (effectiveBoardId) return effectiveBoardId;
    return localStorage.getItem('boardId') || '';
  });
  const [boardName, setBoardName] = useState(() => {
    return localStorage.getItem('boardName') || '';
  });
  const [boardType, setBoardType] = useState('');
  const [boardRegion, setBoardRegion] = useState('');
  const [activationCode, setActivationCode] = useState('');
  
  // Playback state
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAssetUrl, setCurrentAssetUrl] = useState('');
  const [activeAlert, setActiveAlert] = useState(null);
  const [alertCountdown, setAlertCountdown] = useState(0);
  
  // Status states
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(true);
  const [cacheStatus, setCacheStatus] = useState('');

  // Refs for tracking video and timers
  const videoRef = useRef(null);
  const playTimerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // 1. Monitor Browser Network Connectivity
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // 2. Pair / Activation Flow Loop
  useEffect(() => {
    let pollInterval;

    const requestActivationCode = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/player/activate-code');
        setActivationCode(data.code);
        
        // Start polling for activation approval
        pollInterval = setInterval(async () => {
          try {
            const res = await axios.get(`/api/player/check-activation?code=${data.code}`);
            if (res.data.isActivated) {
              clearInterval(pollInterval);
              localStorage.setItem('deviceToken', res.data.deviceToken);
              setDeviceToken(res.data.deviceToken);
              setActivationCode('');
            }
          } catch (err) {
            console.error('Polling activation error:', err);
          }
        }, 5000);
      } catch (err) {
        console.error('Error fetching activation code:', err);
        setTimeout(requestActivationCode, 10000); // Retry code request
      } finally {
        setLoading(false);
      }
    };

    if (!deviceToken) {
      requestActivationCode();
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [deviceToken]);

  // 3. Heartbeat Loop (Runs every 30 seconds once authenticated, 5s for demo)
  useEffect(() => {
    if (!deviceToken) return;

    const pingHeartbeat = async () => {
      const cpuUsage = Math.floor(15 + Math.random() * 30);
      const memoryUsage = Math.floor(40 + Math.random() * 25);
      const storageUsage = Math.floor(20 + Math.random() * 40);
      const syncStatus = 'Synced';
      const uptime = Math.round((Date.now() - startTimeRef.current) / 1000);

      try {
        if (effectiveBoardId) {
          await axios.post(`/api/demo/heartbeat/${effectiveBoardId}`, {
            cpuUsage,
            memoryUsage,
            storageUsage,
            syncStatus,
            uptime
          });
        } else {
          await axios.post('/api/player/heartbeat', {
            cpuUsage,
            memoryUsage,
            storageUsage,
            syncStatus,
            uptime
          }, {
            headers: { Authorization: `Bearer ${deviceToken}` }
          });
        }
        setIsOnline(true);
        if (!effectiveBoardId) {
          syncOfflineLogs();
        }
      } catch (err) {
        console.error('Heartbeat ping failed:', err);
        setIsOnline(false);
      }
    };

    pingHeartbeat();

    const interval = setInterval(pingHeartbeat, effectiveBoardId ? 5000 : 30000);
    return () => clearInterval(interval);
  }, [deviceToken, effectiveBoardId]);

  // 4. Playlist Synchronization & Caching
  const syncPlaylist = async () => {
    if (!deviceToken) return;

    try {
      setCacheStatus('Syncing playlist...');
      let data;
      if (effectiveBoardId) {
        const res = await axios.get(`/api/demo/playlist/${effectiveBoardId}`);
        data = res.data;
      } else {
        const res = await axios.get('/api/player/playlist', {
          headers: { Authorization: `Bearer ${deviceToken}` }
        });
        data = res.data;
      }

      setBoardId(data.boardId);
      if (!effectiveBoardId) localStorage.setItem('boardId', data.boardId);
      
      setBoardName(data.boardName);
      if (!effectiveBoardId) localStorage.setItem('boardName', data.boardName);

      if (data.boardType) setBoardType(data.boardType);
      if (data.region) setBoardRegion(data.region);

      if (data.playlist && data.playlist.length > 0) {
        setPlaylist(data.playlist);
        if (!effectiveBoardId) {
          localStorage.setItem('offlinePlaylist', JSON.stringify(data.playlist));
          await cacheMediaFiles(data.playlist);
        }
      } else {
        setPlaylist([]);
      }
    } catch (err) {
      console.error('Failed to sync playlist:', err);
      if (!effectiveBoardId) {
        const cached = localStorage.getItem('offlinePlaylist');
        if (cached) {
          setPlaylist(JSON.parse(cached));
          setCacheStatus('Offline Mode: Loaded cached playlist');
        } else {
          setCacheStatus('Offline Mode: No playlist cached');
        }
      } else {
        setCacheStatus('Sync failed');
      }
    } finally {
      setLoading(false);
    }
  };

  // Send player audit events
  const sendPlayerAuditEvent = async (action, alertId = null, details = {}) => {
    if (!boardId) return;
    try {
      await axios.post('/api/player/audit', {
        boardId: boardId,
        alertId: alertId,
        action: action,
        details: { ...details, boardName: boardName }
      });
    } catch (err) {
      console.error(`Failed to send player audit event (${action}):`, err);
    }
  };

  // Check for alert override and manage logging
  useEffect(() => {
    if (playlist.length === 0) return;

    const topItem = playlist[0];
    const isAlert = topItem && topItem.assetType === 'Alert';

    if (isAlert) {
      if (!activeAlert || activeAlert._id !== topItem._id) {
        setActiveAlert(topItem);
        sendPlayerAuditEvent('Alert Displayed', topItem._id || topItem.id);
      }
    } else {
      if (activeAlert) {
        sendPlayerAuditEvent('Alert Expired', activeAlert._id || activeAlert.id);
        sendPlayerAuditEvent('Playlist Resumed', null, { resumedIndex: currentIndex });
        setActiveAlert(null);
      }
    }
  }, [playlist]);

  // Countdown timer for active alert
  useEffect(() => {
    if (!activeAlert) return;

    const calculateRemaining = () => {
      const remainingMs = new Date(activeAlert.expiryTime).getTime() - Date.now();
      return Math.max(0, Math.floor(remainingMs / 1000));
    };

    setAlertCountdown(calculateRemaining());

    const timer = setInterval(() => {
      const rem = calculateRemaining();
      setAlertCountdown(rem);
      if (rem <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeAlert]);

  useEffect(() => {
    if (!deviceToken) return;
    syncPlaylist();

    const interval = setInterval(syncPlaylist, effectiveBoardId ? 5000 : 10000);
    return () => clearInterval(interval);
  }, [deviceToken, effectiveBoardId]);

  // 5. Caching Media Files locally in Browser Cache API
  const cacheMediaFiles = async (items) => {
    if (!('caches' in window)) return;
    setCacheStatus('Caching media files...');
    try {
      const cache = await caches.open(CACHE_NAME);
      let cachedCount = 0;
      for (const item of items) {
        const match = await cache.match(item.fileUrl);
        if (!match) {
          try {
            await cache.add(item.fileUrl);
            cachedCount++;
          } catch (e) {
            console.warn(`Failed to cache asset: ${item.fileUrl}`, e);
          }
        }
      }
      setCacheStatus(cachedCount > 0 ? `Cached ${cachedCount} new assets` : 'All assets cached');
      setTimeout(() => setCacheStatus(''), 3000);
    } catch (err) {
      console.error('Cache API error:', err);
      setCacheStatus('Caching failed');
    }
  };

  // 6. Playback Control Engine (Image timers & Video ends)
  const playNextAsset = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % playlist.length);
  };

  // Resolve asset URL (Local blob URL if cached, or direct fileUrl)
  const resolveAssetSource = async (asset) => {
    if (!asset) return;
    if ('caches' in window) {
      try {
        const cache = await caches.open(CACHE_NAME);
        const match = await cache.match(asset.fileUrl);
        if (match) {
          const blob = await match.blob();
          const blobUrl = URL.createObjectURL(blob);
          setCurrentAssetUrl(blobUrl);
          return;
        }
      } catch (err) {
        console.error('Error resolving cache blob:', err);
      }
    }
    // Fallback to direct URL
    setCurrentAssetUrl(asset.fileUrl);
  };

  // Log completed playback
  const recordPlayLog = async (asset) => {
    const logData = {
      campaignId: asset.campaignId,
      assetId: asset.assetId,
      duration: asset.duration,
      playedAt: new Date().toISOString()
    };

    if (navigator.onLine && deviceToken) {
      try {
        if (effectiveBoardId) {
          await axios.post(`/api/demo/log/${effectiveBoardId}`, logData);
        } else {
          await axios.post('/api/player/log', logData, {
            headers: { Authorization: `Bearer ${deviceToken}` }
          });
        }
      } catch (err) {
        console.error('Failed to send play log:', err);
        if (!effectiveBoardId) cacheLogLocally(logData);
      }
    } else {
      if (!effectiveBoardId) cacheLogLocally(logData);
    }
  };

  const cacheLogLocally = (log) => {
    const logs = JSON.parse(localStorage.getItem('offlineLogs') || '[]');
    logs.push(log);
    localStorage.setItem('offlineLogs', JSON.stringify(logs));
  };

  const syncOfflineLogs = async () => {
    const logs = JSON.parse(localStorage.getItem('offlineLogs') || '[]');
    if (logs.length === 0 || !deviceToken) return;

    try {
      // Send play logs sequentially
      for (const log of logs) {
        await axios.post('/api/player/log', log, {
          headers: { Authorization: `Bearer ${deviceToken}` }
        });
      }
      localStorage.removeItem('offlineLogs');
      console.log(`Synced ${logs.length} offline play logs.`);
    } catch (err) {
      console.error('Error syncing offline logs:', err);
    }
  };

  // Playback listener triggers
  useEffect(() => {
    if (playlist.length === 0) return;
    
    // If there is an active alert override, suspend standard playback loop advancing
    if (activeAlert) {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
      return;
    }
    
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    
    const activeAsset = playlist[currentIndex];
    resolveAssetSource(activeAsset);

    // Setup duration timers for images and text slides. Videos are handled by HTML5 onEnded event listeners
    if (activeAsset.assetType === 'Image' || activeAsset.assetType === 'Text') {
      playTimerRef.current = setTimeout(() => {
        recordPlayLog(activeAsset);
        playNextAsset();
      }, activeAsset.duration * 1000);
    } else {
      // Set safety timeout for videos in case of play freeze (e.g. video fails to load)
      playTimerRef.current = setTimeout(() => {
        console.warn('Video playback freeze fallback triggered');
        recordPlayLog(activeAsset);
        playNextAsset();
      }, (activeAsset.duration + 5) * 1000);
    }

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [playlist, currentIndex]);

  // Clean up object URLs to prevent memory leak
  useEffect(() => {
    return () => {
      if (currentAssetUrl && currentAssetUrl.startsWith('blob:')) {
        URL.revokeObjectURL(currentAssetUrl);
      }
    };
  }, [currentAssetUrl]);

  // Handle Video ends
  const handleVideoEnded = () => {
    if (playTimerRef.current) clearTimeout(playTimerRef.current);
    const activeAsset = playlist[currentIndex];
    recordPlayLog(activeAsset);
    playNextAsset();
  };

  // Render Section
  if (loading && !activationCode) {
    return (
      <div className="min-h-screen bg-black text-slate-400 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold tracking-wide">Initializing Terminal node...</p>
      </div>
    );
  }

  // Device Activation Code page
  if (activationCode) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 select-none font-sans">
        <div className="max-w-md w-full text-center space-y-8 bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
          <div className="flex justify-center text-blue-500">
            <Tv className="w-16 h-16 stroke-[1.8]" />
          </div>
          
          <div className="space-y-2.5">
            <h2 className="text-2xl font-bold tracking-tight text-slate-100">Activate Smartboard</h2>
            <p className="text-sm text-slate-400">
              Connect this player screen to your centralized SmartReach media dashboard.
            </p>
          </div>

          <div className="space-y-4">
            <div className="text-xs uppercase tracking-widest font-semibold text-blue-500">
              Pairing Activation Code
            </div>
            <div className="bg-slate-950 border border-slate-800 py-4.5 rounded-xl text-5xl font-extrabold tracking-[0.3em] pl-[0.3em] text-slate-100 select-all font-mono">
              {activationCode}
            </div>
          </div>

          <div className="text-xs text-slate-500 border-t border-slate-800/60 pt-5 space-y-1">
            <p>1. Go to "Live Monitoring" on your admin dashboard.</p>
            <p>2. Click "Activate Smartboard" and enter the code above.</p>
          </div>
        </div>
      </div>
    );
  }

  const currentAsset = playlist[currentIndex];

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden select-none font-sans flex items-center justify-center">
      {/* Network / Offline warning bar */}
      <div className="absolute top-4 right-4 z-50 flex items-center space-x-2 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs font-semibold">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-rose-500 animate-pulse" />
            <span className="text-rose-500">Offline Fallback</span>
          </>
        )}
      </div>

      {/* Cache Status bar */}
      {cacheStatus && (
        <div className="absolute bottom-4 left-4 z-50 flex items-center space-x-1.5 bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold text-slate-400">
          <DownloadCloud className="w-3.5 h-3.5" />
          <span>{cacheStatus}</span>
        </div>
      )}

      {/* Playback View Area */}
      {playlist.length === 0 ? (
        <div className="text-center space-y-3">
          <Tv className="w-12 h-12 text-slate-500 mx-auto" />
          <p className="text-slate-400 font-semibold tracking-wide">No active campaigns assigned to {boardName || 'this screen'}.</p>
          <p className="text-xs text-slate-600">Assign targeted campaigns to start content loop.</p>
        </div>
      ) : activeAlert ? (
        <div className={`w-full h-screen flex flex-col justify-between p-12 text-white transition-all select-none ${
          activeAlert.priority === 100 
            ? 'bg-gradient-to-b from-red-950 via-red-900 to-black border-8 border-red-600 animate-pulse-slow' 
            : activeAlert.priority === 90
            ? 'bg-gradient-to-b from-amber-950 via-amber-900 to-black border-8 border-amber-600'
            : 'bg-gradient-to-b from-blue-950 via-blue-900 to-black border-8 border-blue-600'
        }`}>
          {/* Top Banner */}
          <div className="flex justify-between items-center border-b border-white/25 pb-6">
            <div className="flex items-center space-x-4">
              <div className={`w-4.5 h-4.5 rounded-full animate-ping ${
                activeAlert.priority === 100 ? 'bg-red-500' : activeAlert.priority === 90 ? 'bg-amber-500' : 'bg-blue-500'
              }`} />
              <h1 className="text-3xl font-extrabold tracking-widest font-mono uppercase flex items-center">
                {activeAlert.priority === 100 
                  ? '⚠️ Emergency Alert Broadcast' 
                  : activeAlert.priority === 90
                  ? '⚡ Safety Instruction' 
                  : 'ℹ️ Operational Bulletin'}
              </h1>
            </div>
            <div className="bg-white/10 px-4.5 py-2 rounded-xl border border-white/10 text-xs font-bold tracking-widest font-mono">
              SEVERITY: {activeAlert.severity ? activeAlert.severity.toUpperCase() : 'INFO'}
            </div>
          </div>

          {/* Alert Message */}
          <div className="max-w-4xl space-y-6 my-auto">
            <h2 className="text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              {activeAlert.title}
            </h2>
            <p className="text-2xl text-slate-300 font-medium leading-relaxed font-sans whitespace-pre-line">
              {activeAlert.message}
            </p>
          </div>

          {/* Bottom info and countdown */}
          <div className="flex justify-between items-end border-t border-white/20 pt-6">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-extrabold font-mono">Active Smartboard Node</span>
              <p className="text-lg font-bold text-slate-200">{boardName || 'Terminal Node'}</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-2xl flex items-center space-x-4">
              <div className="text-right">
                {alertCountdown > 300 ? (
                  <>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold font-mono block">Status</span>
                    <span className="text-lg font-black font-mono tracking-wide text-red-500 animate-pulse block">
                      BROADCASTING
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold font-mono block">Expires In</span>
                    <span className="text-3xl font-black font-mono tracking-wide">
                      {alertCountdown}s
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : currentAsset ? (
        <div className="w-full h-screen flex items-center justify-center relative bg-black">
          {/* Top Demo Overlay Bar */}
          {effectiveBoardId && (
            <div className="absolute top-0 left-0 right-0 z-40 bg-black/60 backdrop-blur-md border-b border-white/10 px-6 py-3 flex justify-between items-center select-none font-sans text-xs">
              <div className="flex items-center space-x-3 text-left">
                <div className="flex items-center space-x-1.5 bg-blue-500/15 border border-blue-500/30 px-2 py-0.5 rounded text-blue-400 font-bold tracking-wider uppercase text-[9px]">
                  Demo Board
                </div>
                <span className="text-white font-extrabold text-sm tracking-wide">
                  {boardName}
                </span>
                <span className="text-slate-400 text-xs hidden sm:inline">
                  ({boardType} • {boardRegion})
                </span>
              </div>
              
              <div className="flex items-center space-x-4 text-slate-400">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-emerald-400 font-bold uppercase text-[9px] tracking-wider">Online</span>
                </span>
              </div>
            </div>
          )}

          {currentAsset.assetType === 'Text' ? (
            <div className="w-full h-full flex flex-col justify-center items-center p-12 text-center bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 border-8 border-indigo-500/20 select-none">
              <div className="max-w-4xl space-y-6 animate-fade-in px-4">
                {currentAsset.type && (
                  <span className="text-[10px] uppercase font-extrabold text-indigo-400 tracking-widest block bg-indigo-500/10 px-3 py-1.5 rounded-full w-max mx-auto border border-indigo-500/20">
                    {currentAsset.type}
                  </span>
                )}
                <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md font-sans">
                  {currentAsset.textContent || currentAsset.title}
                </h2>
              </div>
            </div>
          ) : currentAsset.assetType === 'Image' ? (
            <img 
              src={currentAssetUrl || currentAsset.fileUrl} 
              alt={currentAsset.assetName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <video 
              ref={videoRef}
              src={currentAssetUrl || currentAsset.fileUrl} 
              autoPlay 
              muted // Autoplay browser compliance
              onEnded={handleVideoEnded}
              className="w-full h-full object-cover"
            />
          )}

          {/* Bottom Demo Overlay Bar */}
          {effectiveBoardId && (
            <div className="absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/95 via-black/80 to-transparent px-6 py-6 flex justify-between items-end select-none font-sans">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest block">Active Campaign</span>
                <span className="text-base font-bold text-white tracking-wide">
                  {currentAsset.title ? currentAsset.title.split(' - ')[0] : 'Standard Loop'}
                </span>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <div className="text-right">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Playlist Rotation</span>
                  <span className="text-xs font-semibold text-slate-300">
                    Asset <span className="font-bold text-white text-sm font-mono">{currentIndex + 1}</span> of {playlist.length}
                  </span>
                </div>
                
                {/* Visual Step Dots */}
                <div className="flex space-x-1.5">
                  {playlist.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentIndex ? 'w-6 bg-blue-500' : 'w-1.5 bg-white/30'
                      }`} 
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Dynamic QR Code overlay for scanner engagement (only if not effectiveBoardId to keep demo screens clean, or show in small size) */}
          {boardId && !effectiveBoardId && (
            <div className="absolute bottom-6 right-6 z-40 bg-white/95 backdrop-blur border border-white/20 p-3.5 rounded-2xl flex items-center space-x-3 shadow-2xl max-w-xs text-slate-950 animate-fade-in">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(
                  `${window.location.origin}/engage?boardId=${boardId}&campaignId=${currentAsset.campaignId}&assetId=${currentAsset.assetId}`
                )}`} 
                alt="Scan to Interact" 
                className="w-20 h-20 bg-slate-50 p-1 border border-slate-100 rounded-lg shrink-0"
              />
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest block">Scan to Interact</span>
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                  Scan this QR code with your phone camera to submit feedback!
                </p>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Player;
