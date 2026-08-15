const mongoose = require('mongoose');

const testParameterSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  paramName: { type: String, required: true },
  paramCode: { type: String, required: true },
  resultType: { type: String, enum: ['numeric', 'text', 'calculated'], default: 'numeric' },
  unit: { type: String },
  maleRange: {
    low: { type: Number },
    high: { type: Number }
  },
  femaleRange: {
    low: { type: Number },
    high: { type: Number }
  },
  childRange: {
    low: { type: Number },
    high: { type: Number }
  },
  criticalLow: { type: Number },
  criticalHigh: { type: Number },
  decimalPrecision: { type: Number, default: 2 },
  displayOrder: { type: Number, default: 0 },
  options: [{ type: String, comment: 'for text type' }],
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TestParameter', testParameterSchema);
