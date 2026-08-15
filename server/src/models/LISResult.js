const mongoose = require('mongoose');

const lisResultSchema = new mongoose.Schema({
  rawSampleId: { type: String, required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  sample: { type: mongoose.Schema.Types.ObjectId, ref: 'Sample' },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  analyzer: { type: mongoose.Schema.Types.ObjectId, ref: 'Analyzer' },
  receivedAt: { type: Date, default: Date.now },
  rawData: { type: mongoose.Schema.Types.Mixed },
  parsedResults: [{
    paramCode: { type: String },
    paramName: { type: String },
    value: { type: String },
    unit: { type: String },
    referenceRange: { type: String }
  }],
  status: { type: String, enum: ['RECEIVED', 'PROCESSED', 'ERROR'], default: 'RECEIVED' },
  matchingStatus: { type: String, enum: ['MATCHED', 'UNMATCHED', 'PENDING'], default: 'PENDING' },
  processedAt: { type: Date },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('LISResult', lisResultSchema);
