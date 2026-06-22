import Board from '../models/Board.js';
import DeviceActivation from '../models/DeviceActivation.js';
import jwt from 'jsonwebtoken';

// Helper to generate unique Board ID (e.g., SRB-1001)
const generateBoardId = async () => {
  try {
    const latestBoard = await Board.findOne({ boardId: /^SRB-\d+$/ }).sort({ createdAt: -1 });
    if (!latestBoard) {
      return 'SRB-1001';
    }
    const match = latestBoard.boardId.match(/SRB-(\d+)/);
    if (match) {
      const nextNum = parseInt(match[1], 10) + 1;
      return `SRB-${nextNum}`;
    }
    return `SRB-${Math.floor(1000 + Math.random() * 9000)}`;
  } catch (error) {
    console.error('Error generating board ID:', error);
    return `SRB-${Math.floor(1000 + Math.random() * 9000)}`;
  }
};

// @desc    Get all boards (with search, filter, paginate, sort)
// @route   GET /api/boards
// @access  Private
export const getBoards = async (req, res) => {
  try {
    const { search, boardType, status, sortBy, order, page = 1, limit = 10 } = req.query;




    // 1. Build Query Object
    const query = {};

    // Search filter (name or location match)
    if (search) {
      query.$or = [
        { boardName: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { region: { $regex: search, $options: 'i' } },
        { boardId: { $regex: search, $options: 'i' } }
      ];
    }

    // Exact status filter
    if (status) {
      query.status = status;
    }

    // Exact type filter
    if (boardType) {
      query.boardType = boardType;
    }

    // 2. Build Sort Object
    let sort = {};
    if (sortBy) {
      const sortOrder = order === 'desc' ? -1 : 1;
      sort[sortBy] = sortOrder;
    } else {
      // Default sort is descending by createdAt (newest first)
      sort.createdAt = -1;
    }

    // 3. Pagination Configuration
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    // Execute queries
    const count = await Board.countDocuments(query);
    const boards = await Board.find(query)
      .sort(sort)
      .skip(skipNum)
      .limit(limitNum);

    // Dynamic aggregates for dashboard (could be optimized/separated later)
    // We can also fetch overall metrics to send back or let the frontend calculate/fetch them.
    // Let's include total statistics inside this endpoint, or separate it. Let's return stats.
    const allBoardsCount = await Board.countDocuments();
    const activeCount = await Board.countDocuments({ status: 'Active' });
    const offlineCount = await Board.countDocuments({ status: 'Offline' });
    const maintenanceCount = await Board.countDocuments({ status: 'Maintenance' });
    const distinctRegions = await Board.distinct('region');

    res.json({
      boards,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count
      },
      stats: {
        total: allBoardsCount,
        active: activeCount,
        offline: offlineCount,
        maintenance: maintenanceCount,
        regions: distinctRegions.length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a specific board by ID
// @route   GET /api/boards/:id
// @access  Private
export const getBoardById = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    res.json(board);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new board
// @route   POST /api/boards
// @access  Private
export const createBoard = async (req, res) => {
  const { boardName, location, region, boardType, status } = req.body;

  if (!boardName || !location || !region || !boardType) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    const boardId = await generateBoardId();

    const board = await Board.create({
      boardId,
      boardName,
      location,
      region,
      boardType,
      status: status || 'Offline',
      lastSeen: new Date()
    });

    res.status(201).json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a board
// @route   PUT /api/boards/:id
// @access  Private
export const updateBoard = async (req, res) => {
  const { boardName, location, region, boardType, status } = req.body;

  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    // Update fields
    board.boardName = boardName !== undefined ? boardName : board.boardName;
    board.location = location !== undefined ? location : board.location;
    board.region = region !== undefined ? region : board.region;
    board.boardType = boardType !== undefined ? boardType : board.boardType;
    board.status = status !== undefined ? status : board.status;

    // Update lastSeen to current time if status is updated to Active
    if (status === 'Active') {
      board.lastSeen = new Date();
    }

    const updatedBoard = await board.save();
    res.json(updatedBoard);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a board
// @route   DELETE /api/boards/:id
// @access  Private
export const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    await board.deleteOne();
    res.json({ message: 'Board removed successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Board not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Activate and pair a smartboard using TV-style activation code
// @route   POST /api/boards/:id/activate
// @access  Private (Admin Required)
export const activateBoard = async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Please provide activation code' });
  }

  try {
    const board = await Board.findById(req.params.id);
    if (!board) {
      return res.status(404).json({ message: 'Board not found' });
    }

    const activation = await DeviceActivation.findOne({ code: code.toUpperCase() });
    if (!activation) {
      return res.status(400).json({ message: 'Invalid or expired activation code' });
    }

    if (activation.isActivated) {
      return res.status(400).json({ message: 'Activation code has already been used' });
    }

    // Generate JWT deviceToken for this board
    const deviceToken = jwt.sign(
      { boardId: board._id },
      process.env.JWT_SECRET || 'smartreach_secret_key_2026'
    );

    // Pair token to board and set online (Active)
    board.deviceToken = deviceToken;
    board.lastSeen = new Date();
    board.status = 'Active';
    await board.save();

    // Mark code record as activated
    activation.isActivated = true;
    activation.boardId = board._id;
    activation.deviceToken = deviceToken;
    await activation.save();

    res.json({ message: 'Device successfully activated and paired.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

