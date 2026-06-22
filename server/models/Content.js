import mongoose from 'mongoose';
import MockContent from './MockContent.js';

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'Emergency Alert',
      'Safety Message',
      'Operational Content',
      'Sponsorship',
      'Advertisement',
      'Public Information',
      'Fallback Content'
    ]
  },
  priority: {
    type: Number,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 10 // seconds
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
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const MongooseContent = mongoose.model('Content', contentSchema);

class ContentWrapper {
  static get Model() {
    return global.useMockDb ? MockContent : MongooseContent;
  }
  static find(...args) { return this.Model.find(...args); }
  static findOne(...args) { return this.Model.findOne(...args); }
  static findById(...args) { return this.Model.findById(...args); }
  static create(...args) { return this.Model.create(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static countDocuments(...args) { return this.Model.countDocuments(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default ContentWrapper;
