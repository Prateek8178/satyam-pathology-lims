const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  sample: { type: mongoose.Schema.Types.ObjectId, ref: 'Sample' },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  lisResult: { type: mongoose.Schema.Types.ObjectId, ref: 'LISResult' },
  parameterResults: [{
    parameter: { type: mongoose.Schema.Types.ObjectId, ref: 'TestParameter' },
    value: { type: String },
    numericValue: { type: Number },
    unit: { type: String },
    referenceRange: { type: String },
    flag: { type: String, enum: ['NORMAL', 'HIGH', 'LOW', 'CRITICAL', 'ABNORMAL'] },
    remarks: { type: String }
  }],
  source: { type: String, enum: ['LIS', 'MANUAL'], required: true },
  status: { type: String, enum: ['PENDING', 'ENTERED', 'VERIFIED', 'PRINTED'], default: 'PENDING' },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  enteredAt: { type: Date, default: Date.now },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  technicianRemarks: { type: String },
  pathologistRemarks: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
