import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Loader2, RefreshCw } from 'lucide-react';
import BoardRouteWrapper from './BoardRouteWrapper';
import Player from './Player';

const DeviceDisplay = () => {
  const { deviceId } = useParams();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!deviceId) return;

    const registerAndInitialize = async () => {
      try {
        // Register this Pi with the central backend on boot/load
        await axios.post('/api/devices/register', {
          deviceId,
          ipAddress: window.location.hostname || 'localhost'
        });
      } catch (err) {
        console.warn('Device automatic registration failed on mount, will retry:', err);
      }
    };

    const fetchConfig = async () => {
      try {
        const { data } = await axios.get(`/api/devices/${deviceId}/config`);
        setConfig(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching device configuration:', err);
        setError('Connection lost. Attempting to reconnect to central server...');
      } finally {
        setLoading(false);
      }
    };

    const sendHeartbeat = async () => {
      try {
        await axios.post('/api/devices/heartbeat', { deviceId });
      } catch (err) {
        console.warn('Heartbeat check-in failed:', err);
      }
    };

    // Execute initial registration, config fetch and heartbeat
    registerAndInitialize().then(() => {
      fetchConfig();
      sendHeartbeat();
    });

    // 10 second configuration polling for automatic board updates
    const configInterval = setInterval(fetchConfig, 10000);

    // 30 second heartbeat polling to maintain status
    const heartbeatInterval = setInterval(sendHeartbeat, 30000);

    return () => {
      clearInterval(configInterval);
      clearInterval(heartbeatInterval);
    };
  }, [deviceId]);

  if (loading && !config) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center space-y-4 font-sans">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold tracking-wider">Loading device configuration...</p>
      </div>
    );
  }

  // Error overlay if connection is lost, without crashing the layout
  const errorBanner = error && (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-600/90 backdrop-blur border border-rose-500 text-white px-4 py-2.5 rounded-full flex items-center space-x-2 text-xs font-semibold shadow-2xl animate-pulse">
      <RefreshCw className="w-4 h-4 animate-spin" />
      <span>{error}</span>
    </div>
  );

  // Decide what board component to mount
  let boardType = 'Sports'; // Default fallback
  let isAlertOverride = false;

  if (config) {
    if (config.activeAlert) {
      boardType = 'Public Information';
      isAlertOverride = true;
    } else {
      switch (config.board) {
        case 'sports':
          boardType = 'Sports';
          break;
        case 'festival':
          boardType = 'Religious & Cultural';
          break;
        case 'ads':
          boardType = 'Entertainment';
          break;
        case 'alerts':
          boardType = 'Public Information';
          break;
        default:
          boardType = 'Sports';
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-black w-full h-full overflow-hidden">
      {errorBanner}
      {isAlertOverride && (
        <div className="absolute top-4 left-4 z-40 bg-red-600/95 text-white px-3 py-1 rounded text-[10px] font-extrabold uppercase tracking-widest animate-pulse border border-red-500 shadow-lg">
          ⚠️ EMERGENCY OVERRIDE ACTIVE
        </div>
      )}
      {config && config.boardId && !isAlertOverride ? (
        <Player boardIdProp={config.boardId} />
      ) : (
        <BoardRouteWrapper boardType={boardType} />
      )}
    </div>
  );
};

export default DeviceDisplay;
