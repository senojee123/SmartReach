import mongoose from 'mongoose';
import MockBoard from './MockBoard.js';

const boardSchema = new mongoose.Schema({
  boardId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  boardName: {
    type: String,
    required: true,
    trim: true
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    required: true,
    trim: true
  },
  boardType: {
    type: String,
    required: true,
    enum: ['Sports', 'Religious & Cultural', 'Entertainment', 'Public Information']
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Offline', 'Maintenance'],
    default: 'Offline'
  },
  deviceToken: {
    type: String,
    default: null
  },
  cpuUsage: {
    type: Number,
    default: 0
  },
  memoryUsage: {
    type: Number,
    default: 0
  },
  storageUsage: {
    type: Number,
    default: 0
  },
  syncStatus: {
    type: String,
    enum: ['Synced', 'Syncing', 'Error'],
    default: 'Synced'
  },
  uptime: {
    type: Number,
    default: 0
  },
  deviceId: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    default: null
  },
  ipAddress: {
    type: String,
    default: ''
  },
  lastSeen: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseBoard = mongoose.model('Board', boardSchema);

class BoardWrapper {
  static get Model() {
    return global.useMockDb ? MockBoard : MongooseBoard;
  }
  static findOne(...args) { return this.Model.findOne(...args); }
  static find(...args) { return this.Model.find(...args); }
  static countDocuments(...args) { return this.Model.countDocuments(...args); }
  static distinct(...args) { return this.Model.distinct(...args); }
  static create(...args) { return this.Model.create(...args); }
  static findById(...args) { return this.Model.findById(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default BoardWrapper;
