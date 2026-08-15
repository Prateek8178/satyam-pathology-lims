/**
 * Add remaining tests from user's comprehensive list
 * Run: node server/src/utils/seedMoreTests.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Test = require('../models/Test');
const TestParameter = require('../models/TestParameter');

const MORE_TESTS = [
  // HAEMATOLOGY (individual components + new)
  { testCode:'HB',      testName:'Hemoglobin (Hb)',              category:'Haematology',    sampleType:'EDTA Blood' },
  { testCode:'RBCCOUNT',testName:'RBC Count',                    category:'Haematology',    sampleType:'EDTA Blood' },
  { testCode:'WBCCOUNT',testName:'WBC Count (Total Leucocytes)', category:'Haematology',    sampleType:'EDTA Blood' },
  { testCode:'PLTCOUNT',testName:'Platelet Count',               category:'Haematology',    sampleType:'EDTA Blood' },
  { testCode:'MCV2',    testName:'MCV (Mean Corpuscular Volume)', category:'Haematology',    sampleType:'EDTA Blood' },
  { testCode:'MCH2',    testName:'MCH (Mean Corpuscular Haemoglobin)', category:'Haematology', sampleType:'EDTA Blood' },
  { testCode:'MCHC2',   testName:'MCHC',                         category:'Haematology',    sampleType:'EDTA Blood' },
  { testCode:'RDW2',    testName:'RDW (Red Cell Distribution Width)', category:'Haematology', sampleType:'EDTA Blood' },
  { testCode:'G6PD',    testName:'G6PD (Glucose-6-Phosphate Dehydrogenase)', category:'Haematology', sampleType:'EDTA Blood' },
  // BIOCHEMISTRY - individual
  { testCode:'GLOBULIN',testName:'Globulin',                     category:'Biochemistry',   sampleType:'Serum' },
  { testCode:'VLDL2',   testName:'VLDL Cholesterol',             category:'Biochemistry',   sampleType:'Serum' },
  { testCode:'LIPIDPRO',testName:'Lipid Profile (Full)',          category:'Biochemistry',   sampleType:'Serum' },
  { testCode:'TROPCOMB',testName:'Troponin I & T (Combined)',     category:'Cardiac',        sampleType:'Serum' },
  { testCode:'CKMB2',   testName:'CK-MB (Creatine Kinase-MB)',   category:'Cardiac',        sampleType:'Serum' },
  // URINE - individual components
  { testCode:'URINE_RM',testName:'Urine Routine & Microscopy',   category:'Urine',          sampleType:'Fresh Urine' },
  { testCode:'UACR',    testName:'Urine ACR (Albumin/Creatinine Ratio)', category:'Urine',  sampleType:'Spot Urine' },
  // MICROBIOLOGY
  { testCode:'GRAMST',  testName:'Gram Stain',                   category:'Microbiology',   sampleType:'Sample' },
  { testCode:'AFBST',   testName:'AFB Stain (Ziehl-Neelsen)',    category:'Microbiology',   sampleType:'Sputum/Sample' },
  { testCode:'KOHMNT',  testName:'KOH Mount (Fungal)',           category:'Microbiology',   sampleType:'Sample' },
  { testCode:'FUNGC',   testName:'Fungal Culture',               category:'Microbiology',   sampleType:'Sample' },
  { testCode:'ABSTEST', testName:'Antibiotic Sensitivity Test',  category:'Microbiology',   sampleType:'Sample' },
  { testCode:'SEMCS',   testName:'Semen Culture & Sensitivity',  category:'Microbiology',   sampleType:'Semen' },
  // SEROLOGY
  { testCode:'TPHA',    testName:'TPHA (Syphilis Confirmation)',  category:'Serology',       sampleType:'Serum' },
  { testCode:'C3',      testName:'Complement C3',                 category:'Serology',       sampleType:'Serum' },
  { testCode:'C4',      testName:'Complement C4',                 category:'Serology',       sampleType:'Serum' },
  { testCode:'COVID19', testName:'COVID-19 Antigen/Antibody',     category:'Serology',       sampleType:'Nasal Swab/Serum' },
  { testCode:'TORCH',   testName:'TORCH Profile',                 category:'Serology',       sampleType:'Serum' },
  { testCode:'DENGIGM', testName:'Dengue IgM',                   category:'Infectious',     sampleType:'Serum' },
  { testCode:'DENGIGG', testName:'Dengue IgG',                   category:'Infectious',     sampleType:'Serum' },
  { testCode:'TYPHIGM', testName:'Typhoid IgM (Typhidot)',        category:'Infectious',     sampleType:'Serum' },
  // HORMONES
  { testCode:'GH',      testName:'Growth Hormone (GH)',           category:'Hormones',       sampleType:'Serum' },
  { testCode:'ACTH',    testName:'ACTH (Adrenocorticotropic Hormone)', category:'Hormones',  sampleType:'EDTA Plasma' },
  { testCode:'PTH',     testName:'PTH (Parathyroid Hormone)',     category:'Hormones',       sampleType:'Serum' },
  // MOLECULAR / PCR
  { testCode:'RTPCR',   testName:'RT-PCR',                        category:'Molecular',      sampleType:'Sample' },
  { testCode:'DNAPCR',  testName:'DNA PCR',                       category:'Molecular',      sampleType:'Sample' },
  { testCode:'RNAPCR',  testName:'RNA PCR',                       category:'Molecular',      sampleType:'Sample' },
  { testCode:'HPVDNA',  testName:'HPV DNA Test',                  category:'Molecular',      sampleType:'Cervical Swab' },
  { testCode:'HBVDNA',  testName:'HBV DNA (Hepatitis B Viral Load)', category:'Molecular',   sampleType:'Serum' },
  { testCode:'HCVRNA',  testName:'HCV RNA (Hepatitis C Viral Load)', category:'Molecular',   sampleType:'Serum' },
  { testCode:'HIVVL',   testName:'HIV Viral Load (RNA PCR)',       category:'Molecular',      sampleType:'EDTA Blood' },
  { testCode:'MUTTEST', testName:'Gene Mutation Test',             category:'Molecular',      sampleType:'Sample' },
  { testCode:'GSCR',    testName:'Genetic Screening',              category:'Molecular',      sampleType:'EDTA Blood' },
  { testCode:'KARYOT',  testName:'Karyotyping',                   category:'Molecular',      sampleType:'EDTA Blood' },
  { testCode:'FISHTEST',testName:'FISH (Fluorescence In Situ Hybridization)', category:'Molecular', sampleType:'Sample' },
  { testCode:'NGS',     testName:'NGS (Next Generation Sequencing)', category:'Molecular',   sampleType:'Sample' },
  // HISTOPATHOLOGY
  { testCode:'BIOPEXAM',testName:'Biopsy Examination',            category:'Histopathology', sampleType:'Tissue' },
  { testCode:'CERVCBX', testName:'Cervical Biopsy',               category:'Histopathology', sampleType:'Cervical Tissue' },
  { testCode:'SKINBX',  testName:'Skin Biopsy',                   category:'Histopathology', sampleType:'Skin Tissue' },
  { testCode:'LIVERBX', testName:'Liver Biopsy',                  category:'Histopathology', sampleType:'Liver Tissue' },
  { testCode:'KIDNEYBX',testName:'Kidney Biopsy',                 category:'Histopathology', sampleType:'Kidney Tissue' },
  { testCode:'BMBX',    testName:'Bone Marrow Biopsy',            category:'Histopathology', sampleType:'Bone Marrow' },
  { testCode:'HISTOEX', testName:'Histological Examination',      category:'Histopathology', sampleType:'Tissue' },
  { testCode:'FROZENS', testName:'Frozen Section',                category:'Histopathology', sampleType:'Tissue' },
  { testCode:'IHC',     testName:'Immunohistochemistry (IHC)',    category:'Histopathology', sampleType:'Tissue' },
  // STOOL
  { testCode:'STORECM', testName:'Stool Routine & Microscopy',    category:'Stool',          sampleType:'Stool' },
  { testCode:'STORECYST',testName:'Stool for Ova & Cyst',         category:'Stool',          sampleType:'Stool' },
  { testCode:'STORERS', testName:'Stool Reducing Substance',      category:'Stool',          sampleType:'Stool' },
  { testCode:'CALP',    testName:'Calprotectin (Stool)',          category:'Stool',          sampleType:'Stool' },
  { testCode:'FECFAT',  testName:'Fecal Fat',                     category:'Stool',          sampleType:'Stool' },
  // BODY FLUIDS
  { testCode:'PLEURF',  testName:'Pleural Fluid Analysis',        category:'Body Fluids',    sampleType:'Pleural Fluid' },
  { testCode:'ASCITF',  testName:'Ascitic Fluid Analysis',        category:'Body Fluids',    sampleType:'Ascitic Fluid' },
  { testCode:'SYNOVF',  testName:'Synovial Fluid Analysis',       category:'Body Fluids',    sampleType:'Synovial Fluid' },
  { testCode:'PERICARD',testName:'Pericardial Fluid Analysis',    category:'Body Fluids',    sampleType:'Pericardial Fluid' },
  // BLOOD BANK
  { testCode:'ABOTYP',  testName:'ABO Blood Group Typing',        category:'Blood Bank',     sampleType:'EDTA Blood' },
  { testCode:'RHTYP',   testName:'Rh Typing',                     category:'Blood Bank',     sampleType:'EDTA Blood' },
  { testCode:'CROSSMCH',testName:'Cross Matching',                category:'Blood Bank',     sampleType:'EDTA Blood' },
  { testCode:'DAT',     testName:'Direct Coombs Test (DAT)',      category:'Blood Bank',     sampleType:'EDTA Blood' },
  { testCode:'IAT',     testName:'Indirect Coombs Test (IAT)',    category:'Blood Bank',     sampleType:'Serum' },
  { testCode:'ABSCREEN',testName:'Antibody Screening',            category:'Blood Bank',     sampleType:'Serum' },
  { testCode:'ABIDENT', testName:'Antibody Identification',       category:'Blood Bank',     sampleType:'Serum' },
];

// Parameters for new tests
const PARAMS = {
  HB:       [{ paramName:'Hemoglobin', paramCode:'HB2', unit:'g/dL', maleRange:{low:13.0,high:17.0}, femaleRange:{low:11.5,high:15.5}, displayOrder:1 }],
  RBCCOUNT: [{ paramName:'RBC Count', paramCode:'RBC2', unit:'million/µL', maleRange:{low:4.5,high:5.5}, femaleRange:{low:3.8,high:5.2}, displayOrder:1 }],
  WBCCOUNT: [{ paramName:'WBC Count', paramCode:'WBC2', unit:'thousand/µL', maleRange:{low:4.0,high:11.0}, femaleRange:{low:4.0,high:11.0}, displayOrder:1 }],
  PLTCOUNT: [{ paramName:'Platelet Count', paramCode:'PLT2', unit:'thousand/µL', maleRange:{low:150,high:450}, femaleRange:{low:150,high:450}, displayOrder:1 }],
  G6PD:     [{ paramName:'G6PD Activity', paramCode:'G6PD', unit:'U/gHb', maleRange:{low:4.6,high:13.5}, femaleRange:{low:4.6,high:13.5}, displayOrder:1 }],
  GLOBULIN: [{ paramName:'Globulin', paramCode:'GLOB2', unit:'g/dL', maleRange:{low:2.0,high:3.5}, femaleRange:{low:2.0,high:3.5}, displayOrder:1 }],
  VLDL2:    [{ paramName:'VLDL Cholesterol', paramCode:'VLDL2', unit:'mg/dL', maleRange:{low:0,high:30}, femaleRange:{low:0,high:30}, displayOrder:1 }],
  LIPIDPRO: [
    { paramName:'Total Cholesterol', paramCode:'LPCHOL', unit:'mg/dL', maleRange:{low:0,high:200}, femaleRange:{low:0,high:200}, displayOrder:1 },
    { paramName:'Triglycerides',     paramCode:'LPTG',   unit:'mg/dL', maleRange:{low:0,high:150}, femaleRange:{low:0,high:150}, displayOrder:2 },
    { paramName:'HDL Cholesterol',   paramCode:'LPHDL',  unit:'mg/dL', maleRange:{low:40,high:60}, femaleRange:{low:50,high:80}, displayOrder:3 },
    { paramName:'LDL Cholesterol',   paramCode:'LPLDL',  unit:'mg/dL', maleRange:{low:0,high:100}, femaleRange:{low:0,high:100}, displayOrder:4 },
    { paramName:'VLDL Cholesterol',  paramCode:'LPVLDL', unit:'mg/dL', maleRange:{low:0,high:30},  femaleRange:{low:0,high:30},  displayOrder:5 },
    { paramName:'Chol/HDL Ratio',    paramCode:'LPCHR',  unit:'',      maleRange:{low:0,high:5.0}, femaleRange:{low:0,high:4.5}, displayOrder:6 },
    { paramName:'LDL/HDL Ratio',     paramCode:'LPLHR',  unit:'',      maleRange:{low:0,high:3.5}, femaleRange:{low:0,high:3.0}, displayOrder:7 },
  ],
  UACR:     [{ paramName:'Albumin/Creatinine Ratio (ACR)', paramCode:'UACR', unit:'mg/g', maleRange:{low:0,high:30}, femaleRange:{low:0,high:30}, displayOrder:1 }],
  TPHA:     [{ paramName:'TPHA', paramCode:'TPHA', unit:'', displayOrder:1, resultType:'text', options:['Non-Reactive','Reactive'] }],
  C3:       [{ paramName:'Complement C3', paramCode:'C3', unit:'mg/dL', maleRange:{low:90,high:180}, femaleRange:{low:90,high:180}, displayOrder:1 }],
  C4:       [{ paramName:'Complement C4', paramCode:'C4', unit:'mg/dL', maleRange:{low:16,high:47}, femaleRange:{low:16,high:47}, displayOrder:1 }],
  COVID19:  [
    { paramName:'COVID-19 Antigen', paramCode:'COVIDAG', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] },
    { paramName:'COVID-19 IgM',     paramCode:'COVIDIGM',unit:'', displayOrder:2, resultType:'text', options:['Non-Reactive','Reactive'] },
    { paramName:'COVID-19 IgG',     paramCode:'COVIDIGG',unit:'', displayOrder:3, resultType:'text', options:['Non-Reactive','Reactive'] },
  ],
  TORCH: [
    { paramName:'Toxoplasma IgM',   paramCode:'TOXIGM', unit:'', displayOrder:1, resultType:'text', options:['Non-Reactive','Reactive'] },
    { paramName:'Toxoplasma IgG',   paramCode:'TOXIGG', unit:'', displayOrder:2, resultType:'text', options:['Non-Reactive','Reactive'] },
    { paramName:'Rubella IgM',      paramCode:'RUBIGM', unit:'', displayOrder:3, resultType:'text', options:['Non-Reactive','Reactive'] },
    { paramName:'Rubella IgG',      paramCode:'RUBIGG', unit:'', displayOrder:4, resultType:'text', options:['Non-Reactive','Reactive'] },
    { paramName:'CMV IgM',          paramCode:'CMVIGM', unit:'', displayOrder:5, resultType:'text', options:['Non-Reactive','Reactive'] },
    { paramName:'CMV IgG',          paramCode:'CMVIGG', unit:'', displayOrder:6, resultType:'text', options:['Non-Reactive','Reactive'] },
    { paramName:'HSV IgM',          paramCode:'HSVIGM', unit:'', displayOrder:7, resultType:'text', options:['Non-Reactive','Reactive'] },
    { paramName:'HSV IgG',          paramCode:'HSVIGG', unit:'', displayOrder:8, resultType:'text', options:['Non-Reactive','Reactive'] },
  ],
  GH:       [{ paramName:'Growth Hormone (GH)', paramCode:'GH', unit:'ng/mL', displayOrder:1 }],
  ACTH:     [{ paramName:'ACTH (Morning)', paramCode:'ACTH', unit:'pg/mL', maleRange:{low:7.2,high:63.3}, femaleRange:{low:7.2,high:63.3}, displayOrder:1 }],
  PTH:      [{ paramName:'PTH (Intact)', paramCode:'PTH', unit:'pg/mL', maleRange:{low:10,high:65}, femaleRange:{low:10,high:65}, displayOrder:1 }],
  DAT:      [{ paramName:'Direct Coombs Test (DAT)', paramCode:'DAT', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive','Weakly Positive'] }],
  IAT:      [{ paramName:'Indirect Coombs Test (IAT)', paramCode:'IAT', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] }],
  ABSCREEN: [{ paramName:'Antibody Screening', paramCode:'ABSCREEN', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] }],
  PLEURF: [
    { paramName:'Colour',          paramCode:'PLFCOL', unit:'', displayOrder:1, resultType:'text' },
    { paramName:'Appearance',      paramCode:'PLFAPP', unit:'', displayOrder:2, resultType:'text' },
    { paramName:'Total Cell Count',paramCode:'PLFTCC', unit:'/mm³', displayOrder:3 },
    { paramName:'Protein',         paramCode:'PLFPRO', unit:'g/dL', displayOrder:4 },
    { paramName:'Sugar',           paramCode:'PLFGLU', unit:'mg/dL', displayOrder:5 },
    { paramName:'LDH',             paramCode:'PLFLDH', unit:'U/L', displayOrder:6 },
    { paramName:'Adenosine Deaminase (ADA)', paramCode:'PLFADA', unit:'U/L', displayOrder:7 },
  ],
  SYNOVF: [
    { paramName:'Colour',          paramCode:'SFCOL', unit:'', displayOrder:1, resultType:'text' },
    { paramName:'Appearance',      paramCode:'SFAPP', unit:'', displayOrder:2, resultType:'text' },
    { paramName:'Viscosity',       paramCode:'SFVIS', unit:'', displayOrder:3, resultType:'text' },
    { paramName:'WBC Count',       paramCode:'SFWBC', unit:'/mm³', displayOrder:4 },
    { paramName:'Glucose',         paramCode:'SFGLU', unit:'mg/dL', displayOrder:5 },
    { paramName:'Protein',         paramCode:'SFPRO', unit:'g/dL', displayOrder:6 },
    { paramName:'Crystals',        paramCode:'SFCRYS', unit:'', displayOrder:7, resultType:'text' },
  ],
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
    let created = 0, skipped = 0, params = 0;

    for (const t of MORE_TESTS) {
      const exists = await Test.findOne({ testCode: t.testCode });
      if (exists) {
        skipped++;
        // Add params if missing
        const pd = PARAMS[t.testCode];
        if (pd && (await TestParameter.countDocuments({ test: exists._id })) === 0) {
          await TestParameter.insertMany(pd.map(p => ({ test: exists._id, isActive: true, ...p })));
          params += pd.length;
        }
        continue;
      }
      const test = await Test.create({ ...t, price: 0, tat: 24, isActive: true });
      created++;
      console.log(`✅ ${t.testCode} — ${t.testName}`);
      const pd = PARAMS[t.testCode];
      if (pd) {
        await TestParameter.insertMany(pd.map(p => ({ test: test._id, isActive: true, ...p })));
        params += pd.length;
      }
    }

    console.log(`\n📊 Summary:\n   Created: ${created}\n   Skipped: ${skipped}\n   Params: ${params}\n🎉 Done!`);
    process.exit(0);
  } catch (e) { console.error('❌', e.message); process.exit(1); }
}
seed();
