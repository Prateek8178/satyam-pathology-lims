require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Test = require('../models/Test');
const TestParameter = require('../models/TestParameter');

const TESTS = [
  // ── HAEMATOLOGY ──
  {
    testCode: 'CBC',
    testName: 'Complete Blood Count (CBC)',
    category: 'Haematology',
    sampleType: 'EDTA Blood',
    tat: 4,
    method: 'Automated 3-part / 5-part cell counter (Impedance & Colorimetric)',
    comments: 'EDTA Whole Blood - Test done on automated cell counter. (Hemoglobin Cyanide colorimetric, WBC, RBC Platelet count by impedance method, other parameters calculated) All abnormal Haemograms are reviewed and confirmed microscopically.'
  },
  {
    testCode: 'ESR',
    testName: 'ESR (Erythrocyte Sedimentation Rate)',
    category: 'Haematology',
    sampleType: 'EDTA / Citrate Blood',
    tat: 2,
    method: 'Westergren Method',
    comments: 'ESR is a non-specific test that reflects acute phase response and inflammation.'
  },
  {
    testCode: 'BG',
    testName: 'Blood Group & Rh Factor',
    category: 'Haematology',
    sampleType: 'EDTA Blood',
    tat: 2,
    method: 'Column Agglutination / Tube Method'
  },
  {
    testCode: 'PBS',
    testName: 'Peripheral Blood Smear Examination',
    category: 'Haematology',
    sampleType: 'EDTA Blood',
    tat: 4,
    method: 'Microscopic Examination (Leishman Stain)'
  },
  {
    testCode: 'RETIC',
    testName: 'Reticulocyte Count',
    category: 'Haematology',
    sampleType: 'EDTA Blood',
    tat: 4,
    method: 'Supravital Stain (Brilliant Cresyl Blue)'
  },
  {
    testCode: 'BTCT',
    testName: 'Bleeding Time & Clotting Time',
    category: 'Haematology',
    sampleType: 'Capillary Blood',
    tat: 2,
    method: 'Duke / Ivy Method for BT & Wright / capillary tube for CT'
  },
  {
    testCode: 'PTINR',
    testName: 'Prothrombin Time (PT / INR)',
    category: 'Haematology',
    sampleType: 'Citrated Plasma',
    tat: 4,
    method: 'Coagulometer (Optical/Mechanical)'
  },
  {
    testCode: 'APTT',
    testName: 'Activated Partial Thromboplastin Time (APTT)',
    category: 'Haematology',
    sampleType: 'Citrated Plasma',
    tat: 4,
    method: 'Coagulometer'
  },
  {
    testCode: 'DDIM',
    testName: 'D-Dimer',
    category: 'Haematology',
    sampleType: 'Citrated Plasma',
    tat: 4,
    method: 'Immunoturbidimetry / CLIA'
  },
  {
    testCode: 'SICKL',
    testName: 'Sickling Test',
    category: 'Haematology',
    sampleType: 'EDTA Blood',
    tat: 4,
    method: 'Sodium Metabisulphite Slide Method'
  },
  {
    testCode: 'MP',
    testName: 'Malaria Parasite (Smear & Antigen)',
    category: 'Haematology',
    sampleType: 'EDTA Blood',
    tat: 2,
    method: 'Thick & Thin Smear Microscopy & Rapid Ag (Pf/Pv)'
  },

  // ── BIOCHEMISTRY - LIVER ──
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
    testCode: 'TBIL',
    testName: 'Serum Bilirubin (Total / Direct / Indirect)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Diazo Method'
  },
  {
    testCode: 'SGOT',
    testName: 'SGOT (AST)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'IFCC without Pyridoxal Phosphate'
  },
  {
    testCode: 'SGPT',
    testName: 'SGPT (ALT)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'IFCC without Pyridoxal Phosphate'
  },
  {
    testCode: 'SALP',
    testName: 'Serum Alkaline Phosphatase (ALP)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'p-NPP Kinetic'
  },
  {
    testCode: 'SGGT',
    testName: 'Serum GGT (Gamma Glutamyl Transferase)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Enzymatic Szasz Method'
  },
  {
    testCode: 'STP',
    testName: 'Serum Total Protein & Albumin',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Biuret & BCG Dye Binding'
  },

  // ── BIOCHEMISTRY - KIDNEY ──
  {
    testCode: 'KFT',
    testName: 'Kidney Function Test (KFT / RFT)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Kinetic & Colorimetric',
    comments: 'Urea is the end product of protein metabolism synthesized in liver and excreted by kidneys. Creatinine is a catabolic product of creatine phosphate.'
  },
  {
    testCode: 'UREA',
    testName: 'Blood Urea & BUN',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'GLDH Kinetic'
  },
  {
    testCode: 'SCREAT',
    testName: 'Serum Creatinine',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Modified Jaffe Kinetic'
  },
  {
    testCode: 'SUA',
    testName: 'Serum Uric Acid',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Uricase Enzymatic'
  },
  {
    testCode: 'SEELEC',
    testName: 'Serum Electrolytes (Na / K / Cl / Ca / P)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Ion Selective Electrode (ISE) & Arsenazo III'
  },

  // ── BIOCHEMISTRY - LIPID ──
  {
    testCode: 'LIPID',
    testName: 'Lipid Profile',
    category: 'Biochemistry',
    sampleType: 'Serum (Fasting 10-12 hrs)',
    tat: 4,
    method: 'Enzymatic / Direct / Friedewald Calculation',
    comments: '1. Triglycerides: When triglycerides are very high, VLDL is high. Total cholesterol to HDL ratio is an indicator of cardiovascular risk.'
  },
  {
    testCode: 'CHOL',
    testName: 'Total Cholesterol',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'CHOD-PAP Enzymatic'
  },
  {
    testCode: 'TRG',
    testName: 'Serum Triglycerides',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'GPO-PAP Enzymatic'
  },
  {
    testCode: 'HDL',
    testName: 'HDL Cholesterol',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Direct Detergent Method'
  },

  // ── GLUCOSE & DIABETES ──
  {
    testCode: 'FBS',
    testName: 'Fasting Blood Glucose',
    category: 'Biochemistry',
    sampleType: 'Fluoride Plasma / Serum',
    tat: 2,
    method: 'GOD-POD Enzymatic',
    comments: 'Normal fasting blood glucose is between 70 - 100 mg/dL. Impaired Fasting Glucose (Pre-diabetes): 100 - 125 mg/dL. Diabetes: >= 126 mg/dL.'
  },
  {
    testCode: 'PPBS',
    testName: 'Post Prandial Blood Glucose (PPBS)',
    category: 'Biochemistry',
    sampleType: 'Fluoride Plasma / Serum',
    tat: 2,
    method: 'GOD-POD Enzymatic',
    comments: 'Normal post prandial glucose: < 140 mg/dL. Impaired Glucose Tolerance: 140 - 199 mg/dL. Diabetes: >= 200 mg/dL.'
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
    testCode: 'HBA1C',
    testName: 'HbA1c',
    category: 'Biochemistry',
    sampleType: 'EDTA Blood',
    tat: 4,
    method: 'HPLC / Immunoturbidimetry',
    comments: '1. HbA1c is an indicator of glycemic control representing average blood glucose over the past 2-3 months.\nNon-Diabetic: < 5.7 %\nPrediabetes: 5.7 - 6.4 %\nDiabetes: >= 6.5 %'
  },

  // ── ENZYMES & CARDIAC ──
  {
    testCode: 'AMY',
    testName: 'Serum Amylase',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'CNPG3 Kinetic Enzymatic'
  },
  {
    testCode: 'LIP',
    testName: 'Serum Lipase',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Enzymatic Colorimetric'
  },
  {
    testCode: 'CPK',
    testName: 'CPK (Creatine Phosphokinase Total)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'NAC Activated Kinetic'
  },
  {
    testCode: 'CPKMB',
    testName: 'CPK-MB (Cardiac Isoenzyme)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'Immunoinhibition'
  },
  {
    testCode: 'LDH',
    testName: 'LDH (Lactate Dehydrogenase)',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 4,
    method: 'P-L Kinetic UV'
  },

  // ── VITAMINS & MINERALS ──
  {
    testCode: 'VITD',
    testName: '25 Hydroxy Vitamin D',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 24,
    method: 'CLIA / ECLIA',
    comments: 'Deficiency: < 20 ng/mL\nInsufficiency: 20 - 30 ng/mL\nSufficiency: 30 - 100 ng/mL\nToxicity: > 100 ng/mL'
  },
  {
    testCode: 'VITB12',
    testName: 'Vitamin B12',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 24,
    method: 'CLIA / ECLIA',
    comments: 'Vitamin B12 is essential for red blood cell production, cellular metabolism, and neurological function.'
  },
  {
    testCode: 'IRON_PROF',
    testName: 'Iron Profile / Studies',
    category: 'Biochemistry',
    sampleType: 'Serum',
    tat: 12,
    method: 'Ferrozine / Turbidimetry'
  },

  // ── THYROID & HORMONES ──
  {
    testCode: 'TFT',
    testName: 'Thyroid Function Test (TFT)',
    category: 'Thyroid',
    sampleType: 'Serum',
    tat: 6,
    method: 'CLIA / CMIA',
    comments: 'Assay results should be interpreted in context to clinical condition, medications and patient history.'
  },
  {
    testCode: 'TSH',
    testName: 'Thyroid Stimulating Hormone (TSH Ultrasensitive)',
    category: 'Thyroid',
    sampleType: 'Serum',
    tat: 4,
    method: 'CLIA'
  },

  // ── URINE & BODY FLUIDS ──
  {
    testCode: 'CUE',
    testName: 'Complete Urine Analysis (CUE)',
    category: 'Urine',
    sampleType: 'Mid-stream Urine',
    tat: 2,
    method: 'Physical, Reagent Strip Reflectance & Microscopy',
    comments: 'Urine routine examination for kidney function, metabolic disorders and urinary tract infections.'
  },

  // ── SEROLOGY & IMMUNOLOGY ──
  {
    testCode: 'CRP',
    testName: 'C-Reactive Protein (CRP)',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 2,
    method: 'Immunoturbidimetry',
    comments: 'CRP is an acute phase protein synthesized by liver in response to tissue injury, infection or inflammation.'
  },
  {
    testCode: 'RAFACT',
    testName: 'Rheumatoid Factor',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 4,
    method: 'Latex Agglutination / Immunoturbidimetry',
    comments: 'Rheumatoid factor (RF) is an autoantibody directed against the Fc portion of IgG, used in diagnosis of rheumatoid arthritis.'
  },
  {
    testCode: 'ASO',
    testName: 'ASO Titre (Anti-Streptolysin O)',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 4,
    method: 'Latex Agglutination / Turbidimetry'
  },
  {
    testCode: 'WIDAL',
    testName: 'Widal Test',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 4,
    method: 'Slide & Tube Agglutination'
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
    method: 'Immunochromatography / 4th Gen ELISA'
  },
  {
    testCode: 'HBSAG',
    testName: 'HBsAg (Hepatitis B Surface Antigen)',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 2,
    method: 'Immunochromatography / ELISA'
  },
  {
    testCode: 'HCV',
    testName: 'HCV Antibody (Hepatitis C)',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 2,
    method: 'Immunochromatography / ELISA'
  },
  {
    testCode: 'VDRL',
    testName: 'VDRL / RPR (Syphilis)',
    category: 'Serology',
    sampleType: 'Serum',
    tat: 4,
    method: 'Flocculation Antigen Test'
  }
];

const PARAMETERS = {
  // ── CBC PARAMETERS ──
  CBC: [
    { paramName: 'Hemoglobin (Hb)', paramCode: 'HB', unit: 'g/dL', maleRange: { low: 13.0, high: 17.0 }, femaleRange: { low: 12.0, high: 15.0 }, childRange: { low: 11.0, high: 14.5 }, displayOrder: 1 },
    { paramName: 'Total RBC Count', paramCode: 'RBC', unit: 'mill/cumm', maleRange: { low: 4.5, high: 5.5 }, femaleRange: { low: 3.9, high: 4.8 }, childRange: { low: 4.0, high: 5.2 }, displayOrder: 2 },
    { paramName: 'Packed Cell Volume (PCV)', paramCode: 'PCV', unit: '%', maleRange: { low: 40.0, high: 50.0 }, femaleRange: { low: 36.1, high: 44.3 }, childRange: { low: 35.0, high: 45.0 }, displayOrder: 3 },
    { paramName: 'Mean Corpuscular Volume(MCV)', paramCode: 'MCV', unit: 'fL', maleRange: { low: 78.2, high: 97.93 }, femaleRange: { low: 78.2, high: 97.93 }, childRange: { low: 75.0, high: 90.0 }, displayOrder: 4, isCalculated: true, formula: '(PCV * 10) / RBC', dependencies: ['PCV', 'RBC'] },
    { paramName: 'Mean Corpuscular Hemoglobin (MCH)', paramCode: 'MCH', unit: 'pg/cell', maleRange: { low: 27.0, high: 33.0 }, femaleRange: { low: 27.0, high: 33.0 }, childRange: { low: 25.0, high: 31.0 }, displayOrder: 5, isCalculated: true, formula: '(HB * 10) / RBC', dependencies: ['HB', 'RBC'] },
    { paramName: 'Mean Corpuscular Hemoglobin Concentration (MCHC)', paramCode: 'MCHC', unit: 'g/dL', maleRange: { low: 33.0, high: 36.0 }, femaleRange: { low: 33.0, high: 36.0 }, childRange: { low: 32.0, high: 36.0 }, displayOrder: 6, isCalculated: true, formula: '(HB * 100) / PCV', dependencies: ['HB', 'PCV'] },
    { paramName: 'Red cell Distribution Width (RDW)', paramCode: 'RDW', unit: '%', maleRange: { low: 11.5, high: 14.0 }, femaleRange: { low: 11.5, high: 14.0 }, displayOrder: 7 },
    { paramName: 'Total WBC Count', paramCode: 'WBC', unit: 'cumm', maleRange: { low: 4000, high: 11000 }, femaleRange: { low: 4000, high: 11000 }, childRange: { low: 5000, high: 13000 }, displayOrder: 8 },
    { paramName: 'DIFFERENTIAL WBC COUNT', paramCode: 'DIFF_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 9 },
    { paramName: 'Neutrophils', paramCode: 'NEUT', unit: '%', maleRange: { low: 40, high: 70 }, femaleRange: { low: 40, high: 70 }, childRange: { low: 30, high: 60 }, displayOrder: 10 },
    { paramName: 'Lymphocytes', paramCode: 'LYMPH', unit: '%', maleRange: { low: 20, high: 40 }, femaleRange: { low: 20, high: 40 }, childRange: { low: 40, high: 60 }, displayOrder: 11 },
    { paramName: 'Eosinophils', paramCode: 'EOS', unit: '%', maleRange: { low: 1, high: 6 }, femaleRange: { low: 1, high: 6 }, childRange: { low: 1, high: 5 }, displayOrder: 12 },
    { paramName: 'Monocytes', paramCode: 'MONO', unit: '%', maleRange: { low: 2, high: 8 }, femaleRange: { low: 2, high: 8 }, childRange: { low: 2, high: 8 }, displayOrder: 13 },
    { paramName: 'Basophils', paramCode: 'BASO', unit: '%', maleRange: { low: 0, high: 1 }, femaleRange: { low: 0, high: 1 }, displayOrder: 14 },
    { paramName: 'Platelet Count', paramCode: 'PLT_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 15 },
    { paramName: 'Platelet Count', paramCode: 'PLT', unit: '/cumm', maleRange: { low: 150000, high: 450000 }, femaleRange: { low: 150000, high: 450000 }, childRange: { low: 150000, high: 450000 }, displayOrder: 16 },
    { paramName: 'P D W', paramCode: 'PDW', unit: 'fL', maleRange: { low: 8.3, high: 25.0 }, femaleRange: { low: 8.3, high: 25.0 }, displayOrder: 17 },
    { paramName: 'M P V', paramCode: 'MPV', unit: 'fL', maleRange: { low: 8.0, high: 9.5 }, femaleRange: { low: 8.0, high: 9.5 }, displayOrder: 18 },
    { paramName: 'P C T', paramCode: 'PCT', unit: '%', maleRange: { low: 0.15, high: 0.62 }, femaleRange: { low: 0.15, high: 0.62 }, displayOrder: 19 }
  ],

  // ── LFT PARAMETERS ──
  LFT: [
    { paramName: 'BILLIRUBIN', paramCode: 'BIL_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 1 },
    { paramName: 'Total Bilirubin', paramCode: 'TBIL', unit: 'mg/dL', maleRange: { low: 0, high: 1.2 }, femaleRange: { low: 0, high: 1.2 }, displayOrder: 2 },
    { paramName: 'Direct Bilirubin', paramCode: 'DBIL', unit: 'mg/dL', maleRange: { low: 0, high: 0.3 }, femaleRange: { low: 0, high: 0.3 }, displayOrder: 3 },
    { paramName: 'Indirect Bilirubin', paramCode: 'IBIL', unit: 'mg/dL', maleRange: { low: 0.2, high: 1.0 }, femaleRange: { low: 0.2, high: 1.0 }, displayOrder: 4, isCalculated: true, formula: 'TBIL - DBIL', dependencies: ['TBIL', 'DBIL'] },
    { paramName: 'LIVER ENZYMES', paramCode: 'ENZ_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 5 },
    { paramName: 'SGPT (ALT)', paramCode: 'SGPT', unit: 'U/L', maleRange: { low: 0, high: 35 }, femaleRange: { low: 0, high: 35 }, displayOrder: 6 },
    { paramName: 'SGOT (AST)', paramCode: 'SGOT', unit: 'U/L', maleRange: { low: 0, high: 31 }, femaleRange: { low: 0, high: 31 }, displayOrder: 7 },
    { paramName: 'Alkaline Phosphatase', paramCode: 'ALP', unit: 'U/L', maleRange: { low: 30, high: 250 }, femaleRange: { low: 30, high: 250 }, childRange: { low: 100, high: 450 }, displayOrder: 8 },
    { paramName: 'Serum GGT', paramCode: 'GGT', unit: 'U/L', maleRange: { low: 10, high: 71 }, femaleRange: { low: 6, high: 42 }, displayOrder: 9 },
    { paramName: 'SERUM PROTEINS', paramCode: 'PROT_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 10 },
    { paramName: 'Total Serum Protein', paramCode: 'TP', unit: 'g/dL', maleRange: { low: 6.3, high: 7.9 }, femaleRange: { low: 6.3, high: 7.9 }, displayOrder: 11 },
    { paramName: 'Serum Albumin', paramCode: 'ALB', unit: 'g/dL', maleRange: { low: 3.5, high: 5.5 }, femaleRange: { low: 3.5, high: 5.5 }, displayOrder: 12 },
    { paramName: 'Serum Globulin', paramCode: 'GLOB', unit: 'g/dL', maleRange: { low: 2.5, high: 3.5 }, femaleRange: { low: 2.5, high: 3.5 }, displayOrder: 13, isCalculated: true, formula: 'TP - ALB', dependencies: ['TP', 'ALB'] },
    { paramName: 'A/G Ratio', paramCode: 'AGRATIO', unit: '', maleRange: { low: 1.1, high: 2.1 }, femaleRange: { low: 1.1, high: 2.1 }, displayOrder: 14, isCalculated: true, formula: 'ALB / GLOB', dependencies: ['ALB', 'GLOB'] }
  ],

  // ── KFT PARAMETERS ──
  KFT: [
    { paramName: 'KIDNEY TESTS', paramCode: 'KID_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 1 },
    { paramName: 'Serum Urea', paramCode: 'UREA', unit: 'mg/dL', maleRange: { low: 13, high: 40 }, femaleRange: { low: 13, high: 40 }, childRange: { low: 10, high: 36 }, displayOrder: 2 },
    { paramName: 'Blood Urea Nitrogen (BUN)', paramCode: 'BUN', unit: 'mg/dL', maleRange: { low: 6, high: 20 }, femaleRange: { low: 6, high: 20 }, displayOrder: 3, isCalculated: true, formula: 'UREA / 2.14', dependencies: ['UREA'] },
    { paramName: 'Serum Creatinine', paramCode: 'CREAT', unit: 'mg/dL', maleRange: { low: 0.70, high: 1.30 }, femaleRange: { low: 0.50, high: 1.10 }, childRange: { low: 0.30, high: 0.70 }, displayOrder: 4 },
    { paramName: 'Serum Uric Acid', paramCode: 'UA', unit: 'mg/dL', maleRange: { low: 3.5, high: 7.2 }, femaleRange: { low: 2.6, high: 6.0 }, displayOrder: 5 },
    { paramName: 'Serum Calcium', paramCode: 'CA', unit: 'mg/dL', maleRange: { low: 8.6, high: 10.2 }, femaleRange: { low: 8.6, high: 10.2 }, displayOrder: 6 },
    { paramName: 'Serum Phosphorus', paramCode: 'PHOS', unit: 'mg/dL', maleRange: { low: 2.5, high: 4.5 }, femaleRange: { low: 2.5, high: 4.5 }, displayOrder: 7 },
    { paramName: 'Serum Potassium', paramCode: 'K', unit: 'mmol/L', maleRange: { low: 3.6, high: 5.2 }, femaleRange: { low: 3.6, high: 5.2 }, displayOrder: 8 },
    { paramName: 'Serum Sodium', paramCode: 'NA', unit: 'mmol/L', maleRange: { low: 135, high: 145 }, femaleRange: { low: 135, high: 145 }, displayOrder: 9 },
    { paramName: 'Serum Chloride', paramCode: 'CL', unit: 'mmol/L', maleRange: { low: 98, high: 107 }, femaleRange: { low: 98, high: 107 }, displayOrder: 10 },
    { paramName: 'RATIO', paramCode: 'RATIO_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 11 },
    { paramName: 'Urea / Creatinine Ratio', paramCode: 'UCREAT_RATIO', unit: '', maleRange: { low: 40, high: 80 }, femaleRange: { low: 40, high: 80 }, displayOrder: 12, isCalculated: true, formula: 'UREA / CREAT', dependencies: ['UREA', 'CREAT'] },
    { paramName: 'BUN / Creatinine Ratio', paramCode: 'BUN_CREAT_RATIO', unit: '', maleRange: { low: 10, high: 20 }, femaleRange: { low: 10, high: 20 }, displayOrder: 13, isCalculated: true, formula: 'BUN / CREAT', dependencies: ['BUN', 'CREAT'] }
  ],

  // ── LIPID PROFILE PARAMETERS ──
  LIPID: [
    { paramName: 'CHOLESTEROL', paramCode: 'CHOL_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 1 },
    { paramName: 'Total Cholesterol', paramCode: 'CHOL', unit: 'mg/dL', maleRange: { low: 0, high: 200 }, femaleRange: { low: 0, high: 200 }, displayOrder: 2 },
    { paramName: 'Serum Triglycerides', paramCode: 'TRG', unit: 'mg/dL', maleRange: { low: 0, high: 150 }, femaleRange: { low: 0, high: 150 }, displayOrder: 3 },
    { paramName: 'HDL Cholesterol', paramCode: 'HDL', unit: 'mg/dL', textRange: '35 - more', maleRange: { low: 35, high: 65 }, femaleRange: { low: 35, high: 65 }, displayOrder: 4 },
    { paramName: 'LDL Cholesterol', paramCode: 'LDL', unit: 'mg/dL', textRange: '100 - more', maleRange: { low: 0, high: 100 }, femaleRange: { low: 0, high: 100 }, displayOrder: 5 },
    { paramName: 'VLDL Cholesterol', paramCode: 'VLDL', unit: 'mg/dL', maleRange: { low: 0, high: 30 }, femaleRange: { low: 0, high: 30 }, displayOrder: 6, isCalculated: true, formula: 'TRG / 5', dependencies: ['TRG'] },
    { paramName: 'Non-HDL cholesterol', paramCode: 'NONHDL', unit: 'mg/dL', textRange: '< 130', maleRange: { low: 0, high: 130 }, femaleRange: { low: 0, high: 130 }, displayOrder: 7, isCalculated: true, formula: 'CHOL - HDL', dependencies: ['CHOL', 'HDL'] },
    { paramName: 'RATIO', paramCode: 'LIPID_RATIO_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 8 },
    { paramName: 'LDL HDL Cholesterol Ratio', paramCode: 'LDL_HDL_RATIO', unit: '', maleRange: { low: 1.5, high: 3.5 }, femaleRange: { low: 1.5, high: 3.5 }, displayOrder: 9, isCalculated: true, formula: 'LDL / HDL', dependencies: ['LDL', 'HDL'] },
    { paramName: 'Total-HDL Cholesterol Ratio', paramCode: 'CHOL_HDL_RATIO', unit: '', maleRange: { low: 3.5, high: 5.0 }, femaleRange: { low: 3.5, high: 5.0 }, displayOrder: 10, isCalculated: true, formula: 'CHOL / HDL', dependencies: ['CHOL', 'HDL'] },
    { paramName: 'Triglycerides HDL Ratio', paramCode: 'TRG_HDL_RATIO', unit: '', textRange: '< 3.5', maleRange: { low: 0, high: 3.5 }, femaleRange: { low: 0, high: 3.5 }, displayOrder: 11, isCalculated: true, formula: 'TRG / HDL', dependencies: ['TRG', 'HDL'] }
  ],

  // ── HBA1C PARAMETERS ──
  HBA1C: [
    { paramName: 'Glycosylated Hemoglobin(GHb/HbA1c)', paramCode: 'HBA1C', unit: '%', textRange: '5.7 - 6.4', maleRange: { low: 5.7, high: 6.4 }, femaleRange: { low: 5.7, high: 6.4 }, displayOrder: 1 },
    { paramName: 'Mean Blood Glucose', paramCode: 'MBG', unit: 'mg/dL', textRange: '90 - 210', maleRange: { low: 90, high: 210 }, femaleRange: { low: 90, high: 210 }, displayOrder: 2, isCalculated: true, formula: '28.7 * HBA1C - 46.7', dependencies: ['HBA1C'] }
  ],

  // ── TFT PARAMETERS ──
  TFT: [
    { paramName: 'THYROID SERUM HORMONES', paramCode: 'TFT_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 1 },
    { paramName: 'Serum Triiodothyronine (T3)', paramCode: 'T3', unit: 'ng/mL', maleRange: { low: 0.8, high: 1.9 }, femaleRange: { low: 0.8, high: 1.9 }, displayOrder: 2 },
    { paramName: 'Serum Thyroxine (T4)', paramCode: 'T4', unit: 'µg/dL', maleRange: { low: 4.5, high: 12.6 }, femaleRange: { low: 4.5, high: 12.6 }, displayOrder: 3 },
    { paramName: 'Thyroid Stimulating Hormone (TSH)', paramCode: 'TSH', unit: 'µIU/mL', maleRange: { low: 0.35, high: 5.5 }, femaleRange: { low: 0.35, high: 5.5 }, displayOrder: 4 }
  ],

  // ── URINE CUE PARAMETERS ──
  CUE: [
    { paramName: 'PHYSICAL EXAMINATION', paramCode: 'UR_PHYS_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 1 },
    { paramName: 'Quantity', paramCode: 'UR_QTY', unit: 'mL', textRange: '', resultType: 'text', displayOrder: 2 },
    { paramName: 'Colour', paramCode: 'UR_COL', unit: '', textRange: 'Pale yellow', resultType: 'text', displayOrder: 3 },
    { paramName: 'Appearance', paramCode: 'UR_APP', unit: '', textRange: 'Clear', resultType: 'text', displayOrder: 4 },
    { paramName: 'Specific Gravity', paramCode: 'UR_SG', unit: '', textRange: '1.005 - 1.030', maleRange: { low: 1.005, high: 1.030 }, femaleRange: { low: 1.005, high: 1.030 }, displayOrder: 5 },
    { paramName: 'Reaction (PH)', paramCode: 'UR_PH', unit: '', textRange: '4.6 - 8.0', maleRange: { low: 4.6, high: 8.0 }, femaleRange: { low: 4.6, high: 8.0 }, displayOrder: 6 },
    { paramName: 'CHEMICAL EXAMINATION', paramCode: 'UR_CHEM_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 7 },
    { paramName: 'Glucose', paramCode: 'UR_GLU', unit: '', textRange: 'Nil', resultType: 'text', displayOrder: 8 },
    { paramName: 'Protein', paramCode: 'UR_PROT', unit: '', textRange: 'Nil', resultType: 'text', displayOrder: 9 },
    { paramName: 'Blood', paramCode: 'UR_BLD', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 10 },
    { paramName: 'Ketone Bodies', paramCode: 'UR_KET', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 11 },
    { paramName: 'Bile Salts', paramCode: 'UR_BS', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 12 },
    { paramName: 'Bile Pigments', paramCode: 'UR_BP', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 13 },
    { paramName: 'Urobilinogen', paramCode: 'UR_URO', unit: '', textRange: 'Normal', resultType: 'text', displayOrder: 14 },
    { paramName: 'Nitrites', paramCode: 'UR_NIT', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 15 },
    { paramName: 'Leukocyte esterase', paramCode: 'UR_LEU', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 16 },
    { paramName: 'MICROSCOPIC EXAMINATION', paramCode: 'UR_MICR_HEAD', unit: '', isSubheader: true, resultType: 'subheader', displayOrder: 17 },
    { paramName: 'PUS(WBC) Cells', paramCode: 'UR_PUS', unit: '/HPF', textRange: '1 - 5 /HPF', displayOrder: 18 },
    { paramName: 'Red Blood Cells', paramCode: 'UR_RBC', unit: '/hpf', textRange: '1 - 4 /hpf', displayOrder: 19 },
    { paramName: 'U.Epithelial Cells', paramCode: 'UR_EPITH', unit: '/HPF', textRange: '1 - 5 /HPF', displayOrder: 20 },
    { paramName: 'Casts', paramCode: 'UR_CAST', unit: '', textRange: 'Absent', resultType: 'text', displayOrder: 21 },
    { paramName: 'Crystals', paramCode: 'UR_CRYST', unit: '', textRange: 'Absent', resultType: 'text', displayOrder: 22 },
    { paramName: 'Bacteria', paramCode: 'UR_BACT', unit: '', textRange: 'Absent', resultType: 'text', displayOrder: 23 },
    { paramName: 'Others', paramCode: 'UR_OTH', unit: '', textRange: 'Absent', resultType: 'text', displayOrder: 24 }
  ],

  // ── IRON STUDIES ──
  IRON_PROF: [
    { paramName: 'Serum Iron', paramCode: 'IRON', unit: 'µg/dL', maleRange: { low: 65, high: 175 }, femaleRange: { low: 50, high: 170 }, displayOrder: 1 },
    { paramName: 'Total Iron Binding Capacity (TIBC)', paramCode: 'TIBC', unit: 'µg/dL', maleRange: { low: 250, high: 450 }, femaleRange: { low: 250, high: 450 }, displayOrder: 2 },
    { paramName: 'UIBC', paramCode: 'UIBC', unit: 'µg/dL', maleRange: { low: 110, high: 370 }, femaleRange: { low: 110, high: 370 }, displayOrder: 3, isCalculated: true, formula: 'TIBC - IRON', dependencies: ['TIBC', 'IRON'] },
    { paramName: 'Transferrin Saturation', paramCode: 'TSAT', unit: '%', maleRange: { low: 20, high: 50 }, femaleRange: { low: 15, high: 50 }, displayOrder: 4, isCalculated: true, formula: '(IRON / TIBC) * 100', dependencies: ['IRON', 'TIBC'] },
    { paramName: 'Serum Ferritin', paramCode: 'FERRITIN', unit: 'ng/mL', maleRange: { low: 30, high: 400 }, femaleRange: { low: 13, high: 150 }, displayOrder: 5 }
  ],

  // ── SINGLE TEST PARAMETERS ──
  CRP: [
    { paramName: 'C-Reactive Protein (CRP)', paramCode: 'CRP', unit: 'mg/L', textRange: '0.5 - 5.0', maleRange: { low: 0.5, high: 5.0 }, femaleRange: { low: 0.5, high: 5.0 }, displayOrder: 1 }
  ],
  VITD: [
    { paramName: '25 Hydroxy Vitamin D', paramCode: 'VITD', unit: 'ng/mL', textRange: '30 - 100', maleRange: { low: 30, high: 100 }, femaleRange: { low: 30, high: 100 }, displayOrder: 1 }
  ],
  VITB12: [
    { paramName: 'Vitamin B12', paramCode: 'VITB12', unit: 'pg/mL', textRange: '180 - 914', maleRange: { low: 180, high: 914 }, femaleRange: { low: 180, high: 914 }, displayOrder: 1 }
  ],
  RAFACT: [
    { paramName: 'Rheumatoid Factor', paramCode: 'RAFACT', unit: 'IU/mL', textRange: '0 - 20', maleRange: { low: 0, high: 20 }, femaleRange: { low: 0, high: 20 }, displayOrder: 1 }
  ],
  ASO: [
    { paramName: 'ASO Titre', paramCode: 'ASO', unit: 'IU/mL', textRange: '< 200', maleRange: { low: 0, high: 200 }, femaleRange: { low: 0, high: 200 }, displayOrder: 1 }
  ],
  FBS: [
    { paramName: 'Fasting Blood Glucose', paramCode: 'FBS', unit: 'mg/dL', textRange: '70 - 100', maleRange: { low: 70, high: 100 }, femaleRange: { low: 70, high: 100 }, displayOrder: 1 },
    { paramName: 'Urine Glucose (Fasting)', paramCode: 'U_GLU_F', unit: '', textRange: 'Nil', resultType: 'text', displayOrder: 2 }
  ],
  PPBS: [
    { paramName: 'Post Prandial Blood Glucose (PPBS)', paramCode: 'PPBS', unit: 'mg/dL', textRange: '70 - 140', maleRange: { low: 70, high: 140 }, femaleRange: { low: 70, high: 140 }, displayOrder: 1 },
    { paramName: 'Urine Glucose (PP)', paramCode: 'U_GLU_PP', unit: '', textRange: 'Nil', resultType: 'text', displayOrder: 2 }
  ],
  RBS: [
    { paramName: 'Random Blood Sugar', paramCode: 'RBS', unit: 'mg/dL', textRange: '70 - 140', maleRange: { low: 70, high: 140 }, femaleRange: { low: 70, high: 140 }, displayOrder: 1 }
  ],
  ESR: [
    { paramName: 'ESR (Westergren)', paramCode: 'ESR', unit: 'mm/hr', maleRange: { low: 0, high: 15 }, femaleRange: { low: 0, high: 20 }, displayOrder: 1 }
  ],
  WIDAL: [
    { paramName: 'Salmonella Typhi O (TO)', paramCode: 'TO', unit: '', textRange: '< 1:80', resultType: 'text', displayOrder: 1 },
    { paramName: 'Salmonella Typhi H (TH)', paramCode: 'TH', unit: '', textRange: '< 1:80', resultType: 'text', displayOrder: 2 },
    { paramName: 'Salmonella Paratyphi AO', paramCode: 'AO', unit: '', textRange: '< 1:80', resultType: 'text', displayOrder: 3 },
    { paramName: 'Salmonella Paratyphi BH', paramCode: 'BH', unit: '', textRange: '< 1:80', resultType: 'text', displayOrder: 4 }
  ],
  DENGUE: [
    { paramName: 'Dengue NS1 Antigen', paramCode: 'DENG_NS1', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 1 },
    { paramName: 'Dengue IgM Antibody', paramCode: 'DENG_IGM', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 2 },
    { paramName: 'Dengue IgG Antibody', paramCode: 'DENG_IGG', unit: '', textRange: 'Negative', resultType: 'text', displayOrder: 3 }
  ],
  HIV: [
    { paramName: 'HIV 1 & 2 Antibodies', paramCode: 'HIV', unit: '', textRange: 'Non-Reactive', resultType: 'text', displayOrder: 1 }
  ],
  HBSAG: [
    { paramName: 'HBsAg (Hepatitis B)', paramCode: 'HBSAG', unit: '', textRange: 'Non-Reactive', resultType: 'text', displayOrder: 1 }
  ],
  HCV: [
    { paramName: 'HCV Antibody', paramCode: 'HCV', unit: '', textRange: 'Non-Reactive', resultType: 'text', displayOrder: 1 }
  ],
  VDRL: [
    { paramName: 'VDRL / RPR', paramCode: 'VDRL', unit: '', textRange: 'Non-Reactive', resultType: 'text', displayOrder: 1 }
  ],
  AMY: [
    { paramName: 'Serum Amylase', paramCode: 'AMY', unit: 'U/L', maleRange: { low: 28, high: 100 }, femaleRange: { low: 28, high: 100 }, displayOrder: 1 }
  ],
  LIP: [
    { paramName: 'Serum Lipase', paramCode: 'LIP', unit: 'U/L', maleRange: { low: 13, high: 60 }, femaleRange: { low: 13, high: 60 }, displayOrder: 1 }
  ],
  CPK: [
    { paramName: 'CPK Total', paramCode: 'CPK', unit: 'U/L', maleRange: { low: 39, high: 308 }, femaleRange: { low: 26, high: 192 }, displayOrder: 1 }
  ],
  CPKMB: [
    { paramName: 'CPK-MB', paramCode: 'CPKMB', unit: 'U/L', maleRange: { low: 0, high: 25 }, femaleRange: { low: 0, high: 25 }, displayOrder: 1 }
  ],
  LDH: [
    { paramName: 'Serum LDH', paramCode: 'LDH', unit: 'U/L', maleRange: { low: 135, high: 225 }, femaleRange: { low: 135, high: 225 }, displayOrder: 1 }
  ]
};

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/lims';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for comprehensive test master syncing');

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

    console.log('🎉 Complete test master and parameter audit seeded successfully!');
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
