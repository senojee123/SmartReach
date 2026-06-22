import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, '../db.json');

const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const seed = { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!data.campaignTargets) data.campaignTargets = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

class MockCampaignTarget {
  static find(query = {}) {
    const db = readDb();
    let results = [...db.campaignTargets];

    if (query.campaignId) {
      if (typeof query.campaignId === 'object' && query.campaignId.$in) {
        const searchIds = query.campaignId.$in.map(id => String(id));
        results = results.filter(ct => searchIds.includes(String(ct.campaignId)));
      } else {
        results = results.filter(ct => String(ct.campaignId) === String(query.campaignId));
      }
    }
    if (query.boardId) {
      if (typeof query.boardId === 'object' && query.boardId.$in) {
        const searchIds = query.boardId.$in.map(id => String(id));
        results = results.filter(ct => searchIds.includes(String(ct.boardId)));
      } else {
        results = results.filter(ct => String(ct.boardId) === String(query.boardId));
      }
    }

    const chain = {
      results,
      populate: function(field) {
        const d = readDb();
        this.results = this.results.map(ct => {
          const newItem = { ...ct };
          if (field === 'boardId' && newItem.boardId) {
            newItem.boardId = d.boards.find(b => b._id === newItem.boardId) || newItem.boardId;
          }
          if (field === 'campaignId' && newItem.campaignId) {
            newItem.campaignId = d.campaigns.find(c => c._id === newItem.campaignId) || newItem.campaignId;
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
    const newRelation = {
      _id: 'ct_' + Math.random().toString(36).substr(2, 9),
      campaignId: data.campaignId,
      boardId: data.boardId
    };
    db.campaignTargets.push(newRelation);
    writeDb(db);
    return newRelation;
  }

  static async deleteMany(query = {}) {
    const db = readDb();
    let initialCount = db.campaignTargets.length;
    
    if (Object.keys(query).length === 0) {
      db.campaignTargets = [];
    } else {
      db.campaignTargets = db.campaignTargets.filter(ct => {
        if (query.campaignId && ct.campaignId === query.campaignId) return false;
        if (query.boardId && ct.boardId === query.boardId) return false;
        return true;
      });
    }

    writeDb(db);
    return { deletedCount: initialCount - db.campaignTargets.length };
  }

  static async distinct(field, query = {}) {
    const db = readDb();
    let results = [...db.campaignTargets];

    if (query.campaignId) {
      results = results.filter(ct => ct.campaignId === query.campaignId);
    }

    const values = results.map(r => r[field]);
    return [...new Set(values)];
  }

  static async insertMany(relations) {
    const db = readDb();
    const prepped = relations.map(r => ({
      _id: 'ct_' + Math.random().toString(36).substr(2, 9),
      ...r
    }));
    db.campaignTargets = [...db.campaignTargets, ...prepped];
    writeDb(db);
    return prepped;
  }
}

export default MockCampaignTarget;
