import Campaign from '../models/Campaign.js';
import Asset from '../models/Asset.js';
import CampaignTarget from '../models/CampaignTarget.js';
import Board from '../models/Board.js';
import PlaybackLog from '../models/PlaybackLog.js';


// @desc    Get dashboard metrics for overview widgets
// @route   GET /api/dashboard/stats
// @access  Private
export const getDashboardStats = async (req, res) => {
  try {


    // 1. Boards statistics
    const totalBoards = await Board.countDocuments();
    const activeBoards = await Board.countDocuments({ status: 'Active' });
    const offlineBoards = await Board.countDocuments({ status: 'Offline' });
    const distinctRegions = await Board.distinct('region');

    // 2. Campaigns statistics
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'Active' });

    // 3. Media Assets statistics
    const totalAssets = await Asset.countDocuments();

    // 4. Targeted / Assigned Boards statistics
    // Find count of unique boards that are currently targeted by at least one campaign
    const assignedBoardIds = await CampaignTarget.distinct('boardId');
    const totalAssignedBoards = assignedBoardIds.length;

    res.json({
      boards: {
        total: totalBoards,
        active: activeBoards,
        offline: offlineBoards,
        regions: distinctRegions.length
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns
      },
      assets: {
        total: totalAssets
      },
      assignedBoards: {
        total: totalAssignedBoards
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get latest playback logs
// @route   GET /api/dashboard/logs
// @access  Private
export const getPlaybackLogs = async (req, res) => {
  try {
    const logs = await PlaybackLog.find()
      .sort({ playedAt: -1 })
      .limit(10)
      .populate('boardId')
      .populate('campaignId')
      .populate('assetId');

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

