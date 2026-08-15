const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  orderItems: [{
    test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
    package: { type: mongoose.Schema.Types.ObjectId, ref: 'TestPackage' },
    name: { type: String },
    price: { type: Number },
    type: { type: String, enum: ['test', 'package'] }
  }],
  priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
  notes: { type: String },
  status: { type: String, enum: ['CREATED', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'], default: 'CREATED' },
  totalAmount: { type: Number, default: 0 },
  invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
