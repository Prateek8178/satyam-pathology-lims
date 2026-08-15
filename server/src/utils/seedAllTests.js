require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Test = require('../models/Test');
const TestParameter = require('../models/TestParameter');

const TESTS = [
  // HAEMATOLOGY
  { testCode:'CBC',   testName:'Complete Blood Count',              category:'Haematology',    sampleType:'EDTA Blood', tat:4 },
  { testCode:'ESR',   testName:'ESR (Erythrocyte Sedimentation Rate)', category:'Haematology', sampleType:'EDTA Blood', tat:2 },
  { testCode:'BG',    testName:'Blood Group & Rh Factor',           category:'Haematology',    sampleType:'EDTA Blood', tat:2 },
  { testCode:'PBS',   testName:'Peripheral Blood Smear',            category:'Haematology',    sampleType:'EDTA Blood', tat:4 },
  { testCode:'RETIC', testName:'Reticulocyte Count',                category:'Haematology',    sampleType:'EDTA Blood', tat:4 },
  { testCode:'BTCT',  testName:'Bleeding Time & Clotting Time',     category:'Haematology',    sampleType:'Capillary Blood', tat:2 },
  { testCode:'PTINR', testName:'Prothrombin Time (PT/INR)',         category:'Haematology',    sampleType:'Citrate Blood', tat:4 },
  { testCode:'APTT',  testName:'APTT',                              category:'Haematology',    sampleType:'Citrate Blood', tat:4 },
  { testCode:'DDIM',  testName:'D-Dimer',                           category:'Haematology',    sampleType:'Citrate Blood', tat:6 },
  { testCode:'FIBRIN',testName:'Fibrinogen',                        category:'Haematology',    sampleType:'Citrate Blood', tat:6 },
  { testCode:'SICKL', testName:'Sickling Test',                     category:'Haematology',    sampleType:'EDTA Blood', tat:4 },
  { testCode:'HBELEC',testName:'Haemoglobin Electrophoresis',       category:'Haematology',    sampleType:'EDTA Blood', tat:24 },
  { testCode:'MP',    testName:'Malaria Parasite (Smear)',          category:'Haematology',    sampleType:'EDTA Blood', tat:4 },
  // GLUCOSE & DIABETES
  { testCode:'RBS',   testName:'Random Blood Sugar (RBS)',          category:'Biochemistry',   sampleType:'Serum/Fluoride', tat:2 },
  { testCode:'FBS',   testName:'Fasting Blood Sugar (FBS)',         category:'Biochemistry',   sampleType:'Serum/Fluoride', tat:2 },
  { testCode:'PPBS',  testName:'Post Prandial Blood Sugar (PPBS)',  category:'Biochemistry',   sampleType:'Serum/Fluoride', tat:2 },
  { testCode:'GTT',   testName:'Glucose Tolerance Test (GTT 2 Hr)', category:'Biochemistry',   sampleType:'Fluoride Blood', tat:3 },
  { testCode:'HBA1C', testName:'HbA1c (Glycated Haemoglobin)',      category:'Biochemistry',   sampleType:'EDTA Blood', tat:4 },
  // KIDNEY
  { testCode:'KFT',   testName:'Kidney Function Test (KFT)',        category:'Biochemistry',   sampleType:'Serum', tat:6 },
  { testCode:'UREA',  testName:'Blood Urea',                        category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SCREAT',testName:'Serum Creatinine',                  category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SUA',   testName:'Serum Uric Acid',                   category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SEELEC',testName:'Serum Electrolytes (Na/K/Cl)',      category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SNA',   testName:'Serum Sodium',                      category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SK',    testName:'Serum Potassium',                   category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SCL',   testName:'Serum Chloride',                    category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SCA',   testName:'Serum Calcium',                     category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SPHOSPH',testName:'Serum Phosphorus',                 category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SMG',   testName:'Serum Magnesium',                   category:'Biochemistry',   sampleType:'Serum', tat:4 },
  // LIVER
  { testCode:'LFT',   testName:'Liver Function Test (LFT)',         category:'Biochemistry',   sampleType:'Serum', tat:6 },
  { testCode:'TBIL',  testName:'Serum Bilirubin (Total/Direct/Indirect)', category:'Biochemistry', sampleType:'Serum', tat:4 },
  { testCode:'SGOT',  testName:'SGOT (AST)',                        category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SGPT',  testName:'SGPT (ALT)',                        category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SALP',  testName:'Serum ALP (Alkaline Phosphatase)',  category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SGGT',  testName:'Serum GGT (Gamma GT)',              category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'STP',   testName:'Serum Total Protein',               category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'SALB',  testName:'Serum Albumin',                     category:'Biochemistry',   sampleType:'Serum', tat:4 },
  // LIPIDS
  { testCode:'LIPID', testName:'Lipid Profile',                     category:'Biochemistry',   sampleType:'Serum', tat:6 },
  { testCode:'CHOL',  testName:'Total Cholesterol',                 category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'TRG',   testName:'Triglycerides',                     category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'HDL',   testName:'HDL Cholesterol',                   category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'LDL',   testName:'LDL Cholesterol',                   category:'Biochemistry',   sampleType:'Serum', tat:4 },
  // ENZYMES
  { testCode:'AMY',   testName:'Serum Amylase',                     category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'LIP',   testName:'Serum Lipase',                      category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'LDH',   testName:'LDH (Lactate Dehydrogenase)',       category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'CPK',   testName:'CPK (Creatine Phosphokinase Total)', category:'Biochemistry',  sampleType:'Serum', tat:4 },
  { testCode:'CPKMB', testName:'CPK-MB',                            category:'Biochemistry',   sampleType:'Serum', tat:4 },
  // IRON STUDIES
  { testCode:'IRON',  testName:'Serum Iron',                        category:'Biochemistry',   sampleType:'Serum', tat:6 },
  { testCode:'TIBC',  testName:'TIBC (Total Iron Binding Capacity)', category:'Biochemistry',  sampleType:'Serum', tat:6 },
  { testCode:'FERR',  testName:'Serum Ferritin',                    category:'Biochemistry',   sampleType:'Serum', tat:6 },
  { testCode:'IRONSTUDY', testName:'Iron Studies (Iron + TIBC + Ferritin)', category:'Biochemistry', sampleType:'Serum', tat:6 },
  // VITAMINS
  { testCode:'VITD',  testName:'Vitamin D (25-OH)',                 category:'Biochemistry',   sampleType:'Serum', tat:24 },
  { testCode:'VITB12',testName:'Vitamin B12 (Cobalamin)',           category:'Biochemistry',   sampleType:'Serum', tat:24 },
  { testCode:'FOLIC', testName:'Folic Acid (Folate)',               category:'Biochemistry',   sampleType:'Serum', tat:24 },
  { testCode:'ZINC',  testName:'Serum Zinc',                        category:'Biochemistry',   sampleType:'Serum', tat:24 },
  // INFLAMMATORY
  { testCode:'CRP',   testName:'CRP (C-Reactive Protein)',          category:'Biochemistry',   sampleType:'Serum', tat:4 },
  { testCode:'HSCRP', testName:'hs-CRP (High Sensitivity CRP)',     category:'Biochemistry',   sampleType:'Serum', tat:6 },
  { testCode:'PCT',   testName:'Procalcitonin (PCT)',               category:'Biochemistry',   sampleType:'Serum', tat:6 },
  // THYROID
  { testCode:'TSH',   testName:'TSH (Thyroid Stimulating Hormone)', category:'Thyroid',        sampleType:'Serum', tat:6 },
  { testCode:'T3',    testName:'T3 (Total Triiodothyronine)',       category:'Thyroid',        sampleType:'Serum', tat:6 },
  { testCode:'T4',    testName:'T4 (Total Thyroxine)',              category:'Thyroid',        sampleType:'Serum', tat:6 },
  { testCode:'FT3',   testName:'FT3 (Free T3)',                     category:'Thyroid',        sampleType:'Serum', tat:6 },
  { testCode:'FT4',   testName:'FT4 (Free T4)',                     category:'Thyroid',        sampleType:'Serum', tat:6 },
  { testCode:'THYROID3',testName:'Thyroid Profile (TSH + T3 + T4)', category:'Thyroid',       sampleType:'Serum', tat:6 },
  { testCode:'THYROID5',testName:'Thyroid Profile (TSH + FT3 + FT4)', category:'Thyroid',     sampleType:'Serum', tat:6 },
  { testCode:'ANTITPO',testName:'Anti-TPO Antibody',                category:'Thyroid',        sampleType:'Serum', tat:24 },
  { testCode:'ANTITG', testName:'Anti-Thyroglobulin Antibody',      category:'Thyroid',        sampleType:'Serum', tat:24 },
  // HORMONES
  { testCode:'LH',    testName:'LH (Luteinizing Hormone)',          category:'Hormones',       sampleType:'Serum', tat:6 },
  { testCode:'FSH',   testName:'FSH (Follicle Stimulating Hormone)', category:'Hormones',      sampleType:'Serum', tat:6 },
  { testCode:'PRL',   testName:'Prolactin',                         category:'Hormones',       sampleType:'Serum', tat:6 },
  { testCode:'TESTO', testName:'Total Testosterone',                category:'Hormones',       sampleType:'Serum', tat:6 },
  { testCode:'FTESTO',testName:'Free Testosterone',                 category:'Hormones',       sampleType:'Serum', tat:24 },
  { testCode:'E2',    testName:'Estradiol (E2)',                     category:'Hormones',       sampleType:'Serum', tat:6 },
  { testCode:'PROG',  testName:'Progesterone',                      category:'Hormones',       sampleType:'Serum', tat:6 },
  { testCode:'AMH',   testName:'AMH (Anti-Mullerian Hormone)',      category:'Hormones',       sampleType:'Serum', tat:24 },
  { testCode:'BHCG',  testName:'Beta HCG (Pregnancy Test)',         category:'Hormones',       sampleType:'Serum', tat:4 },
  { testCode:'CORT',  testName:'Cortisol (Morning)',                category:'Hormones',       sampleType:'Serum', tat:6 },
  { testCode:'DHEAS', testName:'DHEA-Sulphate',                     category:'Hormones',       sampleType:'Serum', tat:24 },
  { testCode:'INSUL', testName:'Serum Insulin',                     category:'Hormones',       sampleType:'Serum', tat:6 },
  { testCode:'CPEP',  testName:'C-Peptide',                         category:'Hormones',       sampleType:'Serum', tat:24 },
  { testCode:'PSA',   testName:'PSA (Prostate Specific Antigen)',   category:'Hormones',       sampleType:'Serum', tat:6 },
  { testCode:'FPSA',  testName:'Free PSA',                          category:'Hormones',       sampleType:'Serum', tat:6 },
  // CARDIAC MARKERS
  { testCode:'TROPI', testName:'Troponin I',                        category:'Cardiac',        sampleType:'Serum', tat:2 },
  { testCode:'TROPT', testName:'Troponin T',                        category:'Cardiac',        sampleType:'Serum', tat:2 },
  { testCode:'MYOG',  testName:'Myoglobin',                         category:'Cardiac',        sampleType:'Serum', tat:2 },
  { testCode:'BNP',   testName:'BNP (Brain Natriuretic Peptide)',   category:'Cardiac',        sampleType:'Serum', tat:6 },
  { testCode:'NTPRO', testName:'NT-proBNP',                         category:'Cardiac',        sampleType:'Serum', tat:6 },
  { testCode:'HOMOC', testName:'Homocysteine',                      category:'Cardiac',        sampleType:'Serum', tat:24 },
  // TUMOR MARKERS
  { testCode:'AFP',   testName:'AFP (Alpha Fetoprotein)',           category:'Tumor Markers',  sampleType:'Serum', tat:24 },
  { testCode:'CEA',   testName:'CEA (Carcinoembryonic Antigen)',    category:'Tumor Markers',  sampleType:'Serum', tat:24 },
  { testCode:'CA125', testName:'CA-125',                            category:'Tumor Markers',  sampleType:'Serum', tat:24 },
  { testCode:'CA199', testName:'CA 19-9',                           category:'Tumor Markers',  sampleType:'Serum', tat:24 },
  { testCode:'CA153', testName:'CA 15-3',                           category:'Tumor Markers',  sampleType:'Serum', tat:24 },
  { testCode:'B2MG',  testName:'Beta-2 Microglobulin',             category:'Tumor Markers',  sampleType:'Serum', tat:24 },
  // SEROLOGY
  { testCode:'WIDAL', testName:'Widal Test',                        category:'Serology',       sampleType:'Serum', tat:6 },
  { testCode:'VDRL',  testName:'VDRL/RPR (Syphilis)',               category:'Serology',       sampleType:'Serum', tat:4 },
  { testCode:'HIV',   testName:'HIV 1 & 2 (ELISA)',                 category:'Serology',       sampleType:'Serum', tat:4 },
  { testCode:'HBSAG', testName:'HBsAg (Hepatitis B)',               category:'Serology',       sampleType:'Serum', tat:4 },
  { testCode:'HCV',   testName:'HCV Antibody (Hepatitis C)',        category:'Serology',       sampleType:'Serum', tat:4 },
  { testCode:'RAFACT',testName:'RA Factor (Rheumatoid)',            category:'Serology',       sampleType:'Serum', tat:4 },
  { testCode:'ANA',   testName:'ANA (Antinuclear Antibody)',        category:'Serology',       sampleType:'Serum', tat:24 },
  { testCode:'ANTIDS',testName:'Anti-dsDNA Antibody',               category:'Serology',       sampleType:'Serum', tat:24 },
  { testCode:'ASO',   testName:'ASO Titre',                         category:'Serology',       sampleType:'Serum', tat:6 },
  { testCode:'ANCA',  testName:'ANCA',                              category:'Serology',       sampleType:'Serum', tat:24 },
  { testCode:'CMPT',  testName:'Complement C3 & C4',                category:'Serology',       sampleType:'Serum', tat:24 },
  // INFECTIOUS
  { testCode:'DENGNS1',testName:'Dengue NS1 Antigen',              category:'Infectious',     sampleType:'Serum', tat:4 },
  { testCode:'DENGAB',testName:'Dengue IgM & IgG',                  category:'Infectious',     sampleType:'Serum', tat:4 },
  { testCode:'MALAR', testName:'Malaria Antigen (Rapid)',            category:'Infectious',     sampleType:'EDTA Blood', tat:2 },
  { testCode:'TYPHI', testName:'Typhidot (IgM & IgG)',              category:'Infectious',     sampleType:'Serum', tat:4 },
  { testCode:'LEPTIG', testName:'Leptospira IgM',                   category:'Infectious',     sampleType:'Serum', tat:24 },
  { testCode:'CHIKV', testName:'Chikungunya IgM',                   category:'Infectious',     sampleType:'Serum', tat:24 },
  { testCode:'HPYLAB',testName:'H. Pylori Antibody (IgG)',          category:'Infectious',     sampleType:'Serum', tat:24 },
  { testCode:'HPYLSA',testName:'H. Pylori Stool Antigen',           category:'Infectious',     sampleType:'Stool', tat:24 },
  // URINE
  { testCode:'URE',   testName:'Urine Routine Examination',         category:'Urine',          sampleType:'Urine', tat:4 },
  { testCode:'UCS',   testName:'Urine Culture & Sensitivity',       category:'Urine',          sampleType:'Mid-Stream Urine', tat:48 },
  { testCode:'UPR24', testName:'24-Hour Urine Protein',             category:'Urine',          sampleType:'24hr Urine', tat:6 },
  { testCode:'UMICRO',testName:'Urine Microalbumin',                category:'Urine',          sampleType:'Spot Urine', tat:6 },
  { testCode:'UPCR',  testName:'Urine Protein Creatinine Ratio',    category:'Urine',          sampleType:'Spot Urine', tat:4 },
  // STOOL
  { testCode:'STORE', testName:'Stool Routine Examination',         category:'Stool',          sampleType:'Stool', tat:4 },
  { testCode:'SOB',   testName:'Stool Occult Blood',                category:'Stool',          sampleType:'Stool', tat:4 },
  { testCode:'SCS',   testName:'Stool Culture & Sensitivity',       category:'Stool',          sampleType:'Stool', tat:48 },
  // SPUTUM
  { testCode:'SPAFB', testName:'Sputum AFB',                        category:'Sputum',         sampleType:'Sputum', tat:24 },
  { testCode:'SPCS',  testName:'Sputum Culture & Sensitivity',      category:'Sputum',         sampleType:'Sputum', tat:48 },
  { testCode:'SPGS',  testName:'Sputum Gram Stain',                 category:'Sputum',         sampleType:'Sputum', tat:4 },
  // MICROBIOLOGY
  { testCode:'BCS',   testName:'Blood Culture & Sensitivity',       category:'Microbiology',   sampleType:'Blood', tat:72 },
  { testCode:'TSCS',  testName:'Throat Swab Culture & Sensitivity', category:'Microbiology',   sampleType:'Throat Swab', tat:48 },
  { testCode:'WSCS',  testName:'Wound Swab Culture & Sensitivity',  category:'Microbiology',   sampleType:'Wound Swab', tat:48 },
  // SPECIAL
  { testCode:'SEMEN', testName:'Semen Analysis',                    category:'Special',        sampleType:'Semen', tat:6 },
  { testCode:'CSF',   testName:'CSF Analysis',                      category:'Special',        sampleType:'CSF', tat:4 },
  { testCode:'PAPSMEAR',testName:'Pap Smear',                       category:'Special',        sampleType:'Cervical Smear', tat:24 },
  { testCode:'FNAC',  testName:'FNAC Report',                       category:'Special',        sampleType:'FNA Sample', tat:24 },
  { testCode:'BIOPSY',testName:'Biopsy Report',                     category:'Special',        sampleType:'Tissue', tat:72 },
];

// Parameters for tests NOT already seeded
const EXTRA_PARAMS = {
  ESR: [
    { paramName:'ESR (Westergren)', paramCode:'ESR', unit:'mm/hr', maleRange:{low:0,high:15}, femaleRange:{low:0,high:20}, displayOrder:1 }
  ],
  BG: [
    { paramName:'Blood Group', paramCode:'BGTYPE', unit:'', resultType:'text', displayOrder:1 },
    { paramName:'Rh Factor',   paramCode:'RHTYPEW', unit:'', resultType:'text', options:['Positive','Negative'], displayOrder:2 },
  ],
  RETIC: [
    { paramName:'Reticulocyte Count', paramCode:'RETIC', unit:'%', maleRange:{low:0.5,high:2.5}, femaleRange:{low:0.5,high:2.5}, displayOrder:1 }
  ],
  BTCT: [
    { paramName:'Bleeding Time (BT)', paramCode:'BT', unit:'min', maleRange:{low:1,high:3}, femaleRange:{low:1,high:3}, displayOrder:1 },
    { paramName:'Clotting Time (CT)', paramCode:'CT', unit:'min', maleRange:{low:3,high:8}, femaleRange:{low:3,high:8}, displayOrder:2 },
  ],
  PTINR: [
    { paramName:'Prothrombin Time (PT)', paramCode:'PT', unit:'sec', maleRange:{low:11,high:14}, femaleRange:{low:11,high:14}, displayOrder:1 },
    { paramName:'Control PT',           paramCode:'CPT', unit:'sec', displayOrder:2 },
    { paramName:'INR',                  paramCode:'INR', unit:'', maleRange:{low:0.8,high:1.2}, femaleRange:{low:0.8,high:1.2}, displayOrder:3 },
    { paramName:'Prothrombin Activity', paramCode:'PTA', unit:'%', maleRange:{low:70,high:130}, femaleRange:{low:70,high:130}, displayOrder:4 },
  ],
  APTT: [
    { paramName:'APTT',         paramCode:'APTT', unit:'sec', maleRange:{low:26,high:40}, femaleRange:{low:26,high:40}, displayOrder:1 },
    { paramName:'Control APTT', paramCode:'CAPTT', unit:'sec', displayOrder:2 },
  ],
  DDIM: [
    { paramName:'D-Dimer', paramCode:'DDIM', unit:'µg/mL FEU', maleRange:{low:0,high:0.5}, femaleRange:{low:0,high:0.5}, displayOrder:1 }
  ],
  RBS:  [{ paramName:'Random Blood Sugar',      paramCode:'RBS', unit:'mg/dL', maleRange:{low:70,high:140}, femaleRange:{low:70,high:140}, displayOrder:1 }],
  FBS:  [{ paramName:'Fasting Blood Sugar',      paramCode:'FBS', unit:'mg/dL', maleRange:{low:70,high:100}, femaleRange:{low:70,high:100}, displayOrder:1 }],
  PPBS: [{ paramName:'Post Prandial Blood Sugar', paramCode:'PPBS', unit:'mg/dL', maleRange:{low:70,high:140}, femaleRange:{low:70,high:140}, displayOrder:1 }],
  GTT: [
    { paramName:'Fasting Blood Sugar',        paramCode:'GTT0', unit:'mg/dL', maleRange:{low:70,high:100}, femaleRange:{low:70,high:100}, displayOrder:1 },
    { paramName:'1 Hour Blood Sugar',         paramCode:'GTT1', unit:'mg/dL', maleRange:{low:0,high:180}, femaleRange:{low:0,high:180}, displayOrder:2 },
    { paramName:'2 Hour Blood Sugar',         paramCode:'GTT2', unit:'mg/dL', maleRange:{low:70,high:140}, femaleRange:{low:70,high:140}, displayOrder:3 },
  ],
  HBA1C: [
    { paramName:'HbA1c',          paramCode:'HBA1C', unit:'%',      maleRange:{low:4,high:5.6}, femaleRange:{low:4,high:5.6}, displayOrder:1 },
    { paramName:'eAG (Estimated Average Glucose)', paramCode:'EAG', unit:'mg/dL', displayOrder:2 },
  ],
  UREA:   [{ paramName:'Blood Urea',      paramCode:'UREA',  unit:'mg/dL', maleRange:{low:17,high:43}, femaleRange:{low:17,high:43}, displayOrder:1 }],
  SCREAT: [{ paramName:'Serum Creatinine', paramCode:'CREAT', unit:'mg/dL', maleRange:{low:0.7,high:1.3}, femaleRange:{low:0.6,high:1.1}, displayOrder:1 }],
  SUA:    [{ paramName:'Serum Uric Acid',  paramCode:'UA',    unit:'mg/dL', maleRange:{low:3.4,high:7.0}, femaleRange:{low:2.4,high:5.7}, displayOrder:1 }],
  SEELEC: [
    { paramName:'Sodium (Na+)',    paramCode:'NA', unit:'mEq/L', maleRange:{low:136,high:145}, femaleRange:{low:136,high:145}, displayOrder:1 },
    { paramName:'Potassium (K+)', paramCode:'K',  unit:'mEq/L', maleRange:{low:3.5,high:5.0}, femaleRange:{low:3.5,high:5.0}, displayOrder:2 },
    { paramName:'Chloride (Cl-)', paramCode:'CL', unit:'mEq/L', maleRange:{low:98,high:107},  femaleRange:{low:98,high:107},  displayOrder:3 },
  ],
  SNA:   [{ paramName:'Serum Sodium',    paramCode:'NA',  unit:'mEq/L', maleRange:{low:136,high:145}, femaleRange:{low:136,high:145}, displayOrder:1 }],
  SK:    [{ paramName:'Serum Potassium', paramCode:'K',   unit:'mEq/L', maleRange:{low:3.5,high:5.0}, femaleRange:{low:3.5,high:5.0}, displayOrder:1 }],
  SCL:   [{ paramName:'Serum Chloride',  paramCode:'CL',  unit:'mEq/L', maleRange:{low:98,high:107},  femaleRange:{low:98,high:107},  displayOrder:1 }],
  SCA:   [{ paramName:'Serum Calcium',   paramCode:'CA',  unit:'mg/dL', maleRange:{low:8.5,high:10.5},femaleRange:{low:8.5,high:10.5},displayOrder:1 }],
  SPHOSPH:[{ paramName:'Serum Phosphorus',paramCode:'PH', unit:'mg/dL', maleRange:{low:2.5,high:4.5}, femaleRange:{low:2.5,high:4.5}, displayOrder:1 }],
  SMG:   [{ paramName:'Serum Magnesium', paramCode:'MG',  unit:'mg/dL', maleRange:{low:1.7,high:2.3}, femaleRange:{low:1.7,high:2.3}, displayOrder:1 }],
  TBIL: [
    { paramName:'Total Bilirubin',    paramCode:'TBIL', unit:'mg/dL', maleRange:{low:0.2,high:1.2}, femaleRange:{low:0.2,high:1.2}, displayOrder:1 },
    { paramName:'Direct Bilirubin',   paramCode:'DBIL', unit:'mg/dL', maleRange:{low:0,high:0.3},   femaleRange:{low:0,high:0.3},   displayOrder:2 },
    { paramName:'Indirect Bilirubin', paramCode:'IBIL', unit:'mg/dL', maleRange:{low:0.1,high:0.9}, femaleRange:{low:0.1,high:0.9}, displayOrder:3 },
  ],
  SGOT:  [{ paramName:'SGOT (AST)', paramCode:'AST', unit:'U/L', maleRange:{low:10,high:40}, femaleRange:{low:10,high:32}, displayOrder:1 }],
  SGPT:  [{ paramName:'SGPT (ALT)', paramCode:'ALT', unit:'U/L', maleRange:{low:7,high:56},  femaleRange:{low:7,high:35},  displayOrder:1 }],
  SALP:  [{ paramName:'ALP (Alkaline Phosphatase)', paramCode:'ALP', unit:'U/L', maleRange:{low:40,high:129}, femaleRange:{low:35,high:104}, displayOrder:1 }],
  SGGT:  [{ paramName:'GGT (Gamma GT)', paramCode:'GGT', unit:'U/L', maleRange:{low:9,high:48}, femaleRange:{low:9,high:36}, displayOrder:1 }],
  STP:   [{ paramName:'Total Protein', paramCode:'TP', unit:'g/dL', maleRange:{low:6.4,high:8.3}, femaleRange:{low:6.4,high:8.3}, displayOrder:1 }],
  SALB:  [{ paramName:'Serum Albumin', paramCode:'ALB', unit:'g/dL', maleRange:{low:3.5,high:5.0}, femaleRange:{low:3.5,high:5.0}, displayOrder:1 }],
  CHOL:  [{ paramName:'Total Cholesterol', paramCode:'CHOL', unit:'mg/dL', maleRange:{low:0,high:200}, femaleRange:{low:0,high:200}, displayOrder:1 }],
  TRG:   [{ paramName:'Triglycerides', paramCode:'TRG', unit:'mg/dL', maleRange:{low:0,high:150}, femaleRange:{low:0,high:150}, displayOrder:1 }],
  HDL:   [{ paramName:'HDL Cholesterol', paramCode:'HDL', unit:'mg/dL', maleRange:{low:40,high:60}, femaleRange:{low:50,high:80}, displayOrder:1 }],
  LDL:   [{ paramName:'LDL Cholesterol', paramCode:'LDL', unit:'mg/dL', maleRange:{low:0,high:100}, femaleRange:{low:0,high:100}, displayOrder:1 }],
  AMY:   [{ paramName:'Serum Amylase', paramCode:'AMY', unit:'U/L', maleRange:{low:30,high:110}, femaleRange:{low:30,high:110}, displayOrder:1 }],
  LIP:   [{ paramName:'Serum Lipase',  paramCode:'LIP', unit:'U/L', maleRange:{low:7,high:60},   femaleRange:{low:7,high:60},   displayOrder:1 }],
  LDH:   [{ paramName:'LDH',  paramCode:'LDH',  unit:'U/L', maleRange:{low:140,high:280}, femaleRange:{low:140,high:280}, displayOrder:1 }],
  CPK:   [{ paramName:'CPK Total', paramCode:'CPK', unit:'U/L', maleRange:{low:30,high:220}, femaleRange:{low:30,high:170}, displayOrder:1 }],
  CPKMB: [{ paramName:'CPK-MB', paramCode:'CPKMB', unit:'U/L', maleRange:{low:0,high:25}, femaleRange:{low:0,high:25}, displayOrder:1 }],
  IRON:  [{ paramName:'Serum Iron', paramCode:'IRON', unit:'µg/dL', maleRange:{low:60,high:170}, femaleRange:{low:50,high:150}, displayOrder:1 }],
  TIBC:  [{ paramName:'TIBC', paramCode:'TIBC', unit:'µg/dL', maleRange:{low:250,high:400}, femaleRange:{low:250,high:400}, displayOrder:1 }],
  FERR:  [{ paramName:'Serum Ferritin', paramCode:'FERR', unit:'ng/mL', maleRange:{low:12,high:300}, femaleRange:{low:10,high:150}, displayOrder:1 }],
  IRONSTUDY: [
    { paramName:'Serum Iron',   paramCode:'IRON', unit:'µg/dL', maleRange:{low:60,high:170}, femaleRange:{low:50,high:150}, displayOrder:1 },
    { paramName:'TIBC',         paramCode:'TIBC', unit:'µg/dL', maleRange:{low:250,high:400}, femaleRange:{low:250,high:400}, displayOrder:2 },
    { paramName:'Serum Ferritin', paramCode:'FERR', unit:'ng/mL', maleRange:{low:12,high:300}, femaleRange:{low:10,high:150}, displayOrder:3 },
    { paramName:'Transferrin Saturation', paramCode:'TSAT', unit:'%', maleRange:{low:20,high:50}, femaleRange:{low:15,high:50}, displayOrder:4 },
  ],
  VITD:   [{ paramName:'Vitamin D (25-OH)', paramCode:'VITD', unit:'ng/mL', maleRange:{low:30,high:100}, femaleRange:{low:30,high:100}, displayOrder:1 }],
  VITB12: [{ paramName:'Vitamin B12', paramCode:'B12', unit:'pg/mL', maleRange:{low:200,high:900}, femaleRange:{low:200,high:900}, displayOrder:1 }],
  FOLIC:  [{ paramName:'Folic Acid', paramCode:'FOLIC', unit:'ng/mL', maleRange:{low:3.1,high:20.5}, femaleRange:{low:3.1,high:20.5}, displayOrder:1 }],
  ZINC:   [{ paramName:'Serum Zinc', paramCode:'ZINC', unit:'µg/dL', maleRange:{low:60,high:130}, femaleRange:{low:60,high:130}, displayOrder:1 }],
  CRP:    [{ paramName:'CRP', paramCode:'CRP', unit:'mg/L', maleRange:{low:0,high:6}, femaleRange:{low:0,high:6}, displayOrder:1 }],
  HSCRP:  [{ paramName:'hs-CRP', paramCode:'HSCRP', unit:'mg/L', maleRange:{low:0,high:3}, femaleRange:{low:0,high:3}, displayOrder:1 }],
  PCT:    [{ paramName:'Procalcitonin', paramCode:'PCT', unit:'ng/mL', maleRange:{low:0,high:0.5}, femaleRange:{low:0,high:0.5}, displayOrder:1 }],
  FT3:    [{ paramName:'Free T3 (FT3)', paramCode:'FT3', unit:'pg/mL', maleRange:{low:2.3,high:4.2}, femaleRange:{low:2.3,high:4.2}, displayOrder:1 }],
  FT4:    [{ paramName:'Free T4 (FT4)', paramCode:'FT4', unit:'ng/dL', maleRange:{low:0.89,high:1.76}, femaleRange:{low:0.89,high:1.76}, displayOrder:1 }],
  THYROID3: [
    { paramName:'TSH', paramCode:'TSH3', unit:'mIU/L', maleRange:{low:0.4,high:4.0}, femaleRange:{low:0.4,high:4.0}, displayOrder:1 },
    { paramName:'T3',  paramCode:'T33',  unit:'ng/dL', maleRange:{low:80,high:200},  femaleRange:{low:80,high:200},  displayOrder:2 },
    { paramName:'T4',  paramCode:'T43',  unit:'µg/dL', maleRange:{low:5.1,high:14.1},femaleRange:{low:5.1,high:14.1},displayOrder:3 },
  ],
  THYROID5: [
    { paramName:'TSH', paramCode:'TSH5', unit:'mIU/L', maleRange:{low:0.4,high:4.0}, femaleRange:{low:0.4,high:4.0}, displayOrder:1 },
    { paramName:'FT3', paramCode:'FT35', unit:'pg/mL', maleRange:{low:2.3,high:4.2}, femaleRange:{low:2.3,high:4.2}, displayOrder:2 },
    { paramName:'FT4', paramCode:'FT45', unit:'ng/dL', maleRange:{low:0.89,high:1.76},femaleRange:{low:0.89,high:1.76},displayOrder:3 },
  ],
  ANTITPO:  [{ paramName:'Anti-TPO Antibody', paramCode:'ANTITPO', unit:'IU/mL', maleRange:{low:0,high:34}, femaleRange:{low:0,high:34}, displayOrder:1 }],
  ANTITG:   [{ paramName:'Anti-Thyroglobulin', paramCode:'ANTITG', unit:'IU/mL', maleRange:{low:0,high:115}, femaleRange:{low:0,high:115}, displayOrder:1 }],
  LH:    [{ paramName:'LH', paramCode:'LH', unit:'mIU/mL', displayOrder:1 }],
  FSH:   [{ paramName:'FSH', paramCode:'FSH', unit:'mIU/mL', displayOrder:1 }],
  PRL:   [{ paramName:'Prolactin', paramCode:'PRL', unit:'ng/mL', displayOrder:1 }],
  TESTO: [{ paramName:'Total Testosterone', paramCode:'TESTO', unit:'ng/dL', maleRange:{low:270,high:1070}, femaleRange:{low:15,high:70}, displayOrder:1 }],
  E2:    [{ paramName:'Estradiol (E2)', paramCode:'E2', unit:'pg/mL', displayOrder:1 }],
  PROG:  [{ paramName:'Progesterone', paramCode:'PROG', unit:'ng/mL', displayOrder:1 }],
  AMH:   [{ paramName:'AMH', paramCode:'AMH', unit:'ng/mL', displayOrder:1 }],
  BHCG:  [{ paramName:'Beta HCG', paramCode:'BHCG', unit:'mIU/mL', displayOrder:1 }],
  CORT:  [{ paramName:'Cortisol (AM)', paramCode:'CORT', unit:'µg/dL', maleRange:{low:6.2,high:19.4}, femaleRange:{low:6.2,high:19.4}, displayOrder:1 }],
  DHEAS: [{ paramName:'DHEA-S', paramCode:'DHEAS', unit:'µg/dL', displayOrder:1 }],
  INSUL: [{ paramName:'Serum Insulin', paramCode:'INSUL', unit:'µIU/mL', maleRange:{low:2,high:25}, femaleRange:{low:2,high:25}, displayOrder:1 }],
  CPEP:  [{ paramName:'C-Peptide', paramCode:'CPEP', unit:'ng/mL', maleRange:{low:0.8,high:3.85}, femaleRange:{low:0.8,high:3.85}, displayOrder:1 }],
  PSA:   [{ paramName:'PSA (Total)', paramCode:'PSA', unit:'ng/mL', maleRange:{low:0,high:4.0}, femaleRange:{low:0,high:4.0}, displayOrder:1 }],
  FPSA:  [
    { paramName:'Total PSA',  paramCode:'TPSA', unit:'ng/mL', maleRange:{low:0,high:4.0}, displayOrder:1 },
    { paramName:'Free PSA',   paramCode:'FPSA', unit:'ng/mL', displayOrder:2 },
    { paramName:'Free/Total % Ratio', paramCode:'FPTR', unit:'%', displayOrder:3 },
  ],
  TROPI: [{ paramName:'Troponin I', paramCode:'TROPI', unit:'ng/mL', maleRange:{low:0,high:0.04}, femaleRange:{low:0,high:0.04}, displayOrder:1, resultType:'text', options:['Positive','Negative'] }],
  TROPT: [{ paramName:'Troponin T', paramCode:'TROPT', unit:'ng/mL', displayOrder:1, resultType:'text', options:['Positive','Negative'] }],
  MYOG:  [{ paramName:'Myoglobin', paramCode:'MYOG', unit:'ng/mL', maleRange:{low:0,high:90}, femaleRange:{low:0,high:65}, displayOrder:1 }],
  BNP:   [{ paramName:'BNP', paramCode:'BNP', unit:'pg/mL', maleRange:{low:0,high:100}, femaleRange:{low:0,high:100}, displayOrder:1 }],
  NTPRO: [{ paramName:'NT-proBNP', paramCode:'NTPRO', unit:'pg/mL', maleRange:{low:0,high:125}, femaleRange:{low:0,high:125}, displayOrder:1 }],
  HOMOC: [{ paramName:'Homocysteine', paramCode:'HOMOC', unit:'µmol/L', maleRange:{low:4,high:15}, femaleRange:{low:4,high:12}, displayOrder:1 }],
  AFP:   [{ paramName:'AFP', paramCode:'AFP', unit:'ng/mL', maleRange:{low:0,high:7.0}, femaleRange:{low:0,high:7.0}, displayOrder:1 }],
  CEA:   [{ paramName:'CEA', paramCode:'CEA', unit:'ng/mL', maleRange:{low:0,high:5.0}, femaleRange:{low:0,high:5.0}, displayOrder:1 }],
  CA125: [{ paramName:'CA-125', paramCode:'CA125', unit:'U/mL', maleRange:{low:0,high:35}, femaleRange:{low:0,high:35}, displayOrder:1 }],
  CA199: [{ paramName:'CA 19-9', paramCode:'CA199', unit:'U/mL', maleRange:{low:0,high:37}, femaleRange:{low:0,high:37}, displayOrder:1 }],
  CA153: [{ paramName:'CA 15-3', paramCode:'CA153', unit:'U/mL', maleRange:{low:0,high:31.3}, femaleRange:{low:0,high:31.3}, displayOrder:1 }],
  B2MG:  [{ paramName:'Beta-2 Microglobulin', paramCode:'B2MG', unit:'mg/L', maleRange:{low:0.8,high:2.4}, femaleRange:{low:0.8,high:2.4}, displayOrder:1 }],
  WIDAL: [
    { paramName:'Salmonella Typhi O (TO)',    paramCode:'TO',  unit:'', displayOrder:1, resultType:'text' },
    { paramName:'Salmonella Typhi H (TH)',    paramCode:'TH',  unit:'', displayOrder:2, resultType:'text' },
    { paramName:'Salmonella Paratyphi AO',    paramCode:'AO',  unit:'', displayOrder:3, resultType:'text' },
    { paramName:'Salmonella Paratyphi BH',    paramCode:'BH',  unit:'', displayOrder:4, resultType:'text' },
  ],
  VDRL:    [{ paramName:'VDRL/RPR', paramCode:'VDRL', unit:'', displayOrder:1, resultType:'text', options:['Non-Reactive','Reactive'] }],
  HIV:     [{ paramName:'HIV 1 & 2', paramCode:'HIV', unit:'', displayOrder:1, resultType:'text', options:['Non-Reactive','Reactive'] }],
  HBSAG:   [{ paramName:'HBsAg', paramCode:'HBSAG', unit:'', displayOrder:1, resultType:'text', options:['Non-Reactive','Reactive'] }],
  HCV:     [{ paramName:'HCV Antibody', paramCode:'HCV', unit:'', displayOrder:1, resultType:'text', options:['Non-Reactive','Reactive'] }],
  RAFACT:  [{ paramName:'RA Factor', paramCode:'RAFACT', unit:'IU/mL', maleRange:{low:0,high:14}, femaleRange:{low:0,high:14}, displayOrder:1, resultType:'text', options:['Non-Reactive','Reactive'] }],
  ANA:     [{ paramName:'ANA (Antinuclear Antibody)', paramCode:'ANA', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] }],
  ANTIDS:  [{ paramName:'Anti-dsDNA Antibody', paramCode:'ANTIDS', unit:'IU/mL', displayOrder:1 }],
  ASO:     [{ paramName:'ASO Titre', paramCode:'ASO', unit:'IU/mL', maleRange:{low:0,high:200}, femaleRange:{low:0,high:200}, displayOrder:1 }],
  DENGNS1: [{ paramName:'Dengue NS1 Antigen', paramCode:'DENGNS1', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] }],
  DENGAB: [
    { paramName:'Dengue IgM', paramCode:'DENGIGM', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] },
    { paramName:'Dengue IgG', paramCode:'DENGIGG', unit:'', displayOrder:2, resultType:'text', options:['Negative','Positive'] },
  ],
  MALAR: [
    { paramName:'Malaria PfHRP2 (P. falciparum)', paramCode:'MALARPF', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] },
    { paramName:'Malaria PAN (P. vivax)',          paramCode:'MALARPV', unit:'', displayOrder:2, resultType:'text', options:['Negative','Positive'] },
  ],
  TYPHI: [
    { paramName:'Typhidot IgM', paramCode:'TYPHIGM', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] },
    { paramName:'Typhidot IgG', paramCode:'TYPHIGG', unit:'', displayOrder:2, resultType:'text', options:['Negative','Positive'] },
  ],
  LEPTIG:  [{ paramName:'Leptospira IgM', paramCode:'LEPT', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] }],
  CHIKV:   [{ paramName:'Chikungunya IgM', paramCode:'CHIKV', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] }],
  HPYLAB:  [{ paramName:'H. Pylori IgG', paramCode:'HPYLAB', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] }],
  HPYLSA:  [{ paramName:'H. Pylori Stool Antigen', paramCode:'HPYLSA', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] }],
  SOB:     [{ paramName:'Occult Blood (Stool)', paramCode:'SOB', unit:'', displayOrder:1, resultType:'text', options:['Negative','Positive'] }],
  SPAFB: [
    { paramName:'Sputum AFB (Ziehl-Neelsen)', paramCode:'AFB', unit:'', displayOrder:1, resultType:'text', options:['No AFB Seen','Scanty','1+','2+','3+'] },
  ],
  SEMEN: [
    { paramName:'Volume',              paramCode:'SEMVOL',  unit:'mL',    maleRange:{low:1.5,high:5.0}, displayOrder:1 },
    { paramName:'Liquefaction Time',   paramCode:'SEMLIQ',  unit:'min',   displayOrder:2, resultType:'text' },
    { paramName:'Colour',              paramCode:'SEMCOL',  unit:'',      displayOrder:3, resultType:'text', options:['Whitish Grey','Yellowish','Clear'] },
    { paramName:'pH',                  paramCode:'SEMPH',   unit:'',      maleRange:{low:7.2,high:8.0}, displayOrder:4 },
    { paramName:'Total Sperm Count',   paramCode:'SEMTOT',  unit:'million/mL', maleRange:{low:16,high:213}, displayOrder:5 },
    { paramName:'Total Motility',      paramCode:'SEMTMOT', unit:'%',     maleRange:{low:42,high:100}, displayOrder:6 },
    { paramName:'Progressive Motility (PR)', paramCode:'SEMPR', unit:'%', maleRange:{low:30,high:100}, displayOrder:7 },
    { paramName:'Non-Progressive Motility (NP)', paramCode:'SEMNP', unit:'%', displayOrder:8 },
    { paramName:'Immotile Sperm',      paramCode:'SEMIMM',  unit:'%',     displayOrder:9 },
    { paramName:'Normal Morphology',   paramCode:'SEMMORP', unit:'%',     maleRange:{low:4,high:100}, displayOrder:10 },
    { paramName:'WBC (Pus Cells)',     paramCode:'SEMWBC',  unit:'/HPF',  maleRange:{low:0,high:5}, displayOrder:11 },
  ],
  STORE: [
    { paramName:'Colour',              paramCode:'STCOL',  unit:'', displayOrder:1, resultType:'text' },
    { paramName:'Consistency',         paramCode:'STCON',  unit:'', displayOrder:2, resultType:'text', options:['Formed','Semi-formed','Soft','Loose','Watery'] },
    { paramName:'Mucus',               paramCode:'STMUC',  unit:'', displayOrder:3, resultType:'text', options:['Absent','Present'] },
    { paramName:'Blood',               paramCode:'STBLD',  unit:'', displayOrder:4, resultType:'text', options:['Absent','Present'] },
    { paramName:'Pus Cells',           paramCode:'STPUS',  unit:'/HPF', displayOrder:5 },
    { paramName:'RBC',                 paramCode:'STRBC',  unit:'/HPF', displayOrder:6 },
    { paramName:'Epithelial Cells',    paramCode:'STEPI',  unit:'/HPF', displayOrder:7 },
    { paramName:'Ova/Cysts/Parasites', paramCode:'STPAR',  unit:'', displayOrder:8, resultType:'text', options:['Not Seen','Seen'] },
    { paramName:'Bacteria',            paramCode:'STBAC',  unit:'', displayOrder:9, resultType:'text', options:['Absent','Few','Moderate','Many'] },
  ],
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    let testCreated = 0, testSkipped = 0, paramsSeeded = 0;

    for (const t of TESTS) {
      const exists = await Test.findOne({ testCode: t.testCode });
      if (exists) {
        testSkipped++;
        // Still seed params if not done
        const paramDefs = EXTRA_PARAMS[t.testCode];
        if (paramDefs) {
          const count = await TestParameter.countDocuments({ test: exists._id });
          if (count === 0) {
            const docs = paramDefs.map(p => ({ test: exists._id, isActive: true, ...p }));
            await TestParameter.insertMany(docs);
            paramsSeeded += docs.length;
            console.log(`   📋 Params added for ${t.testCode}: ${docs.length}`);
          }
        }
        continue;
      }
      const test = await Test.create({
        testCode: t.testCode, testName: t.testName, category: t.category,
        sampleType: t.sampleType, price: 0, tat: t.tat || 24, isActive: true,
      });
      testCreated++;
      console.log(`✅ Created: ${t.testCode} — ${t.testName}`);

      const paramDefs = EXTRA_PARAMS[t.testCode];
      if (paramDefs) {
        const docs = paramDefs.map(p => ({ test: test._id, isActive: true, ...p }));
        await TestParameter.insertMany(docs);
        paramsSeeded += docs.length;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Tests created: ${testCreated}`);
    console.log(`   Tests skipped (already exist): ${testSkipped}`);
    console.log(`   Parameters seeded: ${paramsSeeded}`);
    console.log('🎉 Done!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();
