const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
  testName: { type: String, required: true, trim: true },
  testCode: { type: String, required: true, unique: true, uppercase: true },
  category: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  sampleType: { type: String, required: true },
  department: { type: String },
  tat: { type: Number, default: 24, comment: 'hours' },
  isActive: { type: Boolean, default: true },
  analyzerCode: { type: String, comment: 'LIS/Analyzer mapping code' },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
