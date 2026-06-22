import DeviceActivation from '../models/DeviceActivation.js';
import CampaignTarget from '../models/CampaignTarget.js';
import Campaign from '../models/Campaign.js';
import CampaignAsset from '../models/CampaignAsset.js';
import PlaybackLog from '../models/PlaybackLog.js';
import Board from '../models/Board.js';
import BoardHealthLog from '../models/BoardHealthLog.js';
import jwt from 'jsonwebtoken';
import { getActiveContentForBoard } from '../services/priorityEngine.js';
import * as auditService from '../services/auditService.js';

// Helper to generate 6-character random activation code
const generateRandomCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// @desc    Generate a TV activation code for smartboard players
// @route   GET /api/player/activate-code
// @access  Public
export const generateActivationCode = async (req, res) => {
  try {
    let code = generateRandomCode();
    // Ensure uniqueness
    let exists = await DeviceActivation.findOne({ code });
    while (exists) {
      code = generateRandomCode();
      exists = await DeviceActivation.findOne({ code });
    }

    const activation = await DeviceActivation.create({ code });
    res.json({ code: activation.code });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Poll status of activation code
// @route   GET /api/player/check-activation
// @access  Public
export const checkActivation = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'Please provide activation code' });
  }

  try {
    const activation = await DeviceActivation.findOne({ code, isActivated: true });

    if (activation) {
      res.json({
        isActivated: true,
        deviceToken: activation.deviceToken,
        boardId: activation.boardId
      });
      
      // Clean up activation record after successful collection
      await activation.deleteOne();
    } else {
      res.json({ isActivated: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get playlist loop for smartboard device
// @route   GET /api/player/playlist
// @access  Private (Device Token Required)
export const getPlaylist = async (req, res) => {
  try {
    const boardId = req.board._id;

    // Call the Priority Override Engine to resolve active playlist
    const playlist = await getActiveContentForBoard(boardId);

    // If there are active alerts in the playlist, log 'Alert Delivered'
    const activeAlerts = playlist.filter(item => item.priority >= 80 && item.assetType === 'Alert');
    for (const alert of activeAlerts) {
      await auditService.logEvent('Alert Delivered', {
        user: 'Device ' + (req.board.boardId || req.board._id),
        boardId: boardId,
        alertId: alert.id,
        details: { severity: alert.severity, priority: alert.priority }
      });
    }

    res.json({
      boardId: req.board._id,
      boardName: req.board.boardName,
      playlist
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Receive device heartbeat ping
// @route   POST /api/player/heartbeat
// @access  Private (Device Token Required)
export const sendHeartbeat = async (req, res) => {
  const { cpuUsage, memoryUsage, storageUsage, syncStatus, uptime } = req.body;

  try {
    const board = req.board;
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

// @desc    Record completed asset play log
// @route   POST /api/player/log
// @access  Private (Device Token Required)
export const logPlayback = async (req, res) => {
  const { campaignId, assetId, duration } = req.body;

  if (!campaignId || !assetId || duration === undefined) {
    return res.status(400).json({ message: 'Missing parameters for playback log' });
  }

  try {
    // Proof-of-play verification checks
    const target = await CampaignTarget.findOne({ campaignId, boardId: req.board._id });
    const assetRelation = await CampaignAsset.findOne({ campaignId, assetId });
    const verified = !!(target && assetRelation);

    const log = await PlaybackLog.create({
      boardId: req.board._id,
      campaignId,
      assetId,
      duration,
      verified,
      playedAt: new Date()
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Receive audit event log from smartboard player client
// @route   POST /api/player/audit
// @access  Public
export const logPlayerAuditEvent = async (req, res) => {
  const { boardId, alertId, action, details } = req.body;

  if (!boardId || !action) {
    return res.status(400).json({ message: 'Missing boardId or action for player audit log.' });
  }

  try {
    const actor = 'Device ' + boardId;
    const log = await auditService.logEvent(action, {
      user: actor,
      boardId,
      alertId: alertId || null,
      details: details || {}
    });

    res.status(201).json({ status: 'OK', log });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
