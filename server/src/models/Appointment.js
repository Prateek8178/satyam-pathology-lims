const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  date: { type: Date, required: true },
  timeSlot: { type: String, required: true },
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  status: { type: String, enum: ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'], default: 'SCHEDULED' },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
