const mongoose = require('mongoose');

const labSettingsSchema = new mongoose.Schema({
  labName: { type: String, default: 'SATYAM PATHOLOGY CENTER' },
  tagline: { type: String, default: 'Accurate | Caring | Instant' },
  logo: { type: String, default: null }, // Base64 data URL or remote URL
  signature: { type: String, default: null }, // Base64 data URL or remote URL
  address: { type: String, default: 'Inside Gopi Medical, Sheetla Mai Chauraha, Jabalpur' },
  phone: { type: String, default: '9165144073, 9340311506, 9516128613' },
  customerSupport: { type: String, default: '9165144073' },
  email: { type: String, default: 'lp93403115@gmail.com' },
  doctorName: { type: String, default: 'Dr. KHUSHBOO SHAH' },
  doctorDegree: { type: String, default: '(MD. Pathology)' },
  registrationInfo: { type: String, default: 'Accurate | Caring | Instant' },
  footer: { type: String, default: 'Results are valid for clinical correlation.' },
  disclaimer: {
    type: String,
    default: 'Results of investigation depends upon test methods and instrument used. Interpretation may vary from lab to lab, our Pathology will not assume any liability for any controversy in interpretation or report. Claims if any are subject to Jabalpur (M.P.) Jurisdiction.'
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
