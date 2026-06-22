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
    if (!data.campaignAssets) data.campaignAssets = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

class MockCampaignAsset {
  static find(query = {}) {
    const db = readDb();
    let results = [...db.campaignAssets];

    if (query.campaignId) {
      if (typeof query.campaignId === 'object' && query.campaignId.$in) {
        const searchIds = query.campaignId.$in.map(id => String(id));
        results = results.filter(ca => searchIds.includes(String(ca.campaignId)));
      } else {
        results = results.filter(ca => String(ca.campaignId) === String(query.campaignId));
      }
    }
    if (query.assetId) {
      if (typeof query.assetId === 'object' && query.assetId.$in) {
        const searchIds = query.assetId.$in.map(id => String(id));
        results = results.filter(ca => searchIds.includes(String(ca.assetId)));
      } else {
        results = results.filter(ca => String(ca.assetId) === String(query.assetId));
      }
    }

    const chain = {
      results,
      populate: function(field) {
        const d = readDb();
        this.results = this.results.map(ca => {
          const newItem = { ...ca };
          if (field === 'assetId' && newItem.assetId) {
            newItem.assetId = d.assets.find(a => a._id === newItem.assetId) || newItem.assetId;
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
      _id: 'ca_' + Math.random().toString(36).substr(2, 9),
      campaignId: data.campaignId,
      assetId: data.assetId
    };
    db.campaignAssets.push(newRelation);
    writeDb(db);
    return newRelation;
  }

  static async deleteMany(query = {}) {
    const db = readDb();
    let initialCount = db.campaignAssets.length;
    
    if (Object.keys(query).length === 0) {
      db.campaignAssets = [];
    } else {
      db.campaignAssets = db.campaignAssets.filter(ca => {
        if (query.campaignId && ca.campaignId === query.campaignId) return false;
        if (query.assetId && ca.assetId === query.assetId) return false;
        return true;
      });
    }

    writeDb(db);
    return { deletedCount: initialCount - db.campaignAssets.length };
  }

  static async insertMany(relations) {
    const db = readDb();
    const prepped = relations.map(r => ({
      _id: 'ca_' + Math.random().toString(36).substr(2, 9),
      ...r
    }));
    db.campaignAssets = [...db.campaignAssets, ...prepped];
    writeDb(db);
    return prepped;
  }
}

export default MockCampaignAsset;
