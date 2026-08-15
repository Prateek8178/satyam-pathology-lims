const mongoose = require('mongoose');

const sampleSchema = new mongoose.Schema({
  sampleId: { type: String, unique: true, required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  sampleType: { type: String },
  collectionDate: { type: Date },
  collectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['PENDING', 'COLLECTED', 'RECEIVED', 'REJECTED', 'PROCESSED'], default: 'PENDING' },
  barcode: { type: String },
  rejectionReason: { type: String },
  notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Sample', sampleSchema);
