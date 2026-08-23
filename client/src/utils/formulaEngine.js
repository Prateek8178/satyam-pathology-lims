/**
 * Generic Laboratory Calculation & Formula Engine
 * Handles automatic derivation of medical parameters (LFT, Lipid, KFT, CBC, HbA1c, Averages, etc.)
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

// Normalizes parameter names for matching
const normalize = (name = '') =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Recalculates all derived parameters for a test section.
 * @param {Array} rows - List of parameter rows in the section [{ param, result, unit, refRange, ... }]
 * @param {String} testName - Name of the test/section
 * @returns {Array} - Updated rows with auto-calculated values
 */
export const recalculateSection = (rows = [], testName = '') => {
  if (!Array.isArray(rows) || rows.length === 0) return rows;

  // Build key-value map of current non-empty numeric inputs
  const values = {};
  rows.forEach((r) => {
    const key = normalize(r.param);
    const num = parseNum(r.result);
    if (key && num !== null) {
      values[key] = num;
    }
  });

  // Helper to find value by possible parameter name aliases
  const getVal = (...aliases) => {
    for (const a of aliases) {
      const k = normalize(a);
      if (values[k] !== undefined && values[k] !== null) return values[k];
      // Substring match if exact match not found
      for (const [vKey, vVal] of Object.entries(values)) {
        if (vKey.includes(k) || k.includes(vKey)) return vVal;
      }
    }
    return null;
  };

  return rows.map((r) => {
    // If user explicitly entered text for qualitative or non-numeric parameter, preserve unless it's a known formula
    const pName = normalize(r.param);

    // ──────────────────────── LFT CALCULATIONS ────────────────────────
    // 1. Indirect Bilirubin = Total Bilirubin - Direct Bilirubin
    if (pName.includes('indirectbilirubin') || pName === 'ibil') {
      const tbil = getVal('totalbilirubin', 'tbil', 'bilirubintotal');
      const dbil = getVal('directbilirubin', 'dbil', 'bilirubindirect');
      if (tbil !== null && dbil !== null && tbil >= dbil) {
        return { ...r, result: roundTo(tbil - dbil, 2) };
      }
      if (tbil === null || dbil === null) {
        // If inputs were cleared, clear auto-calculated result unless manually overridden
        return r.isManual ? r : { ...r, result: '' };
      }
    }

    // 2. Serum Globulin = Total Protein - Serum Albumin
    if (pName.includes('globulin') && !pName.includes('ratio') && !pName.includes('microglobulin') && !pName.includes('ag')) {
      const tp = getVal('totalprotein', 'totalserumprotein', 'protein', 'serumprotein');
      const alb = getVal('albumin', 'serumalbumin');
      if (tp !== null && alb !== null && tp >= alb) {
        return { ...r, result: roundTo(tp - alb, 2) };
      }
      if (tp === null || alb === null) {
        return r.isManual ? r : { ...r, result: '' };
      }
    }

    // 3. A/G Ratio = Serum Albumin / Serum Globulin
    if (pName.includes('agratio') || pName.includes('albumin/globulin') || pName.includes('albuminglobulinratio') || pName === 'ag') {
      const alb = getVal('albumin', 'serumalbumin');
      let glob = getVal('globulin', 'serumglobulin');
      // If globulin not directly entered, derive from TP - ALB
      if (glob === null) {
        const tp = getVal('totalprotein', 'totalserumprotein', 'protein');
        if (tp !== null && alb !== null && tp > alb) {
          glob = tp - alb;
        }
      }
      if (alb !== null && glob !== null && glob > 0) {
        return { ...r, result: roundTo(alb / glob, 2) };
      }
      if (alb === null || glob === null || glob <= 0) {
        return r.isManual ? r : { ...r, result: '' };
      }
    }

    // ──────────────────────── LIPID PROFILE CALCULATIONS ──────────────
    // 4. VLDL Cholesterol = Triglycerides / 5
    if (pName.includes('vldl') || pName.includes('vldlcholesterol')) {
      const trg = getVal('triglycerides', 'serumtriglycerides', 'trg');
      if (trg !== null && trg >= 0) {
        return { ...r, result: roundTo(trg / 5, 1) };
      }
      if (trg === null) return r.isManual ? r : { ...r, result: '' };
    }

    // 5. Non-HDL Cholesterol = Total Cholesterol - HDL Cholesterol
    if (pName.includes('nonhdl') || pName.includes('nonhdlcholesterol')) {
      const chol = getVal('totalcholesterol', 'cholesterol', 'chol');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (chol !== null && hdl !== null && chol >= hdl) {
        return { ...r, result: roundTo(chol - hdl, 1) };
      }
      if (chol === null || hdl === null) return r.isManual ? r : { ...r, result: '' };
    }

    // 6. LDL / HDL Ratio = LDL Cholesterol / HDL Cholesterol
    if ((pName.includes('ldlhdl') || pName.includes('ldl/hdl')) && pName.includes('ratio')) {
      const ldl = getVal('ldlcholesterol', 'ldl');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (ldl !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(ldl / hdl, 2) };
      }
      if (ldl === null || hdl === null || hdl <= 0) return r.isManual ? r : { ...r, result: '' };
    }

    // 7. Total-HDL Cholesterol Ratio = Total Cholesterol / HDL Cholesterol
    if ((pName.includes('totalhdl') || pName.includes('total/hdl') || pName.includes('cholesterolhdl')) && pName.includes('ratio')) {
      const chol = getVal('totalcholesterol', 'cholesterol', 'chol');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (chol !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(chol / hdl, 2) };
      }
      if (chol === null || hdl === null || hdl <= 0) return r.isManual ? r : { ...r, result: '' };
    }

    // 8. Triglycerides / HDL Ratio = Triglycerides / HDL Cholesterol
    if ((pName.includes('triglycerideshdl') || pName.includes('triglyceride/hdl') || pName.includes('trghdl')) && pName.includes('ratio')) {
      const trg = getVal('triglycerides', 'serumtriglycerides', 'trg');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (trg !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(trg / hdl, 2) };
      }
      if (trg === null || hdl === null || hdl <= 0) return r.isManual ? r : { ...r, result: '' };
    }

    // ──────────────────────── KFT CALCULATIONS ────────────────────────
    // 9. Urea / Creatinine Ratio = Serum Urea / Serum Creatinine
    if (pName.includes('ureacreatinine') || (pName.includes('urea') && pName.includes('creatinine') && pName.includes('ratio'))) {
      const urea = getVal('serumurea', 'urea', 'bloodurea');
      const creat = getVal('serumcreatinine', 'creatinine', 'creat');
      if (urea !== null && creat !== null && creat > 0) {
        return { ...r, result: roundTo(urea / creat, 2) };
      }
      if (urea === null || creat === null || creat <= 0) return r.isManual ? r : { ...r, result: '' };
    }

    // ──────────────────────── HBA1C CALCULATIONS ──────────────────────
    // 10. Mean Blood Glucose (eAG) = 28.7 * HbA1c - 46.7
    if (pName.includes('meanbloodglucose') || pName.includes('estimatedaverageglucose') || pName === 'eag' || pName.includes('mpg')) {
      const a1c = getVal('glycosylatedhemoglobin', 'hba1c', 'ghb', 'a1c');
      if (a1c !== null && a1c > 0) {
        const eag = 28.7 * a1c - 46.7;
        return { ...r, result: roundTo(Math.max(0, eag), 2) };
      }
      if (a1c === null) return r.isManual ? r : { ...r, result: '' };
    }

    // ──────────────────────── CBC INDICES CALCULATIONS ────────────────
    // 11. MCV = (PCV * 10) / RBC
    if (pName.includes('meancorpuscularvolume') || pName === 'mcv') {
      const pcv = getVal('packedcellvolume', 'pcv', 'hematocrit', 'hct');
      const rbc = getVal('totalrbccount', 'rbc', 'rbccount');
      if (pcv !== null && rbc !== null && rbc > 0) {
        return { ...r, result: roundTo((pcv * 10) / rbc, 2) };
      }
    }

    // 12. MCH = (Hemoglobin * 10) / RBC
    if (pName.includes('meancorpuscularhemoglobin') && !pName.includes('concentration') && (pName === 'mch' || pName.includes('mch'))) {
      const hb = getVal('hemoglobin', 'hb', 'hgb');
      const rbc = getVal('totalrbccount', 'rbc', 'rbccount');
      if (hb !== null && rbc !== null && rbc > 0) {
        return { ...r, result: roundTo((hb * 10) / rbc, 2) };
      }
    }

    // 13. MCHC = (Hemoglobin * 100) / PCV
    if (pName.includes('meancorpuscularhemoglobinconcentration') || pName === 'mchc') {
      const hb = getVal('hemoglobin', 'hb', 'hgb');
      const pcv = getVal('packedcellvolume', 'pcv', 'hematocrit', 'hct');
      if (hb !== null && pcv !== null && pcv > 0) {
        return { ...r, result: roundTo((hb * 100) / pcv, 2) };
      }
    }

    // ──────────────────────── GENERIC AVERAGE CALCULATION ─────────────
    if (pName.startsWith('average') || pName.startsWith('mean') || pName.includes('averagereading')) {
      const numericReadings = [];
      rows.forEach((otherRow) => {
        if (otherRow.id !== r.id && parseNum(otherRow.result) !== null) {
          const oName = normalize(otherRow.param);
          if (oName.includes('reading') || oName.includes('trial') || oName.includes('sample')) {
            numericReadings.push(parseNum(otherRow.result));
          }
        }
      });
      if (numericReadings.length > 0) {
        const sum = numericReadings.reduce((acc, v) => acc + v, 0);
        return { ...r, result: roundTo(sum / numericReadings.length, 2) };
      }
    }

    return r;
  });
};

/**
 * Filter out empty/unentered parameters so only reportable parameters appear.
 * Preserves 0, 0.0, negative numbers, and text qualitative results.
 */
export const filterReportableRows = (rows = []) => {
  if (!Array.isArray(rows)) return [];
  return rows.filter((r) => {
    // If it's a subheader (e.g. "DIFFERENTIAL WBC COUNT", "BILLIRUBIN"), keep it if any following rows have data
    if (r.isSubheader) return true;
    return isReportable(r.result);
  });
};

/**
 * Clean sections for report generation/printing:
 * 1. Filter out empty rows from each section.
 * 2. Filter out orphaned subheaders (subheaders with no following data rows).
 * 3. Filter out completely empty sections.
 */
export const filterReportableSections = (sections = []) => {
  if (!Array.isArray(sections)) return [];
  return sections
    .map((sec) => {
      const filteredRows = (sec.rows || []).filter((r) => isReportable(r.result) || r.isSubheader);

      // Clean up orphaned subheaders
      const cleanedRows = [];
      for (let i = 0; i < filteredRows.length; i++) {
        const row = filteredRows[i];
        if (row.isSubheader) {
          // Look ahead to check if there is at least one non-subheader row before the next subheader or end
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
