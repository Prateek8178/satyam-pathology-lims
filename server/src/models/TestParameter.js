const mongoose = require('mongoose');

const testParameterSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  paramName: { type: String, required: true },
  paramCode: { type: String, required: true },
  resultType: { type: String, enum: ['numeric', 'text', 'calculated', 'subheader'], default: 'numeric' },
  unit: { type: String, default: '' },
  textRange: { type: String, default: '' }, // For qualitative/custom ranges like "0.5 - 5.0", "Negative", "30 - 100"
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
  options: [{ type: String, comment: 'for text type options' }],
  isSubheader: { type: Boolean, default: false },
  group: { type: String, default: '' },
  formula: { type: String, default: '' }, // e.g. "TBIL - DBIL"
  interpretation: { type: String, default: '' },
  comments: { type: String, default: '' },
  method: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('TestParameter', testParameterSchema);
