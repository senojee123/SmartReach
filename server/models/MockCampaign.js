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
    if (!data.campaigns) data.campaigns = [];
    if (!data.assets) data.assets = [];
    if (!data.campaignAssets) data.campaignAssets = [];
    if (!data.campaignTargets) data.campaignTargets = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], campaigns: [], assets: [], campaignAssets: [], campaignTargets: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

class MockCampaign {
  static findOne(query = {}) {
    const db = readDb();
    let campaigns = [...db.campaigns];

    if (query._id) {
      campaigns = campaigns.filter(c => c._id === query._id);
    }
    if (query.campaignId) {
      campaigns = campaigns.filter(c => c.campaignId === query.campaignId);
    }

    const sortFn = (sortObj) => {
      const field = Object.keys(sortObj)[0];
      const order = sortObj[field];
      campaigns.sort((a, b) => {
        if (a[field] < b[field]) return -1 * order;
        if (a[field] > b[field]) return 1 * order;
        return 0;
      });
      return campaigns[0] || null;
    };

    return {
      sort: sortFn,
      then: function(resolve) {
        resolve(campaigns[0] || null);
      }
    };
  }

  static find(query = {}) {
    const db = readDb();
    let results = [...db.campaigns];

    // Filter by _id
    if (query._id) {
      if (typeof query._id === 'object' && query._id.$in) {
        // Stringify values to ensure reliable comparison regardless of type
        const searchIds = query._id.$in.map(id => String(id));
        results = results.filter(c => searchIds.includes(String(c._id)));
      } else {
        results = results.filter(c => String(c._id) === String(query._id));
      }
    }

    // Filter by search string
    if (query.$or) {
      results = results.filter(c => {
        return query.$or.some(condition => {
          const field = Object.keys(condition)[0];
          const queryVal = condition[field];
          if (queryVal && queryVal.$regex) {
            const regex = new RegExp(queryVal.$regex, 'i');
            return regex.test(c[field]);
          }
          return false;
        });
      });
    }

    // Filter by status
    if (query.status) {
      results = results.filter(c => c.status === query.status);
    }

    // Filter by campaignType
    if (query.campaignType) {
      results = results.filter(c => c.campaignType === query.campaignType);
    }

    // Filter by createdBy
    if (query.createdBy) {
      results = results.filter(c => c.createdBy === query.createdBy);
    }

    const chain = {
      results,
      sort: function(sortObj) {
        const field = Object.keys(sortObj)[0] || 'createdAt';
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
    let results = [...db.campaigns];

    // Filter by _id
    if (query._id) {
      if (typeof query._id === 'object' && query._id.$in) {
        const searchIds = query._id.$in.map(id => String(id));
        results = results.filter(c => searchIds.includes(String(c._id)));
      } else {
        results = results.filter(c => String(c._id) === String(query._id));
      }
    }

    if (query.$or) {
      results = results.filter(c => {
        return query.$or.some(condition => {
          const field = Object.keys(condition)[0];
          const queryVal = condition[field];
          if (queryVal && queryVal.$regex) {
            const regex = new RegExp(queryVal.$regex, 'i');
            return regex.test(c[field]);
          }
          return false;
        });
      });
    }

    if (query.status) {
      results = results.filter(c => c.status === query.status);
    }

    if (query.campaignType) {
      results = results.filter(c => c.campaignType === query.campaignType);
    }

    return results.length;
  }

  static async create(data) {
    const db = readDb();
    
    // Generate campaignId: CMP-1001 increment sequence
    let nextNum = 1001;
    const latestCampaign = [...db.campaigns].sort((a, b) => b.campaignId.localeCompare(a.campaignId))[0];
    if (latestCampaign) {
      const match = latestCampaign.campaignId.match(/CMP-(\d+)/);
      if (match) {
        nextNum = parseInt(match[1], 10) + 1;
      }
    }
    const campaignId = `CMP-${nextNum}`;

    const newCampaign = {
      _id: 'cmp_' + Math.random().toString(36).substr(2, 9),
      campaignId,
      campaignName: data.campaignName,
      description: data.description,
      campaignType: data.campaignType,
      status: data.status || 'Draft',
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime || '00:00',
      endTime: data.endTime || '23:59',
      createdBy: data.createdBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.campaigns.push(newCampaign);
    writeDb(db);
    return newCampaign;
  }

  static async findById(id) {
    const db = readDb();
    const campaign = db.campaigns.find(c => c._id === id);
    if (!campaign) return null;

    return {
      ...campaign,
      save: async function() {
        const d = readDb();
        const idx = d.campaigns.findIndex(c => c._id === id);
        if (idx !== -1) {
          d.campaigns[idx] = { ...d.campaigns[idx], ...this, updatedAt: new Date().toISOString() };
          writeDb(d);
        }
        return this;
      },
      deleteOne: async function() {
        const d = readDb();
        d.campaigns = d.campaigns.filter(c => c._id !== id);
        d.campaignAssets = d.campaignAssets.filter(ca => ca.campaignId !== id);
        d.campaignTargets = d.campaignTargets.filter(ct => ct.campaignId !== id);
        writeDb(d);
        return { deletedCount: 1 };
      }
    };
  }

  static async deleteMany() {
    const db = readDb();
    db.campaigns = [];
    writeDb(db);
  }

  static async insertMany(campaigns) {
    const db = readDb();
    const prepped = campaigns.map(c => ({
      _id: 'cmp_' + Math.random().toString(36).substr(2, 9),
      ...c,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : (c.createdAt || new Date().toISOString()),
      updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : (c.updatedAt || new Date().toISOString())
    }));
    db.campaigns = [...db.campaigns, ...prepped];
    writeDb(db);
    return prepped;
  }
}

export default MockCampaign;
