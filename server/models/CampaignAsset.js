import mongoose from 'mongoose';
import MockCampaignAsset from './MockCampaignAsset.js';

const campaignAssetSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true
  },
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset',
    required: true
  }
});

// Compound index to prevent duplicate entries
campaignAssetSchema.index({ campaignId: 1, assetId: 1 }, { unique: true });

const MongooseCampaignAsset = mongoose.model('CampaignAsset', campaignAssetSchema);

class CampaignAssetWrapper {
  static get Model() {
    return global.useMockDb ? MockCampaignAsset : MongooseCampaignAsset;
  }
  static find(...args) { return this.Model.find(...args); }
  static create(...args) { return this.Model.create(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default CampaignAssetWrapper;
