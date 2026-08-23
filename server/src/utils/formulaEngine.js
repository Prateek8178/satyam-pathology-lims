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

const normalize = (name = '') =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '');

const recalculateSection = (rows = [], testName = '') => {
  if (!Array.isArray(rows) || rows.length === 0) return rows;

  const values = {};
  rows.forEach((r) => {
    const key = normalize(r.param);
    const num = parseNum(r.result);
    if (key && num !== null) {
      values[key] = num;
    }
  });

  const getVal = (...aliases) => {
    for (const a of aliases) {
      const k = normalize(a);
      if (values[k] !== undefined && values[k] !== null) return values[k];
      for (const [vKey, vVal] of Object.entries(values)) {
        if (vKey.includes(k) || k.includes(vKey)) return vVal;
      }
    }
    return null;
  };

  return rows.map((r) => {
    const pName = normalize(r.param);

    // LFT: Indirect Bilirubin = Total Bilirubin - Direct Bilirubin
    if (pName.includes('indirectbilirubin') || pName === 'ibil') {
      const tbil = getVal('totalbilirubin', 'tbil', 'bilirubintotal');
      const dbil = getVal('directbilirubin', 'dbil', 'bilirubindirect');
      if (tbil !== null && dbil !== null && tbil >= dbil) {
        return { ...r, result: roundTo(tbil - dbil, 2) };
      }
    }

    // LFT: Serum Globulin = Total Protein - Serum Albumin
    if (pName.includes('globulin') && !pName.includes('ratio') && !pName.includes('microglobulin') && !pName.includes('ag')) {
      const tp = getVal('totalprotein', 'totalserumprotein', 'protein', 'serumprotein');
      const alb = getVal('albumin', 'serumalbumin');
      if (tp !== null && alb !== null && tp >= alb) {
        return { ...r, result: roundTo(tp - alb, 2) };
      }
    }

    // LFT: A/G Ratio = Serum Albumin / Serum Globulin
    if (pName.includes('agratio') || pName.includes('albumin/globulin') || pName.includes('albuminglobulinratio') || pName === 'ag') {
      const alb = getVal('albumin', 'serumalbumin');
      let glob = getVal('globulin', 'serumglobulin');
      if (glob === null) {
        const tp = getVal('totalprotein', 'totalserumprotein', 'protein');
        if (tp !== null && alb !== null && tp > alb) {
          glob = tp - alb;
        }
      }
      if (alb !== null && glob !== null && glob > 0) {
        return { ...r, result: roundTo(alb / glob, 2) };
      }
    }

    // Lipid: VLDL = Triglycerides / 5
    if (pName.includes('vldl') || pName.includes('vldlcholesterol')) {
      const trg = getVal('triglycerides', 'serumtriglycerides', 'trg');
      if (trg !== null && trg >= 0) {
        return { ...r, result: roundTo(trg / 5, 1) };
      }
    }

    // Lipid: Non-HDL = Total Cholesterol - HDL Cholesterol
    if (pName.includes('nonhdl') || pName.includes('nonhdlcholesterol')) {
      const chol = getVal('totalcholesterol', 'cholesterol', 'chol');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (chol !== null && hdl !== null && chol >= hdl) {
        return { ...r, result: roundTo(chol - hdl, 1) };
      }
    }

    // Lipid: LDL / HDL Ratio = LDL / HDL
    if ((pName.includes('ldlhdl') || pName.includes('ldl/hdl')) && pName.includes('ratio')) {
      const ldl = getVal('ldlcholesterol', 'ldl');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (ldl !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(ldl / hdl, 2) };
      }
    }

    // Lipid: Total-HDL Ratio = Total Cholesterol / HDL
    if ((pName.includes('totalhdl') || pName.includes('total/hdl') || pName.includes('cholesterolhdl')) && pName.includes('ratio')) {
      const chol = getVal('totalcholesterol', 'cholesterol', 'chol');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (chol !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(chol / hdl, 2) };
      }
    }

    // Lipid: Triglycerides / HDL Ratio
    if ((pName.includes('triglycerideshdl') || pName.includes('triglyceride/hdl') || pName.includes('trghdl')) && pName.includes('ratio')) {
      const trg = getVal('triglycerides', 'serumtriglycerides', 'trg');
      const hdl = getVal('hdlcholesterol', 'hdl');
      if (trg !== null && hdl !== null && hdl > 0) {
        return { ...r, result: roundTo(trg / hdl, 2) };
      }
    }

    // KFT: Urea / Creatinine Ratio
    if (pName.includes('ureacreatinine') || (pName.includes('urea') && pName.includes('creatinine') && pName.includes('ratio'))) {
      const urea = getVal('serumurea', 'urea', 'bloodurea');
      const creat = getVal('serumcreatinine', 'creatinine', 'creat');
      if (urea !== null && creat !== null && creat > 0) {
        return { ...r, result: roundTo(urea / creat, 2) };
      }
    }

    // HbA1c: Mean Blood Glucose (eAG) = 28.7 * HbA1c - 46.7
    if (pName.includes('meanbloodglucose') || pName.includes('estimatedaverageglucose') || pName === 'eag' || pName.includes('mpg')) {
      const a1c = getVal('glycosylatedhemoglobin', 'hba1c', 'ghb', 'a1c');
      if (a1c !== null && a1c > 0) {
        const eag = 28.7 * a1c - 46.7;
        return { ...r, result: roundTo(Math.max(0, eag), 2) };
      }
    }

    // CBC Indices
    if (pName.includes('meancorpuscularvolume') || pName === 'mcv') {
      const pcv = getVal('packedcellvolume', 'pcv', 'hematocrit', 'hct');
      const rbc = getVal('totalrbccount', 'rbc', 'rbccount');
      if (pcv !== null && rbc !== null && rbc > 0) {
        return { ...r, result: roundTo((pcv * 10) / rbc, 2) };
      }
    }

    if (pName.includes('meancorpuscularhemoglobin') && !pName.includes('concentration') && (pName === 'mch' || pName.includes('mch'))) {
      const hb = getVal('hemoglobin', 'hb', 'hgb');
      const rbc = getVal('totalrbccount', 'rbc', 'rbccount');
      if (hb !== null && rbc !== null && rbc > 0) {
        return { ...r, result: roundTo((hb * 10) / rbc, 2) };
      }
    }

    if (pName.includes('meancorpuscularhemoglobinconcentration') || pName === 'mchc') {
      const hb = getVal('hemoglobin', 'hb', 'hgb');
      const pcv = getVal('packedcellvolume', 'pcv', 'hematocrit', 'hct');
      if (hb !== null && pcv !== null && pcv > 0) {
        return { ...r, result: roundTo((hb * 100) / pcv, 2) };
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
  recalculateSection,
  filterReportableSections,
};
