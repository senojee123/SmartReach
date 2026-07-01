import Content from '../models/Content.js';
import Alert from '../models/Alert.js';
import Board from '../models/Board.js';
import Campaign from '../models/Campaign.js';
import CampaignAsset from '../models/CampaignAsset.js';
import CampaignTarget from '../models/CampaignTarget.js';

/**
 * Resolves the active playlist for a specific board based on targeting rules and priority overrides.
 * @param {string} boardId - The MongoDB ID of the board (e.g. "brd_...")
 * @returns {Promise<Array>} - The filtered and sorted list of active items to play.
 */
export const getActiveContentForBoard = async (boardId) => {
  try {
    // 1. Fetch board details to get region and type (group)
    const board = await Board.findById(boardId);
    if (!board) {
      console.warn(`Board with ID ${boardId} not found in Priority Engine.`);
      return [];
    }

    const now = new Date();
    const boardRegion = board.region || '';
    const boardType = board.boardType || '';

    // 2. Fetch all active general Content items (Phase 5)
    const allContent = await Content.find({ status: 'Active' });
    const activeContent = allContent.filter(c => {
      const start = new Date(c.startTime);
      const end = new Date(c.endTime);
      return start <= now && end >= now;
    });

    // 3. Fetch all active and approved Alert items (Phase 5)
    const allAlerts = await Alert.find({ isApproved: true });
    const activeAlerts = allAlerts.filter(a => {
      const start = new Date(a.startTime);
      const end = new Date(a.expiryTime);
      return start <= now && end >= now && a.status !== 'Expired';
    });

    const campaignTargets = await CampaignTarget.find({ boardId });
    const campaignIds = campaignTargets.map(t => t.campaignId);
    const relatedCampaigns = await Campaign.find({ _id: { $in: campaignIds }, status: 'Active' });
    const activeCampaigns = relatedCampaigns.filter(c => {
      // Resolve current date and time in Sri Lanka timezone (Asia/Colombo)
      const colomboDateStr = new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Colombo' });
      const colomboDate = new Date(colomboDateStr);
      const today = new Date(colomboDate.getFullYear(), colomboDate.getMonth(), colomboDate.getDate());
      
      const campaignStartVal = new Date(c.startDate);
      const campaignStartDay = new Date(campaignStartVal.getFullYear(), campaignStartVal.getMonth(), campaignStartVal.getDate());
      
      const campaignEndVal = new Date(c.endDate);
      const campaignEndDay = new Date(campaignEndVal.getFullYear(), campaignEndVal.getMonth(), campaignEndVal.getDate());
      
      const isDateActive = campaignStartDay <= today && campaignEndDay >= today;
      if (!isDateActive) return false;

      // Extract current time in HH:MM format in Sri Lanka timezone
      const colomboTimeStr = new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Colombo', hour12: false });
      const [colomboHours, colomboMinutes] = colomboTimeStr.split(':');
      const currentTimeStr = `${colomboHours.padStart(2, '0')}:${colomboMinutes.padStart(2, '0')}`;

      const campaignStart = c.startTime || '00:00';
      const campaignEnd = c.endTime || '23:59';

      if (campaignStart <= campaignEnd) {
        return currentTimeStr >= campaignStart && currentTimeStr <= campaignEnd;
      } else {
        // Handle overnight scheduling (e.g. 22:00 to 06:00)
        return currentTimeStr >= campaignStart || currentTimeStr <= campaignEnd;
      }
    });
    const activeCampaignIds = activeCampaigns.map(c => c._id);

    // Fetch legcay campaign assets
    const campaignAssets = await CampaignAsset.find({ campaignId: { $in: activeCampaignIds } }).populate('assetId');

    // Helper function to match geo-targeting parameters for Content items
    const matchesTargeting = (item) => {
      const targetBoards = item.targetBoards || [];
      const targetRegions = item.targetRegions || [];
      const targetGroups = item.targetGroups || [];

      const hasBoards = targetBoards.length > 0;
      const hasRegions = targetRegions.length > 0;
      const hasGroups = targetGroups.length > 0;

      // Nationwide check: if no targeting lists are specified, it matches all boards
      if (!hasBoards && !hasRegions && !hasGroups) {
        return true;
      }

      // Check if boardId matches target boards
      if (hasBoards && targetBoards.some(id => id.toString() === boardId.toString() || id === boardId)) {
        return true;
      }

      // Check if region matches target regions
      if (hasRegions && targetRegions.some(region => region.toLowerCase() === boardRegion.toLowerCase())) {
        return true;
      }

      // Check if board type/group matches target groups
      if (hasGroups && targetGroups.some(group => group.toLowerCase() === boardType.toLowerCase())) {
        return true;
      }

      return false;
    };

    // 5. Filter lists by targeting rules
    const targetedContent = activeContent.filter(matchesTargeting);
    const targetedAlerts = activeAlerts.filter(matchesTargeting);

    // 6. Merge all items into a unified playlist array
    let playlist = [];

    // Map Alerts to playlist
    targetedAlerts.forEach(a => {
      playlist.push({
        _id: a._id,
        id: a._id,
        alertId: a.alertId,
        title: a.title,
        message: a.message,
        type: a.priority === 100 ? 'Emergency Alert' : 'Safety Message',
        assetType: 'Alert',
        severity: a.severity || 'Info',
        priority: a.priority !== undefined ? Number(a.priority) : 100,
        fileUrl: '',
        duration: 15,
        expiryTime: a.expiryTime,
        startTime: a.startTime,
        campaignId: null
      });
    });

    // Map Content to playlist
    targetedContent.forEach(c => {
      playlist.push({
        _id: c._id,
        id: c._id,
        title: c.title,
        type: c.type,
        assetType: c.type.includes('Alert') ? 'Alert' : (c.fileUrl.match(/\.(mp4|webm|ogg)$/i) ? 'Video' : 'Image'),
        severity: 'Info',
        priority: Number(c.priority),
        fileUrl: c.fileUrl,
        duration: Number(c.duration),
        expiryTime: c.endTime,
        startTime: c.startTime,
        campaignId: c.type === 'Sponsorship' || c.type === 'Advertisement' ? c.id || c._id : null
      });
    });

    // Map Legacy Campaign Assets to playlist
    campaignAssets.forEach(ca => {
      const asset = ca.assetId;
      const campaign = activeCampaigns.find(c => c._id.toString() === ca.campaignId.toString());
      if (asset && campaign) {
        // Determine Priority from Campaign Name/Type according to the priority hierarchy
        let priority = 60; // Default: Standard Campaign (60)
        let type = 'Standard Campaign';

        const nameLower = campaign.campaignName.toLowerCase();
        const typeLower = (campaign.campaignType || '').toLowerCase();

        if (nameLower.includes('emergency') || nameLower.includes('alert')) {
          priority = 100;
          type = 'Emergency Alert';
        } else if (nameLower.includes('government') || nameLower.includes('announcement') || nameLower.includes('gov') || typeLower === 'public information') {
          priority = 90;
          type = 'Government Announcement';
        } else if (nameLower.includes('premium') || nameLower.includes('sponsorship') || nameLower.includes('sponsor')) {
          priority = 80;
          type = 'Premium Campaign';
        } else if (nameLower.includes('event') || nameLower.includes('festival') || typeLower === 'sports' || typeLower === 'entertainment') {
          priority = 70;
          type = 'Event Campaign';
        } else if (nameLower.includes('community') || nameLower.includes('local') || nameLower.includes('charity') || typeLower === 'religious & cultural') {
          priority = 50;
          type = 'Community Campaign';
        } else if (nameLower.includes('standard') || nameLower.includes('general')) {
          priority = 60;
          type = 'Standard Campaign';
        }

        playlist.push({
          _id: ca._id,
          id: ca._id,
          title: campaign.campaignName + ' - ' + asset.assetName,
          type: type,
          assetType: asset.assetType,
          severity: 'Info',
          priority: priority,
          fileUrl: asset.fileUrl,
          duration: asset.assetType === 'Video' ? asset.duration : 10,
          expiryTime: campaign.endDate,
          startTime: campaign.startDate,
          campaignId: campaign._id
        });
      }
    });

    // Map Text-only Campaigns (if any) or Campaigns with campaignText
    activeCampaigns.forEach(campaign => {
      if (campaign.campaignText && campaign.campaignText.trim()) {
        // Determine Priority from Campaign Name/Type according to the priority hierarchy
        let priority = 60; // Default: Standard Campaign (60)
        let type = 'Standard Campaign';

        const nameLower = campaign.campaignName.toLowerCase();
        const typeLower = (campaign.campaignType || '').toLowerCase();

        if (nameLower.includes('emergency') || nameLower.includes('alert')) {
          priority = 100;
          type = 'Emergency Alert';
        } else if (nameLower.includes('government') || nameLower.includes('announcement') || nameLower.includes('gov') || typeLower === 'public information') {
          priority = 90;
          type = 'Government Announcement';
        } else if (nameLower.includes('premium') || nameLower.includes('sponsorship') || nameLower.includes('sponsor')) {
          priority = 80;
          type = 'Premium Campaign';
        } else if (nameLower.includes('event') || nameLower.includes('festival') || typeLower === 'sports' || typeLower === 'entertainment') {
          priority = 70;
          type = 'Event Campaign';
        } else if (nameLower.includes('community') || nameLower.includes('local') || nameLower.includes('charity') || typeLower === 'religious & cultural') {
          priority = 50;
          type = 'Community Campaign';
        } else if (nameLower.includes('standard') || nameLower.includes('general')) {
          priority = 60;
          type = 'Standard Campaign';
        }

        playlist.push({
          _id: campaign._id.toString() + '_text',
          id: campaign._id.toString() + '_text',
          title: campaign.campaignName,
          type: type,
          assetType: 'Text',
          severity: 'Info',
          priority: priority,
          fileUrl: '',
          textContent: campaign.campaignText,
          duration: 10, // Text default duration is 10s
          expiryTime: campaign.endDate,
          startTime: campaign.startDate,
          campaignId: campaign._id
        });
      }
    });

    // Add Fallback Cached Playlist item if empty (Priority 10)
    if (playlist.length === 0) {
      playlist.push({
        _id: 'fallback_item',
        id: 'fallback_item',
        title: 'SmartReach Network Placeholder Loop',
        type: 'Fallback Content',
        assetType: 'Image',
        severity: 'Info',
        priority: 10,
        fileUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
        duration: 10,
        expiryTime: new Date(Date.now() + 86400000),
        startTime: new Date(Date.now() - 86400000),
        campaignId: null
      });
    }

    // 7. Apply strict priority hierarchy override: higher priority overrides all lower priority items
    const availablePriorities = playlist.map(item => item.priority);
    if (availablePriorities.length > 0) {
      const maxPriority = Math.max(...availablePriorities);
      playlist = playlist.filter(item => item.priority === maxPriority);
    }

    // 8. Sort playlist: priority descending, then startTime descending (newest first)
    playlist.sort((a, b) => {
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
    });

    return playlist;
  } catch (error) {
    console.error(`Error resolving Priority Engine playlist for board ${boardId}:`, error);
    return [];
  }
};
