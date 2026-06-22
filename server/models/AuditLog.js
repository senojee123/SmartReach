import mongoose from 'mongoose';
import MockAuditLog from './MockAuditLog.js';

const auditLogSchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  user: {
    type: String,
    required: true
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    default: null
  },
  boardName: {
    type: String,
    default: null
  },
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    default: null
  },
  alertTitle: {
    type: String,
    default: null
  },
  action: {
    type: String,
    required: true,
    enum: [
      'Alert Created',
      'Alert Approved',
      'Alert Delivered',
      'Alert Displayed',
      'Alert Expired',
      'Playlist Resumed'
    ]
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
});

const MongooseAuditLog = mongoose.model('AuditLog', auditLogSchema);

class AuditLogWrapper {
  static get Model() {
    return global.useMockDb ? MockAuditLog : MongooseAuditLog;
  }
  static find(...args) { return this.Model.find(...args); }
  static create(...args) { return this.Model.create(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static countDocuments(...args) { return this.Model.countDocuments(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default AuditLogWrapper;
