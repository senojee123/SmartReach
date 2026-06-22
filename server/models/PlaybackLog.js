import mongoose from 'mongoose';
import MockPlaybackLog from './MockPlaybackLog.js';

const playbackLogSchema = new mongoose.Schema({
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
  duration: {
    type: Number, // Playback duration in seconds
    required: true
  },
  verified: {
    type: Boolean,
    default: true
  },
  playedAt: {
    type: Date,
    default: Date.now
  }
});

const MongoosePlaybackLog = mongoose.model('PlaybackLog', playbackLogSchema);

class PlaybackLogWrapper {
  static get Model() {
    return global.useMockDb ? MockPlaybackLog : MongoosePlaybackLog;
  }
  static find(...args) { return this.Model.find(...args); }
  static create(...args) { return this.Model.create(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
  static insertMany(...args) { return this.Model.insertMany(...args); }
}

export default PlaybackLogWrapper;
