const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qualification: { type: String },
  specialization: { type: String },
  mobile: { type: String, required: true },
  email: { type: String },
  clinic: { type: String },
  address: { type: String },
  notes: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
