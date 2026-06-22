import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, '../db.json');

const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const seed = { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [], playbackLogs: [], deviceActivations: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!data.playbackLogs) data.playbackLogs = [];
    if (!data.deviceActivations) data.deviceActivations = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [], playbackLogs: [], deviceActivations: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

class MockPlaybackLog {
  static find(query = {}) {
    const db = readDb();
    let results = [...db.playbackLogs];

    if (query.boardId) {
      results = results.filter(log => log.boardId === query.boardId);
    }
    if (query.campaignId) {
      results = results.filter(log => log.campaignId === query.campaignId);
    }

    const chain = {
      results,
      sort: function(sortObj) {
        const field = Object.keys(sortObj)[0] || 'playedAt';
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
      _id: 'log_' + Math.random().toString(36).substr(2, 9),
      boardId: data.boardId,
      campaignId: data.campaignId,
      assetId: data.assetId,
      duration: data.duration,
      verified: data.verified !== undefined ? data.verified : true,
      playedAt: data.playedAt || new Date().toISOString()
    };
    db.playbackLogs.push(newLog);
    writeDb(db);
    return newLog;
  }

  static async deleteMany() {
    const db = readDb();
    db.playbackLogs = [];
    writeDb(db);
  }

  static async insertMany(logs) {
    const db = readDb();
    const prepped = logs.map(l => ({
      _id: 'log_' + Math.random().toString(36).substr(2, 9),
      ...l,
      verified: l.verified !== undefined ? l.verified : true,
      playedAt: l.playedAt instanceof Date ? l.playedAt.toISOString() : (l.playedAt || new Date().toISOString())
    }));
    db.playbackLogs = [...db.playbackLogs, ...prepped];
    writeDb(db);
    return prepped;
  }
}

export default MockPlaybackLog;
