/**
 * Seed test parameters for CBC, KFT, LFT, TSH, LIPID, URE
 * Run: node server/src/utils/seedParams.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Test = require('../models/Test');
const TestParameter = require('../models/TestParameter');

const PARAMS = {
  CBC: [
    { paramName: 'HEMOGLOBIN',          paramCode: 'HGB',  unit: 'gm/dl',    maleRange: { low: 13.0, high: 17.0 }, femaleRange: { low: 11.5, high: 15.5 }, displayOrder: 1 },
    { paramName: 'HCT (PCV)',           paramCode: 'HCT',  unit: '%',         maleRange: { low: 40, high: 54 },   femaleRange: { low: 36, high: 48 },   displayOrder: 2 },
    { paramName: 'TOTAL ERYTHROCYTES (RBC)', paramCode: 'RBC', unit: '10^6/µL', maleRange: { low: 4.5, high: 5.5 }, femaleRange: { low: 3.8, high: 5.2 }, displayOrder: 3 },
    { paramName: 'MCV',                 paramCode: 'MCV',  unit: 'fL',        maleRange: { low: 80, high: 96 },   femaleRange: { low: 80, high: 96 },   displayOrder: 4 },
    { paramName: 'MCH',                 paramCode: 'MCH',  unit: 'pg',        maleRange: { low: 26, high: 35 },   femaleRange: { low: 26, high: 35 },   displayOrder: 5 },
    { paramName: 'MCHC',                paramCode: 'MCHC', unit: 'g/dL',      maleRange: { low: 29, high: 37 },   femaleRange: { low: 29, high: 37 },   displayOrder: 6 },
    { paramName: 'RDW-CV',              paramCode: 'RDW',  unit: '%',         maleRange: { low: 11, high: 14 },   femaleRange: { low: 11, high: 14 },   displayOrder: 7 },
    { paramName: 'TOTAL LEUCOCYTES (WBC)', paramCode: 'WBC', unit: '10^3/µL', maleRange: { low: 4, high: 11 },    femaleRange: { low: 4, high: 11 },    displayOrder: 8 },
    { paramName: 'NEUTROPHILS',         paramCode: 'NEU',  unit: '%',         maleRange: { low: 40, high: 75 },   femaleRange: { low: 40, high: 75 },   displayOrder: 9 },
    { paramName: 'LYMPHOCYTES',         paramCode: 'LYM',  unit: '%',         maleRange: { low: 20, high: 45 },   femaleRange: { low: 20, high: 45 },   displayOrder: 10 },
    { paramName: 'MONOCYTES',           paramCode: 'MON',  unit: '%',         maleRange: { low: 2, high: 10 },    femaleRange: { low: 2, high: 10 },    displayOrder: 11 },
    { paramName: 'EOSINOPHILS',         paramCode: 'EOS',  unit: '%',         maleRange: { low: 1, high: 6 },     femaleRange: { low: 1, high: 6 },     displayOrder: 12 },
    { paramName: 'BASOPHILS',           paramCode: 'BAS',  unit: '%',         maleRange: { low: 0, high: 1 },     femaleRange: { low: 0, high: 1 },     displayOrder: 13 },
    { paramName: 'PLATELET COUNT',      paramCode: 'PLT',  unit: '10^3/µL',   maleRange: { low: 150, high: 450 }, femaleRange: { low: 150, high: 450 }, displayOrder: 14 },
    { paramName: 'MPV',                 paramCode: 'MPV',  unit: 'fL',        maleRange: { low: 7, high: 11 },    femaleRange: { low: 7, high: 11 },    displayOrder: 15 },
  ],
  KFT: [
    { paramName: 'BLOOD UREA',          paramCode: 'BUN',  unit: 'mg/dl',  maleRange: { low: 17, high: 43 },   femaleRange: { low: 17, high: 43 },  displayOrder: 1 },
    { paramName: 'SERUM CREATININE',    paramCode: 'CREAT',unit: 'mg/dl',  maleRange: { low: 0.7, high: 1.3 }, femaleRange: { low: 0.6, high: 1.1 }, displayOrder: 2 },
    { paramName: 'URIC ACID',           paramCode: 'UA',   unit: 'mg/dl',  maleRange: { low: 3.4, high: 7.0 }, femaleRange: { low: 2.4, high: 5.7 }, displayOrder: 3 },
    { paramName: 'SODIUM (Na+)',         paramCode: 'NA',   unit: 'mEq/L',  maleRange: { low: 136, high: 145 }, femaleRange: { low: 136, high: 145 }, displayOrder: 4 },
    { paramName: 'POTASSIUM (K+)',       paramCode: 'K',    unit: 'mEq/L',  maleRange: { low: 3.5, high: 5.0 }, femaleRange: { low: 3.5, high: 5.0 }, displayOrder: 5 },
    { paramName: 'CHLORIDE (Cl-)',       paramCode: 'CL',   unit: 'mEq/L',  maleRange: { low: 98, high: 106 },  femaleRange: { low: 98, high: 106 },  displayOrder: 6 },
    { paramName: 'CALCIUM',             paramCode: 'CA',   unit: 'mg/dl',  maleRange: { low: 8.5, high: 10.5 },femaleRange: { low: 8.5, high: 10.5 },displayOrder: 7 },
    { paramName: 'eGFR',                paramCode: 'EGFR', unit: 'mL/min', maleRange: { low: 90, high: 120 },  femaleRange: { low: 90, high: 120 },  displayOrder: 8 },
  ],
  LFT: [
    { paramName: 'TOTAL BILIRUBIN',     paramCode: 'TBIL',  unit: 'mg/dl', maleRange: { low: 0.2, high: 1.2 }, femaleRange: { low: 0.2, high: 1.2 }, displayOrder: 1 },
    { paramName: 'DIRECT BILIRUBIN',    paramCode: 'DBIL',  unit: 'mg/dl', maleRange: { low: 0.0, high: 0.3 }, femaleRange: { low: 0.0, high: 0.3 }, displayOrder: 2 },
    { paramName: 'INDIRECT BILIRUBIN',  paramCode: 'IBIL',  unit: 'mg/dl', maleRange: { low: 0.1, high: 0.8 }, femaleRange: { low: 0.1, high: 0.8 }, displayOrder: 3 },
    { paramName: 'SGOT (AST)',          paramCode: 'AST',   unit: 'U/L',   maleRange: { low: 10, high: 40 },   femaleRange: { low: 10, high: 32 },   displayOrder: 4 },
    { paramName: 'SGPT (ALT)',          paramCode: 'ALT',   unit: 'U/L',   maleRange: { low: 7, high: 56 },    femaleRange: { low: 7, high: 35 },    displayOrder: 5 },
    { paramName: 'ALP',                 paramCode: 'ALP',   unit: 'U/L',   maleRange: { low: 40, high: 129 },  femaleRange: { low: 35, high: 104 },  displayOrder: 6 },
    { paramName: 'TOTAL PROTEIN',       paramCode: 'TP',    unit: 'g/dl',  maleRange: { low: 6.4, high: 8.3 }, femaleRange: { low: 6.4, high: 8.3 }, displayOrder: 7 },
    { paramName: 'ALBUMIN',             paramCode: 'ALB',   unit: 'g/dl',  maleRange: { low: 3.5, high: 5.0 }, femaleRange: { low: 3.5, high: 5.0 }, displayOrder: 8 },
    { paramName: 'GLOBULIN',            paramCode: 'GLOB',  unit: 'g/dl',  maleRange: { low: 2.0, high: 3.5 }, femaleRange: { low: 2.0, high: 3.5 }, displayOrder: 9 },
    { paramName: 'A/G RATIO',           paramCode: 'AGR',   unit: '',      maleRange: { low: 1.0, high: 2.5 }, femaleRange: { low: 1.0, high: 2.5 }, displayOrder: 10 },
    { paramName: 'GGT',                 paramCode: 'GGT',   unit: 'U/L',   maleRange: { low: 9, high: 48 },    femaleRange: { low: 9, high: 36 },    displayOrder: 11 },
  ],
  TSH: [
    { paramName: 'TSH (Thyroid Stimulating Hormone)', paramCode: 'TSH', unit: 'mIU/L', maleRange: { low: 0.4, high: 4.0 }, femaleRange: { low: 0.4, high: 4.0 }, displayOrder: 1 },
    { paramName: 'T3 (Total Triiodothyronine)',        paramCode: 'T3',  unit: 'ng/dL', maleRange: { low: 80, high: 200 },  femaleRange: { low: 80, high: 200 },  displayOrder: 2 },
    { paramName: 'T4 (Total Thyroxine)',               paramCode: 'T4',  unit: 'µg/dL', maleRange: { low: 5.1, high: 14.1 },femaleRange: { low: 5.1, high: 14.1 },displayOrder: 3 },
  ],
  LIPID: [
    { paramName: 'TOTAL CHOLESTEROL',   paramCode: 'CHOL',  unit: 'mg/dl', maleRange: { low: 0, high: 200 },   femaleRange: { low: 0, high: 200 },   displayOrder: 1 },
    { paramName: 'TRIGLYCERIDES',       paramCode: 'TG',    unit: 'mg/dl', maleRange: { low: 0, high: 150 },   femaleRange: { low: 0, high: 150 },   displayOrder: 2 },
    { paramName: 'HDL CHOLESTEROL',     paramCode: 'HDL',   unit: 'mg/dl', maleRange: { low: 40, high: 60 },   femaleRange: { low: 50, high: 80 },   displayOrder: 3 },
    { paramName: 'LDL CHOLESTEROL',     paramCode: 'LDL',   unit: 'mg/dl', maleRange: { low: 0, high: 100 },   femaleRange: { low: 0, high: 100 },   displayOrder: 4 },
    { paramName: 'VLDL CHOLESTEROL',    paramCode: 'VLDL',  unit: 'mg/dl', maleRange: { low: 0, high: 30 },    femaleRange: { low: 0, high: 30 },    displayOrder: 5 },
    { paramName: 'CHOL/HDL RATIO',      paramCode: 'CHR',   unit: '',      maleRange: { low: 0, high: 5.0 },   femaleRange: { low: 0, high: 4.5 },   displayOrder: 6 },
    { paramName: 'LDL/HDL RATIO',       paramCode: 'LHR',   unit: '',      maleRange: { low: 0, high: 3.5 },   femaleRange: { low: 0, high: 3.0 },   displayOrder: 7 },
  ],
  URE: [
    { paramName: 'COLOUR',              paramCode: 'UCOL',  unit: '',       maleRange: null, femaleRange: null, displayOrder: 1, resultType: 'text', options: ['Yellow','Pale Yellow','Dark Yellow','Amber','Red','Colorless'] },
    { paramName: 'APPEARANCE',          paramCode: 'UAPP',  unit: '',       maleRange: null, femaleRange: null, displayOrder: 2, resultType: 'text', options: ['Clear','Slightly Turbid','Turbid'] },
    { paramName: 'pH',                  paramCode: 'UPH',   unit: '',      maleRange: { low: 4.5, high: 8.0 }, femaleRange: { low: 4.5, high: 8.0 }, displayOrder: 3 },
    { paramName: 'SPECIFIC GRAVITY',    paramCode: 'USG',   unit: '',      maleRange: { low: 1.005, high: 1.030 }, femaleRange: { low: 1.005, high: 1.030 }, displayOrder: 4 },
    { paramName: 'PROTEIN',             paramCode: 'UPRO',  unit: '',       maleRange: null, femaleRange: null, displayOrder: 5, resultType: 'text', options: ['Nil','Trace','+','++','+++'] },
    { paramName: 'GLUCOSE',             paramCode: 'UGLU',  unit: '',       maleRange: null, femaleRange: null, displayOrder: 6, resultType: 'text', options: ['Nil','Trace','+','++','+++'] },
    { paramName: 'KETONES',             paramCode: 'UKET',  unit: '',       maleRange: null, femaleRange: null, displayOrder: 7, resultType: 'text', options: ['Nil','Trace','+'] },
    { paramName: 'BLOOD',               paramCode: 'UBLD',  unit: '',       maleRange: null, femaleRange: null, displayOrder: 8, resultType: 'text', options: ['Nil','Trace','+','++'] },
    { paramName: 'BILIRUBIN',           paramCode: 'UBIL',  unit: '',       maleRange: null, femaleRange: null, displayOrder: 9, resultType: 'text', options: ['Nil','Trace','+'] },
    { paramName: 'UROBILINOGEN',        paramCode: 'UUROB', unit: 'EU/dL',  maleRange: { low: 0.1, high: 1.0 }, femaleRange: { low: 0.1, high: 1.0 }, displayOrder: 10 },
    { paramName: 'NITRITE',             paramCode: 'UNIT',  unit: '',       maleRange: null, femaleRange: null, displayOrder: 11, resultType: 'text', options: ['Negative','Positive'] },
    { paramName: 'LEUCOCYTES (WBC)',    paramCode: 'UWBC',  unit: '/HPF',   maleRange: { low: 0, high: 5 },     femaleRange: { low: 0, high: 8 },     displayOrder: 12 },
    { paramName: 'RBC',                 paramCode: 'URBC',  unit: '/HPF',   maleRange: { low: 0, high: 2 },     femaleRange: { low: 0, high: 3 },     displayOrder: 13 },
    { paramName: 'EPITHELIAL CELLS',    paramCode: 'UEPI',  unit: '/HPF',   maleRange: { low: 0, high: 5 },     femaleRange: { low: 0, high: 8 },     displayOrder: 14 },
    { paramName: 'CASTS',               paramCode: 'UCAS',  unit: '',       maleRange: null, femaleRange: null, displayOrder: 15, resultType: 'text', options: ['Nil','Hyaline','Granular'] },
    { paramName: 'CRYSTALS',            paramCode: 'UCRYS', unit: '',       maleRange: null, femaleRange: null, displayOrder: 16, resultType: 'text', options: ['Nil','Urate','Oxalate','Phosphate'] },
    { paramName: 'BACTERIA',            paramCode: 'UBAC',  unit: '',       maleRange: null, femaleRange: null, displayOrder: 17, resultType: 'text', options: ['Nil','Few','Moderate','Many'] },
  ],
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    const tests = await Test.find({});
    let total = 0;

    for (const test of tests) {
      const paramDefs = PARAMS[test.testCode];
      if (!paramDefs) { console.log(`⏭  No params for ${test.testCode}`); continue; }

      // Delete existing params for this test
      await TestParameter.deleteMany({ test: test._id });

      const docs = paramDefs.map(p => ({
        test: test._id,
        paramName: p.paramName,
        paramCode: p.paramCode,
        unit: p.unit || '',
        resultType: p.resultType || 'numeric',
        options: p.options || [],
        maleRange: p.maleRange,
        femaleRange: p.femaleRange,
        displayOrder: p.displayOrder,
        isActive: true,
      }));

      await TestParameter.insertMany(docs);
      console.log(`✅ ${test.testCode}: ${docs.length} params seeded`);
      total += docs.length;
    }

    console.log(`\n🎉 Total: ${total} parameters seeded!`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
