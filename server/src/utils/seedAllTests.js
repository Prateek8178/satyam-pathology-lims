require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Test = require('../models/Test');
const TestParameter = require('../models/TestParameter');

const TESTS = [
  // SAMPLE REPORT TESTS & PANELS
  {
    testCode: 'CBC',
    testName: 'Complete Blood Count (CBC)',
    category: 'Haematology',
    sampleType: 'EDTA Blood',
    tat: 4,
    method: 'Automated 3-part / 5-part cell counter (Impedance & Colorimetric)',
    comments: 'EDTA Whole Blood - Test done on automated cell counter. All abnormal Hemograms are reviewed and confirmed microscopically.'
  },
  {
    testCode: 'LFT',
    testName: 'Liver Function Test (LFT)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Spectrophotometry / Enzymatic',
    comments: 'Liver function tests are blood tests used to help diagnose and monitor liver disease or damage.'
  },
  {
    testCode: 'KFT',
    testName: 'Kidney Function Test (KFT)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Kinetic & Colorimetric',
    comments: 'Urea is the end product of protein metabolism synthesized in liver and excreted by kidneys. Creatinine is a catabolic product of creatine phosphate.'
  },
  {
    testCode: 'LIPID',
    testName: 'Lipid Profile',
    category: 'Biochemistry',
    sampleType: 'Serum (Fasting 10-12 hrs)',
    tat: 4,
    method: 'Enzymatic / Direct / Friedewald Calculation',
    comments: 'Triglycerides, HDL, LDL, and cholesterol ratios help evaluate cardiovascular risk.'
  },
  {
    testCode: 'HBA1C',
    testName: 'HbA1c',
    category: 'Biochemistry',
    sampleType: 'EDTA Blood',
    tat: 4,
    method: 'HPLC / Immunoturbidimetry',
    comments: 'HbA1c is an indicator of glycemic control representing average blood glucose over the past 2-3 months.'
  },
  {
    testCode: 'TFT',
    testName: 'Thyroid Function Test (TFT)',
    category: 'Thyroid',
    sampleType: 'Serum',
    tat: 6,
    method: 'CLIA / CMIA',
    comments: 'Assay results should be interpreted in context to the clinical condition and history.'
  },
  {
    testCode: 'CUE',
    testName: 'Complete Urine Analysis (CUE)',
    category: 'Urine',
    sampleType: 'Mid-stream Urine',
    tat: 2,
    method: 'Physical, Reagent Strip Reflectance & Microscopy',
    comments: 'Urine routine examination for kidney, metabolic and urinary tract evaluation.'
  },
  {
    testCode: 'CRP',
    testName: 'C-Reactive Protein (CRP)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 2,
    method: 'Immunoturbidometry',
    comments: 'CRP is an acute phase reactant used for clinical diagnosis and monitoring of inflammation and infection.'
  },
  {
    testCode: 'VITD',
    testName: '25 Hydroxy Vitamin D',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 24,
    method: 'CLIA',
    comments: '25-hydroxy vitamin D blood test evaluates vitamin D sufficiency (30-100 ng/mL).'
  },
  {
    testCode: 'VITB12',
    testName: 'Vitamin B12',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 24,
    method: 'CLIA / ECLIA',
    comments: 'Vitamin B12 is essential for neurological function and red blood cell production.'
  },
  {
    testCode: 'RAFACT',
    testName: 'Rheumatoid Factor',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 4,
    method: 'Latex Agglutination / Immunoturbidimetry',
    comments: 'Rheumatoid factor (RF) is an autoantibody protein used in evaluation of rheumatoid arthritis.'
  },
  {
    testCode: 'FBS',
    testName: 'Fasting Blood Glucose',
    category: 'Biochemistry',
    sampleType: 'Fluoride Plasma / Serum',
    tat: 2,
    method: 'GOD-POD Enzymatic',
    comments: 'Normal fasting blood glucose is between 70 - 100 mg/dL.'
  },
  {
    testCode: 'PPBS',
    testName: 'Post Prandial Blood Glucose (PPBS)',
    category: 'Biochemistry',
    sampleType: 'Fluoride Plasma / Serum',
    tat: 2,
    method: 'GOD-POD Enzymatic',
    comments: 'Normal post prandial glucose is < 140 mg/dL.'
  },
  {
    testCode: 'RBS',
    testName: 'Random Blood Sugar (RBS)',
    category: 'Biochemistry',
    sampleType: 'Fluoride Plasma / Serum',
    tat: 2,
    method: 'GOD-POD Enzymatic'
  },
  {
    testCode: 'ESR',
    testName: 'ESR (Erythrocyte Sedimentation Rate)',
    category: 'Haematology',
    sampleType: 'EDTA / Citrate Blood',
    tat: 2,
    method: 'Westergren Method'
  },
  {
    testCode: 'WIDAL',
    testName: 'Widal Test',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 4,
    method: 'Tube / Slide Agglutination'
  },
  {
    testCode: 'DENGUE',
    testName: 'Dengue Duo (NS1 + IgM + IgG)',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 2,
    method: 'Rapid Immunochromatography'
  },
  {
    testCode: 'HIV',
    testName: 'HIV 1 & 2',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 2,
    method: 'Immunochromatography / ELISA'
  },
  {
    testCode: 'HBSAG',
    testName: 'HBsAg (Hepatitis B)',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 2,
    method: 'Immunochromatography / ELISA'
  },
  {
    testCode: 'HCV',
    testName: 'HCV Antibody',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 2,
    method: 'Immunochromatography / ELISA'
  }
];

const PARAMETERS = {
  // CBC PARAMETERS
  CBC: [
    { paramName: 'Hemoglobin (Hb)', paramCode: 'HB', unit: 'g/dL', maleRange: { low: 13.0, high: 17.0 }, femaleRange: { low: 12.0, high: 15.0 }, displayOrder: 1 },
    { paramName: 'Total RBC Count', paramCode: 'RBC', unit: 'mill/cumm', maleRange: { low: 4.5, high: 5.5 }, femaleRange: { low: 3.9, high: 4.8 }, displayOrder: 2 },
    { paramName: 'Packed Cell Volume (PCV)', paramCode: 'PCV', unit: '%', maleRange: { low: 40.0, high: 50.0 }, femaleRange: { low: 36.1, high: 44.3 }, displayOrder: 3 },
    { paramName: 'Mean Corpuscular Volume(MCV)', paramCode: 'MCV', unit: 'fL', maleRange: { low: 78.2, high: 97.93 }, femaleRange: { low: 78.2, high: 97.93 }, displayOrder: 4, formula: '(PCV * 10) / RBC' },
    { paramName: 'Mean Corpuscular Hemoglobin (MCH)', paramCode: 'MCH', unit: 'pg/cell', maleRange: { low: 27.0, high: 33.0 }, femaleRange: { low: 27.0, high: 33.0 }, displayOrder: 5, formula: '(HB * 10) / RBC' },
    { paramName: 'Mean Corpuscular Hemoglobin Concentration (MCHC)', paramCode: 'MCHC', unit: 'g/dL', maleRange: { low: 33.0, high: 36.0 }, femaleRange: { low: 33.0, high: 36.0 }, displayOrder: 6, formula: '(HB * 100) / PCV' },
    { paramName: 'Red cell Distribution Width (RDW)', paramCode: 'RDW', unit: '%', maleRange: { low: 11.5, high: 14.0 }, femaleRange: { low: 11.5, high: 14.0 }, displayOrder: 7 },
    { paramName: 'Total WBC Count', paramCode: 'WBC', unit: 'cumm', maleRange: { low: 4000, high: 11000 }, femaleRange: { low: 4000, high: 11000 }, displayOrder: 8 },
    { paramName: 'DIFFERENTIAL WBC COUNT', paramCode: 'DIFF_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 9 },
    { paramName: 'Neutrophils', paramCode: 'NEUT', unit: '%', maleRange: { low: 40, high: 70 }, femaleRange: { low: 40, high: 70 }, displayOrder: 10 },
    { paramName: 'Lymphocytes', paramCode: 'LYMPH', unit: '%', maleRange: { low: 20, high: 40 }, femaleRange: { low: 20, high: 40 }, displayOrder: 11 },
    { paramName: 'Eosinophils', paramCode: 'EOS', unit: '%', maleRange: { low: 1, high: 6 }, femaleRange: { low: 1, high: 6 }, displayOrder: 12 },
    { paramName: 'Monocytes', paramCode: 'MONO', unit: '%', maleRange: { low: 2, high: 8 }, femaleRange: { low: 2, high: 8 }, displayOrder: 13 },
    { paramName: 'Basophils', paramCode: 'BASO', unit: '%', maleRange: { low: 0, high: 1 }, femaleRange: { low: 0, high: 1 }, displayOrder: 14 },
    { paramName: 'Platelet Count', paramCode: 'PLT_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 15 },
    { paramName: 'Platelet Count', paramCode: 'PLT', unit: '/cumm', maleRange: { low: 150000, high: 450000 }, femaleRange: { low: 150000, high: 450000 }, displayOrder: 16 },
    { paramName: 'P D W', paramCode: 'PDW', unit: 'fL', maleRange: { low: 8.3, high: 25.0 }, femaleRange: { low: 8.3, high: 25.0 }, displayOrder: 17 },
    { paramName: 'M P V', paramCode: 'MPV', unit: 'fL', maleRange: { low: 8.0, high: 9.5 }, femaleRange: { low: 8.0, high: 9.5 }, displayOrder: 18 },
    { paramName: 'P C T', paramCode: 'PCT', unit: '%', maleRange: { low: 0.15, high: 0.62 }, femaleRange: { low: 0.15, high: 0.62 }, displayOrder: 19 }
  ],

  // LFT PARAMETERS
  LFT: [
    { paramName: 'BILLIRUBIN', paramCode: 'BIL_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 1 },
    { paramName: 'Total Bilirubin', paramCode: 'TBIL', unit: 'mg/dL', maleRange: { low: 0, high: 1.2 }, femaleRange: { low: 0, high: 1.2 }, displayOrder: 2 },
    { paramName: 'Direct Bilirubin', paramCode: 'DBIL', unit: 'mg/dL', maleRange: { low: 0, high: 0.3 }, femaleRange: { low: 0, high: 0.3 }, displayOrder: 3 },
    { paramName: 'Indirect Bilirubin', paramCode: 'IBIL', unit: 'mg/dL', maleRange: { low: 0.2, high: 1.0 }, femaleRange: { low: 0.2, high: 1.0 }, displayOrder: 4, formula: 'TBIL - DBIL' },
    { paramName: 'LIVER ENZYMES', paramCode: 'ENZ_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 5 },
    { paramName: 'SGPT (ALT)', paramCode: 'SGPT', unit: 'U/L', maleRange: { low: 0, high: 35 }, femaleRange: { low: 0, high: 35 }, displayOrder: 6 },
    { paramName: 'SGOT (AST)', paramCode: 'SGOT', unit: 'U/L', maleRange: { low: 0, high: 31 }, femaleRange: { low: 0, high: 31 }, displayOrder: 7 },
    { paramName: 'Alkaline Phosphatase', paramCode: 'ALP', unit: 'U/L', maleRange: { low: 30, high: 250 }, femaleRange: { low: 30, high: 250 }, displayOrder: 8 },
    { paramName: 'SERUM PROTEINS', paramCode: 'PROT_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 9 },
    { paramName: 'Total Serum Protein', paramCode: 'TP', unit: 'g/dL', maleRange: { low: 6.3, high: 7.9 }, femaleRange: { low: 6.3, high: 7.9 }, displayOrder: 10 },
    { paramName: 'Serum Albumin', paramCode: 'ALB', unit: 'g/dL', maleRange: { low: 3.5, high: 5.5 }, femaleRange: { low: 3.5, high: 5.5 }, displayOrder: 11 },
    { paramName: 'Serum Globulin', paramCode: 'GLOB', unit: 'g/dL', maleRange: { low: 2.5, high: 3.5 }, femaleRange: { low: 2.5, high: 3.5 }, displayOrder: 12, formula: 'TP - ALB' },
    { paramName: 'A/G Ratio', paramCode: 'AGRATIO', unit: '', maleRange: { low: 1.1, high: 2.1 }, femaleRange: { low: 1.1, high: 2.1 }, displayOrder: 13, formula: 'ALB / GLOB' }
  ],

  // KFT PARAMETERS
  KFT: [
    { paramName: 'KIDNEY TESTS', paramCode: 'KID_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 1 },
    { paramName: 'Serum Urea', paramCode: 'UREA', unit: 'mg/dL', maleRange: { low: 13, high: 40 }, femaleRange: { low: 13, high: 40 }, displayOrder: 2 },
    { paramName: 'Serum Creatinine', paramCode: 'CREAT', unit: 'mg/dL', maleRange: { low: 0.59, high: 1.45 }, femaleRange: { low: 0.59, high: 1.45 }, displayOrder: 3 },
    { paramName: 'Serum Calcium', paramCode: 'CA', unit: 'mg/dL', maleRange: { low: 8.6, high: 10.0 }, femaleRange: { low: 8.6, high: 10.0 }, displayOrder: 4 },
    { paramName: 'Serum Potassium', paramCode: 'K', unit: 'mmol/L', maleRange: { low: 3.6, high: 5.2 }, femaleRange: { low: 3.6, high: 5.2 }, displayOrder: 5 },
    { paramName: 'Serum Sodium', paramCode: 'NA', unit: 'mmol/L', maleRange: { low: 135, high: 145 }, femaleRange: { low: 135, high: 145 }, displayOrder: 6 },
    { paramName: 'Serum Uric Acid', paramCode: 'UA', unit: 'mg/dL', maleRange: { low: 2.6, high: 6.0 }, femaleRange: { low: 2.6, high: 6.0 }, displayOrder: 7 },
    { paramName: 'RATIO', paramCode: 'RATIO_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 8 },
    { paramName: 'Urea / Creatinine Ratio', paramCode: 'UCREAT_RATIO', unit: '', maleRange: { low: 40, high: 80 }, femaleRange: { low: 40, high: 80 }, displayOrder: 9, formula: 'UREA / CREAT' }
  ],

  // LIPID PROFILE PARAMETERS
  LIPID: [
    { paramName: 'CHOLESTEROL', paramCode: 'CHOL_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 1 },
    { paramName: 'Total Cholesterol', paramCode: 'CHOL', unit: 'mg/dL', maleRange: { low: 0, high: 200 }, femaleRange: { low: 0, high: 200 }, displayOrder: 2 },
    { paramName: 'Serum Triglycerides', paramCode: 'TRG', unit: 'mg/dL', maleRange: { low: 0, high: 150 }, femaleRange: { low: 0, high: 150 }, displayOrder: 3 },
    { paramName: 'HDL Cholesterol', paramCode: 'HDL', unit: 'mg/dL', textRange: '35 - more', maleRange: { low: 35, high: 65 }, femaleRange: { low: 35, high: 65 }, displayOrder: 4 },
    { paramName: 'LDL Cholesterol', paramCode: 'LDL', unit: 'mg/dL', textRange: '100 - more', maleRange: { low: 0, high: 100 }, femaleRange: { low: 0, high: 100 }, displayOrder: 5 },
    { paramName: 'VLDL Cholesterol', paramCode: 'VLDL', unit: 'mg/dL', maleRange: { low: 0, high: 30 }, femaleRange: { low: 0, high: 30 }, displayOrder: 6, formula: 'TRG / 5' },
    { paramName: 'Non-HDL cholesterol', paramCode: 'NONHDL', unit: 'mg/dL', textRange: '< 130', maleRange: { low: 0, high: 130 }, femaleRange: { low: 0, high: 130 }, displayOrder: 7, formula: 'CHOL - HDL' },
    { paramName: 'RATIO', paramCode: 'LIPID_RATIO_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 8 },
    { paramName: 'LDL HDL Cholesterol Ratio', paramCode: 'LDL_HDL_RATIO', unit: '', maleRange: { low: 1.5, high: 3.5 }, femaleRange: { low: 1.5, high: 3.5 }, displayOrder: 9, formula: 'LDL / HDL' },
    { paramName: 'Total-HDL Cholesterol Ratio', paramCode: 'CHOL_HDL_RATIO', unit: '', maleRange: { low: 3.5, high: 5.0 }, femaleRange: { low: 3.5, high: 5.0 }, displayOrder: 10, formula: 'CHOL / HDL' },
    { paramName: 'Triglycerides HDL Ratio', paramCode: 'TRG_HDL_RATIO', unit: '', textRange: '< 3.5', maleRange: { low: 0, high: 3.5 }, femaleRange: { low: 0, high: 3.5 }, displayOrder: 11, formula: 'TRG / HDL' }
  ],

  // HBA1C PARAMETERS
  HBA1C: [
    { paramName: 'Glycosylated Hemoglobin(GHb/HbA1c)', paramCode: 'HBA1C', unit: '%', textRange: '5.7 - 6.4', maleRange: { low: 5.7, high: 6.4 }, femaleRange: { low: 5.7, high: 6.4 }, displayOrder: 1 },
    { paramName: 'Mean Blood Glucose', paramCode: 'MBG', unit: 'mg/dL', textRange: '90 - 210', maleRange: { low: 90, high: 210 }, femaleRange: { low: 90, high: 210 }, displayOrder: 2, formula: '28.7 * HBA1C - 46.7' }
  ],

  // TFT PARAMETERS
  TFT: [
    { paramName: 'THYROID SERUM HORMONES', paramCode: 'TFT_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 1 },
    { paramName: 'Serum Triiodothyronine (T3)', paramCode: 'T3', unit: 'ng/mL', maleRange: { low: 0.8, high: 1.9 }, femaleRange: { low: 0.8, high: 1.9 }, displayOrder: 2 },
    { paramName: 'Serum Thyroxine (T4)', paramCode: 'T4', unit: 'ng/mL', maleRange: { low: 4.5, high: 12.6 }, femaleRange: { low: 4.5, high: 12.6 }, displayOrder: 3 },
    { paramName: 'Thyroid Stimulating Hormone (TSH)', paramCode: 'TSH', unit: 'µIU/mL', maleRange: { low: 0.35, high: 5.5 }, femaleRange: { low: 0.35, high: 5.5 }, displayOrder: 4 }
  ],

  // CUE (URINE) PARAMETERS
  CUE: [
    { paramName: 'PHYSICAL EXAMINATION', paramCode: 'UR_PHYS_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 1 },
    { paramName: 'Colour', paramCode: 'UR_COL', unit: '', textRange: 'Pale yellow', resultType: 'text', displayOrder: 2 },
    { paramName: 'Appearance', paramCode: 'UR_APP', unit: '', textRange: 'Clear', resultType: 'text', displayOrder: 3 },
    { paramName: 'CHEMICAL EXAMINATION', paramCode: 'UR_CHEM_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 4 },
    { paramName: 'Glucose', paramCode: 'UR_GLU', unit: '', textRange: 'Nil', resultType: 'text', displayOrder: 5 },
    { paramName: 'Protein', paramCode: 'UR_PROT', unit: '', textRange: 'Nil', resultType: 'text', displayOrder: 6 },
    { paramName: 'Specific Gravity', paramCode: 'UR_SG', unit: '', textRange: '1.005 - 1.030', maleRange: { low: 1.005, high: 1.030 }, femaleRange: { low: 1.005, high: 1.030 }, displayOrder: 7 },
    { paramName: 'Blood', paramCode: 'UR_BLD', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 8 },
    { paramName: 'Reaction (PH)', paramCode: 'UR_PH', unit: '', textRange: '4.6 - 8.0', maleRange: { low: 4.6, high: 8.0 }, femaleRange: { low: 4.6, high: 8.0 }, displayOrder: 9 },
    { paramName: 'Nitrites', paramCode: 'UR_NIT', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 10 },
    { paramName: 'Leukocyte esterase', paramCode: 'UR_LEU', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 11 },
    { paramName: 'MICROSCOPIC EXAMINATION', paramCode: 'UR_MICR_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 12 },
    { paramName: 'PUS(WBC) Cells', paramCode: 'UR_PUS', unit: '/HPF', textRange: '1 - 5 /HPF', displayOrder: 13 },
    { paramName: 'Red Blood Cells', paramCode: 'UR_RBC', unit: '/hpf', textRange: '1 - 4 /hpf', displayOrder: 14 },
    { paramName: 'U.Epithelial Cells', paramCode: 'UR_EPITH', unit: '/HPF', textRange: '1 - 5 /HPF', displayOrder: 15 },
    { paramName: 'Crystals', paramCode: 'UR_CRYST', unit: '', textRange: 'Absent', resultType: 'text', displayOrder: 16 },
    { paramName: 'Others', paramCode: 'UR_OTH', unit: '', textRange: 'Absent', resultType: 'text', displayOrder: 17 }
  ],

  // SINGLE PARAMETERS
  CRP: [
    { paramName: 'C-Reactive Protein (CRP)', paramCode: 'CRP', unit: 'mg/L', textRange: '0.5 - 5.0', maleRange: { low: 0.5, high: 5.0 }, femaleRange: { low: 0.5, high: 5.0 }, displayOrder: 1 }
  ],
  VITD: [
    { paramName: '25 Hydroxy Vitamin D', paramCode: 'VITD', unit: 'ng/mL', textRange: '30 - 100', maleRange: { low: 30, high: 100 }, femaleRange: { low: 30, high: 100 }, displayOrder: 1 }
  ],
  VITB12: [
    { paramName: 'Vitamin B12', paramCode: 'VITB12', unit: 'ng/L', textRange: '180 - 914', maleRange: { low: 180, high: 914 }, femaleRange: { low: 180, high: 914 }, displayOrder: 1 }
  ],
  RAFACT: [
    { paramName: 'Rheumatoid Factor', paramCode: 'RAFACT', unit: 'IU/mL', textRange: '0 - 20', maleRange: { low: 0, high: 20 }, femaleRange: { low: 0, high: 20 }, displayOrder: 1 }
  ],
  FBS: [
    { paramName: 'Fasting Blood Glucose', paramCode: 'FBS', unit: 'mg/dL', textRange: '70 - 100', maleRange: { low: 70, high: 100 }, femaleRange: { low: 70, high: 100 }, displayOrder: 1 }
  ],
  PPBS: [
    { paramName: 'Post Prandial Blood Glucose (PPBS)', paramCode: 'PPBS', unit: 'mg/dL', textRange: '70 - 140', maleRange: { low: 70, high: 140 }, femaleRange: { low: 70, high: 140 }, displayOrder: 1 }
  ],
  RBS: [
    { paramName: 'Random Blood Sugar', paramCode: 'RBS', unit: 'mg/dL', textRange: '70 - 140', maleRange: { low: 70, high: 140 }, femaleRange: { low: 70, high: 140 }, displayOrder: 1 }
  ],
  ESR: [
    { paramName: 'ESR (Westergren)', paramCode: 'ESR', unit: 'mm/hr', maleRange: { low: 0, high: 15 }, femaleRange: { low: 0, high: 20 }, displayOrder: 1 }
  ],
  WIDAL: [
    { paramName: 'Salmonella Typhi O (TO)', paramCode: 'TO', unit: '', resultType: 'text', displayOrder: 1 },
    { paramName: 'Salmonella Typhi H (TH)', paramCode: 'TH', unit: '', resultType: 'text', displayOrder: 2 },
    { paramName: 'Salmonella Paratyphi AO', paramCode: 'AO', unit: '', resultType: 'text', displayOrder: 3 },
    { paramName: 'Salmonella Paratyphi BH', paramCode: 'BH', unit: '', resultType: 'text', displayOrder: 4 }
  ],
  DENGUE: [
    { paramName: 'Dengue NS1 Antigen', paramCode: 'DENG_NS1', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 1 },
    { paramName: 'Dengue IgM Antibody', paramCode: 'DENG_IGM', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 2 },
    { paramName: 'Dengue IgG Antibody', paramCode: 'DENG_IGG', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 3 }
  ],
  HIV: [
    { paramName: 'HIV 1 & 2', paramCode: 'HIV', unit: '', textRange: 'Non-Reactive', resultType: 'text', displayOrder: 1 }
  ],
  HBSAG: [
    { paramName: 'HBsAg', paramCode: 'HBSAG', unit: '', textRange: 'Non-Reactive', resultType: 'text', displayOrder: 1 }
  ],
  HCV: [
    { paramName: 'HCV Antibody', paramCode: 'HCV', unit: '', textRange: 'Non-Reactive', resultType: 'text', displayOrder: 1 }
  ]
};

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lims';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for test seeding');

    for (const testDef of TESTS) {
      let test = await Test.findOne({ testCode: testDef.testCode });
      if (!test) {
        test = await Test.create({
          ...testDef,
          price: testDef.price || 200,
          isActive: true
        });
        console.log(`➕ Created test: ${test.testName} (${test.testCode})`);
      } else {
        await Test.findByIdAndUpdate(test._id, {
          testName: testDef.testName,
          category: testDef.category,
          sampleType: testDef.sampleType,
          method: testDef.method || test.method,
          comments: testDef.comments || test.comments
        });
        console.log(`🔄 Updated test: ${test.testName} (${test.testCode})`);
      }

      // Seed/Upsert parameters
      const paramsList = PARAMETERS[testDef.testCode];
      if (paramsList && paramsList.length > 0) {
        for (const p of paramsList) {
          const existing = await TestParameter.findOne({ test: test._id, paramCode: p.paramCode });
          if (!existing) {
            await TestParameter.create({
              ...p,
              test: test._id,
              isActive: true
            });
          } else {
            await TestParameter.findByIdAndUpdate(existing._id, {
              ...p,
              test: test._id
            });
          }
        }
        console.log(`   ↳ Synced ${paramsList.length} parameters for ${testDef.testCode}`);
      }
    }

    console.log('🎉 All test master and parameters seeded/synced successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding tests:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seed();
}

module.exports = { TESTS, PARAMETERS, seed };
