import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, '../db.json');

const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const seed = { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [], playbackLogs: [], deviceActivations: [], engagementLogs: [], boardHealthLogs: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!data.boardHealthLogs) data.boardHealthLogs = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [], playbackLogs: [], deviceActivations: [], engagementLogs: [], boardHealthLogs: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

class MockBoardHealthLog {
  static find(query = {}) {
    const db = readDb();
    let results = [...db.boardHealthLogs];

    if (query.boardId) {
      results = results.filter(log => String(log.boardId) === String(query.boardId));
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
      _id: 'hlth_' + Math.random().toString(36).substr(2, 9),
      boardId: data.boardId,
      cpuUsage: data.cpuUsage,
      memoryUsage: data.memoryUsage,
      storageUsage: data.storageUsage,
      syncStatus: data.syncStatus || 'Synced',
      timestamp: data.timestamp || new Date().toISOString()
    };
    db.boardHealthLogs.push(newLog);
    writeDb(db);
    return newLog;
  }

  static async deleteMany() {
    const db = readDb();
    db.boardHealthLogs = [];
    writeDb(db);
  }

  static async insertMany(logs) {
    const db = readDb();
    const prepped = logs.map(l => ({
      _id: 'hlth_' + Math.random().toString(36).substr(2, 9),
      ...l,
      timestamp: l.timestamp instanceof Date ? l.timestamp.toISOString() : (l.timestamp || new Date().toISOString())
    }));
    db.boardHealthLogs = [...db.boardHealthLogs, ...prepped];
    writeDb(db);
    return prepped;
  }
}

export default MockBoardHealthLog;
