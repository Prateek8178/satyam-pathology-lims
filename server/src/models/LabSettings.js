const mongoose = require('mongoose');

const labSettingsSchema = new mongoose.Schema({
  labName: { type: String, default: 'Path-Lab Diagnostics' },
  logo: { type: String },
  address: { type: String },
  phone: { type: String },
  email: { type: String },
  registrationInfo: { type: String },
  footer: { type: String },
  disclaimer: { type: String },
  reportSettings: {
    headerTemplate: { type: String },
    footerText: { type: String },
    signature: { type: String },
    showQR: { type: Boolean, default: true },
    numberingPrefix: { type: String, default: 'REP' }
  },
  lisSettings: {
    connectionType: { type: String },
    host: { type: String },
    port: { type: Number },
    protocol: { type: String },
    username: { type: String },
    password: { type: String, select: false },
    autoReceive: { type: Boolean, default: false },
    pollingInterval: { type: Number, default: 30000 }
  },
  defaultTat: { type: Number, default: 24 },
  currency: { type: String, default: 'INR' },
  taxRate: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('LabSettings', labSettingsSchema);
