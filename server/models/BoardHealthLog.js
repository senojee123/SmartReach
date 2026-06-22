import mongoose from 'mongoose';
import MockBoardHealthLog from './MockBoardHealthLog.js';

const boardHealthLogSchema = new mongoose.Schema({
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  cpuUsage: {
    type: Number,
    required: true
  },
  memoryUsage: {
    type: Number,
    required: true
  },
  storageUsage: {
    type: Number, // Percentage of storage used
    required: true
  },
  syncStatus: {
    type: String,
    enum: ['Synced', 'Syncing', 'Error'],
    default: 'Synced'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const MongooseBoardHealthLog = mongoose.model('BoardHealthLog', boardHealthLogSchema);

class BoardHealthLogWrapper {
  static get Model() {
    return global.useMockDb ? MockBoardHealthLog : MongooseBoardHealthLog;
  }
  static find(...args) { return this.Model.find(...args); }
  static create(...args) { return this.Model.create(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default BoardHealthLogWrapper;
