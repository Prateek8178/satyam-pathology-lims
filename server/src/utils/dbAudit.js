require('dotenv').config();
const mongoose = require('mongoose');

async function fullAudit() {
  await mongoose.connect(process.env.MONGO_URI);
  const Test = require('../models/Test');
  const TestParameter = require('../models/TestParameter');
  const SavedReport = require('../models/SavedReport');
  const Patient = require('../models/Patient');
  const LabSettings = require('../models/LabSettings');

  const tests = await Test.find({ isActive: true }).limit(200);
  const paramCounts = await TestParameter.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$test', count: { $sum: 1 } } }
  ]);
  const countMap = Object.fromEntries(paramCounts.map(p => [p._id.toString(), p.count]));
  
  console.log('=== DATABASE AUDIT ===');
  console.log('Total active tests:', tests.length);
  console.log('Total tests with params:', paramCounts.length);
  
  const testsMissingParams = tests.filter(t => !countMap[t._id.toString()]);
  console.log('Tests with NO parameters:', testsMissingParams.length);
  testsMissingParams.slice(0, 40).forEach(t => console.log(' -', t.testName, '(' + t.category + ')'));
  
  console.log('');
  console.log('=== TESTS WITH PARAMS (sample) ===');
  tests.filter(t => countMap[t._id.toString()]).slice(0, 30).forEach(t => {
    console.log(t.testName + ': ' + countMap[t._id.toString()] + ' params');
  });
  
  const settings = await LabSettings.findOne();
  console.log('');
  console.log('=== LAB SETTINGS ===');
  console.log('Lab Name:', settings?.labName);
  console.log('Doctor:', settings?.doctorName);
  console.log('Logo:', settings?.logo ? 'SET (length: ' + settings.logo.length + ')' : 'NOT SET');
  console.log('Signature:', settings?.signature ? 'SET (length: ' + settings.signature.length + ')' : 'NOT SET');
  
  const patientCount = await Patient.countDocuments();
  const reportCount = await SavedReport.countDocuments();
  const lastReport = await SavedReport.findOne().sort({ createdAt: -1 }).populate('patient', 'fullName');
  console.log('');
  console.log('=== COLLECTION COUNTS ===');
  console.log('Patients:', patientCount);
  console.log('Saved Reports:', reportCount);
  if (lastReport) {
    console.log('Last Report No:', lastReport.reportNo);
    console.log('Last Report Patient:', lastReport.patient?.fullName);
    console.log('Last Report sampleTime:', lastReport.sampleTime);
  }
  
  await mongoose.disconnect();
}
fullAudit().catch(console.error);
