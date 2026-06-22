import mongoose from 'mongoose';
import MockDeviceActivation from './MockDeviceActivation.js';

const deviceActivationSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  boardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Board',
    default: null
  },
  deviceToken: {
    type: String,
    default: null
  },
  isActivated: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Expire after 10 minutes
  }
});

const MongooseDeviceActivation = mongoose.model('DeviceActivation', deviceActivationSchema);

class DeviceActivationWrapper {
  static get Model() {
    return global.useMockDb ? MockDeviceActivation : MongooseDeviceActivation;
  }
  static findOne(...args) { return this.Model.findOne(...args); }
  static create(...args) { return this.Model.create(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
}

export default DeviceActivationWrapper;
