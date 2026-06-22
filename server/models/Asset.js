import mongoose from 'mongoose';
import MockAsset from './MockAsset.js';

const assetSchema = new mongoose.Schema({
  assetId: {
    type: String,
    required: true,
    unique: true
  },
  assetName: {
    type: String,
    required: true,
    trim: true
  },
  assetType: {
    type: String,
    required: true,
    enum: ['Image', 'Video']
  },
  fileUrl: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // In bytes
    required: true
  },
  duration: {
    type: Number, // In seconds, 0 for images
    default: 0
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: { createdAt: 'uploadedAt', updatedAt: false }
});

const MongooseAsset = mongoose.model('Asset', assetSchema);

class AssetWrapper {
  static get Model() {
    return global.useMockDb ? MockAsset : MongooseAsset;
  }
  static findOne(...args) { return this.Model.findOne(...args); }
  static find(...args) { return this.Model.find(...args); }
  static countDocuments(...args) { return this.Model.countDocuments(...args); }
  static create(...args) { return this.Model.create(...args); }
  static findById(...args) { return this.Model.findById(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default AssetWrapper;
