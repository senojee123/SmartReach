import CampaignTarget from '../models/CampaignTarget.js';
import Board from '../models/Board.js';

// @desc    Assign targeted boards to a campaign
// @route   POST /api/campaigns/:id/assign-boards
// @access  Private
export const assignCampaignBoards = async (req, res) => {
  const { boardIds } = req.body; // Array of Board MongoDB _id strings

  if (!Array.isArray(boardIds)) {
    return res.status(400).json({ message: 'Please provide an array of board IDs' });
  }

  try {
    const campaignId = req.params.id;

    // Remove previous targeted boards for this campaign
    await CampaignTarget.deleteMany({ campaignId });

    // Build relationship models
    if (boardIds.length > 0) {
      const targetEntries = boardIds.map(boardId => ({
        campaignId,
        boardId
      }));
      await CampaignTarget.insertMany(targetEntries);
    }

    res.json({ message: `Successfully assigned ${boardIds.length} boards to campaign.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get targeted boards for a campaign
// @route   GET /api/campaigns/:id/targets
// @access  Private
export const getCampaignTargets = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaignTargets = await CampaignTarget.find({ campaignId }).populate('boardId');
    const boards = campaignTargets.map(ct => ct.boardId).filter(Boolean);
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
