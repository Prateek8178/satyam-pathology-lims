const mongoose = require('mongoose');

const labSettingsSchema = new mongoose.Schema({
  labName: { type: String, default: 'We Care PATHOLOGY LAB' },
  tagline: { type: String, default: 'Accurate Results Timely Delivered' },
  logo: { type: String, default: null }, // Base64 data URL or remote URL
  signature: { type: String, default: null }, // Base64 data URL or remote URL
  address: { type: String, default: '1283, BT Road near Maruti Marbal, Choti Bajariya, Garha Jabalpur (M.P.)' },
  phone: { type: String, default: '9131709514' },
  customerSupport: { type: String, default: '9131709514' },
  email: { type: String, default: 'lp93403115@gmail.com' },
  doctorName: { type: String, default: 'DR. R K SAGARIYA' },
  doctorDegree: { type: String, default: 'MD PATHOLOGY' },
  registrationInfo: { type: String, default: 'NABL Accredited Diagnostic Center' },
  footer: { type: String, default: 'Results are valid for clinical correlation.' },
  disclaimer: {
    type: String,
    default: 'Note: Pathological Test Have Technical, For Any Disparity, retested Examination Are Required. No Legal Liability Is Accepted. Clinical Correlation Is Also Requested.'
  },
  notes: {
    type: String,
    default: 'Results of investigation depends upon test methods and instrument used. Interpretation may vary from lab to lab, our Pathology will not assume any liability for any controversy in interpretation or report. Claims if any are subject to Jabalpur (M.P.) Jurisdiction.'
  },
  reportSettings: {
    headerTemplate: { type: String },
    footerText: { type: String },
    signature: { type: String },
    showQR: { type: Boolean, default: true },
    numberingPrefix: { type: String, default: 'STP' }
  },
  lisSettings: {
    connectionType: { type: String, default: 'mock' },
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
