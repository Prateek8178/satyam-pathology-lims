const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String, enum: ['APPOINTMENT_CONFIRMATION', 'SAMPLE_COLLECTED', 'REPORT_READY', 'PAYMENT_RECEIVED', 'DUE_PAYMENT'] },
  message: { type: String, required: true },
  channel: { type: String, enum: ['EMAIL', 'SMS', 'WHATSAPP'] },
  status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
  sentAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
