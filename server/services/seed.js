import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Board from '../models/Board.js';
import Campaign from '../models/Campaign.js';
import Asset from '../models/Asset.js';
import CampaignAsset from '../models/CampaignAsset.js';
import CampaignTarget from '../models/CampaignTarget.js';
import DeviceActivation from '../models/DeviceActivation.js';
import PlaybackLog from '../models/PlaybackLog.js';
import EngagementLog from '../models/EngagementLog.js';
import BoardHealthLog from '../models/BoardHealthLog.js';
import Content from '../models/Content.js';
import Alert from '../models/Alert.js';
import AuditLog from '../models/AuditLog.js';

dotenv.config();

const sampleUsers = [
  {
    name: 'Super Administrator',
    email: 'superadmin@smartreach.com',
    password: 'admin123',
    role: 'Super Admin'
  },
  {
    name: 'Standard Administrator',
    email: 'admin@smartreach.com',
    password: 'admin123',
    role: 'Admin'
  }
];

const sampleBoards = [
  {
    boardId: 'SRB-1001',
    boardName: 'Downtown Sports Arena Main Screen',
    location: '102 Arena Way, Sector 4',
    region: 'North Region',
    boardType: 'Sports',
    status: 'Active',
    lastSeen: new Date(Date.now() - 1000 * 60 * 5),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)
  },
  {
    boardId: 'SRB-1002',
    boardName: 'Community Center Cultural Board',
    location: 'Cultural Hall, Sector 12',
    region: 'West Region',
    boardType: 'Religious & Cultural',
    status: 'Active',
    lastSeen: new Date(Date.now() - 1000 * 60 * 12),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28)
  },
  {
    boardId: 'SRB-1003',
    boardName: 'Metro Hub Transit Display',
    location: 'Platform 3, Central Station',
    region: 'Central Region',
    boardType: 'Public Information',
    status: 'Active',
    lastSeen: new Date(Date.now() - 1000 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 25)
  },
  {
    boardId: 'SRB-1004',
    boardName: 'Grand Theater Marquis',
    location: '40 Broadway Blvd',
    region: 'South Region',
    boardType: 'Entertainment',
    status: 'Offline',
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 36),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20)
  },
  {
    boardId: 'SRB-1005',
    boardName: 'Starlight Stadium Perimeter North',
    location: 'Stadium Gate 2',
    region: 'North Region',
    boardType: 'Sports',
    status: 'Maintenance',
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 5),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 18)
  },
  {
    boardId: 'SRB-1006',
    boardName: 'Holy Shrine Visitors Info board',
    location: 'Entrance Gate A',
    region: 'East Region',
    boardType: 'Religious & Cultural',
    status: 'Offline',
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 72),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15)
  },
  {
    boardId: 'SRB-1007',
    boardName: 'Times Square Cinema Board',
    location: 'Times Square Arcade Entrance',
    region: 'Central Region',
    boardType: 'Entertainment',
    status: 'Active',
    lastSeen: new Date(Date.now() - 1000 * 60 * 1),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12)
  },
  {
    boardId: 'SRB-1008',
    boardName: 'City Park Info Display',
    location: 'Botanical Garden pathway',
    region: 'South Region',
    boardType: 'Public Information',
    status: 'Active',
    lastSeen: new Date(Date.now() - 1000 * 60 * 15),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10)
  },
  {
    boardId: 'SRB-1009',
    boardName: 'Youth Sports Complex Court 1',
    location: 'Indoor Stadium Hall B',
    region: 'East Region',
    boardType: 'Sports',
    status: 'Maintenance',
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
  },
  {
    boardId: 'SRB-1010',
    boardName: 'Downtown Library Community Board',
    location: 'Foyer, 3rd Floor Library',
    region: 'North Region',
    boardType: 'Public Information',
    status: 'Offline',
    lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
  }
];

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany();
    await Board.deleteMany();
    await Campaign.deleteMany();
    await Asset.deleteMany();
    await CampaignAsset.deleteMany();
    await CampaignTarget.deleteMany();
    await DeviceActivation.deleteMany();
    await PlaybackLog.deleteMany();
    await EngagementLog.deleteMany();
    await BoardHealthLog.deleteMany();
    await Content.deleteMany({});
    await Alert.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Seeding users...');
    const seededUsers = [];
    for (const u of sampleUsers) {
      const newUser = await User.create(u);
      seededUsers.push(newUser);
    }
    const adminUser = seededUsers[1] || seededUsers[0];
    console.log(`Successfully seeded ${seededUsers.length} users.`);

    console.log('Seeding boards...');
    const seededBoards = await Board.insertMany(sampleBoards);
    console.log(`Successfully seeded ${seededBoards.length} boards.`);

    console.log('Seeding media assets...');
    const sampleAssets = [
      {
        assetId: 'AST-1001',
        assetName: 'Summer Sports Promo Poster.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600',
        publicId: 'local-seed-sports-image',
        fileSize: 450000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      {
        assetId: 'AST-1002',
        assetName: 'Central Station Info Loop.mp4',
        assetType: 'Video',
        fileUrl: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
        publicId: 'local-seed-info-video',
        fileSize: 1050000,
        duration: 15,
        uploadedBy: adminUser._id
      },
      // Demo Assets (3 per board type)
      // Sports Assets for board-01 (Colombo Stadium)
      {
        assetId: 'AST-D01',
        assetName: 'Live Match Highlights.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-sports-1',
        fileSize: 320000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      {
        assetId: 'AST-D02',
        assetName: 'Upcoming Tournaments.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-sports-2',
        fileSize: 410000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      {
        assetId: 'AST-D03',
        assetName: 'Stadium Ticket Sales.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-sports-3',
        fileSize: 380000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      // Religious Assets for board-02 (Kandy Temple)
      {
        assetId: 'AST-D04',
        assetName: 'Festival Calendar.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-cultural-1',
        fileSize: 290000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      {
        assetId: 'AST-D05',
        assetName: 'Historical Tour Guide.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1590076247563-a2e2f6ed6f78?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-cultural-2',
        fileSize: 340000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      {
        assetId: 'AST-D06',
        assetName: 'Cultural Exhibition.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-cultural-3',
        fileSize: 310000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      // Entertainment Assets for board-03 (Galle Event Hall)
      {
        assetId: 'AST-D07',
        assetName: 'Tonight Live Music.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-ent-1',
        fileSize: 370000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      {
        assetId: 'AST-D08',
        assetName: 'Upcoming Drama Show.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-ent-2',
        fileSize: 450000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      {
        assetId: 'AST-D09',
        assetName: 'Galle Event Ticket Info.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-ent-3',
        fileSize: 390000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      // Public Information Assets for board-04 (Colombo Public Display)
      {
        assetId: 'AST-D10',
        assetName: 'Traffic Advisory.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-pub-1',
        fileSize: 260000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      {
        assetId: 'AST-D11',
        assetName: 'Weather Updates.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-pub-2',
        fileSize: 300000,
        duration: 0,
        uploadedBy: adminUser._id
      },
      {
        assetId: 'AST-D12',
        assetName: 'Community Clean-up Drive.jpg',
        assetType: 'Image',
        fileUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=600&auto=format&fit=crop',
        publicId: 'demo-pub-3',
        fileSize: 340000,
        duration: 0,
        uploadedBy: adminUser._id
      }
    ];
    const seededAssets = await Asset.insertMany(sampleAssets);
    console.log(`Successfully seeded ${seededAssets.length} assets.`);

    console.log('Seeding campaigns...');
    const sampleCampaigns = [
      {
        campaignId: 'CMP-1001',
        campaignName: 'Summer Sports Championship Ad Campaign',
        description: 'Promote championship scheduling on arena displays',
        campaignType: 'Sports',
        status: 'Active',
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
        createdBy: adminUser._id
      },
      {
        campaignId: 'CMP-1002',
        campaignName: 'Metro Transit Public Announcements',
        description: 'Inform passengers of weekend rail upgrades',
        campaignType: 'Public Information',
        status: 'Draft',
        startDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
        createdBy: adminUser._id
      }
    ];
    const seededCampaigns = await Campaign.insertMany(sampleCampaigns);
    console.log(`Successfully seeded ${seededCampaigns.length} campaigns.`);

    console.log('Seeding relationships (CampaignAssets & CampaignTargets)...');

    const campaignAssetRelations = [
      { campaignId: seededCampaigns[0]._id, assetId: seededAssets[0]._id },
      { campaignId: seededCampaigns[0]._id, assetId: seededAssets[1]._id },
      { campaignId: seededCampaigns[1]._id, assetId: seededAssets[1]._id }
    ];
    await CampaignAsset.insertMany(campaignAssetRelations);

    // Resolve specific boards for targets
    const b1001 = seededBoards.find(b => b.boardId === 'SRB-1001');
    const b1005 = seededBoards.find(b => b.boardId === 'SRB-1005');
    const b1003 = seededBoards.find(b => b.boardId === 'SRB-1003');

    const campaignTargetRelations = [
      { campaignId: seededCampaigns[0]._id, boardId: b1001._id },
      { campaignId: seededCampaigns[0]._id, boardId: b1005._id },
      { campaignId: seededCampaigns[1]._id, boardId: b1003._id }
    ];
    await CampaignTarget.insertMany(campaignTargetRelations);

    console.log('Seeding mock playback logs, health logs & engagements...');
    const samplePlaybackLogs = [];
    const sampleEngagementLogs = [];
    const sampleBoardHealthLogs = [];

    // Seed data spread over the past 7 days
    const now = Date.now();
    for (let day = 6; day >= 0; day--) {
      const dayMillis = now - day * 24 * 60 * 60 * 1000;
      
      // Seed 6-10 playback logs for each day
      const playsCount = Math.floor(6 + Math.random() * 5); 
      for (let p = 0; p < playsCount; p++) {
        const playedAt = new Date(dayMillis - p * 2 * 60 * 60 * 1000); 
        const randomBoard = seededBoards[p % seededBoards.length];
        const randomCampaign = seededCampaigns[p % seededCampaigns.length];
        const randomAsset = seededAssets[p % seededAssets.length];

        samplePlaybackLogs.push({
          boardId: randomBoard._id,
          campaignId: randomCampaign._id,
          assetId: randomAsset._id,
          duration: randomAsset.assetType === 'Video' ? 15 : 10,
          verified: Math.random() > 0.1, // 90% verified
          playedAt
        });

        // Seed 1-3 scan engagements for each day
        if (p < 3) {
          const timestamp = new Date(playedAt.getTime() + 30 * 1000); // 30s after play
          sampleEngagementLogs.push({
            boardId: randomBoard._id,
            campaignId: randomCampaign._id,
            assetId: randomAsset._id,
            type: 'Scan',
            details: {},
            timestamp
          });

          // Seed poll response for some scans
          if (Math.random() > 0.4) {
            sampleEngagementLogs.push({
              boardId: randomBoard._id,
              campaignId: randomCampaign._id,
              assetId: randomAsset._id,
              type: 'Poll',
              details: { 
                rating: Math.floor(3 + Math.random() * 3), // 3, 4, or 5 stars
                feedback: Math.random() > 0.5 ? 'Looks great on screen!' : 'Clear visibility.' 
              },
              timestamp: new Date(timestamp.getTime() + 15 * 1000) // 15s after scan
            });
          }
        }
      }

      // Seed health logs for all active boards each day
      seededBoards.forEach(b => {
        if (b.status === 'Active') {
          sampleBoardHealthLogs.push({
            boardId: b._id,
            cpuUsage: Math.floor(10 + Math.random() * 40),
            memoryUsage: Math.floor(30 + Math.random() * 30),
            storageUsage: Math.floor(15 + Math.random() * 50),
            syncStatus: Math.random() > 0.05 ? 'Synced' : 'Syncing',
            timestamp: new Date(dayMillis)
          });
        }
      });
    }

    await PlaybackLog.insertMany(samplePlaybackLogs);
    await EngagementLog.insertMany(sampleEngagementLogs);
    await BoardHealthLog.insertMany(sampleBoardHealthLogs);

    // Also update board documents with some current telemetry so they show up in health dashboard
    for (const b of seededBoards) {
      const boardDoc = await Board.findById(b._id);
      if (boardDoc) {
        if (boardDoc.status === 'Active') {
          boardDoc.cpuUsage = Math.floor(20 + Math.random() * 30);
          boardDoc.memoryUsage = Math.floor(45 + Math.random() * 20);
          boardDoc.storageUsage = Math.floor(30 + Math.random() * 30);
          boardDoc.syncStatus = 'Synced';
          boardDoc.uptime = Math.floor(10000 + Math.random() * 50000);
        } else if (boardDoc.status === 'Offline') {
          boardDoc.cpuUsage = 0;
          boardDoc.memoryUsage = 0;
          boardDoc.storageUsage = 45;
          boardDoc.syncStatus = 'Synced';
          boardDoc.uptime = 0;
        } else { // Maintenance
          boardDoc.cpuUsage = 10;
          boardDoc.memoryUsage = 25;
          boardDoc.storageUsage = 60;
          boardDoc.syncStatus = 'Syncing';
          boardDoc.uptime = 1200;
        }
        await boardDoc.save();
      }
    }

    console.log('Seeding Content and Alert override configurations (Phase 5)...');
    
    // Fallback item
    const fallbackContent = await Content.create({
      title: 'SmartReach Network Default Fallback Loop',
      type: 'Fallback Content',
      priority: 10,
      fileUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80',
      duration: 10,
      targetBoards: [],
      targetRegions: [],
      targetGroups: [],
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      status: 'Active'
    });

    // Operational Bulletin targeting sports Arena
    const sportsBoard = seededBoards.find(b => b.boardType === 'Sports');
    const opContent = await Content.create({
      title: 'Downtown Arena Operational Scheduling Notice',
      type: 'Operational Content',
      priority: 80,
      fileUrl: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600',
      duration: 15,
      targetBoards: sportsBoard ? [sportsBoard._id] : [],
      targetRegions: [],
      targetGroups: [],
      startTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      endTime: new Date(Date.now() + 1000 * 60 * 60 * 4), // 4 hours later
      status: 'Active'
    });

    // Active Approved Alert
    const activeAlert = await Alert.create({
      alertId: 'ALT-100901',
      title: 'Severe Flash Flood Weather Warning',
      message: 'Heavy thunderstorms are causing flash flooding across North Region. Do not travel unless absolutely necessary. Find safe shelters.',
      severity: 'Critical',
      priority: 100,
      targetBoards: [],
      targetRegions: ['North Region'],
      targetGroups: [],
      createdBy: 'superadmin@smartreach.com',
      approvedBy: 'admin@smartreach.com',
      isApproved: true,
      startTime: new Date(Date.now() - 1000 * 60 * 15), // 15 mins ago
      expiryTime: new Date(Date.now() + 1000 * 60 * 45), // 45 mins later
      status: 'Active'
    });

    // Pending Queue Alert
    const pendingAlert = await Alert.create({
      alertId: 'ALT-100902',
      title: 'Central Transit Hub Platform Safety Check',
      message: 'Transit platforms in Central Hub will undergo safety checks. Please expect minor delays and watch screen directions.',
      severity: 'Warning',
      priority: 90,
      targetBoards: [],
      targetRegions: ['Central Region'],
      targetGroups: [],
      createdBy: 'superadmin@smartreach.com',
      startTime: new Date(Date.now() - 1000 * 60 * 5), // 5 mins ago (active immediately on approval)
      expiryTime: new Date(Date.now() + 1000 * 60 * 60 * 2)
    });

    // Seed initial Audit logs
    await AuditLog.insertMany([
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        user: 'superadmin@smartreach.com',
        alertId: activeAlert._id,
        alertTitle: activeAlert.title,
        action: 'Alert Created',
        details: { severity: 'Critical', priority: 100 }
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        user: 'admin@smartreach.com',
        alertId: activeAlert._id,
        alertTitle: activeAlert.title,
        action: 'Alert Approved',
        details: { approvedBy: 'admin@smartreach.com' }
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 40),
        user: 'Device ' + (sportsBoard ? sportsBoard.boardId : 'SRB-1001'),
        boardId: sportsBoard ? sportsBoard._id : null,
        boardName: sportsBoard ? sportsBoard.boardName : 'Downtown Sports Arena Main Screen',
        alertId: activeAlert._id,
        alertTitle: activeAlert.title,
        action: 'Alert Delivered',
        details: { severity: 'Critical' }
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 39),
        user: 'Device ' + (sportsBoard ? sportsBoard.boardId : 'SRB-1001'),
        boardId: sportsBoard ? sportsBoard._id : null,
        boardName: sportsBoard ? sportsBoard.boardName : 'Downtown Sports Arena Main Screen',
        alertId: activeAlert._id,
        alertTitle: activeAlert.title,
        action: 'Alert Displayed',
        details: { severity: 'Critical' }
      }
    ]);

    console.log('Database seeding complete!');
    if (!global.useMockDb) {
      await mongoose.connection.close();
    }
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
