import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, '../db.json');

const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const seed = { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [], playbackLogs: [], deviceActivations: [], engagementLogs: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!data.engagementLogs) data.engagementLogs = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [], playbackLogs: [], deviceActivations: [], engagementLogs: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

class MockEngagementLog {
  static find(query = {}) {
    const db = readDb();
    let results = [...db.engagementLogs];

    if (query.boardId) {
      results = results.filter(log => String(log.boardId) === String(query.boardId));
    }
    if (query.campaignId) {
      if (typeof query.campaignId === 'object' && query.campaignId.$in) {
        const searchIds = query.campaignId.$in.map(id => String(id));
        results = results.filter(log => searchIds.includes(String(log.campaignId)));
      } else {
        results = results.filter(log => String(log.campaignId) === String(query.campaignId));
      }
    }

    const chain = {
      results,
      sort: function(sortObj) {
        const field = Object.keys(sortObj)[0] || 'timestamp';
        const order = sortObj[field] || -1;
        this.results.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return -1 * order;
          if (valA > valB) return 1 * order;
          return 0;
        });
        return this;
      },
      limit: function(limitNum) {
        this.results = this.results.slice(0, limitNum);
        return this;
      },
      populate: function(field) {
        const d = readDb();
        this.results = this.results.map(log => {
          const newItem = { ...log };
          if (field === 'boardId' && newItem.boardId) {
            newItem.boardId = d.boards.find(b => b._id === newItem.boardId) || newItem.boardId;
          }
          if (field === 'campaignId' && newItem.campaignId) {
            newItem.campaignId = d.campaigns.find(c => c._id === newItem.campaignId) || newItem.campaignId;
          }
          if (field === 'assetId' && newItem.assetId) {
            newItem.assetId = d.assets.find(a => a._id === newItem.assetId) || newItem.assetId;
          }
          return newItem;
        });
        return this;
      },
      then: function(resolve) {
        resolve(this.results);
      }
    };

    return chain;
  }

  static async create(data) {
    const db = readDb();
    const newLog = {
      _id: 'eng_' + Math.random().toString(36).substr(2, 9),
      boardId: data.boardId,
      campaignId: data.campaignId,
      assetId: data.assetId,
      type: data.type,
      details: data.details || {},
      timestamp: data.timestamp || new Date().toISOString()
    };
    db.engagementLogs.push(newLog);
    writeDb(db);
    return newLog;
  }

  static async deleteMany() {
    const db = readDb();
    db.engagementLogs = [];
    writeDb(db);
  }

  static async insertMany(logs) {
    const db = readDb();
    const prepped = logs.map(l => ({
      _id: 'eng_' + Math.random().toString(36).substr(2, 9),
      ...l,
      timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : (l.timestamp || new Date().toISOString())
    }));
    db.engagementLogs = [...db.engagementLogs, ...prepped];
    writeDb(db);
    return prepped;
  }
}

export default MockEngagementLog;
