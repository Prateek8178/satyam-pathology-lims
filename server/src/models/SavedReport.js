const mongoose = require('mongoose');
const { Schema } = mongoose;

const rowSchema = new Schema({
  param:    { type: String, default: '' },
  result:   { type: String, default: '' },
  unit:     { type: String, default: '' },
  refRange: { type: String, default: '' },
  flag:     { type: String, default: '' },
  isSubheader: { type: Boolean, default: false },
}, { _id: false });

const sectionSchema = new Schema({
  testName: { type: String, required: true },
  method:   { type: String, default: '' },
  comments: { type: String, default: '' },
  interpretation: { type: String, default: '' },
  rows: [rowSchema],
}, { _id: false });

const savedReportSchema = new Schema({
  patient:    { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  reportNo:   { type: String, default: '' },
  refDoctor:  { type: String, default: '' },
  sampleDate: { type: Date },
  sampleTime: { type: String, default: '' },
  sampleType: { type: String, default: '' }, // No hardcoded 'Blood'
  sections:   [sectionSchema],
  preparedBy: { type: String, default: '' },
  createdBy:  { type: Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('SavedReport', savedReportSchema);
