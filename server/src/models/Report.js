const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: { type: String, unique: true, required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  result: { type: mongoose.Schema.Types.ObjectId, ref: 'Result', required: true },
  reportType: { type: String, enum: ['WITH_HEADER', 'WITHOUT_HEADER'], required: true },
  pdfPath: { type: String },
  status: { type: String, enum: ['DRAFT', 'GENERATED', 'FINAL'], default: 'DRAFT' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  generatedAt: { type: Date },
  verificationStatus: { type: String, enum: ['VERIFIED', 'UNVERIFIED'], default: 'UNVERIFIED' },
  downloadCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
