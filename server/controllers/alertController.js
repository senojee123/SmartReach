import Alert from '../models/Alert.js';
import AuditLog from '../models/AuditLog.js';
import * as auditService from '../services/auditService.js';

// @desc    Get all override alerts
// @route   GET /api/alerts
// @access  Private
export const getAlertList = async (req, res) => {
  try {
    const list = await Alert.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new override alert
// @route   POST /api/alerts
// @access  Private
export const createAlert = async (req, res) => {
  const { title, message, severity, priority, targetBoards, targetRegions, targetGroups, startTime, expiryTime } = req.body;

  if (!title || !message || !startTime || !expiryTime) {
    return res.status(400).json({ message: 'Missing title, message, or timings for alert.' });
  }

  try {
    const createdByEmail = req.user?.email || 'admin@smartreach.com';

    // Generate unique alertId
    const alertId = 'ALT-' + Math.floor(100000 + Math.random() * 900000);

    const alertItem = await Alert.create({
      alertId,
      title,
      message,
      severity: severity || 'Info',
      priority: priority !== undefined ? Number(priority) : 100,
      targetBoards: targetBoards || [],
      targetRegions: targetRegions || [],
      targetGroups: targetGroups || [],
      createdBy: createdByEmail,
      isApproved: false,
      status: 'Pending',
      startTime,
      expiryTime
    });

    // Write audit log
    await auditService.logEvent('Alert Created', {
      user: createdByEmail,
      alertId: alertItem._id,
      details: { severity: alertItem.severity, priority: alertItem.priority }
    });

    res.status(201).json(alertItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve an override alert
// @route   POST /api/alerts/:id/approve
// @access  Private
export const approveAlert = async (req, res) => {
  const { id } = req.params;

  try {
    const alertItem = await Alert.findById(id);
    if (!alertItem) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    const approvedByEmail = req.user?.email || 'admin@smartreach.com';

    alertItem.isApproved = true;
    alertItem.approvedBy = approvedByEmail;
    alertItem.status = 'Approved';
    
    // If start time is already in the past, mark active immediately
    const now = new Date();
    if (new Date(alertItem.startTime) <= now && new Date(alertItem.expiryTime) > now) {
      alertItem.status = 'Active';
    }

    await alertItem.save();

    // Write audit log
    await auditService.logEvent('Alert Approved', {
      user: approvedByEmail,
      alertId: alertItem._id,
      details: { approvedBy: approvedByEmail }
    });

    res.json(alertItem);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel or delete an override alert
// @route   DELETE /api/alerts/:id
// @access  Private
export const deleteAlert = async (req, res) => {
  const { id } = req.params;

  try {
    const alertItem = await Alert.findById(id);
    if (!alertItem) {
      return res.status(404).json({ message: 'Alert not found.' });
    }

    const email = req.user?.email || 'admin@smartreach.com';

    // Log the cancellation before deleting
    await auditService.logEvent('Alert Expired', {
      user: email,
      alertId: alertItem._id,
      details: { reason: 'Manually deleted/canceled by admin' }
    });

    await alertItem.deleteOne();
    res.json({ message: 'Alert canceled and removed successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all audit log history
// @route   GET /api/alerts/audit
// @access  Private
export const getAuditHistory = async (req, res) => {
  try {
    const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
