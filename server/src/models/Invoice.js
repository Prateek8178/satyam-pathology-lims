const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceId: { type: String, unique: true, required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  items: [{
    type: { type: String },
    refId: { type: String },
    name: { type: String },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number },
    discount: { type: Number, default: 0 },
    total: { type: Number }
  }],
  subtotal: { type: Number, default: 0 },
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  taxAmount: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  dueAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['PENDING', 'PARTIAL', 'PAID', 'CANCELLED'], default: 'PENDING' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
