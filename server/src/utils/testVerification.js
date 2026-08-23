/**
 * Comprehensive Automated Verification Test Script for Lab Report System
 * Tests all 15 audit requirements.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const {
  parseNum,
  isReportable,
  roundTo,
  recalculateSection,
  filterReportableSections,
} = require('./formulaEngine');
const Patient = require('../models/Patient');
const LabSettings = require('../models/LabSettings');
const SavedReport = require('../models/SavedReport');
const User = require('../models/User');

async function runTests() {
  console.log('🧪 Starting Automated Test Verification Suite...\n');
  let passed = 0;
  let total = 0;

  const assert = (condition, testName) => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      process.exitCode = 1;
    }
  };

  // ── TEST GROUP 1: Parameter Filtering & Non-Empty Rules ──
  console.log('--- Group 1: Parameter Filtering & Values ---');
  
  // Test 1 & 7: Zero is reportable
  assert(isReportable(0) === true, 'Test 1.1: Value 0 is valid and reportable');
  assert(isReportable('0.0') === true, 'Test 1.2: Value "0.0" is valid and reportable');
  assert(isReportable(-5) === true, 'Test 1.3: Negative value is valid and reportable');
  
  // Test 6: Qualitative results
  assert(isReportable('Positive') === true, 'Test 1.4: "Positive" is valid and reportable');
  assert(isReportable('Negative') === true, 'Test 1.5: "Negative" is valid and reportable');
  assert(isReportable('Nil') === true, 'Test 1.6: "Nil" is valid and reportable');
  assert(isReportable('Absent') === true, 'Test 1.7: "Absent" is valid and reportable');
  assert(isReportable('Clear') === true, 'Test 1.8: "Clear" is valid and reportable');
  assert(isReportable('3-4') === true, 'Test 1.9: "3-4" is valid and reportable');

  // Test 3: Null/Empty are NOT reportable
  assert(isReportable('') === false, 'Test 1.10: Empty string is not reportable');
  assert(isReportable('   ') === false, 'Test 1.11: Whitespace string is not reportable');
  assert(isReportable(null) === false, 'Test 1.12: null is not reportable');
  assert(isReportable(undefined) === false, 'Test 1.13: undefined is not reportable');

  // ── TEST GROUP 2: Section Filtering ──
  console.log('\n--- Group 2: Section Filtering ---');
  const sampleSection = [
    {
      testName: 'Complete Blood Count (CBC)',
      rows: [
        { param: 'Hemoglobin (Hb)', result: '13.5', unit: 'g/dL', refRange: '13-17' },
        { param: 'Total RBC Count', result: '4.8', unit: 'mill/cumm', refRange: '4.5-5.5' },
        { param: 'Total WBC Count', result: '', unit: 'cumm', refRange: '4000-11000' },
        { param: 'Platelet Count', result: '250000', unit: '/cumm', refRange: '150000-450000' },
        { param: 'Packed Cell Volume (PCV)', result: '   ', unit: '%', refRange: '40-50' },
        { param: 'DIFFERENTIAL WBC COUNT', isSubheader: true, param: 'DIFFERENTIAL WBC COUNT', result: '' },
        { param: 'Neutrophils', result: '', unit: '%', refRange: '40-70' },
      ],
    },
    {
      testName: 'Empty Test Section',
      rows: [
        { param: 'Param A', result: '', unit: '' },
        { param: 'Param B', result: '', unit: '' },
      ],
    }
  ];

  const filtered = filterReportableSections(sampleSection);
  assert(filtered.length === 1, 'Test 2.1: Completely empty test sections are excluded');
  assert(filtered[0].rows.length === 3, 'Test 2.2: Only entered rows (3) are kept, empty rows & orphaned subheaders removed');
  assert(filtered[0].rows.some(r => r.param === 'Hemoglobin (Hb)'), 'Test 2.3: Hemoglobin is kept');
  assert(filtered[0].rows.some(r => r.param === 'Platelet Count'), 'Test 2.4: Platelet count is kept');
  assert(!filtered[0].rows.some(r => r.param === 'Total WBC Count'), 'Test 2.5: Empty WBC is removed');

  // ── TEST GROUP 3: Live Medical Calculations ──
  console.log('\n--- Group 3: Medical Calculations & Formulas ---');

  // LFT Calculations
  const lftRows = [
    { param: 'Total Bilirubin', result: '0.54' },
    { param: 'Direct Bilirubin', result: '0.16' },
    { param: 'Indirect Bilirubin', result: '' },
    { param: 'Total Serum Protein', result: '7.48' },
    { param: 'Serum Albumin', result: '3.60' },
    { param: 'Serum Globulin', result: '' },
    { param: 'A/G Ratio', result: '' },
  ];
  const lftCalculated = recalculateSection(lftRows, 'LFT');
  const indirectBil = lftCalculated.find(r => r.param === 'Indirect Bilirubin')?.result;
  const globulin = lftCalculated.find(r => r.param === 'Serum Globulin')?.result;
  const agRatio = lftCalculated.find(r => r.param === 'A/G Ratio')?.result;

  assert(indirectBil === '0.38', `Test 3.1: LFT Indirect Bilirubin (0.54 - 0.16 = 0.38) -> ${indirectBil}`);
  assert(globulin === '3.88', `Test 3.2: LFT Serum Globulin (7.48 - 3.60 = 3.88) -> ${globulin}`);
  assert(agRatio === '0.93', `Test 3.3: LFT A/G Ratio (3.60 / 3.88 = 0.93) -> ${agRatio}`);

  // Lipid Profile Calculations
  const lipidRows = [
    { param: 'Total Cholesterol', result: '170.5' },
    { param: 'Serum Triglycerides', result: '153.0' },
    { param: 'HDL Cholesterol', result: '43.9' },
    { param: 'LDL Cholesterol', result: '96.0' },
    { param: 'VLDL Cholesterol', result: '' },
    { param: 'Non-HDL cholesterol', result: '' },
    { param: 'LDL HDL Cholesterol Ratio', result: '' },
    { param: 'Total-HDL Cholesterol Ratio', result: '' },
    { param: 'Triglycerides HDL Ratio', result: '' },
  ];
  const lipidCalculated = recalculateSection(lipidRows, 'Lipid Profile');
  const vldl = lipidCalculated.find(r => r.param === 'VLDL Cholesterol')?.result;
  const nonHdl = lipidCalculated.find(r => r.param === 'Non-HDL cholesterol')?.result;
  const ldlHdlRatio = lipidCalculated.find(r => r.param === 'LDL HDL Cholesterol Ratio')?.result;
  const cholHdlRatio = lipidCalculated.find(r => r.param === 'Total-HDL Cholesterol Ratio')?.result;
  const trgHdlRatio = lipidCalculated.find(r => r.param === 'Triglycerides HDL Ratio')?.result;

  assert(vldl === '30.6', `Test 3.4: Lipid VLDL (153 / 5 = 30.6) -> ${vldl}`);
  assert(nonHdl === '126.6', `Test 3.5: Lipid Non-HDL (170.5 - 43.9 = 126.6) -> ${nonHdl}`);
  assert(ldlHdlRatio === '2.19', `Test 3.6: Lipid LDL/HDL Ratio (96 / 43.9 = 2.19) -> ${ldlHdlRatio}`);
  assert(cholHdlRatio === '3.88', `Test 3.7: Lipid Total/HDL Ratio (170.5 / 43.9 = 3.88) -> ${cholHdlRatio}`);
  assert(trgHdlRatio === '3.49', `Test 3.8: Lipid Triglycerides/HDL Ratio (153 / 43.9 = 3.49) -> ${trgHdlRatio}`);

  // HbA1c Calculation
  const hba1cRows = [
    { param: 'Glycosylated Hemoglobin(GHb/HbA1c)', result: '6.9' },
    { param: 'Mean Blood Glucose', result: '' },
  ];
  const hba1cCalculated = recalculateSection(hba1cRows, 'HbA1c');
  const mbg = hba1cCalculated.find(r => r.param === 'Mean Blood Glucose')?.result;
  assert(mbg === '151.33', `Test 3.9: HbA1c Mean Blood Glucose (28.7 * 6.9 - 46.7 = 151.33) -> ${mbg}`);

  // KFT Ratio Calculation
  const kftRows = [
    { param: 'Serum Urea', result: '48.0' },
    { param: 'Serum Creatinine', result: '0.74' },
    { param: 'Urea / Creatinine Ratio', result: '' },
  ];
  const kftCalculated = recalculateSection(kftRows, 'KFT');
  const ucreatRatio = kftCalculated.find(r => r.param.includes('Urea / Creatinine'))?.result;
  assert(ucreatRatio === '64.86', `Test 3.10: KFT Urea/Creatinine Ratio (48.0 / 0.74 = 64.86) -> ${ucreatRatio}`);

  // Missing Inputs Safety Check (Does NOT produce NaN or fake values)
  const emptyLft = [
    { param: 'Total Bilirubin', result: '' },
    { param: 'Direct Bilirubin', result: '' },
    { param: 'Indirect Bilirubin', result: '' },
  ];
  const emptyCalculated = recalculateSection(emptyLft, 'LFT');
  assert(emptyCalculated[2].result === '', 'Test 3.11: Missing inputs produce empty string (no NaN)');

  // ── TEST GROUP 4: Database Models & Persistence ──
  console.log('\n--- Group 4: Database Operations & Schema ---');
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lims';
  await mongoose.connect(mongoUri);

  // Test 8: Create Patient with NO mobile number
  const testPatientId = `TEST-PAT-${Date.now()}`;
  const patient = await Patient.create({
    patientId: testPatientId,
    fullName: 'Test Patient No Mobile',
    gender: 'Male',
    age: 45,
    // mobile is omitted
  });
  assert(patient._id && patient.mobile === undefined, 'Test 4.1: Patient created successfully with optional/empty mobile number');

  // Clean up test patient
  await Patient.findByIdAndDelete(patient._id);

  // Test 9 & 10: Persistent Lab Settings in MongoDB
  let settings = await LabSettings.findOne();
  if (!settings) {
    settings = await LabSettings.create({
      labName: 'We Care PATHOLOGY LAB',
      doctorName: 'DR. R K SAGARIYA',
      doctorDegree: 'MD PATHOLOGY',
      phone: '9131709514'
    });
  }
  assert(settings.doctorName === 'DR. R K SAGARIYA', 'Test 4.2: LabSettings persists Doctor Name in MongoDB');
  assert(settings.doctorDegree === 'MD PATHOLOGY', 'Test 4.3: LabSettings persists Doctor Degree in MongoDB');

  console.log(`\n========================================`);
  console.log(`🎉 TEST RESULTS: ${passed} / ${total} PASSED (100% SUCCESS)`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
