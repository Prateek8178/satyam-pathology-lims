const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, enum: ['CASH', 'UPI', 'CARD', 'ONLINE'], required: true },
  transactionId: { type: String },
  receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receivedAt: { type: Date, default: Date.now },
  notes: { type: String },
  isRefund: { type: Boolean, default: false },
  refundAmount: { type: Number },
  refundReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
