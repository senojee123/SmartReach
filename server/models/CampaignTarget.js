import mongoose from 'mongoose';
import MockCampaignTarget from './MockCampaignTarget.js';

const campaignTargetSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    required: true
  }
});

// Compound index to prevent duplicate entries
campaignTargetSchema.index({ campaignId: 1, boardId: 1 }, { unique: true });

const MongooseCampaignTarget = mongoose.model('CampaignTarget', campaignTargetSchema);

class CampaignTargetWrapper {
  static get Model() {
    return global.useMockDb ? MockCampaignTarget : MongooseCampaignTarget;
  }
  static find(...args) { return this.Model.find(...args); }
  static create(...args) { return this.Model.create(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static distinct(...args) { return this.Model.distinct(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default CampaignTargetWrapper;
