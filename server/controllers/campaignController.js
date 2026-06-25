import Campaign from '../models/Campaign.js';
import CampaignAsset from '../models/CampaignAsset.js';
import CampaignTarget from '../models/CampaignTarget.js';

// @desc    Get all campaigns (with search, filter, paginate, sort)
// @route   GET /api/campaigns
// @access  Private
export const getCampaigns = async (req, res) => {
  try {
    const { search, campaignType, status, sortBy, order, page = 1, limit = 10 } = req.query;

    const query = {};

    // Search query (name or description)
    if (search) {
      query.$or = [
        { campaignName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { campaignId: { $regex: search, $options: 'i' } }
      ];
    }

    // Filters
    if (campaignType) {
      query.campaignType = campaignType;
    }
    if (status) {
      query.status = status;
    }

    // Sort configuration
    let sort = {};
    if (sortBy) {
      const sortOrder = order === 'desc' ? -1 : 1;
      sort[sortBy] = sortOrder;
    } else {
      sort.createdAt = -1; // Default: newest campaigns first
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    // Execute query
    const count = await Campaign.countDocuments(query);
    const campaignsList = await Campaign.find(query)
      .sort(sort)
      .skip(skipNum)
      .limit(limitNum);

    // Fetch aggregates for stats
    const totalCount = await Campaign.countDocuments();
    const activeCount = await Campaign.countDocuments({ status: 'Active' });
    const draftCount = await Campaign.countDocuments({ status: 'Draft' });
    const scheduledCount = await Campaign.countDocuments({ status: 'Scheduled' });
    const completedCount = await Campaign.countDocuments({ status: 'Completed' });
    const pausedCount = await Campaign.countDocuments({ status: 'Paused' });

    res.json({
      campaigns: campaignsList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count
      },
      stats: {
        total: totalCount,
        active: activeCount,
        draft: draftCount,
        scheduled: scheduledCount,
        completed: completedCount,
        paused: pausedCount
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single campaign by ID (with populated assets and targets)
// @route   GET /api/campaigns/:id
// @access  Private
export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Fetch related targets and assets
    const campaignAssets = await CampaignAsset.find({ campaignId: campaign._id }).populate('assetId');
    const campaignTargets = await CampaignTarget.find({ campaignId: campaign._id }).populate('boardId');

    // Extract records (unwrapping from intermediate relation arrays)
    const assets = campaignAssets.map(ca => ca.assetId).filter(Boolean);
    const targets = campaignTargets.map(ct => ct.boardId).filter(Boolean);

    res.json({
      ...campaign,
      // Supporting both wrapper object formats
      _id: campaign._id,
      campaignId: campaign.campaignId,
      campaignName: campaign.campaignName,
      description: campaign.description,
      campaignText: campaign.campaignText,
      campaignType: campaign.campaignType,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      startTime: campaign.startTime,
      endTime: campaign.endTime,
      createdBy: campaign.createdBy,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      assets,
      targets
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new campaign
// @route   POST /api/campaigns
// @access  Private
export const createCampaign = async (req, res) => {
  const { campaignName, description, campaignText, campaignType, startDate, endDate, startTime, endTime, status, assetIds } = req.body;

  if (!campaignName || !campaignType || !startDate || !endDate) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Generate unique campaignId (e.g. CMP-105234)
    const campaignId = 'CMP-' + Math.floor(100000 + Math.random() * 900000);

    const newCampaign = await Campaign.create({
      campaignId,
      campaignName,
      description,
      campaignText: campaignText || '',
      campaignType,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime: startTime || '00:00',
      endTime: endTime || '23:59',
      status: status || 'Draft',
      createdBy: req.user._id
    });

    if (Array.isArray(assetIds) && assetIds.length > 0) {
      const relationEntries = assetIds.map(assetId => ({
        campaignId: newCampaign._id,
        assetId
      }));
      await CampaignAsset.insertMany(relationEntries);
    }

    res.status(201).json(newCampaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a campaign
// @route   PUT /api/campaigns/:id
// @access  Private
export const updateCampaign = async (req, res) => {
  const { campaignName, description, campaignText, campaignType, startDate, endDate, startTime, endTime, status, assetIds } = req.body;

  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Update attributes
    campaign.campaignName = campaignName !== undefined ? campaignName : campaign.campaignName;
    campaign.description = description !== undefined ? description : campaign.description;
    campaign.campaignText = campaignText !== undefined ? campaignText : campaign.campaignText;
    campaign.campaignType = campaignType !== undefined ? campaignType : campaign.campaignType;
    campaign.status = status !== undefined ? status : campaign.status;
    campaign.startDate = startDate !== undefined ? new Date(startDate) : campaign.startDate;
    campaign.endDate = endDate !== undefined ? new Date(endDate) : campaign.endDate;
    campaign.startTime = startTime !== undefined ? startTime : campaign.startTime;
    campaign.endTime = endTime !== undefined ? endTime : campaign.endTime;

    const updatedCampaign = await campaign.save();

    if (Array.isArray(assetIds)) {
      await CampaignAsset.deleteMany({ campaignId: req.params.id });
      if (assetIds.length > 0) {
        const relationEntries = assetIds.map(assetId => ({
          campaignId: req.params.id,
          assetId
        }));
        await CampaignAsset.insertMany(relationEntries);
      }
    }

    res.json(updatedCampaign);
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a campaign
// @route   DELETE /api/campaigns/:id
// @access  Private
export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Delete relationships and the campaign
    await campaign.deleteOne();
    
    // Cleanup linked assets and targets mapping records
    await CampaignAsset.deleteMany({ campaignId: req.params.id });
    await CampaignTarget.deleteMany({ campaignId: req.params.id });

    res.json({ message: 'Campaign and associated targeting removed successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.status(500).json({ message: error.message });
  }
};
