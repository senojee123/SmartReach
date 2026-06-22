import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, '../db.json');

const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const seed = { users: [], boards: [], alerts: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!data.alerts) data.alerts = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], alerts: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

const wrapAlertObj = (alert) => {
  if (!alert) return null;
  return {
    ...alert,
    save: async function() {
      const d = readDb();
      const idx = d.alerts.findIndex(a => a._id === alert._id);
      if (idx !== -1) {
        d.alerts[idx] = { ...d.alerts[idx], ...this };
        writeDb(d);
      }
      return this;
    },
    deleteOne: async function() {
      const d = readDb();
      d.alerts = d.alerts.filter(a => a._id !== alert._id);
      writeDb(d);
      return { deletedCount: 1 };
    }
  };
};

class MockAlert {
  static find(query = {}) {
    const db = readDb();
    let results = [...db.alerts];

    if (query.status) {
      results = results.filter(a => a.status === query.status);
    }
    if (query.isApproved !== undefined) {
      results = results.filter(a => a.isApproved === query.isApproved);
    }

    const wrappedResults = results.map(wrapAlertObj);

    const chain = {
      results: wrappedResults,
      sort: function(sortObj) {
        const field = Object.keys(sortObj)[0];
        const order = sortObj[field];
        this.results.sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA < valB) return -1 * order;
          if (valA > valB) return 1 * order;
          return 0;
        });
        return this;
      },
      then: function(resolve) {
        resolve(this.results);
      }
    };
    return chain;
  }

  static findOne(query = {}) {
    const db = readDb();
    let results = [...db.alerts];

    if (query._id) {
      results = results.filter(a => a._id === query._id);
    }
    if (query.alertId) {
      results = results.filter(a => a.alertId === query.alertId);
    }
    if (query.code) {
      results = results.filter(a => a.code === query.code);
    }

    const item = results[0] || null;
    return {
      then: function(resolve) {
        resolve(wrapAlertObj(item));
      }
    };
  }

  static async findById(id) {
    const db = readDb();
    const item = db.alerts.find(a => a._id === id);
    return wrapAlertObj(item);
  }

  static async create(data) {
    const db = readDb();
    const newRecord = {
      _id: 'alt_' + Math.random().toString(36).substr(2, 9),
      alertId: data.alertId || 'ALT-' + Math.floor(1000 + Math.random() * 9000),
      title: data.title,
      message: data.message,
      severity: data.severity || 'Info',
      priority: data.priority !== undefined ? Number(data.priority) : 100,
      targetBoards: data.targetBoards || [],
      targetRegions: data.targetRegions || [],
      targetGroups: data.targetGroups || [],
      createdBy: data.createdBy,
      approvedBy: data.approvedBy || null,
      isApproved: data.isApproved || false,
      startTime: data.startTime instanceof Date ? data.startTime.toISOString() : data.startTime,
      expiryTime: data.expiryTime instanceof Date ? data.expiryTime.toISOString() : data.expiryTime,
      status: data.status || 'Pending',
      createdAt: new Date().toISOString()
    };
    db.alerts.push(newRecord);
    writeDb(db);
    return wrapAlertObj(newRecord);
  }

  static async deleteMany(query = {}) {
    const db = readDb();
    if (Object.keys(query).length === 0) {
      db.alerts = [];
    } else if (query._id) {
      db.alerts = db.alerts.filter(a => a._id !== query._id);
    }
    writeDb(db);
    return { deletedCount: 1 };
  }

  static async countDocuments(query = {}) {
    const db = readDb();
    let results = [...db.alerts];
    if (query.status) {
      results = results.filter(a => a.status === query.status);
    }
    if (query.isApproved !== undefined) {
      results = results.filter(a => a.isApproved === query.isApproved);
    }
    return results.length;
  }

  static async insertMany(items) {
    const db = readDb();
    const prepped = items.map(item => ({
      _id: 'alt_' + Math.random().toString(36).substr(2, 9),
      alertId: item.alertId || 'ALT-' + Math.floor(1000 + Math.random() * 9000),
      title: item.title,
      message: item.message,
      severity: item.severity || 'Info',
      priority: item.priority !== undefined ? Number(item.priority) : 100,
      targetBoards: item.targetBoards || [],
      targetRegions: item.targetRegions || [],
      targetGroups: item.targetGroups || [],
      createdBy: item.createdBy,
      approvedBy: item.approvedBy || null,
      isApproved: item.isApproved || false,
      startTime: item.startTime instanceof Date ? item.startTime.toISOString() : (item.startTime || new Date().toISOString()),
      expiryTime: item.expiryTime instanceof Date ? item.expiryTime.toISOString() : (item.expiryTime || new Date().toISOString()),
      status: item.status || 'Pending',
      createdAt: new Date().toISOString()
    }));
    db.alerts = [...db.alerts, ...prepped];
    writeDb(db);
    return prepped.map(wrapAlertObj);
  }
}

export default MockAlert;
