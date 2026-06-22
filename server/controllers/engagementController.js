import EngagementLog from '../models/EngagementLog.js';

// @desc    Log a QR code scan event
// @route   POST /api/engagement/scan
// @access  Public
export const logScan = async (req, res) => {
  const { boardId, campaignId, assetId } = req.body;

  if (!boardId || !campaignId || !assetId) {
    return res.status(400).json({ message: 'Missing required parameters: boardId, campaignId, assetId' });
  }

  try {
    const log = await EngagementLog.create({
      boardId,
      campaignId,
      assetId,
      type: 'Scan',
      details: {},
      timestamp: new Date()
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Log rating feedback survey response
// @route   POST /api/engagement/poll
// @access  Public
export const logPoll = async (req, res) => {
  const { boardId, campaignId, assetId, rating, feedback } = req.body;

  if (!boardId || !campaignId || !assetId || rating === undefined) {
    return res.status(400).json({ message: 'Missing parameters. Rating is required.' });
  }

  try {
    const log = await EngagementLog.create({
      boardId,
      campaignId,
      assetId,
      type: 'Poll',
      details: { rating: Number(rating), feedback: feedback || '' },
      timestamp: new Date()
    });

    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
