import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, '../db.json');

const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const seed = { users: [], boards: [], contents: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!data.contents) data.contents = [];
    return data;
  } catch (err) {
    return { users: [], boards: [], contents: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

const wrapContentObj = (content) => {
  if (!content) return null;
  return {
    ...content,
    save: async function() {
      const d = readDb();
      const idx = d.contents.findIndex(c => c._id === content._id);
      if (idx !== -1) {
        d.contents[idx] = { ...d.contents[idx], ...this };
        writeDb(d);
      }
      return this;
    },
    deleteOne: async function() {
      const d = readDb();
      d.contents = d.contents.filter(c => c._id !== content._id);
      writeDb(d);
      return { deletedCount: 1 };
    }
  };
};

class MockContent {
  static find(query = {}) {
    const db = readDb();
    let results = [...db.contents];

    if (query.status) {
      results = results.filter(c => c.status === query.status);
    }
    if (query.type) {
      results = results.filter(c => c.type === query.type);
    }

    const wrappedResults = results.map(wrapContentObj);

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
    let results = [...db.contents];

    if (query._id) {
      results = results.filter(c => c._id === query._id);
    }

    const item = results[0] || null;
    return {
      then: function(resolve) {
        resolve(wrapContentObj(item));
      }
    };
  }

  static async findById(id) {
    const db = readDb();
    const item = db.contents.find(c => c._id === id);
    return wrapContentObj(item);
  }

  static async create(data) {
    const db = readDb();
    const newRecord = {
      _id: 'cnt_' + Math.random().toString(36).substr(2, 9),
      title: data.title,
      type: data.type,
      priority: Number(data.priority),
      fileUrl: data.fileUrl,
      duration: data.duration !== undefined ? Number(data.duration) : 10,
      targetBoards: data.targetBoards || [],
      targetRegions: data.targetRegions || [],
      targetGroups: data.targetGroups || [],
      startTime: data.startTime instanceof Date ? data.startTime.toISOString() : data.startTime,
      endTime: data.endTime instanceof Date ? data.endTime.toISOString() : data.endTime,
      status: data.status || 'Active',
      createdAt: new Date().toISOString()
    };
    db.contents.push(newRecord);
    writeDb(db);
    return wrapContentObj(newRecord);
  }

  static async deleteMany(query = {}) {
    const db = readDb();
    if (Object.keys(query).length === 0) {
      db.contents = [];
    } else if (query._id) {
      db.contents = db.contents.filter(c => c._id !== query._id);
    }
    writeDb(db);
    return { deletedCount: 1 };
  }

  static async countDocuments(query = {}) {
    const db = readDb();
    let results = [...db.contents];
    if (query.status) {
      results = results.filter(c => c.status === query.status);
    }
    return results.length;
  }

  static async insertMany(items) {
    const db = readDb();
    const prepped = items.map(item => ({
      _id: 'cnt_' + Math.random().toString(36).substr(2, 9),
      title: item.title,
      type: item.type,
      priority: Number(item.priority),
      fileUrl: item.fileUrl,
      duration: item.duration !== undefined ? Number(item.duration) : 10,
      targetBoards: item.targetBoards || [],
      targetRegions: item.targetRegions || [],
      targetGroups: item.targetGroups || [],
      startTime: item.startTime instanceof Date ? item.startTime.toISOString() : (item.startTime || new Date().toISOString()),
      endTime: item.endTime instanceof Date ? item.endTime.toISOString() : (item.endTime || new Date().toISOString()),
      status: item.status || 'Active',
      createdAt: new Date().toISOString()
    }));
    db.contents = [...db.contents, ...prepped];
    writeDb(db);
    return prepped.map(wrapContentObj);
  }
}

export default MockContent;
