import Board from '../models/Board.js';
import Alert from '../models/Alert.js';

// Map client board channel string to backend Board type category
const mapChannelToBoardType = (channel) => {
  switch (channel) {
    case 'sports': return 'Sports';
    case 'festival': return 'Religious & Cultural';
    case 'ads': return 'Entertainment';
    case 'alerts': return 'Public Information';
    default: return 'Sports';
  }
};

// Map backend Board type category to client board channel string
const mapBoardTypeToChannel = (boardType) => {
  switch (boardType) {
    case 'Sports': return 'sports';
    case 'Religious & Cultural': return 'festival';
    case 'Entertainment': return 'ads';
    case 'Public Information': return 'alerts';
    default: return 'sports';
  }
};

// @desc    Register a new device (represented as a Smartboard node)
// @route   POST /api/devices/register
export const registerDevice = async (req, res) => {
  try {
    const { deviceId, deviceName, location, assignedBoard, ipAddress } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required' });
    }

    let board = await Board.findOne({ deviceId });

    if (board) {
      // Update status of existing assigned smartboard
      board.onlineStatus = true; // backward-compatible alias if queried
      board.status = 'Active';
      board.lastSeen = new Date();
      if (ipAddress) board.ipAddress = ipAddress;
      await board.save();
    } else {
      // Auto-create a smartboard associated with this device ID
      const boardId = `SRB-${deviceId.toUpperCase()}`;
      board = await Board.create({
        boardId,
        boardName: deviceName || `Board ${deviceId}`,
        location: location || 'Unknown',
        region: 'Unknown',
        boardType: assignedBoard ? mapChannelToBoardType(assignedBoard) : 'Sports',
        status: 'Active',
        deviceId: deviceId,
        ipAddress: ipAddress || '',
        lastSeen: new Date()
      });
    }

    res.status(200).json({
      _id: board._id,
      deviceId: board.deviceId,
      deviceName: board.boardName,
      location: board.location,
      onlineStatus: board.status === 'Active',
      lastSeen: board.lastSeen,
      assignedBoard: mapBoardTypeToChannel(board.boardType),
      ipAddress: board.ipAddress,
      createdAt: board.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all devices (returns all boards with assigned deviceId)
// @route   GET /api/devices
export const getDevices = async (req, res) => {
  try {
    const boards = await Board.find({});
    const now = new Date();
    const devices = [];

    for (let board of boards) {
      // Only include boards that have a device ID associated
      if (!board.deviceId) continue;

      const lastSeenTime = new Date(board.lastSeen).getTime();
      const timeDiff = (now.getTime() - lastSeenTime) / 1000;

      // Automatically mark offline if heartbeat is missing for > 60 seconds
      if (timeDiff > 60 && board.status === 'Active') {
        board.status = 'Offline';
        await board.save();
      }

      devices.push({
        _id: board._id,
        deviceId: board.deviceId,
        deviceName: board.boardName,
        location: board.location,
        onlineStatus: board.status === 'Active',
        lastSeen: board.lastSeen,
        assignedBoard: mapBoardTypeToChannel(board.boardType),
        ipAddress: board.ipAddress,
        createdAt: board.createdAt
      });
    }

    res.status(200).json(devices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single device
// @route   GET /api/devices/:deviceId
export const getDeviceById = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const board = await Board.findOne({ deviceId });

    if (!board) {
      return res.status(404).json({ message: 'Device not found' });
    }

    res.status(200).json({
      _id: board._id,
      deviceId: board.deviceId,
      deviceName: board.boardName,
      location: board.location,
      onlineStatus: board.status === 'Active',
      lastSeen: board.lastSeen,
      assignedBoard: mapBoardTypeToChannel(board.boardType),
      ipAddress: board.ipAddress,
      createdAt: board.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update device heartbeat
// @route   POST /api/devices/heartbeat
export const heartbeatDevice = async (req, res) => {
  try {
    const deviceId = req.body.deviceId || req.query.deviceId;

    if (!deviceId) {
      return res.status(400).json({ message: 'Device ID is required' });
    }

    const board = await Board.findOne({ deviceId });

    if (!board) {
      return res.status(404).json({ message: 'Device/Smartboard not found' });
    }

    board.status = 'Active';
    board.lastSeen = new Date();
    await board.save();

    res.status(200).json({ status: 'OK', message: 'Heartbeat registered' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update device configuration via Board model
// @route   PUT /api/devices/:deviceId
export const updateDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { deviceName, location, assignedBoard, ipAddress, onlineStatus } = req.body;

    const board = await Board.findOne({ deviceId });

    if (!board) {
      return res.status(404).json({ message: 'Device/Smartboard not found' });
    }

    if (deviceName !== undefined) board.boardName = deviceName;
    if (location !== undefined) board.location = location;
    if (assignedBoard !== undefined) board.boardType = mapChannelToBoardType(assignedBoard);
    if (ipAddress !== undefined) board.ipAddress = ipAddress;
    if (onlineStatus !== undefined) board.status = onlineStatus ? 'Active' : 'Offline';

    board.lastSeen = new Date();
    await board.save();

    res.status(200).json({
      _id: board._id,
      deviceId: board.deviceId,
      deviceName: board.boardName,
      location: board.location,
      onlineStatus: board.status === 'Active',
      lastSeen: board.lastSeen,
      assignedBoard: mapBoardTypeToChannel(board.boardType),
      ipAddress: board.ipAddress,
      createdAt: board.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete/Unlink device hardware
// @route   DELETE /api/devices/:deviceId
export const deleteDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const board = await Board.findOne({ deviceId });

    if (!board) {
      return res.status(404).json({ message: 'Device/Smartboard not found' });
    }

    // Set deviceId to null to unlink it from the smartboard
    board.deviceId = null;
    board.ipAddress = '';
    board.status = 'Offline';
    await board.save();

    res.status(200).json({ message: 'Device unlinked from smartboard successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get device display configuration mapping
// @route   GET /api/devices/:deviceId/config
export const getDeviceConfig = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const board = await Board.findOne({ deviceId });

    // Fetch active approved alerts
    const alerts = await Alert.find({ isApproved: true });
    const now = new Date();
    
    // Find any alert currently active (between startTime and expiryTime)
    const activeAlert = alerts.find(a => {
      const start = new Date(a.startTime);
      const expiry = new Date(a.expiryTime);
      return start <= now && expiry >= now && a.status !== 'Expired';
    });

    if (!board) {
      return res.status(200).json({
        board: 'sports',
        refreshInterval: 10,
        activeAlert: activeAlert ? {
          id: activeAlert._id,
          title: activeAlert.title,
          message: activeAlert.message
        } : null
      });
    }

    // Update heartbeat of corresponding smartboard on config request
    board.status = 'Active';
    board.lastSeen = new Date();
    await board.save();

    res.status(200).json({
      board: mapBoardTypeToChannel(board.boardType),
      refreshInterval: 10,
      activeAlert: activeAlert ? {
        id: activeAlert._id,
        title: activeAlert.title,
        message: activeAlert.message
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
