/**
 * Generic Laboratory Calculation & Formula Engine
 * Configuration-Driven & Dynamic Formula Parser
 */

// Safe number parser
export const parseNum = (val) => {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s === '' || isNaN(Number(s))) return null;
  return Number(s);
};

// Check if a value is valid/reportable (preserves 0, 0.0, negative numbers, text values like Nil/Absent/Negative)
export const isReportable = (val) => {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  return s !== '';
};

// Safe rounding with decimal precision
export const roundTo = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return '';
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(num * factor) / factor;
  return String(rounded);
};

// Normalizes parameter keys for matching
export const normalizeKey = (name = '') =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Safely evaluates a math expression with a dictionary of numeric variables.
 * Supports basic arithmetic (+, -, *, /), parentheses, and constants.
 */
export const evaluateExpression = (expr = '', varMap = {}) => {
  if (!expr || typeof expr !== 'string') return null;

  // Tokenize words and replace with variable values
  let safeExpr = expr;
  // Sort keys by length descending to prevent partial replacement
  const sortedKeys = Object.keys(varMap).sort((a, b) => b.length - a.length);

  for (const k of sortedKeys) {
    const val = varMap[k];
    if (val === null || val === undefined) return null; // dependency missing
    const regex = new RegExp(`\\b${k}\\b`, 'gi');
    safeExpr = safeExpr.replace(regex, `(${val})`);
  }

  // Check if expression still contains alphabetic characters (unresolved dependencies)
  if (/[a-zA-Z]/.test(safeExpr)) {
    return null; // Unresolved variable
  }

  // Validate only allowed characters: digits, ., +, -, *, /, (, ), spaces
  if (!/^[\d\.\+\-\*\/\(\)\s]+$/.test(safeExpr)) {
    return null;
  }

  try {
    // Check for division by zero before evaluating
    if (/\/0(?!\.)/.test(safeExpr.replace(/\s+/g, '')) || /\/\(0\)/.test(safeExpr.replace(/\s+/g, ''))) {
      return null;
    }
    // Safe evaluation using Function constructor
    const result = Function(`'use strict'; return (${safeExpr})`)();
    if (result === null || result === undefined || isNaN(result) || !isFinite(result)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
};

/**
 * Recalculates all derived parameters for a test section.
 * @param {Array} rows - List of parameter rows in the section [{ param, result, unit, refRange, formula, ... }]
 * @param {String} testName - Name of the test/section
 * @returns {Array} - Updated rows with auto-calculated values
 */
export const recalculateSection = (rows = [], testName = '') => {
  if (!Array.isArray(rows) || rows.length === 0) return rows;

  // Build key-value map of current non-empty numeric inputs
  const varMap = {};
  rows.forEach((r) => {
    const num = parseNum(r.result);
    if (num !== null) {
      if (r.paramCode) varMap[r.paramCode.toUpperCase()] = num;
      if (r.param) {
        varMap[normalizeKey(r.param)] = num;
        // Add individual words / short aliases
        const words = r.param.split(/[\s\(\)\/\-\+]+/);
        words.forEach((w) => {
          if (w.length >= 2 && !varMap[w.toUpperCase()]) {
            varMap[w.toUpperCase()] = num;
          }
        });
      }
    }
  });

  const getVal = (...aliases) => {
    for (const a of aliases) {
      const k = normalizeKey(a);
      if (varMap[k] !== undefined && varMap[k] !== null) return varMap[k];
      const uk = a.toUpperCase();
      if (varMap[uk] !== undefined && varMap[uk] !== null) return varMap[uk];
      for (const [vKey, vVal] of Object.entries(varMap)) {
        if (vKey.includes(k) || k.includes(vKey)) return vVal;
      }
    }
    return null;
  };

  return rows.map((r) => {
    const precision = r.decimalPrecision ?? 2;
    const pName = normalizeKey(r.param);

    // 1. If row has an explicit custom formula configured
    if (r.formula && typeof r.formula === 'string' && r.formula.trim() !== '') {
      const calculated = evaluateExpression(r.formula, varMap);
      if (calculated !== null) {
        return { ...r, result: roundTo(calculated, precision), isCalculated: true };
      }
      // If formula dependencies are not yet entered, clear calculated result unless manually overridden
      if (!r.isManual) {
        return { ...r, result: '' };
      }
    }

    // 2. Standard Laboratory Formula Rules
    // ──────────────────────── LFT CALCULATIONS ────────────────────────
    // Indirect Bilirubin = Total Bilirubin - Direct Bilirubin
    if (pName.includes('indirectbilirubin') || pName === 'ibil') {
      const tbil = getVal('totalbilirubin', 'tbil', 'bilirubintotal');
      const dbil = getVal('directbilirubin', 'dbil', 'bilirubindirect');
      if (tbil !== null && dbil !== null && tbil >= dbil) {
        return { ...r, result: roundTo(tbil - dbil, 2), isCalculated: true };
      }
      if (tbil === null || dbil === null) return r.isManual ? r : { ...r, result: '' };
    }

    // Serum Globulin = Total Protein - Serum Albumin
    if (pName.includes('globulin') && !pName.includes('ratio') && !pName.includes('microglobulin') && !pName.includes('ag')) {
      const tp = getVal('totalprotein', 'totalserumprotein', 'protein', 'serumprotein', 'tp');
      const alb = getVal('albumin', 'serumalbumin', 'alb');
      if (tp !== null && alb !== null && tp >= alb) {
        return { ...r, result: roundTo(tp - alb, 2), isCalculated: true };
      }
      if (tp === null || alb === null) return r.isManual ? r : { ...r, result: '' };
    }

    // A/G Ratio = Serum Albumin / Serum Globulin
    if (pName.includes('agratio') || pName.includes('albumin/globulin') || pName.includes('albuminglobulinratio') || pName === 'ag') {
      const alb = getVal('albumin', 'serumalbumin', 'alb');
      let glob = getVal('globulin', 'serumglobulin', 'glob');
      if (glob === null) {
        const tp = getVal('totalprotein', 'totalserumprotein', 'protein', 'tp');
        if (tp !== null && alb !== null && tp > alb) glob = tp - alb;
      }
      if (alb !== null && glob !== null && glob > 0) {
        return { ...r, result: roundTo(alb / glob, 2), isCalculated: true };
      }
      if (alb === null || glob === null || glob <= 0) return r.isManual ? r : { ...r, result: '' };
    }

    // ──────────────────────── LIPID PROFILE CALCULATIONS ──────────────
    // VLDL = Triglycerides / 5
    if (pName.includes('vldl') || pName.includes('vldlcholesterol')) {
      const trg = getVal('triglycerides', 'serumtriglycerides', 'trg');
      if (trg !== null && trg >= 0) {
        return { ...r, result: roundTo(trg / 5, 1), isCalculated: true };
      }
      if (trg === null) return r.isManual ? r : { ...r, result: '' };
    }

    // Non-HDL = Total Cholesterol - HDL
    if (pName.includes('nonhdl') || pName.includes('nonhdlcholesterol')) {
      const chol = getVal('totalcholesterol', 'cholesterol', 'chol');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (chol !== null && hdl !== null && chol >= hdl) {
        return { ...r, result: roundTo(chol - hdl, 1), isCalculated: true };
      }
      if (chol === null || hdl === null) return r.isManual ? r : { ...r, result: '' };
    }

    // LDL / HDL Ratio
    if ((pName.includes('ldlhdl') || pName.includes('ldl/hdl')) && pName.includes('ratio')) {
      const ldl = getVal('ldlcholesterol', 'ldl');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (ldl !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(ldl / hdl, 2), isCalculated: true };
      }
      if (ldl === null || hdl === null || hdl <= 0) return r.isManual ? r : { ...r, result: '' };
    }

    // Total / HDL Ratio
    if ((pName.includes('totalhdl') || pName.includes('total/hdl') || pName.includes('cholesterolhdl')) && pName.includes('ratio')) {
      const chol = getVal('totalcholesterol', 'cholesterol', 'chol');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (chol !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(chol / hdl, 2), isCalculated: true };
      }
      if (chol === null || hdl === null || hdl <= 0) return r.isManual ? r : { ...r, result: '' };
    }

    // Triglycerides / HDL Ratio
    if ((pName.includes('triglycerideshdl') || pName.includes('triglyceride/hdl') || pName.includes('trghdl')) && pName.includes('ratio')) {
      const trg = getVal('triglycerides', 'serumtriglycerides', 'trg');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (trg !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(trg / hdl, 2), isCalculated: true };
      }
      if (trg === null || hdl === null || hdl <= 0) return r.isManual ? r : { ...r, result: '' };
    }

    // ──────────────────────── KFT CALCULATIONS ────────────────────────
    // BUN = Serum Urea / 2.14
    if (pName === 'bun' || pName.includes('bloodureanitrogen')) {
      const urea = getVal('serumurea', 'urea', 'bloodurea');
      if (urea !== null && urea >= 0) {
        return { ...r, result: roundTo(urea / 2.14, 1), isCalculated: true };
      }
    }

    // Urea / Creatinine Ratio
    if (pName.includes('ureacreatinine') || (pName.includes('urea') && pName.includes('creatinine') && pName.includes('ratio'))) {
      const urea = getVal('serumurea', 'urea', 'bloodurea');
      const creat = getVal('serumcreatinine', 'creatinine', 'creat');
      if (urea !== null && creat !== null && creat > 0) {
        return { ...r, result: roundTo(urea / creat, 2), isCalculated: true };
      }
      if (urea === null || creat === null || creat <= 0) return r.isManual ? r : { ...r, result: '' };
    }

    // BUN / Creatinine Ratio
    if (pName.includes('buncreatinine') || (pName.includes('bun') && pName.includes('creatinine') && pName.includes('ratio'))) {
      let bun = getVal('bun', 'bloodureanitrogen');
      if (bun === null) {
        const urea = getVal('serumurea', 'urea');
        if (urea !== null) bun = urea / 2.14;
      }
      const creat = getVal('serumcreatinine', 'creatinine', 'creat');
      if (bun !== null && creat !== null && creat > 0) {
        return { ...r, result: roundTo(bun / creat, 2), isCalculated: true };
      }
    }

    // ──────────────────────── HBA1C CALCULATIONS ──────────────────────
    // Mean Blood Glucose (eAG) = 28.7 * HbA1c - 46.7
    if (pName.includes('meanbloodglucose') || pName.includes('estimatedaverageglucose') || pName === 'eag' || pName.includes('mbg')) {
      const a1c = getVal('glycosylatedhemoglobin', 'hba1c', 'ghb', 'a1c');
      if (a1c !== null && a1c > 0) {
        const eag = 28.7 * a1c - 46.7;
        return { ...r, result: roundTo(Math.max(0, eag), 2), isCalculated: true };
      }
      if (a1c === null) return r.isManual ? r : { ...r, result: '' };
    }

    // ──────────────────────── CBC INDICES CALCULATIONS ────────────────
    // MCV = (PCV * 10) / RBC
    if (pName.includes('meancorpuscularvolume') || pName === 'mcv') {
      const pcv = getVal('packedcellvolume', 'pcv', 'hematocrit', 'hct');
      const rbc = getVal('totalrbccount', 'rbc', 'rbccount');
      if (pcv !== null && rbc !== null && rbc > 0) {
        return { ...r, result: roundTo((pcv * 10) / rbc, 2), isCalculated: true };
      }
    }

    // MCH = (Hemoglobin * 10) / RBC
    if (pName.includes('meancorpuscularhemoglobin') && !pName.includes('concentration') && (pName === 'mch' || pName.includes('mch'))) {
      const hb = getVal('hemoglobin', 'hb', 'hgb');
      const rbc = getVal('totalrbccount', 'rbc', 'rbccount');
      if (hb !== null && rbc !== null && rbc > 0) {
        return { ...r, result: roundTo((hb * 10) / rbc, 2), isCalculated: true };
      }
    }

    // MCHC = (Hemoglobin * 100) / PCV
    if (pName.includes('meancorpuscularhemoglobinconcentration') || pName === 'mchc') {
      const hb = getVal('hemoglobin', 'hb', 'hgb');
      const pcv = getVal('packedcellvolume', 'pcv', 'hematocrit', 'hct');
      if (hb !== null && pcv !== null && pcv > 0) {
        return { ...r, result: roundTo((hb * 100) / pcv, 2), isCalculated: true };
      }
    }

    // ──────────────────────── IRON STUDIES ────────────────────────────
    // UIBC = TIBC - Iron
    if (pName === 'uibc' || pName.includes('unsaturatediron')) {
      const tibc = getVal('tibc', 'totalironbindingcapacity');
      const iron = getVal('iron', 'serumiron');
      if (tibc !== null && iron !== null && tibc >= iron) {
        return { ...r, result: roundTo(tibc - iron, 1), isCalculated: true };
      }
    }

    // Transferrin Saturation = (Iron / TIBC) * 100
    if (pName.includes('transferrinsaturation') || pName === 'tsat') {
      const tibc = getVal('tibc', 'totalironbindingcapacity');
      const iron = getVal('iron', 'serumiron');
      if (tibc !== null && iron !== null && tibc > 0) {
        return { ...r, result: roundTo((iron / tibc) * 100, 1), isCalculated: true };
      }
    }

    // ──────────────────────── GENERIC AVERAGE CALCULATION ─────────────
    if (pName.startsWith('average') || pName.startsWith('mean') || pName.includes('averagereading')) {
      const numericReadings = [];
      rows.forEach((otherRow) => {
        if (otherRow.id !== r.id && parseNum(otherRow.result) !== null) {
          const oName = normalizeKey(otherRow.param);
          if (oName.includes('reading') || oName.includes('trial') || oName.includes('sample')) {
            numericReadings.push(parseNum(otherRow.result));
          }
        }
      });
      if (numericReadings.length > 0) {
        const sum = numericReadings.reduce((acc, v) => acc + v, 0);
        return { ...r, result: roundTo(sum / numericReadings.length, 2), isCalculated: true };
      }
    }

    return r;
  });
};

/**
 * Clean sections for report generation/printing:
 * 1. Filter out empty rows from each section.
 * 2. Filter out orphaned subheaders.
 * 3. Filter out completely empty sections.
 */
export const filterReportableSections = (sections = []) => {
  if (!Array.isArray(sections)) return [];
  return sections
    .map((sec) => {
      const filteredRows = (sec.rows || []).filter((r) => isReportable(r.result) || r.isSubheader);

      const cleanedRows = [];
      for (let i = 0; i < filteredRows.length; i++) {
        const row = filteredRows[i];
        if (row.isSubheader) {
          let hasChild = false;
          for (let j = i + 1; j < filteredRows.length; j++) {
            if (filteredRows[j].isSubheader) break;
            if (isReportable(filteredRows[j].result)) {
              hasChild = true;
              break;
            }
          }
          if (hasChild) cleanedRows.push(row);
        } else {
          cleanedRows.push(row);
        }
      }

      return {
        ...sec,
        rows: cleanedRows,
      };
    })
    .filter((sec) => (sec.rows || []).some((r) => !r.isSubheader && isReportable(r.result)));
};
