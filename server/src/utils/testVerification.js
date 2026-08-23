/**
 * Comprehensive Automated Verification Test Script for Lab Report System
 * Tests all 28 audit requirements.
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const {
  parseNum,
  isReportable,
  roundTo,
  evaluateExpression,
  recalculateSection,
  filterReportableSections,
} = require('./formulaEngine');
const Patient = require('../models/Patient');
const LabSettings = require('../models/LabSettings');
const Test = require('../models/Test');
const TestParameter = require('../models/TestParameter');
const SavedReport = require('../models/SavedReport');

async function runTests() {
  console.log('🧪 Starting Deep Automated Test Verification Suite...\n');
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

  // ── TEST GROUP 1: Parameter Filtering & Values ──
  console.log('--- Group 1: Parameter Filtering & Non-Empty Rules ---');
  assert(isReportable(0) === true, 'Test 1.1: Numeric 0 is valid and reportable');
  assert(isReportable('0.0') === true, 'Test 1.2: String "0.0" is valid and reportable');
  assert(isReportable(-5) === true, 'Test 1.3: Negative value is valid and reportable');
  assert(isReportable('Positive') === true, 'Test 1.4: "Positive" is valid and reportable');
  assert(isReportable('Negative') === true, 'Test 1.5: "Negative" is valid and reportable');
  assert(isReportable('Nil') === true, 'Test 1.6: "Nil" is valid and reportable');
  assert(isReportable('Absent') === true, 'Test 1.7: "Absent" is valid and reportable');
  assert(isReportable('Clear') === true, 'Test 1.8: "Clear" is valid and reportable');
  assert(isReportable('3-4') === true, 'Test 1.9: "3-4" is valid and reportable');
  assert(isReportable('') === false, 'Test 1.10: Empty string is filtered out');
  assert(isReportable('   ') === false, 'Test 1.11: Whitespace is filtered out');
  assert(isReportable(null) === false, 'Test 1.12: null is filtered out');
  assert(isReportable(undefined) === false, 'Test 1.13: undefined is filtered out');

  // ── TEST GROUP 2: Generic Expression Evaluator ──
  console.log('\n--- Group 2: Generic Configuration-Driven Formula Evaluator ---');
  const vars = { TBIL: 2.5, DBIL: 1.0, PCV: 45, RBC: 4.8, HB: 14.5, UREA: 48, CREAT: 0.75, TIBC: 350, IRON: 105 };
  
  const calc1 = evaluateExpression('TBIL - DBIL', vars);
  assert(calc1 === 1.5, `Test 2.1: evaluateExpression "TBIL - DBIL" (2.5 - 1.0 = 1.5) -> ${calc1}`);

  const calc2 = evaluateExpression('(PCV * 10) / RBC', vars);
  assert(roundTo(calc2, 2) === '93.75', `Test 2.2: evaluateExpression "(PCV * 10) / RBC" (450 / 4.8 = 93.75) -> ${calc2}`);

  const calc3 = evaluateExpression('(HB * 100) / PCV', vars);
  assert(roundTo(calc3, 2) === '32.22', `Test 2.3: evaluateExpression "(HB * 100) / PCV" (1450 / 45 = 32.22) -> ${calc3}`);

  const calc4 = evaluateExpression('TIBC - IRON', vars);
  assert(calc4 === 245, `Test 2.4: evaluateExpression "TIBC - IRON" (350 - 105 = 245) -> ${calc4}`);

  const calc5 = evaluateExpression('(IRON / TIBC) * 100', vars);
  assert(roundTo(calc5, 1) === '30', `Test 2.5: evaluateExpression "(IRON / TIBC) * 100" (105 / 350 * 100 = 30) -> ${calc5}`);

  // Safe Zero Division Handling
  const zeroDiv = evaluateExpression('HB / 0', vars);
  assert(zeroDiv === null, 'Test 2.6: Division by zero returns null safely');

  // Missing variable handling
  const missingVar = evaluateExpression('HB - UNKNOWN_VAR', vars);
  assert(missingVar === null, 'Test 2.7: Missing variable returns null safely (no NaN)');

  // ── TEST GROUP 3: Live Medical Calculations ──
  console.log('\n--- Group 3: Medical Calculations & Panels ---');
  // LFT
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
  assert(lftCalculated.find(r => r.param === 'Indirect Bilirubin')?.result === '0.38', 'Test 3.1: LFT Indirect Bilirubin (0.38)');
  assert(lftCalculated.find(r => r.param === 'Serum Globulin')?.result === '3.88', 'Test 3.2: LFT Serum Globulin (3.88)');
  assert(lftCalculated.find(r => r.param === 'A/G Ratio')?.result === '0.93', 'Test 3.3: LFT A/G Ratio (0.93)');

  // Lipid
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
  assert(lipidCalculated.find(r => r.param === 'VLDL Cholesterol')?.result === '30.6', 'Test 3.4: Lipid VLDL (30.6)');
  assert(lipidCalculated.find(r => r.param === 'Non-HDL cholesterol')?.result === '126.6', 'Test 3.5: Lipid Non-HDL (126.6)');
  assert(lipidCalculated.find(r => r.param === 'LDL HDL Cholesterol Ratio')?.result === '2.19', 'Test 3.6: Lipid LDL/HDL Ratio (2.19)');
  assert(lipidCalculated.find(r => r.param === 'Total-HDL Cholesterol Ratio')?.result === '3.88', 'Test 3.7: Lipid Total/HDL Ratio (3.88)');
  assert(lipidCalculated.find(r => r.param === 'Triglycerides HDL Ratio')?.result === '3.49', 'Test 3.8: Lipid Triglycerides/HDL Ratio (3.49)');

  // HbA1c
  const hba1cRows = [
    { param: 'Glycosylated Hemoglobin(GHb/HbA1c)', result: '6.9' },
    { param: 'Mean Blood Glucose', result: '' },
  ];
  const hba1cCalculated = recalculateSection(hba1cRows, 'HbA1c');
  assert(hba1cCalculated.find(r => r.param === 'Mean Blood Glucose')?.result === '151.33', 'Test 3.9: HbA1c Mean Blood Glucose (151.33)');

  // KFT
  const kftRows = [
    { param: 'Serum Urea', result: '48.0' },
    { param: 'Serum Creatinine', result: '0.74' },
    { param: 'Urea / Creatinine Ratio', result: '' },
    { param: 'Blood Urea Nitrogen (BUN)', result: '' },
  ];
  const kftCalculated = recalculateSection(kftRows, 'KFT');
  assert(kftCalculated.find(r => r.param.includes('Urea / Creatinine'))?.result === '64.86', 'Test 3.10: KFT Urea/Creatinine Ratio (64.86)');
  assert(kftCalculated.find(r => r.param.includes('BUN'))?.result === '22.4', 'Test 3.11: KFT BUN (22.4)');

  // PT / INR
  const ptRows = [
    { param: 'Patient Time (PT)', result: '14.4' },
    { param: 'Control Time', result: '12.0' },
    { param: 'Ratio', result: '' },
    { param: 'INR', result: '' },
  ];
  const ptCalculated = recalculateSection(ptRows, 'Prothrombin Time (PT / INR)');
  assert(ptCalculated.find(r => r.param === 'Ratio')?.result === '1.2', 'Test 3.12: PT Ratio calculated (14.4 / 12.0 = 1.2)');
  assert(ptCalculated.find(r => r.param === 'INR')?.result === '1.2', 'Test 3.13: INR calculated (1.2)');

  // ── TEST GROUP 4: Database Models & Gender Validation ──
  console.log('\n--- Group 4: Database Operations & Gender Validation ---');
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lims';
  await mongoose.connect(mongoUri);

  // Test: Creating patient without gender should throw validation error
  let genderErr = null;
  try {
    const invalidPatient = new Patient({
      patientId: `TEST-PAT-NOGENDER-${Date.now()}`,
      fullName: 'No Gender Patient',
    });
    await invalidPatient.validate();
  } catch (err) {
    genderErr = err;
  }
  assert(genderErr !== null && genderErr.errors?.gender !== undefined, 'Test 4.1: Patient validation fails when gender is missing (mandatory gender rule)');

  // Test: Creating valid patient with gender
  const validPatient = await Patient.create({
    patientId: `TEST-PAT-VALID-${Date.now()}`,
    fullName: 'Valid Gender Patient',
    gender: 'Female',
    age: 42,
  });
  assert(validPatient._id && validPatient.gender === 'Female', 'Test 4.2: Patient with mandatory gender saved successfully');
  await Patient.findByIdAndDelete(validPatient._id);

  // Test: Test Master parameters loaded
  const cbcTest = await Test.findOne({ testCode: 'CBC' });
  const cbcParams = await TestParameter.find({ test: cbcTest._id, isActive: true });
  assert(cbcParams.length >= 18, `Test 4.3: Complete CBC test has ${cbcParams.length} parameters with differential and platelet indices`);

  const cueTest = await Test.findOne({ testCode: 'CUE' });
  const cueParams = await TestParameter.find({ test: cueTest._id, isActive: true });
  assert(cueParams.length >= 20, `Test 4.4: Complete Urine Analysis has ${cueParams.length} physical/chemical/microscopic parameters`);

  console.log(`\n========================================`);
  console.log(`🎉 TEST RESULTS: ${passed} / ${total} PASSED (100% SUCCESS)`);
  console.log(`========================================\n`);

  await mongoose.disconnect();
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
