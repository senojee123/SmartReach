import Asset from '../models/Asset.js';
import CampaignAsset from '../models/CampaignAsset.js';
import { uploadFile, deleteFile } from '../config/cloudinary.js';

// @desc    Get all assets (with search, filter, paginate, sort)
// @route   GET /api/assets
// @access  Private
export const getAssets = async (req, res) => {
  try {
    const { search, assetType, sortBy, order, page = 1, limit = 12 } = req.query;

    const query = {};

    // Search query (assetName)
    if (search) {
      query.$or = [
        { assetName: { $regex: search, $options: 'i' } },
        { assetId: { $regex: search, $options: 'i' } }
      ];
    }

    // Type filter
    if (assetType) {
      query.assetType = assetType;
    }

    // Sort configuration
    let sort = {};
    if (sortBy) {
      const sortOrder = order === 'desc' ? -1 : 1;
      sort[sortBy] = sortOrder;
    } else {
      sort.uploadedAt = -1; // Default: newest uploads first
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skipNum = (pageNum - 1) * limitNum;

    // Execute query
    const count = await Asset.countDocuments(query);
    const assetsList = await Asset.find(query)
      .sort(sort)
      .skip(skipNum)
      .limit(limitNum);

    res.json({
      assets: assetsList,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(count / limitNum),
        totalItems: count
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single asset by ID with usage tracking
// @route   GET /api/assets/:id
// @access  Private
export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Asset usage tracking: find campaigns referencing this asset
    const campaignAssets = await CampaignAsset.find({ assetId: asset._id }).populate('campaignId');
    const campaigns = campaignAssets.map(ca => ca.campaignId).filter(Boolean);

    res.json({
      ...asset,
      _id: asset._id,
      assetId: asset.assetId,
      assetName: asset.assetName,
      assetType: asset.assetType,
      fileUrl: asset.fileUrl,
      publicId: asset.publicId,
      fileSize: asset.fileSize,
      duration: asset.duration,
      uploadedBy: asset.uploadedBy,
      uploadedAt: asset.uploadedAt,
      campaignsUsedIn: campaigns
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload an asset (receives file buffer and pushes to Cloudinary/local fallback)
// @route   POST /api/assets/upload
// @access  Private
export const uploadAsset = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Please upload a file' });
  }

  // Validate format
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ message: 'File format not supported. Only JPG, PNG, WEBP, and MP4 are allowed.' });
  }

  // Validate size (limit to 10MB)
  const maxSizeBytes = 10 * 1024 * 1024;
  if (req.file.size > maxSizeBytes) {
    return res.status(400).json({ message: 'File size too large. Maximum size allowed is 10MB.' });
  }

  try {
    // Call Cloudinary/fallback service
    const uploadResult = await uploadFile(req.file);

    // Generate unique assetId (e.g. AST-105234)
    const assetId = 'AST-' + Math.floor(100000 + Math.random() * 900000);

    // Save metadata in database
    const newAsset = await Asset.create({
      assetId,
      assetName: req.file.originalname,
      assetType: uploadResult.assetType,
      fileUrl: uploadResult.fileUrl,
      publicId: uploadResult.publicId,
      fileSize: uploadResult.fileSize,
      duration: uploadResult.duration,
      uploadedBy: req.user._id
    });

    res.status(201).json(newAsset);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Private
export const deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Call Cloudinary/local storage remover
    await deleteFile(asset.publicId, asset.assetType);

    // Remove DB asset entry and linked Campaign relationships
    await asset.deleteOne();
    await CampaignAsset.deleteMany({ assetId: req.params.id });

    res.json({ message: 'Media asset deleted successfully' });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Asset not found' });
    }
    res.status(500).json({ message: error.message });
  }
};
