const mongoose = require('mongoose');

const testPackageSchema = new mongoose.Schema({
  packageName: { type: String, required: true },
  description: { type: String },
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  normalPrice: { type: Number, required: true },
  packagePrice: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('TestPackage', testPackageSchema);
