import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

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

class MockUser {
  static async findOne({ email }) {
    const db = readDb();
    const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;
    return {
      ...user,
      matchPassword: async function(enteredPassword) {
        return await bcrypt.compare(enteredPassword, this.password);
      }
    };
  }

  static findById(id) {
    const db = readDb();
    const user = db.users.find(u => u._id === id);
    const preppedUser = user ? { ...user } : null;

    const query = {
      select: function(fields) {
        if (preppedUser && fields.includes('-password')) {
          delete preppedUser.password;
        }
        return Promise.resolve(preppedUser);
      },
      then: function(resolve) {
        resolve(preppedUser);
      }
    };
    return query;
  }

  static async create(data) {
    const db = readDb();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    
    const newUser = {
      _id: 'usr_' + Math.random().toString(36).substr(2, 9),
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'Admin',
      createdAt: new Date().toISOString()
    };
    
    db.users.push(newUser);
    writeDb(db);
    return newUser;
  }

  static async deleteMany() {
    const db = readDb();
    db.users = [];
    writeDb(db);
  }
}

export default MockUser;
