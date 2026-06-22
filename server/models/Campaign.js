import mongoose from 'mongoose';
import MockCampaign from './MockCampaign.js';

const campaignSchema = new mongoose.Schema({
  campaignId: {
    type: String,
    required: true,
    unique: true
  },
  campaignName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  campaignType: {
    type: String,
    required: true,
    enum: ['Sports', 'Religious & Cultural', 'Entertainment', 'Public Information']
  },
  status: {
    type: String,
    required: true,
    enum: ['Draft', 'Scheduled', 'Active', 'Completed', 'Paused'],
    default: 'Draft'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    default: '00:00'
  },
  endTime: {
    type: String,
    default: '23:59'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const MongooseCampaign = mongoose.model('Campaign', campaignSchema);

class CampaignWrapper {
  static get Model() {
    return global.useMockDb ? MockCampaign : MongooseCampaign;
  }
  static findOne(...args) { return this.Model.findOne(...args); }
  static find(...args) { return this.Model.find(...args); }
  static countDocuments(...args) { return this.Model.countDocuments(...args); }
  static create(...args) { return this.Model.create(...args); }
  static findById(...args) { return this.Model.findById(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default CampaignWrapper;
