import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, '../db.json');

const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const seed = { users: [], boards: [], auditLogs: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!data.auditLogs) data.auditLogs = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], auditLogs: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

const wrapAuditLogObj = (log) => {
  if (!log) return null;
  return {
    ...log
  };
};

class MockAuditLog {
  static find(query = {}) {
    const db = readDb();
    let results = [...db.auditLogs];

    if (query.action) {
      results = results.filter(l => l.action === query.action);
    }
    if (query.alertId) {
      results = results.filter(l => l.alertId === query.alertId);
    }
    if (query.boardId) {
      results = results.filter(l => l.boardId === query.boardId);
    }

    const wrappedResults = results.map(wrapAuditLogObj);

    const chain = {
      results: wrappedResults,
      sort: function(sortObj) {
        const field = Object.keys(sortObj)[0];
        const order = sortObj[field];
        this.results.sort((a, b) => {
          const valA = new Date(a[field]).getTime();
          const valB = new Date(b[field]).getTime();
          if (valA < valB) return -1 * order;
          if (valA > valB) return 1 * order;
          return 0;
        });
        return this;
      },
      limit: function(limitNum) {
        this.results = this.results.slice(0, limitNum);
        return this.results;
      },
      then: function(resolve) {
        resolve(this.results);
      }
    };
    return chain;
  }

  static async create(data) {
    const db = readDb();
    const newRecord = {
      _id: 'aud_' + Math.random().toString(36).substr(2, 9),
      timestamp: data.timestamp instanceof Date ? data.timestamp.toISOString() : (data.timestamp || new Date().toISOString()),
      user: data.user,
      boardId: data.boardId || null,
      boardName: data.boardName || null,
      alertId: data.alertId || null,
      alertTitle: data.alertTitle || null,
      action: data.action,
      details: data.details || {}
    };
    db.auditLogs.push(newRecord);
    writeDb(db);
    return wrapAuditLogObj(newRecord);
  }

  static async deleteMany(query = {}) {
    const db = readDb();
    if (Object.keys(query).length === 0) {
      db.auditLogs = [];
    } else if (query.alertId) {
      db.auditLogs = db.auditLogs.filter(l => l.alertId !== query.alertId);
    }
    writeDb(db);
    return { deletedCount: 1 };
  }

  static async countDocuments(query = {}) {
    const db = readDb();
    let results = [...db.auditLogs];
    if (query.action) {
      results = results.filter(l => l.action === query.action);
    }
    return results.length;
  }

  static async insertMany(items) {
    const db = readDb();
    const prepped = items.map(item => ({
      _id: 'aud_' + Math.random().toString(36).substr(2, 9),
      timestamp: item.timestamp instanceof Date ? item.timestamp.toISOString() : (item.timestamp || new Date().toISOString()),
      user: item.user,
      boardId: item.boardId || null,
      boardName: item.boardName || null,
      alertId: item.alertId || null,
      alertTitle: item.alertTitle || null,
      action: item.action,
      details: item.details || {}
    }));
    db.auditLogs = [...db.auditLogs, ...prepped];
    writeDb(db);
    return prepped.map(wrapAuditLogObj);
  }
}

export default MockAuditLog;
