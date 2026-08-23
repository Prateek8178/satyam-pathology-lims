/**
 * Generic Laboratory Calculation & Formula Engine (CommonJS for Server)
 */

const parseNum = (val) => {
  if (val === null || val === undefined) return null;
  const s = String(val).trim();
  if (s === '' || isNaN(Number(s))) return null;
  return Number(s);
};

const isReportable = (val) => {
  if (val === null || val === undefined) return false;
  const s = String(val).trim();
  return s !== '';
};

const roundTo = (num, decimals = 2) => {
  if (num === null || num === undefined || isNaN(num) || !isFinite(num)) return '';
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(num * factor) / factor;
  return String(rounded);
};

const normalizeKey = (name = '') =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '');

const evaluateExpression = (expr = '', varMap = {}) => {
  if (!expr || typeof expr !== 'string') return null;

  let safeExpr = expr;
  const sortedKeys = Object.keys(varMap).sort((a, b) => b.length - a.length);

  for (const k of sortedKeys) {
    const val = varMap[k];
    if (val === null || val === undefined) return null;
    const regex = new RegExp(`\\b${k}\\b`, 'gi');
    safeExpr = safeExpr.replace(regex, `(${val})`);
  }

  if (/[a-zA-Z]/.test(safeExpr)) return null;
  if (!/^[\d\.\+\-\*\/\(\)\s]+$/.test(safeExpr)) return null;

  try {
    if (/\/0(?!\.)/.test(safeExpr.replace(/\s+/g, '')) || /\/\(0\)/.test(safeExpr.replace(/\s+/g, ''))) {
      return null;
    }
    const result = Function(`'use strict'; return (${safeExpr})`)();
    if (result === null || result === undefined || isNaN(result) || !isFinite(result)) {
      return null;
    }
    return result;
  } catch {
    return null;
  }
};

const recalculateSection = (rows = [], testName = '') => {
  if (!Array.isArray(rows) || rows.length === 0) return rows;

  const varMap = {};
  rows.forEach((r) => {
    const num = parseNum(r.result);
    if (num !== null) {
      if (r.paramCode) varMap[r.paramCode.toUpperCase()] = num;
      if (r.param) {
        varMap[normalizeKey(r.param)] = num;
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

    if (r.formula && typeof r.formula === 'string' && r.formula.trim() !== '') {
      const calculated = evaluateExpression(r.formula, varMap);
      if (calculated !== null) {
        return { ...r, result: roundTo(calculated, precision), isCalculated: true };
      }
      if (!r.isManual) return { ...r, result: '' };
    }

    // LFT: Indirect Bilirubin = Total Bilirubin - Direct Bilirubin
    if (pName.includes('indirectbilirubin') || pName === 'ibil') {
      const tbil = getVal('totalbilirubin', 'tbil', 'bilirubintotal');
      const dbil = getVal('directbilirubin', 'dbil', 'bilirubindirect');
      if (tbil !== null && dbil !== null && tbil >= dbil) {
        return { ...r, result: roundTo(tbil - dbil, 2), isCalculated: true };
      }
    }

    // LFT: Serum Globulin = Total Protein - Serum Albumin
    if (pName.includes('globulin') && !pName.includes('ratio') && !pName.includes('microglobulin') && !pName.includes('ag')) {
      const tp = getVal('totalprotein', 'totalserumprotein', 'protein', 'serumprotein', 'tp');
      const alb = getVal('albumin', 'serumalbumin', 'alb');
      if (tp !== null && alb !== null && tp >= alb) {
        return { ...r, result: roundTo(tp - alb, 2), isCalculated: true };
      }
    }

    // LFT: A/G Ratio = Serum Albumin / Serum Globulin
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
    }

    // Lipid: VLDL = Triglycerides / 5
    if (pName.includes('vldl') || pName.includes('vldlcholesterol')) {
      const trg = getVal('triglycerides', 'serumtriglycerides', 'trg');
      if (trg !== null && trg >= 0) {
        return { ...r, result: roundTo(trg / 5, 1), isCalculated: true };
      }
    }

    // Lipid: Non-HDL = Total Cholesterol - HDL
    if (pName.includes('nonhdl') || pName.includes('nonhdlcholesterol')) {
      const chol = getVal('totalcholesterol', 'cholesterol', 'chol');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (chol !== null && hdl !== null && chol >= hdl) {
        return { ...r, result: roundTo(chol - hdl, 1), isCalculated: true };
      }
    }

    // Lipid: LDL / HDL Ratio
    if ((pName.includes('ldlhdl') || pName.includes('ldl/hdl')) && pName.includes('ratio')) {
      const ldl = getVal('ldlcholesterol', 'ldl');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (ldl !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(ldl / hdl, 2), isCalculated: true };
      }
    }

    // Lipid: Total-HDL Ratio
    if ((pName.includes('totalhdl') || pName.includes('total/hdl') || pName.includes('cholesterolhdl')) && pName.includes('ratio')) {
      const chol = getVal('totalcholesterol', 'cholesterol', 'chol');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (chol !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(chol / hdl, 2), isCalculated: true };
      }
    }

    // Lipid: Triglycerides / HDL Ratio
    if ((pName.includes('triglycerideshdl') || pName.includes('triglyceride/hdl') || pName.includes('trghdl')) && pName.includes('ratio')) {
      const trg = getVal('triglycerides', 'serumtriglycerides', 'trg');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (trg !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(trg / hdl, 2), isCalculated: true };
      }
    }

    // KFT: BUN = Urea / 2.14
    if (pName === 'bun' || pName.includes('bloodureanitrogen')) {
      const urea = getVal('serumurea', 'urea', 'bloodurea');
      if (urea !== null && urea >= 0) {
        return { ...r, result: roundTo(urea / 2.14, 1), isCalculated: true };
      }
    }

    // KFT: Urea / Creatinine Ratio
    if (pName.includes('ureacreatinine') || (pName.includes('urea') && pName.includes('creatinine') && pName.includes('ratio'))) {
      const urea = getVal('serumurea', 'urea', 'bloodurea');
      const creat = getVal('serumcreatinine', 'creatinine', 'creat');
      if (urea !== null && creat !== null && creat > 0) {
        return { ...r, result: roundTo(urea / creat, 2), isCalculated: true };
      }
    }

    // ──────────────────────── PT / INR CALCULATIONS ───────────────────
    // Ratio = Patient PT / Control PT
    if ((pName.includes('ratio') || pName === 'ptratio') && (pName.includes('pt') || testName.toUpperCase().includes('PT') || testName.toUpperCase().includes('INR'))) {
      const pt = getVal('patienttime', 'pt', 'patientpt', 'prothrombintime', 'pttime');
      const ctrl = getVal('controltime', 'controlpt', 'control', 'normalcontrol', 'ptctrl');
      if (pt !== null && ctrl !== null && ctrl > 0) {
        return { ...r, result: roundTo(pt / ctrl, 2), isCalculated: true };
      }
    }

    // INR = (Patient PT / Control PT) ^ ISI (default ISI = 1.0)
    if (pName === 'inr' || pName.includes('inr') || pName.includes('internationalnormalizedratio')) {
      const pt = getVal('patienttime', 'pt', 'patientpt', 'prothrombintime', 'pttime');
      const ctrl = getVal('controltime', 'controlpt', 'control', 'normalcontrol', 'ptctrl');
      let ratio = getVal('ratio', 'ptratio');
      if (ratio === null && pt !== null && ctrl !== null && ctrl > 0) {
        ratio = pt / ctrl;
      }
      const isi = getVal('isi', 'isivalue') ?? 1.0;
      if (ratio !== null && ratio > 0) {
        const inr = Math.pow(ratio, isi);
        return { ...r, result: roundTo(inr, 2), isCalculated: true };
      }
    }

    // HbA1c: Mean Blood Glucose = 28.7 * HbA1c - 46.7
    if (pName.includes('meanbloodglucose') || pName.includes('estimatedaverageglucose') || pName === 'eag' || pName.includes('mbg')) {
      const a1c = getVal('glycosylatedhemoglobin', 'hba1c', 'ghb', 'a1c');
      if (a1c !== null && a1c > 0) {
        const eag = 28.7 * a1c - 46.7;
        return { ...r, result: roundTo(Math.max(0, eag), 2), isCalculated: true };
      }
    }

    // CBC Indices
    if (pName.includes('meancorpuscularvolume') || pName === 'mcv') {
      const pcv = getVal('packedcellvolume', 'pcv', 'hematocrit', 'hct');
      const rbc = getVal('totalrbccount', 'rbc', 'rbccount');
      if (pcv !== null && rbc !== null && rbc > 0) {
        return { ...r, result: roundTo((pcv * 10) / rbc, 2), isCalculated: true };
      }
    }

    if (pName.includes('meancorpuscularhemoglobin') && !pName.includes('concentration') && (pName === 'mch' || pName.includes('mch'))) {
      const hb = getVal('hemoglobin', 'hb', 'hgb');
      const rbc = getVal('totalrbccount', 'rbc', 'rbccount');
      if (hb !== null && rbc !== null && rbc > 0) {
        return { ...r, result: roundTo((hb * 10) / rbc, 2), isCalculated: true };
      }
    }

    if (pName.includes('meancorpuscularhemoglobinconcentration') || pName === 'mchc') {
      const hb = getVal('hemoglobin', 'hb', 'hgb');
      const pcv = getVal('packedcellvolume', 'pcv', 'hematocrit', 'hct');
      if (hb !== null && pcv !== null && pcv > 0) {
        return { ...r, result: roundTo((hb * 100) / pcv, 2), isCalculated: true };
      }
    }

    // Iron Studies: UIBC = TIBC - Iron
    if (pName === 'uibc' || pName.includes('unsaturatediron')) {
      const tibc = getVal('tibc', 'totalironbindingcapacity');
      const iron = getVal('iron', 'serumiron');
      if (tibc !== null && iron !== null && tibc >= iron) {
        return { ...r, result: roundTo(tibc - iron, 1), isCalculated: true };
      }
    }

    // Iron Studies: Transferrin Saturation = (Iron / TIBC) * 100
    if (pName.includes('transferrinsaturation') || pName === 'tsat') {
      const tibc = getVal('tibc', 'totalironbindingcapacity');
      const iron = getVal('iron', 'serumiron');
      if (tibc !== null && iron !== null && tibc > 0) {
        return { ...r, result: roundTo((iron / tibc) * 100, 1), isCalculated: true };
      }
    }

    return r;
  });
};

const filterReportableSections = (sections = []) => {
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

module.exports = {
  parseNum,
  isReportable,
  roundTo,
  normalizeKey,
  evaluateExpression,
  recalculateSection,
  filterReportableSections,
};
