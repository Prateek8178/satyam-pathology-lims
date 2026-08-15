const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, lowercase: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  mobile: { type: String, trim: true },
  password: { type: String, required: true, select: false },
  fullName: { type: String, required: true, trim: true },
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'LAB_TECHNICIAN'],
    required: true
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  resetPasswordToken: { type: String, select: false },
  resetPasswordExpiry: { type: Date, select: false },
  department: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
