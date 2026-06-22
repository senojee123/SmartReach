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
    if (!data.assets) data.assets = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

class MockAsset {
  static findOne(query = {}) {
    const db = readDb();
    const results = db.assets.filter(a => {
      if (query._id && a._id !== query._id) return false;
      if (query.assetId && a.assetId !== query.assetId) return false;
      return true;
    });
    
    return {
      then: function(resolve) {
        resolve(results[0] || null);
      }
    };
  }

  static find(query = {}) {
    const db = readDb();
    let results = [...db.assets];

    // Filter by search string
    if (query.$or) {
      results = results.filter(a => {
        return query.$or.some(condition => {
          const field = Object.keys(condition)[0];
          const queryVal = condition[field];
          if (queryVal && queryVal.$regex) {
            const regex = new RegExp(queryVal.$regex, 'i');
            return regex.test(a[field]);
          }
          return false;
        });
      });
    }

    // Filter by assetType
    if (query.assetType) {
      results = results.filter(a => a.assetType === query.assetType);
    }

    const chain = {
      results,
      sort: function(sortObj) {
        const field = Object.keys(sortObj)[0] || 'uploadedAt';
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
      skip: function(skipNum) {
        this.results = this.results.slice(skipNum);
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

  static async countDocuments(query = {}) {
    const db = readDb();
    let results = [...db.assets];

    if (query.$or) {
      results = results.filter(a => {
        return query.$or.some(condition => {
          const field = Object.keys(condition)[0];
          const queryVal = condition[field];
          if (queryVal && queryVal.$regex) {
            const regex = new RegExp(queryVal.$regex, 'i');
            return regex.test(a[field]);
          }
          return false;
        });
      });
    }

    if (query.assetType) {
      results = results.filter(a => a.assetType === query.assetType);
    }

    return results.length;
  }

  static async create(data) {
    const db = readDb();
    
    // Generate assetId: AST-1001 increment sequence
    let nextNum = 1001;
    const latestAsset = [...db.assets].sort((a, b) => b.assetId.localeCompare(a.assetId))[0];
    if (latestAsset) {
      const match = latestAsset.assetId.match(/AST-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const assetId = `AST-${nextNum}`;

    const newAsset = {
      _id: 'ast_' + Math.random().toString(36).substr(2, 9),
      assetId,
      assetName: data.assetName,
      assetType: data.assetType,
      fileUrl: data.fileUrl,
      publicId: data.publicId,
      fileSize: data.fileSize,
      duration: data.duration || 0,
      uploadedBy: data.uploadedBy,
      uploadedAt: new Date().toISOString()
    };

    db.assets.push(newAsset);
    writeDb(db);
    return newAsset;
  }

  static async findById(id) {
    const db = readDb();
    const asset = db.assets.find(a => a._id === id);
    if (!asset) return null;

    return {
      ...asset,
      deleteOne: async function() {
        const d = readDb();
        d.assets = d.assets.filter(a => a._id !== id);
        d.campaignAssets = d.campaignAssets.filter(ca => ca.assetId !== id);
        writeDb(d);
        return { deletedCount: 1 };
      }
    };
  }

  static async deleteMany() {
    const db = readDb();
    db.assets = [];
    writeDb(db);
  }

  static async insertMany(assets) {
    const db = readDb();
    const prepped = assets.map(a => ({
      _id: 'ast_' + Math.random().toString(36).substr(2, 9),
      ...a,
      uploadedAt: a.uploadedAt instanceof Date ? a.uploadedAt.toISOString() : (a.uploadedAt || new Date().toISOString())
    }));
    db.assets = [...db.assets, ...prepped];
    writeDb(db);
    return prepped;
  }
}

export default MockAsset;
