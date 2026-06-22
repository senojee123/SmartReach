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
    if (!data.deviceActivations) data.deviceActivations = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [], playbackLogs: [], deviceActivations: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

class MockDeviceActivation {
  static findOne(query = {}) {
    const db = readDb();
    let results = [...db.deviceActivations];

    if (query.code) {
      results = results.filter(rec => rec.code.toLowerCase() === query.code.toLowerCase());
    }
    if (query.boardId) {
      results = results.filter(rec => rec.boardId === query.boardId);
    }

    const currentRecord = results[0] || null;

    const queryObj = {
      then: function(resolve) {
        resolve(currentRecord ? {
          ...currentRecord,
          save: async function() {
            const d = readDb();
            const idx = d.deviceActivations.findIndex(rec => rec._id === currentRecord._id);
            if (idx !== -1) {
              d.deviceActivations[idx] = { ...d.deviceActivations[idx], ...this };
              writeDb(d);
            }
            return this;
          },
          deleteOne: async function() {
            const d = readDb();
            d.deviceActivations = d.deviceActivations.filter(rec => rec._id !== currentRecord._id);
            writeDb(d);
            return { deletedCount: 1 };
          }
        } : null);
      }
    };

    return queryObj;
  }

  static async create(data) {
    const db = readDb();
    const newRecord = {
      _id: 'act_' + Math.random().toString(36).substr(2, 9),
      code: data.code.toUpperCase(),
      boardId: data.boardId || null,
      deviceToken: data.deviceToken || null,
      isActivated: data.isActivated || false,
      createdAt: new Date().toISOString()
    };
    db.deviceActivations.push(newRecord);
    writeDb(db);
    return newRecord;
  }

  static async deleteMany(query = {}) {
    const db = readDb();
    if (Object.keys(query).length === 0) {
      db.deviceActivations = [];
    } else {
      db.deviceActivations = db.deviceActivations.filter(rec => {
        if (query.code && rec.code.toLowerCase() === query.code.toLowerCase()) return false;
        if (query.boardId && rec.boardId === query.boardId) return false;
        return true;
      });
    }
    writeDb(db);
    return { deletedCount: 1 };
  }
}

export default MockDeviceActivation;
