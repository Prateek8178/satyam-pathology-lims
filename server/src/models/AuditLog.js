const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  role: { type: String },
  action: { type: String, required: true, index: true },
  entity: { type: String, required: true, index: true },
  entityId: { type: String },
  oldValue: { type: mongoose.Schema.Types.Mixed },
  newValue: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  timestamp: { type: Date, default: Date.now, index: true }
}, { timestamps: false });

module.exports = mongoose.model('AuditLog', auditLogSchema);
