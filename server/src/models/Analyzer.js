const mongoose = require('mongoose');

const analyzerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String },
  model: { type: String },
  serialNumber: { type: String },
  location: { type: String },
  connection: {
    type: { type: String },
    host: { type: String },
    port: { type: Number },
    protocol: { type: String }
  },
  isActive: { type: Boolean, default: true },
  lastSeen: { type: Date },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Analyzer', analyzerSchema);
