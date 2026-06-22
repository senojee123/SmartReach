import Board from '../models/Board.js';
import Campaign from '../models/Campaign.js';
import CampaignAsset from '../models/CampaignAsset.js';
import CampaignTarget from '../models/CampaignTarget.js';
import PlaybackLog from '../models/PlaybackLog.js';
import BoardHealthLog from '../models/BoardHealthLog.js';
import Alert from '../models/Alert.js';
import { getActiveContentForBoard } from '../services/priorityEngine.js';
import * as auditService from '../services/auditService.js';

// @desc    Get playlist loop for a specific demo board without authentication
// @route   GET /api/demo/playlist/:boardId
// @access  Public
export const getPlaylist = async (req, res) => {
  const { boardId } = req.params;
  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: `Board ${boardId} not found.` });
    }

    const playlist = await getActiveContentForBoard(boardId);

    // Automatically log 'Alert Delivered' if any priority >= 80 alert is in the playlist
    const activeAlerts = playlist.filter(item => item.priority >= 80 && item.assetType === 'Alert');
    for (const alert of activeAlerts) {
      await auditService.logEvent('Alert Delivered', {
        user: 'Device ' + (board.boardId || board._id),
        boardId: board._id,
        alertId: alert.id,
        details: { severity: alert.severity, priority: alert.priority }
      });
    }

    res.json({
      boardId: board._id,
      boardName: board.boardName,
      boardType: board.boardType,
      region: board.region,
      playlist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Receive telemetry and heartbeat from a demo board without authentication
// @route   POST /api/demo/heartbeat/:boardId
// @access  Public
export const sendHeartbeat = async (req, res) => {
  const { boardId } = req.params;
  const { cpuUsage, memoryUsage, storageUsage, syncStatus, uptime } = req.body;

  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: `Board ${boardId} not found.` });
    }

    board.lastSeen = new Date();
    
    board.cpuUsage = cpuUsage !== undefined ? Number(cpuUsage) : board.cpuUsage;
    board.memoryUsage = memoryUsage !== undefined ? Number(memoryUsage) : board.memoryUsage;
    board.storageUsage = storageUsage !== undefined ? Number(storageUsage) : board.storageUsage;
    board.syncStatus = syncStatus !== undefined ? syncStatus : board.syncStatus;
    board.uptime = uptime !== undefined ? Number(uptime) : board.uptime;

    await board.save();

    await BoardHealthLog.create({
      boardId: board._id,
      cpuUsage: cpuUsage !== undefined ? Number(cpuUsage) : 0,
      memoryUsage: memoryUsage !== undefined ? Number(memoryUsage) : 0,
      storageUsage: storageUsage !== undefined ? Number(storageUsage) : 0,
      syncStatus: syncStatus || 'Synced',
      timestamp: new Date()
    });

    res.json({ status: 'OK', message: 'Heartbeat and telemetry processed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log playback for a demo board without authentication
// @route   POST /api/demo/log/:boardId
// @access  Public
export const logPlayback = async (req, res) => {
  const { boardId } = req.params;
  const { campaignId, assetId, duration } = req.body;

  if (!campaignId || !assetId || duration === undefined) {
    return res.status(400).json({ message: 'Missing parameters for playback log.' });
  }

  try {
    const board = await Board.findById(boardId);
    if (!board) {
      return res.status(404).json({ message: `Board ${boardId} not found.` });
    }

    // Playback verification
    const target = await CampaignTarget.findOne({ campaignId, boardId: board._id });
    const assetRelation = await CampaignAsset.findOne({ campaignId, assetId });
    const verified = !!(target && assetRelation);

    const log = await PlaybackLog.create({
      boardId: board._id,
      campaignId,
      assetId,
      duration,
      playedAt: new Date(),
      verified
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Trigger Colombo Flood Warning alert (Priority 100, 60 seconds duration)
// @route   POST /api/demo/trigger
// @access  Public
export const triggerFloodWarning = async (req, res) => {
  try {
    const alertId = 'ALT-DEMO-FLOOD';

    // Delete any existing demo flood warning to prevent duplicate entries
    const existing = await Alert.findOne({ alertId });
    if (existing) {
      await existing.deleteOne();
    }

    const alertItem = await Alert.create({
      alertId,
      title: 'Colombo Flood Warning',
      message: 'CRITICAL WARNING: Heavy thunderstorms are causing severe flash floods across the Colombo region. Avoid low-lying areas. Stay indoors and seek higher ground immediately.',
      severity: 'Critical',
      priority: 100,
      targetBoards: [],
      targetRegions: ['Colombo'],
      targetGroups: [],
      createdBy: 'demo-system',
      approvedBy: 'demo-system',
      isApproved: true,
      startTime: new Date(),
      expiryTime: new Date(Date.now() + 99 * 365 * 24 * 60 * 60 * 1000), // Active for 99 years (indefinite until manual cancel)
      status: 'Active'
    });

    // Write audit logs
    await auditService.logEvent('Alert Created', {
      user: 'demo-system',
      alertId: alertItem._id,
      details: { severity: alertItem.severity, priority: alertItem.priority }
    });

    await auditService.logEvent('Alert Approved', {
      user: 'demo-system',
      alertId: alertItem._id,
      details: { approvedBy: 'demo-system' }
    });

    res.status(201).json(alertItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel Colombo Flood Warning alert manually
// @route   POST /api/demo/cancel
// @access  Public
export const cancelFloodWarning = async (req, res) => {
  try {
    const alertId = 'ALT-DEMO-FLOOD';
    const alertItem = await Alert.findOne({ alertId });
    if (!alertItem) {
      return res.status(404).json({ message: 'No active demo alert found to cancel.' });
    }

    // Log cancellation/expiration
    await auditService.logEvent('Alert Expired', {
      user: 'demo-system',
      alertId: alertItem._id,
      details: { reason: 'Manually canceled by demo admin' }
    });

    await alertItem.deleteOne();
    res.json({ status: 'OK', message: 'Demo alert canceled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get real-time monitoring stats for demo dashboard
// @route   GET /api/demo/stats
// @access  Public
export const getDemoStats = async (req, res) => {
  try {
    const { boardIds } = req.query;
    let query = {};
    if (boardIds) {
      const queryIds = boardIds.split(',').filter(id => id.trim() !== '');
      query = { _id: { $in: queryIds } };
    }

    const boards = await Board.find(query);
    const demoBoardIds = boards.map(b => b._id);
    
    const totalBoards = boards.length;
    const onlineBoards = boards.filter(b => b.status === 'Active').length;

    // Dynamically calculate active campaigns targeting the demo boards
    const campaignTargets = await CampaignTarget.find({ boardId: { $in: demoBoardIds } });
    const campaignIds = campaignTargets.map(ct => ct.campaignId);
    const activeCampaigns = await Campaign.countDocuments({
      _id: { $in: campaignIds },
      status: 'Active'
    });

    // Count currently active alerts targeting our demo regions (Colombo, Kandy, Galle)
    const allAlerts = await Alert.find({ isApproved: true });
    const now = new Date();
    const activeAlerts = allAlerts.filter(a => {
      const start = new Date(a.startTime);
      const end = new Date(a.expiryTime);
      return start <= now && end >= now && a.status !== 'Expired';
    });
    
    const activeAlertsCount = activeAlerts.length;
    const currentDeliveries = onlineBoards;

    res.json({
      totalBoards,
      onlineBoards,
      activeCampaigns,
      activeAlerts: activeAlertsCount,
      currentDeliveries,
      boards
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all system boards for dropdown selection
// @route   GET /api/demo/boards
// @access  Public
export const getAllBoards = async (req, res) => {
  try {
    const boards = await Board.find({});
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
