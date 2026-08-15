const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true, required: true },
  fullName: { type: String, required: true, trim: true },
  fatherHusbandName: { type: String },
  dob: { type: Date },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  mobile: { type: String, required: true },
  email: { type: String },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', 'Unknown'] },
  referringDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  referredByName:  { type: String },   // free-text: "Self", doctor name, etc.

  notes: { type: String },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
