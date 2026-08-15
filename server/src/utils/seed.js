// ⚠️ DEV ONLY - DO NOT RUN IN PRODUCTION
// Run with: node src/utils/seed.js

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Test = require('../models/Test');
const TestParameter = require('../models/TestParameter');
const TestPackage = require('../models/TestPackage');
const LabSettings = require('../models/LabSettings');
const ReportTemplate = require('../models/ReportTemplate');

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🌱 Connected to MongoDB for seeding...');

    // Clear all collections
    await Promise.all([
      User.deleteMany({}), Doctor.deleteMany({}), Patient.deleteMany({}),
      Test.deleteMany({}), TestParameter.deleteMany({}), TestPackage.deleteMany({}),
      LabSettings.deleteMany({}), ReportTemplate.deleteMany({})
    ]);
    console.log('🗑️  Cleared existing data');

    // Create Users
    const users = await User.create([
      { username: 'admin', email: 'admin@gmail.com', password: 'Admin@123', fullName: 'Super Admin', role: 'SUPER_ADMIN', mobile: '9000000001' },
      { username: 'tech', email: 'tech@lims.dev', password: 'Tech@123', fullName: 'Ravi Kumar', role: 'LAB_TECHNICIAN', mobile: '9000000003' },
    ]);
    console.log(`✅ Created ${users.length} users`);

    // Create Doctors
    const doctors = await Doctor.create([
      { name: 'Dr. Anil Sharma', qualification: 'MBBS, MD', specialization: 'General Medicine', mobile: '9100000001', email: 'anil@clinic.com', clinic: 'Sharma Clinic' },
      { name: 'Dr. Meera Joshi', qualification: 'MBBS, MS', specialization: 'Gynecology', mobile: '9100000002', email: 'meera@clinic.com', clinic: 'Joshi Hospital' },
      { name: 'Dr. Pradeep Nair', qualification: 'MBBS, DM', specialization: 'Cardiology', mobile: '9100000003', email: 'pradeep@clinic.com', clinic: 'Heart Care Center' },
    ]);
    console.log(`✅ Created ${doctors.length} doctors`);

    // Create Patients
    const patients = await Patient.create([
      { patientId: 'PAT-2026-000001', fullName: 'Rahul Sharma', age: 32, gender: 'Male', mobile: '9200000001', email: 'rahul@gmail.com', bloodGroup: 'B+', referringDoctor: doctors[0]._id, address: { street: '12 MG Road', city: 'Delhi', state: 'Delhi', pincode: '110001' } },
      { patientId: 'PAT-2026-000002', fullName: 'Amit Verma', age: 45, gender: 'Male', mobile: '9200000002', bloodGroup: 'O+', referringDoctor: doctors[1]._id, address: { city: 'Mumbai', state: 'Maharashtra' } },
      { patientId: 'PAT-2026-000003', fullName: 'Neha Patel', age: 28, gender: 'Female', mobile: '9200000003', bloodGroup: 'A+', referringDoctor: doctors[2]._id, address: { city: 'Ahmedabad', state: 'Gujarat' } },
    ]);
    console.log(`✅ Created ${patients.length} patients`);

    // Create Tests
    const cbcTest = await Test.create({ testName: 'Complete Blood Count', testCode: 'CBC', category: 'Haematology', price: 250, sampleType: 'Blood (EDTA)', department: 'Haematology', tat: 4, analyzerCode: 'CBC-001', isActive: true });
    const lftTest = await Test.create({ testName: 'Liver Function Test', testCode: 'LFT', category: 'Biochemistry', price: 450, sampleType: 'Blood (Serum)', department: 'Biochemistry', tat: 6, analyzerCode: 'LFT-001', isActive: true });
    const kftTest = await Test.create({ testName: 'Kidney Function Test', testCode: 'KFT', category: 'Biochemistry', price: 400, sampleType: 'Blood (Serum)', department: 'Biochemistry', tat: 6, analyzerCode: 'KFT-001', isActive: true });
    const tshTest = await Test.create({ testName: 'Thyroid Stimulating Hormone', testCode: 'TSH', category: 'Endocrinology', price: 350, sampleType: 'Blood (Serum)', department: 'Biochemistry', tat: 8, analyzerCode: 'TSH-001', isActive: true });
    const lipidTest = await Test.create({ testName: 'Lipid Profile', testCode: 'LIPID', category: 'Biochemistry', price: 500, sampleType: 'Blood (Serum)', department: 'Biochemistry', tat: 6, isActive: true });
    const urineTest = await Test.create({ testName: 'Urine Routine Examination', testCode: 'URE', category: 'Urine', price: 150, sampleType: 'Urine', department: 'Microbiology', tat: 3, isActive: true });
    console.log('✅ Created 6 tests');

    // CBC Parameters
    await TestParameter.create([
      { test: cbcTest._id, paramName: 'Hemoglobin', paramCode: 'HGB', unit: 'g/dL', resultType: 'numeric', maleRange: { low: 13.0, high: 17.0 }, femaleRange: { low: 11.5, high: 16.0 }, childRange: { low: 11.0, high: 16.0 }, criticalLow: 7.0, criticalHigh: 20.0, decimalPrecision: 1, displayOrder: 1 },
      { test: cbcTest._id, paramName: 'RBC Count', paramCode: 'RBC', unit: 'million/µL', resultType: 'numeric', maleRange: { low: 4.5, high: 5.9 }, femaleRange: { low: 4.0, high: 5.2 }, decimalPrecision: 2, displayOrder: 2 },
      { test: cbcTest._id, paramName: 'WBC Count', paramCode: 'WBC', unit: 'thousand/µL', resultType: 'numeric', maleRange: { low: 4.5, high: 11.0 }, femaleRange: { low: 4.5, high: 11.0 }, criticalHigh: 30.0, decimalPrecision: 1, displayOrder: 3 },
      { test: cbcTest._id, paramName: 'Platelet Count', paramCode: 'PLT', unit: 'thousand/µL', resultType: 'numeric', maleRange: { low: 150, high: 400 }, femaleRange: { low: 150, high: 400 }, criticalLow: 50, criticalHigh: 1000, decimalPrecision: 0, displayOrder: 4 },
      { test: cbcTest._id, paramName: 'MCV', paramCode: 'MCV', unit: 'fL', resultType: 'numeric', maleRange: { low: 80, high: 100 }, femaleRange: { low: 80, high: 100 }, decimalPrecision: 1, displayOrder: 5 },
      { test: cbcTest._id, paramName: 'MCH', paramCode: 'MCH', unit: 'pg', resultType: 'numeric', maleRange: { low: 27, high: 34 }, femaleRange: { low: 27, high: 34 }, decimalPrecision: 1, displayOrder: 6 },
      { test: cbcTest._id, paramName: 'MCHC', paramCode: 'MCHC', unit: 'g/dL', resultType: 'numeric', maleRange: { low: 32, high: 36 }, femaleRange: { low: 32, high: 36 }, decimalPrecision: 1, displayOrder: 7 },
      { test: cbcTest._id, paramName: 'PCV/Hematocrit', paramCode: 'HCT', unit: '%', resultType: 'numeric', maleRange: { low: 40, high: 52 }, femaleRange: { low: 36, high: 48 }, decimalPrecision: 1, displayOrder: 8 },
    ]);

    // LFT Parameters
    await TestParameter.create([
      { test: lftTest._id, paramName: 'Total Bilirubin', paramCode: 'TBIL', unit: 'mg/dL', resultType: 'numeric', maleRange: { low: 0.2, high: 1.2 }, femaleRange: { low: 0.2, high: 1.2 }, criticalHigh: 15.0, decimalPrecision: 2, displayOrder: 1 },
      { test: lftTest._id, paramName: 'SGOT (AST)', paramCode: 'SGOT', unit: 'U/L', resultType: 'numeric', maleRange: { low: 10, high: 40 }, femaleRange: { low: 10, high: 35 }, criticalHigh: 1000, decimalPrecision: 0, displayOrder: 2 },
      { test: lftTest._id, paramName: 'SGPT (ALT)', paramCode: 'SGPT', unit: 'U/L', resultType: 'numeric', maleRange: { low: 7, high: 56 }, femaleRange: { low: 7, high: 45 }, criticalHigh: 1000, decimalPrecision: 0, displayOrder: 3 },
      { test: lftTest._id, paramName: 'Alkaline Phosphatase', paramCode: 'ALP', unit: 'U/L', resultType: 'numeric', maleRange: { low: 44, high: 147 }, femaleRange: { low: 44, high: 147 }, decimalPrecision: 0, displayOrder: 4 },
      { test: lftTest._id, paramName: 'Total Protein', paramCode: 'TP', unit: 'g/dL', resultType: 'numeric', maleRange: { low: 6.3, high: 8.2 }, femaleRange: { low: 6.3, high: 8.2 }, decimalPrecision: 1, displayOrder: 5 },
      { test: lftTest._id, paramName: 'Albumin', paramCode: 'ALB', unit: 'g/dL', resultType: 'numeric', maleRange: { low: 3.5, high: 5.0 }, femaleRange: { low: 3.5, high: 5.0 }, decimalPrecision: 1, displayOrder: 6 },
    ]);

    // KFT Parameters
    await TestParameter.create([
      { test: kftTest._id, paramName: 'Serum Creatinine', paramCode: 'CREAT', unit: 'mg/dL', resultType: 'numeric', maleRange: { low: 0.7, high: 1.3 }, femaleRange: { low: 0.6, high: 1.1 }, criticalHigh: 10.0, decimalPrecision: 2, displayOrder: 1 },
      { test: kftTest._id, paramName: 'Blood Urea Nitrogen', paramCode: 'BUN', unit: 'mg/dL', resultType: 'numeric', maleRange: { low: 7, high: 20 }, femaleRange: { low: 7, high: 20 }, criticalHigh: 100, decimalPrecision: 0, displayOrder: 2 },
      { test: kftTest._id, paramName: 'Serum Urea', paramCode: 'UREA', unit: 'mg/dL', resultType: 'numeric', maleRange: { low: 15, high: 45 }, femaleRange: { low: 15, high: 45 }, decimalPrecision: 0, displayOrder: 3 },
      { test: kftTest._id, paramName: 'Uric Acid', paramCode: 'UA', unit: 'mg/dL', resultType: 'numeric', maleRange: { low: 3.5, high: 7.2 }, femaleRange: { low: 2.6, high: 6.0 }, criticalHigh: 13.0, decimalPrecision: 1, displayOrder: 4 },
      { test: kftTest._id, paramName: 'eGFR', paramCode: 'EGFR', unit: 'mL/min/1.73m²', resultType: 'numeric', maleRange: { low: 60, high: 120 }, femaleRange: { low: 60, high: 120 }, criticalLow: 15, decimalPrecision: 0, displayOrder: 5 },
    ]);

    // TSH
    await TestParameter.create([
      { test: tshTest._id, paramName: 'TSH', paramCode: 'TSH', unit: 'µIU/mL', resultType: 'numeric', maleRange: { low: 0.4, high: 4.0 }, femaleRange: { low: 0.4, high: 4.0 }, criticalLow: 0.01, criticalHigh: 100, decimalPrecision: 3, displayOrder: 1 },
    ]);
    console.log('✅ Created test parameters');

    // Test Package
    await TestPackage.create({
      packageName: 'Full Body Health Checkup',
      description: 'Comprehensive health screening package',
      tests: [cbcTest._id, lftTest._id, kftTest._id, tshTest._id, lipidTest._id],
      normalPrice: 1950,
      packagePrice: 1499,
      discount: 23,
      isActive: true,
      createdBy: users[0]._id
    });
    console.log('✅ Created test package');

    // Lab Settings
    await LabSettings.create({
      labName: 'PathLab Diagnostics',
      address: 'B-42, Health District, New Delhi - 110001',
      phone: '+91-11-4567-8901',
      email: 'info@pathlabdiagnostics.com',
      registrationInfo: 'Reg. No: DL-LAB-2022-001234 | NABL Accredited',
      footer: 'Results are valid for 30 days from the date of collection.',
      disclaimer: 'This report is confidential and intended solely for the referred physician. Consult your physician for interpretation.',
      reportSettings: {
        showQR: true,
        footerText: 'PathLab Diagnostics - Accuracy You Can Trust. Call: +91-11-4567-8901',
        authorizedPerson: 'Dr. Rajesh Verma MD (Pathology)'
      },
      lisSettings: {
        connectionType: 'mock',
        autoReceive: false,
        pollingInterval: 30000
      },
      defaultTat: 24,
      currency: 'INR',
      taxRate: 0
    });
    console.log('✅ Created lab settings');

    // Report Template
    await ReportTemplate.create({
      labName: 'PathLab Diagnostics',
      address: 'B-42, Health District, New Delhi - 110001',
      phone: '+91-11-4567-8901',
      email: 'info@pathlabdiagnostics.com',
      registrationInfo: 'NABL Accredited | Reg. No: DL-LAB-2022-001234',
      authorizedPerson: 'Dr. Rajesh Verma MD',
      disclaimer: 'This report is for physician use only.',
      showQR: true,
      showReferenceRange: true,
      isDefault: true
    });
    console.log('✅ Created report template');

    console.log('\n🎉 SEED COMPLETE!');
    console.log('\n📋 DEV CREDENTIALS:');
    console.log('┌────────────────┬──────────────────────┬─────────────────┐');
    console.log('│ Role           │ Email                │ Password        │');
    console.log('├────────────────┼──────────────────────┼─────────────────┤');
    console.log('│ SUPER_ADMIN    │ admin@gmail.com      │ Admin@123       │');
    console.log('│ LAB_TECHNICIAN │ tech@lims.dev        │ Tech@123        │');
    console.log('└────────────────┴──────────────────────┴─────────────────┘');
    console.log('\n⚠️  These are DEV ONLY credentials. Change in production.');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

seed();
