import mongoose from 'mongoose';
import MockAlert from './MockAlert.js';

const alertSchema = new mongoose.Schema({
  alertId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true,
    trim: true
  },
  severity: {
    type: String,
    enum: ['Critical', 'Warning', 'Info'],
    default: 'Info'
  },
  priority: {
    type: Number,
    required: true,
    default: 100 // Default to Emergency level
  },
  targetBoards: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board'
  }],
  targetRegions: [{
    type: String
  }],
  targetGroups: [{
    type: String // boardType maps to group
  }],
  createdBy: {
    type: String, // email or User ID
    required: true
  },
  approvedBy: {
    type: String, // email or User ID
    default: null
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  startTime: {
    type: Date,
    required: true
  },
  expiryTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Active', 'Approved', 'Expired'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseAlert = mongoose.model('Alert', alertSchema);

class AlertWrapper {
  static get Model() {
    return global.useMockDb ? MockAlert : MongooseAlert;
  }
  static find(...args) { return this.Model.find(...args); }
  static findOne(...args) { return this.Model.findOne(...args); }
  static findById(...args) { return this.Model.findById(...args); }
  static create(...args) { return this.Model.create(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static countDocuments(...args) { return this.Model.countDocuments(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default AlertWrapper;
