import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import MockUser from './MockUser.js';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Super Admin', 'Admin'],
    default: 'Admin'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving (Mongoose mode)
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password (Mongoose mode)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const MongooseUser = mongoose.model('User', userSchema);

class UserWrapper {
  static get Model() {
    return global.useMockDb ? MockUser : MongooseUser;
  }
  static findOne(...args) { return this.Model.findOne(...args); }
  static findById(...args) { return this.Model.findById(...args); }
  static create(...args) { return this.Model.create(...args); }
  static deleteMany(...args) { return this.Model.deleteMany(...args); }
}

export default UserWrapper;
