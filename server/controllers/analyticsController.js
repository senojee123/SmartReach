import PlaybackLog from '../models/PlaybackLog.js';
import Board from '../models/Board.js';
import Campaign from '../models/Campaign.js';
import Asset from '../models/Asset.js';
import EngagementLog from '../models/EngagementLog.js';
import BoardHealthLog from '../models/BoardHealthLog.js';

// @desc    Get summary statistics for overall platform analytics
// @route   GET /api/analytics/overview
// @access  Private
export const getOverviewAnalytics = async (req, res) => {
  try {
    // 1. Fetch raw datasets (using wrappers that resolve to arrays in both db modes)
    const logs = await PlaybackLog.find().populate('boardId').populate('campaignId').populate('assetId');
    const boards = await Board.find();
    const engagements = await EngagementLog.find();

    // 2. Aggregate general stats
    const totalPlays = logs.length;
    const totalDurationSeconds = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const totalDisplayTimeHours = Number((totalDurationSeconds / 3600).toFixed(2));

    const activeBoards = boards.filter(b => b.status === 'Active');
    const systemAvailability = boards.length > 0 
      ? Number(((activeBoards.length / boards.length) * 100).toFixed(1)) 
      : 100;

    const scanCount = engagements.filter(e => e.type === 'Scan').length;
    const clickThroughRate = totalPlays > 0 
      ? Number(((scanCount / totalPlays) * 100).toFixed(2)) 
      : 0;

    // 3. Aggregate regional distribution
    const regionalPlays = {
      'North Region': 0,
      'South Region': 0,
      'East Region': 0,
      'West Region': 0,
      'Central Region': 0
    };

    logs.forEach(log => {
      // boardId might be populated or a raw string/object depending on DB mode
      const board = typeof log.boardId === 'object' ? log.boardId : null;
      if (board && board.region in regionalPlays) {
        regionalPlays[board.region]++;
      } else if (board && board.region) {
        regionalPlays[board.region] = (regionalPlays[board.region] || 0) + 1;
      }
    });

    // 4. Aggregate top campaigns
    const campaignStatsMap = {};
    logs.forEach(log => {
      const camp = typeof log.campaignId === 'object' ? log.campaignId : null;
      if (camp) {
        const id = camp._id;
        if (!campaignStatsMap[id]) {
          campaignStatsMap[id] = {
            id: camp.campaignId,
            name: camp.campaignName,
            plays: 0,
            duration: 0
          };
        }
        campaignStatsMap[id].plays++;
        campaignStatsMap[id].duration += log.duration;
      }
    });

    const topCampaigns = Object.values(campaignStatsMap)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);

    // 5. Aggregate top assets
    const assetStatsMap = {};
    logs.forEach(log => {
      const asset = typeof log.assetId === 'object' ? log.assetId : null;
      if (asset) {
        const id = asset._id;
        if (!assetStatsMap[id]) {
          assetStatsMap[id] = {
            name: asset.assetName,
            type: asset.assetType,
            plays: 0
          };
        }
        assetStatsMap[id].plays++;
      }
    });

    const topAssets = Object.values(assetStatsMap)
      .sort((a, b) => b.plays - a.plays)
      .slice(0, 5);

    // 6. Aggregate daily trend data (past 7 days)
    const dailyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const dailyPlays = logs.filter(log => {
        const playedTime = new Date(log.playedAt);
        return playedTime >= startOfDay && playedTime <= endOfDay;
      }).length;

      const dailyScans = engagements.filter(e => {
        const scanTime = new Date(e.timestamp);
        return e.type === 'Scan' && scanTime >= startOfDay && scanTime <= endOfDay;
      }).length;

      dailyTrend.push({
        date: dateString,
        plays: dailyPlays,
        scans: dailyScans
      });
    }

    res.json({
      summary: {
        totalPlays,
        displayTimeHours: totalDisplayTimeHours,
        availabilityRate: systemAvailability,
        ctr: clickThroughRate,
        scans: scanCount
      },
      regionalPlays,
      topCampaigns,
      topAssets,
      dailyTrend
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get analytics for a specific campaign
// @route   GET /api/analytics/campaign/:id
// @access  Private
export const getCampaignAnalytics = async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    const logs = await PlaybackLog.find({ campaignId: id }).populate('boardId').populate('assetId');
    const engagements = await EngagementLog.find({ campaignId: id }).populate('boardId');

    const totalPlays = logs.length;
    const totalDurationSeconds = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const displayTimeHours = Number((totalDurationSeconds / 3600).toFixed(2));

    const verifiedPlays = logs.filter(log => log.verified === true).length;
    const verifiedRate = totalPlays > 0 
      ? Number(((verifiedPlays / totalPlays) * 100).toFixed(1)) 
      : 100;

    const scanCount = engagements.filter(e => e.type === 'Scan').length;
    const pollCount = engagements.filter(e => e.type === 'Poll').length;
    const ctr = totalPlays > 0 
      ? Number(((scanCount / totalPlays) * 100).toFixed(2)) 
      : 0;

    // Daily play distribution over campaign runtime or past 7 days
    const dailyPlays = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateString = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      const startOfDay = new Date(d.setHours(0, 0, 0, 0));
      const endOfDay = new Date(d.setHours(23, 59, 59, 999));

      const dayPlays = logs.filter(log => {
        const playedTime = new Date(log.playedAt);
        return playedTime >= startOfDay && playedTime <= endOfDay;
      }).length;

      const dayScans = engagements.filter(e => {
        const scanTime = new Date(e.timestamp);
        return e.type === 'Scan' && scanTime >= startOfDay && scanTime <= endOfDay;
      }).length;

      dailyPlays.push({
        date: dateString,
        plays: dayPlays,
        scans: dayScans
      });
    }

    // Regional performance
    const regionalPlays = {
      'North Region': 0,
      'South Region': 0,
      'East Region': 0,
      'West Region': 0,
      'Central Region': 0
    };
    logs.forEach(log => {
      const board = typeof log.boardId === 'object' ? log.boardId : null;
      if (board && board.region in regionalPlays) {
        regionalPlays[board.region]++;
      }
    });

    // Asset breakdown inside campaign
    const assetBreakdown = {};
    logs.forEach(log => {
      const asset = typeof log.assetId === 'object' ? log.assetId : null;
      if (asset) {
        const assetIdStr = asset._id;
        if (!assetBreakdown[assetIdStr]) {
          assetBreakdown[assetIdStr] = {
            name: asset.assetName,
            type: asset.assetType,
            plays: 0,
            duration: 0
          };
        }
        assetBreakdown[assetIdStr].plays++;
        assetBreakdown[assetIdStr].duration += log.duration;
      }
    });

    res.json({
      campaign: {
        id: campaign.campaignId,
        name: campaign.campaignName,
        status: campaign.status,
        type: campaign.campaignType
      },
      stats: {
        plays: totalPlays,
        displayTimeHours,
        verifiedRate,
        scans: scanCount,
        polls: pollCount,
        ctr
      },
      dailyPlays,
      regionalPlays,
      assetBreakdown: Object.values(assetBreakdown)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get health stats and active resource usage diagnostics
// @route   GET /api/analytics/health
// @access  Private
export const getSystemHealth = async (req, res) => {
  try {
    const boards = await Board.find();
    const activeBoards = boards.filter(b => b.status === 'Active');

    let totalCpu = 0;
    let totalRam = 0;
    let totalStorage = 0;

    activeBoards.forEach(b => {
      totalCpu += b.cpuUsage || 0;
      totalRam += b.memoryUsage || 0;
      totalStorage += b.storageUsage || 0;
    });

    const avgCpu = activeBoards.length > 0 ? Math.round(totalCpu / activeBoards.length) : 0;
    const avgRam = activeBoards.length > 0 ? Math.round(totalRam / activeBoards.length) : 0;
    const avgStorage = activeBoards.length > 0 ? Math.round(totalStorage / activeBoards.length) : 0;

    // Track diagnostic system alerts
    const alerts = [];
    boards.forEach(b => {
      if (b.status === 'Active') {
        if (b.cpuUsage > 80) {
          alerts.push({
            boardId: b.boardId,
            boardName: b.boardName,
            type: 'Warning',
            message: `High CPU usage detected: ${b.cpuUsage}%`
          });
        }
        if (b.storageUsage > 85) {
          alerts.push({
            boardId: b.boardId,
            boardName: b.boardName,
            type: 'Warning',
            message: `Storage capacity warning: ${b.storageUsage}% full`
          });
        }
        if (b.syncStatus === 'Error') {
          alerts.push({
            boardId: b.boardId,
            boardName: b.boardName,
            type: 'Critical',
            message: 'Media files synchronization failure.'
          });
        }
      } else if (b.status === 'Offline' && b.deviceToken) {
        alerts.push({
          boardId: b.boardId,
          boardName: b.boardName,
          type: 'Offline',
          message: 'Smartboard node heartbeat ping lost.'
        });
      }
    });

    res.json({
      metrics: {
        total: boards.length,
        active: activeBoards.length,
        offline: boards.filter(b => b.status === 'Offline').length,
        maintenance: boards.filter(b => b.status === 'Maintenance').length,
        avgCpu,
        avgRam,
        avgStorage
      },
      alerts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export playback log, engagements, or hardware logs as CSV
// @route   GET /api/analytics/export/:type
// @access  Private
export const exportDataCSV = async (req, res) => {
  const { type } = req.params;

  try {
    let csvContent = '';
    let filename = '';

    if (type === 'playback') {
      const logs = await PlaybackLog.find().populate('boardId').populate('campaignId').populate('assetId');
      filename = 'smartreach_playback_audit_log.csv';
      csvContent = 'LogID,BoardID,BoardName,CampaignID,CampaignName,AssetID,AssetName,Duration(s),Verified,PlayedAt\n';
      
      logs.forEach(log => {
        const board = typeof log.boardId === 'object' ? log.boardId : { boardId: 'N/A', boardName: 'N/A' };
        const campaign = typeof log.campaignId === 'object' ? log.campaignId : { campaignId: 'N/A', campaignName: 'N/A' };
        const asset = typeof log.assetId === 'object' ? log.assetId : { assetId: 'N/A', assetName: 'N/A' };
        
        csvContent += `"${log._id}","${board.boardId}","${board.boardName}","${campaign.campaignId}","${campaign.campaignName}","${log.assetId?._id || 'N/A'}","${asset.assetName}",${log.duration},${log.verified ? 'YES' : 'NO'},"${log.playedAt}"\n`;
      });

    } else if (type === 'engagement') {
      const logs = await EngagementLog.find().populate('boardId').populate('campaignId').populate('assetId');
      filename = 'smartreach_engagement_report.csv';
      csvContent = 'EngagementID,BoardID,BoardName,CampaignID,CampaignName,AssetName,Type,Rating,Feedback,Timestamp\n';

      logs.forEach(log => {
        const board = typeof log.boardId === 'object' ? log.boardId : { boardId: 'N/A', boardName: 'N/A' };
        const campaign = typeof log.campaignId === 'object' ? log.campaignId : { campaignId: 'N/A', campaignName: 'N/A' };
        const asset = typeof log.assetId === 'object' ? log.assetId : { assetName: 'N/A' };
        
        const rating = log.details?.rating || '';
        const feedback = log.details?.feedback || '';

        csvContent += `"${log._id}","${board.boardId}","${board.boardName}","${campaign.campaignId}","${campaign.campaignName}","${asset.assetName}","${log.type}","${rating}","${feedback}","${log.timestamp}"\n`;
      });

    } else if (type === 'health') {
      const logs = await BoardHealthLog.find().populate('boardId');
      filename = 'smartreach_hardware_health_log.csv';
      csvContent = 'LogID,BoardID,BoardName,CPU_Usage(%),RAM_Usage(%),Disk_Usage(%),SyncStatus,Timestamp\n';

      logs.forEach(log => {
        const board = typeof log.boardId === 'object' ? log.boardId : { boardId: 'N/A', boardName: 'N/A' };
        csvContent += `"${log._id}","${board.boardId}","${board.boardName}",${log.cpuUsage},${log.memoryUsage},${log.storageUsage},"${log.syncStatus}","${log.timestamp}"\n`;
      });
    } else {
      return res.status(400).json({ message: 'Invalid export type. Select: playback, engagement, or health.' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.status(200).send(csvContent);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
