const mongoose = require('mongoose');

const reportTemplateSchema = new mongoose.Schema({
  labName: { type: String },
  logo: { type: String, comment: 'file path' },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  registrationInfo: { type: String },
  header: { type: String },
  footer: { type: String },
  signature: { type: String, comment: 'file path' },
  authorizedPerson: { type: String },
  disclaimer: { type: String },
  showQR: { type: Boolean, default: true },
  showReferenceRange: { type: Boolean, default: true },
  footerText: { type: String },
  isDefault: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('ReportTemplate', reportTemplateSchema);
