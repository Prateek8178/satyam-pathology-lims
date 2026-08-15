const mongoose = require('mongoose');

const homeCollectionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  address: {
    street: { type: String },
    city: { type: String },
    state: { type: String },
    pincode: { type: String }
  },
  date: { type: Date, required: true },
  timeSlot: { type: String },
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  assignedTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['REQUESTED', 'ASSIGNED', 'ON_THE_WAY', 'COLLECTED', 'COMPLETED', 'CANCELLED'], default: 'REQUESTED' },
  collectionNotes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('HomeCollection', homeCollectionSchema);
