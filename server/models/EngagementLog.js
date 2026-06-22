import mongoose from 'mongoose';
import MockEngagementLog from './MockEngagementLog.js';

const engagementLogSchema = new mongoose.Schema({
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  },
  type: {
    type: String,
    enum: ['Scan', 'Poll'],
    required: true
  },
  details: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const MongooseEngagementLog = mongoose.model('EngagementLog', engagementLogSchema);

class EngagementLogWrapper {
  static get Model() {
    return global.useMockDb ? MockEngagementLog : MongooseEngagementLog;
  }
  static find(...args) { return this.Model.find(...args); }
  static create(...args) { return this.Model.create(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default EngagementLogWrapper;
