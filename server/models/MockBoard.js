import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.resolve(__dirname, '../db.json');

const readDb = () => {
  if (!fs.existsSync(DB_FILE)) {
    const seed = { users: [], boards: [] };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
    return seed;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (err) {
    return { users: [], boards: [] };
  }
};

const writeDb = (data) => {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
};

const wrapBoardObj = (board) => {
  if (!board) return null;
  return {
    ...board,
    save: async function() {
      const d = readDb();
      const idx = d.boards.findIndex(b => b._id === board._id);
      if (idx !== -1) {
        d.boards[idx] = { ...d.boards[idx], ...this };
        writeDb(d);
      }
      return this;
    },
    deleteOne: async function() {
      const d = readDb();
      d.boards = d.boards.filter(b => b._id !== board._id);
      writeDb(d);
      return { deletedCount: 1 };
    }
  };
};

class MockBoard {
  static findOne(query = {}) {
    const db = readDb();
    let boards = [...db.boards];
    
    // Simple mock query logic for auto-gen boardId Regex
    if (query.boardId && query.boardId instanceof RegExp) {
      boards = boards.filter(b => query.boardId.test(b.boardId));
    } else if (query.boardId) {
      boards = boards.filter(b => b.boardId === query.boardId);
    }

    const sortFn = (sortObj) => {
      const field = Object.keys(sortObj)[0];
      const order = sortObj[field];
      boards.sort((a, b) => {
        const valA = a[field] instanceof Date ? new Date(a[field]).getTime() : a[field];
        const valB = b[field] instanceof Date ? new Date(b[field]).getTime() : b[field];
        if (valA < valB) return -1 * order;
        if (valA > valB) return 1 * order;
        return 0;
      });
      return wrapBoardObj(boards[0]);
    };

    const queryObj = {
      sort: sortFn,
      then: function(resolve) {
        // In case findOne is directly awaited without sort
        resolve(wrapBoardObj(boards[0]));
      }
    };

    return queryObj;
  }

  static find(query = {}) {
    const db = readDb();
    let results = [...db.boards];

    // Filter by _id
    if (query._id) {
      if (typeof query._id === 'object' && query._id.$in) {
        const searchIds = query._id.$in.map(id => String(id));
        results = results.filter(b => searchIds.includes(String(b._id)));
      } else {
        results = results.filter(b => String(b._id) === String(query._id));
      }
    }

    // Filter by deviceToken
    if (query.deviceToken) {
      if (typeof query.deviceToken === 'object') {
        if (query.deviceToken.$regex) {
          const regex = new RegExp(query.deviceToken.$regex, query.deviceToken.$options || 'i');
          results = results.filter(b => regex.test(b.deviceToken));
        } else if (query.deviceToken.$in) {
          results = results.filter(b => query.deviceToken.$in.includes(b.deviceToken));
        }
      } else {
        results = results.filter(b => b.deviceToken === query.deviceToken);
      }
    }

    // Filter by search string
    if (query.$or) {
      results = results.filter(b => {
        return query.$or.some(condition => {
          const field = Object.keys(condition)[0];
          const queryVal = condition[field];
          if (queryVal && queryVal.$regex) {
            const regex = new RegExp(queryVal.$regex, 'i');
            return regex.test(b[field]);
          }
          return false;
        });
      });
    }

    // Filter by status
    if (query.status) {
      results = results.filter(b => b.status === query.status);
    }

    // Filter by boardType
    if (query.boardType) {
      results = results.filter(b => b.boardType === query.boardType);
    }

    const wrappedResults = results.map(wrapBoardObj);

    // Return chaining interface for sort, skip, limit
    const chain = {
      results: wrappedResults,
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
      // In case we directly return chain or call then
      then: function(resolve) {
        resolve(this.results);
      }
    };

    return chain;
  }

  static async countDocuments(query = {}) {
    const db = readDb();
    let results = [...db.boards];

    // Filter by _id
    if (query._id) {
      if (typeof query._id === 'object' && query._id.$in) {
        const searchIds = query._id.$in.map(id => String(id));
        results = results.filter(b => searchIds.includes(String(b._id)));
      } else {
        results = results.filter(b => String(b._id) === String(query._id));
      }
    }

    // Filter by deviceToken
    if (query.deviceToken) {
      if (typeof query.deviceToken === 'object') {
        if (query.deviceToken.$regex) {
          const regex = new RegExp(query.deviceToken.$regex, query.deviceToken.$options || 'i');
          results = results.filter(b => regex.test(b.deviceToken));
        } else if (query.deviceToken.$in) {
          results = results.filter(b => query.deviceToken.$in.includes(b.deviceToken));
        }
      } else {
        results = results.filter(b => b.deviceToken === query.deviceToken);
      }
    }

    if (query.$or) {
      results = results.filter(b => {
        return query.$or.some(condition => {
          const field = Object.keys(condition)[0];
          const queryVal = condition[field];
          if (queryVal && queryVal.$regex) {
            const regex = new RegExp(queryVal.$regex, 'i');
            return regex.test(b[field]);
          }
          return false;
        });
      });
    }

    if (query.status) {
      results = results.filter(b => b.status === query.status);
    }

    if (query.boardType) {
      results = results.filter(b => b.boardType === query.boardType);
    }

    return results.length;
  }

  static async distinct(field) {
    const db = readDb();
    const values = db.boards.map(b => b[field]);
    return [...new Set(values)];
  }

  static async create(data) {
    const db = readDb();
    const newBoard = {
      _id: 'brd_' + Math.random().toString(36).substr(2, 9),
      boardId: data.boardId,
      boardName: data.boardName,
      location: data.location,
      region: data.region,
      boardType: data.boardType,
      status: data.status || 'Offline',
      deviceToken: data.deviceToken || null,
      cpuUsage: data.cpuUsage || 0,
      memoryUsage: data.memoryUsage || 0,
      storageUsage: data.storageUsage || 0,
      syncStatus: data.syncStatus || 'Synced',
      uptime: data.uptime || 0,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    db.boards.push(newBoard);
    writeDb(db);
    return newBoard;
  }

  static async findById(id) {
    const db = readDb();
    const board = db.boards.find(b => b._id === id);
    if (!board) return null;
    
    // Add Mongoose instance methods like save() and deleteOne()
    return {
      ...board,
      save: async function() {
        const d = readDb();
        const idx = d.boards.findIndex(b => b._id === id);
        if (idx !== -1) {
          d.boards[idx] = { ...d.boards[idx], ...this };
          writeDb(d);
        }
        return this;
      },
      deleteOne: async function() {
        const d = readDb();
        d.boards = d.boards.filter(b => b._id !== id);
        writeDb(d);
        return { deletedCount: 1 };
      }
    };
  }

  static async deleteMany() {
    const db = readDb();
    db.boards = [];
    writeDb(db);
  }

  static async insertMany(boards) {
    const db = readDb();
    const prepped = boards.map(b => ({
      _id: 'brd_' + Math.random().toString(36).substr(2, 9),
      ...b,
      deviceToken: b.deviceToken || null,
      cpuUsage: b.cpuUsage || 0,
      memoryUsage: b.memoryUsage || 0,
      storageUsage: b.storageUsage || 0,
      syncStatus: b.syncStatus || 'Synced',
      uptime: b.uptime || 0,
      lastSeen: b.lastSeen instanceof Date ? b.lastSeen.toISOString() : (b.lastSeen || new Date().toISOString()),
      createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : (b.createdAt || new Date().toISOString())
    }));
    db.boards = [...db.boards, ...prepped];
    writeDb(db);
    return prepped;
  }
}

export default MockBoard;
