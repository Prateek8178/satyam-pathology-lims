import React, { useState, useEffect, useReducer, useCallback, useRef, memo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  parseNum,
  isReportable,
  roundTo,
  recalculateSection,
  filterReportableSections,
} from '../../utils/formulaEngine';

/* ═══════════════════════════════════════════════════════════════
   PRINT STYLES (injected once into <head>)
   Uses the CSS table-header-group & table-footer-group layout to guarantee
   that the Header is fixed at the top of EVERY page and the Footer is fixed
   at the bottom of EVERY page in both single-page & multi-page reports!
═══════════════════════════════════════════════════════════════ */
const PRINT_CSS = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 8mm 12mm 28mm 12mm;
    }

    /* Hide everything on screen */
    body * { visibility: hidden !important; }

    /* Show only the report root */
    #REPORT_PRINT_ROOT,
    #REPORT_PRINT_ROOT * { visibility: visible !important; }

    #REPORT_PRINT_ROOT {
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      min-height: unset !important;
      overflow: visible !important;
      background: white !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 !important;
      max-width: none !important;
      font-family: Arial, sans-serif !important;
      color: #111 !important;
    }

    /* Standard CSS Print Table Header & Footer (Repeats on EVERY printed page!) */
    table.print-page-table {
      width: 100% !important;
      border-collapse: collapse !important;
      border: none !important;
    }

    table.print-page-table > thead {
      display: table-header-group !important;
    }

    table.print-page-table > tfoot {
      display: table-footer-group !important;
    }

    table.print-page-table > thead > tr > td,
    table.print-page-table > tfoot > tr > td,
    table.print-page-table > tbody > tr > td {
      border: none !important;
      padding: 0 !important;
    }

    /* Hide all interactive controls */
    .no-print { display: none !important; visibility: hidden !important; }
    /* Show print-only elements */
    .print-only { display: inline !important; visibility: visible !important; }

    /* Inputs appear as plain text without borders */
    input, select, textarea {
      border: none !important;
      background: transparent !important;
      outline: none !important;
      padding: 0 !important;
      margin: 0 !important;
      font-size: inherit !important;
      color: inherit !important;
      font-family: inherit !important;
      box-shadow: none !important;
      -webkit-appearance: none !important;
      appearance: none !important;
      display: inline !important;
    }

    /* Table borders for inner test data */
    .test-data-table { border-collapse: collapse !important; width: 100% !important; }
    .test-data-table td, .test-data-table th { border-color: #b0c4d8 !important; }

    /* Hide empty unentered rows completely on print */
    .row-unentered {
      display: none !important;
      visibility: hidden !important;
    }

    /* Keep test sections intact */
    .test-section-block {
      page-break-inside: auto !important;
      break-inside: auto !important;
      margin-bottom: 12px !important;
    }

    .test-row-item {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Watermark visible on all pages */
    .report-watermark {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      z-index: 0 !important;
      pointer-events: none !important;
      opacity: 0.08 !important;
    }

    /* Fixed footer pinned at the absolute bottom */
    .page-footer-container {
      position: fixed !important;
      bottom: 0 !important;
      left: 12mm !important;
      right: 12mm !important;
      background: white !important;
      z-index: 9999 !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  }
`;

/* ═══════════════════════════════════════════════════════════════
   HELPERS & REFERENCE RANGE CALCULATION (Gender & Age Aware)
═══════════════════════════════════════════════════════════════ */
const todayISO = () => new Date().toISOString().split('T')[0];
const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

let _uid = 0;
const uid = () => ++_uid;

const calcFlag = (result, refRange, gender, age) => {
  const num = parseNum(result);
  if (!result || num === null || !refRange) return null;
  let lo = null, hi = null;
  const gk = gender === 'Female' ? 'F' : 'M';
  const gm = refRange.match(new RegExp(gk + '\\s*:\\s*([\\d.]+)\\s*-\\s*([\\d.]+)'));
  if (gm) { lo = +gm[1]; hi = +gm[2]; }
  else {
    const r = refRange.match(/([\d.]+)\s*-\s*([\d.]+)/);
    if (r) { lo = +r[1]; hi = +r[2]; }
    const lt = refRange.match(/<\s*([\d.]+)/); if (lt) { lo = 0; hi = +lt[1]; }
    const gt = refRange.match(/>\s*([\d.]+)/); if (gt) { lo = +gt[1]; hi = Infinity; }
  }
  if (lo === null && hi === null) return null;
  if (hi !== null && num > hi) return 'H';
  if (lo !== null && num < lo) return 'L';
  return null;
};

const refFromParam = (p, gender = 'Male', age = 30) => {
  if (p.textRange) return p.textRange;
  const isChild = age != null && age < 18;
  const isFemale = gender === 'Female';

  if (isChild && p.childRange?.low != null && p.childRange?.high != null) {
    return `${p.childRange.low} - ${p.childRange.high}`;
  }
  if (isFemale && p.femaleRange?.low != null && p.femaleRange?.high != null) {
    return `${p.femaleRange.low} - ${p.femaleRange.high}`;
  }
  if (p.maleRange?.low != null && p.maleRange?.high != null) {
    return `${p.maleRange.low} - ${p.maleRange.high}`;
  }
  if (p.femaleRange?.low != null && p.femaleRange?.high != null) {
    return `${p.femaleRange.low} - ${p.femaleRange.high}`;
  }
  return '';
};

/* ═══════════════════════════════════════════════════════════════
   MICROSCOPE SVG ICON (Exact Original Letterhead Silhouette)
═══════════════════════════════════════════════════════════════ */
const MicroscopeSVG = ({ size = 80, color = '#111', opacity = 1 }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 160 200"
       xmlns="http://www.w3.org/2000/svg" style={{ opacity, display: 'block' }}>
    {/* Eyepiece */}
    <rect x="68" y="0"  width="28" height="10" rx="4" fill={color}/>
    <rect x="74" y="8"  width="16" height="28" rx="3" fill={color}/>
    {/* Head / Nosepiece body */}
    <rect x="60" y="33" width="40" height="18" rx="5" fill={color}/>
    {/* Main arm — curved left side */}
    <rect x="60" y="48" width="14" height="62" rx="6" fill={color}/>
    {/* Coarse + fine focus knobs (left) */}
    <ellipse cx="52" cy="80" rx="12" ry="8" fill={color}/>
    <ellipse cx="52" cy="95" rx="9"  ry="6" fill={color}/>
    {/* Stage (horizontal platform) */}
    <rect x="48" y="108" width="72" height="10" rx="4" fill={color}/>
    {/* Stage clip arms */}
    <rect x="56" y="103" width="8"  height="8" rx="2" fill={color}/>
    <rect x="96" y="103" width="8"  height="8" rx="2" fill={color}/>
    {/* Sub-stage condenser */}
    <rect x="70" y="117" width="22" height="14" rx="3" fill={color}/>
    {/* Objective lenses */}
    <rect x="90" y="48"  width="10" height="32" rx="3" fill={color}/>
    <rect x="103" y="52" width="8"  height="24" rx="3" fill={color}/>
    <rect x="115" y="56" width="7"  height="18" rx="3" fill={color}/>
    {/* Objective nosepiece circle */}
    <ellipse cx="100" cy="50" rx="18" ry="10" fill={color}/>
    {/* Pillar connecting stage to base */}
    <rect x="62" y="130" width="12" height="32" rx="4" fill={color}/>
    {/* Base */}
    <ellipse cx="78" cy="168" rx="52" ry="14" fill={color}/>
    <rect x="26" y="158" width="104" height="14" rx="6" fill={color}/>
    {/* Light source at base */}
    <ellipse cx="78" cy="155" rx="8" ry="5" fill={color}/>
  </svg>
);

/* ═══════════════════════════════════════════════════════════════
   STATE MANAGEMENT (useReducer)
═══════════════════════════════════════════════════════════════ */
const makeSTPPrefix = () => {
  const n = new Date();
  const dd = String(n.getDate()).padStart(2, '0');
  const mm = String(n.getMonth() + 1).padStart(2, '0');
  return `STP-${dd}${mm}${n.getFullYear()}-`;
};

const getNowTimeAMPM = () => {
  const n = new Date();
  let h = n.getHours();
  const m = String(n.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

const formatAMPM = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.toUpperCase().includes('AM') || timeStr.toUpperCase().includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1].slice(0, 2);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

const initState = {
  patientId: '',
  meta: {
    reportNo: '',
    refDoctor: '',
    sampleDate: todayISO(),
    sampleTime: getNowTimeAMPM(),
    sampleType: '',
    preparedBy: '',
  },
  sections: [],
  showHeader: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PATIENT':
      return { ...state, patientId: action.id };
    case 'SET_META':
      return { ...state, meta: { ...state.meta, ...action.payload } };
    case 'TOGGLE_HEADER':
      return { ...state, showHeader: !state.showHeader };
    case 'SET_HEADER':
      return { ...state, showHeader: action.val };
    case 'SET_SECTIONS':
      return { ...state, sections: action.sections };
    case 'SET_SECTION_TEST_ID':
      return {
        ...state,
        sections: state.sections.map((s) => (s.id === action.sectionId ? { ...s, testId: action.testId } : s)),
      };
    case 'ADD_SECTION': {
      if (state.sections.find((s) => s.testName === action.section.testName)) return state;
      const initialCalculatedRows = recalculateSection(action.section.rows, action.section.testName);
      return {
        ...state,
        sections: [...state.sections, { ...action.section, rows: initialCalculatedRows }],
      };
    }
    case 'REMOVE_SECTION':
      return { ...state, sections: state.sections.filter((s) => s.id !== action.id) };
    case 'ADD_ROW':
      return {
        ...state,
        sections: state.sections.map((s) =>
          s.id === action.sectionId
            ? {
                ...s,
                rows: [
                  ...s.rows,
                  {
                    id: uid(),
                    param: action.isSubheader ? 'CATEGORY / SUBHEADER' : '',
                    result: '',
                    unit: '',
                    refRange: '',
                    formula: '',
                    isSubheader: action.isSubheader || false,
                  },
                ],
              }
            : s
        ),
      };
    case 'REMOVE_ROW':
      return {
        ...state,
        sections: state.sections.map((s) => {
          if (s.id !== action.sectionId) return s;
          const remaining = s.rows.filter((r) => r.id !== action.rowId);
          return { ...s, rows: recalculateSection(remaining, s.testName) };
        }),
      };
    case 'UPDATE_ROW': {
      return {
        ...state,
        sections: state.sections.map((s) => {
          if (s.id !== action.sectionId) return s;
          const updatedRawRows = s.rows.map((r) =>
            r.id === action.rowId ? { ...r, [action.field]: action.value, isManual: action.field === 'result' ? true : r.isManual } : r
          );
          // Run reactive formula engine on the section
          const recalculated = recalculateSection(updatedRawRows, s.testName);
          return { ...s, rows: recalculated };
        }),
      };
    }
    case 'LOAD_SAVED_REPORT':
      return {
        ...state,
        meta: action.payload.meta,
        sections: action.payload.sections,
        showHeader: true,
      };
    case 'CLEAR':
      return {
        ...initState,
        meta: {
          ...initState.meta,
          reportNo: makeSTPPrefix(),
          sampleDate: todayISO(),
          sampleTime: new Date().toTimeString().slice(0, 5),
        },
      };
    default:
      return state;
  }
}

/* ═══════════════════════════════════════════════════════════════
   EDITABLE TABLE INPUT COMPONENT
═══════════════════════════════════════════════════════════════ */
const Editable = memo(({ value, onChange, style, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value ?? ''}
    onChange={onChange}
    placeholder={placeholder}
    style={{
      background: 'transparent',
      border: '1px solid #ccc',
      borderRadius: '3px',
      padding: '2px 5px',
      fontSize: '11.5px',
      color: 'inherit',
      width: '100%',
      outline: 'none',
      fontFamily: 'inherit',
      ...style,
    }}
  />
));

/* ═══════════════════════════════════════════════════════════════
   PARAMETER ROW COMPONENT (Clean High-Contrast Table Layout)
═══════════════════════════════════════════════════════════════ */
const ParamRow = memo(({ row, sectionId, gender, age, dispatch, idx }) => {
  // If row is a subheader (e.g. "DIFFERENTIAL WBC COUNT", "BILLIRUBIN")
  if (row.isSubheader) {
    return (
      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #333' }} className="test-row-item">
        <td colSpan={5} style={{ padding: '4px 8px', border: '1px solid #cbd5e1' }}>
          <Editable
            value={row.param}
            placeholder="CATEGORY / SUBHEADER TITLE"
            style={{ fontWeight: '800', color: '#111', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px' }}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_ROW', sectionId, rowId: row.id, field: 'param', value: e.target.value })
            }
          />
        </td>
        <td className="no-print" style={{ padding: '3px 4px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
          <button
            onClick={() => dispatch({ type: 'REMOVE_ROW', sectionId, rowId: row.id })}
            style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
            title="Remove subheader"
          >
            ×
          </button>
        </td>
      </tr>
    );
  }

  const hasValue = isReportable(row.result);
  const flag = calcFlag(row.result, row.refRange, gender, age);
  const isHigh = flag === 'H';
  const isLow = flag === 'L';
  const isAbnormal = isHigh || isLow;

  return (
    <tr
      className={`test-row-item ${!hasValue ? 'row-unentered' : ''}`}
      style={{
        background: isAbnormal ? '#fef2f2' : idx % 2 === 0 ? '#ffffff' : '#fcfcfc',
        borderBottom: '1px solid #cbd5e1',
      }}
    >
      {/* Parameter Name */}
      <td style={{ padding: '4px 6px', fontSize: '11px', color: '#111', border: '1px solid #cbd5e1' }}>
        <Editable
          value={row.param}
          placeholder="Parameter name"
          onChange={(e) =>
            dispatch({ type: 'UPDATE_ROW', sectionId, rowId: row.id, field: 'param', value: e.target.value })
          }
        />
      </td>

      {/* Result */}
      <td style={{ padding: '4px 6px', textAlign: 'center', border: '1px solid #cbd5e1' }}>
        <Editable
          value={row.result}
          placeholder="—"
          style={{
            textAlign: 'center',
            fontWeight: isAbnormal ? 'bold' : '600',
            color: isHigh ? '#dc2626' : isLow ? '#2563eb' : '#111',
            width: '80px',
          }}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_ROW', sectionId, rowId: row.id, field: 'result', value: e.target.value })
          }
        />
      </td>

      {/* Unit */}
      <td style={{ padding: '4px 6px', textAlign: 'center', fontSize: '11px', color: '#333', border: '1px solid #cbd5e1' }}>
        <Editable
          value={row.unit}
          placeholder="unit"
          style={{ textAlign: 'center', width: '65px' }}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_ROW', sectionId, rowId: row.id, field: 'unit', value: e.target.value })
          }
        />
      </td>

      {/* Reference Value */}
      <td style={{ padding: '4px 6px', fontSize: '11px', color: '#333', border: '1px solid #cbd5e1' }}>
        <Editable
          value={row.refRange}
          placeholder="e.g. 12 - 15"
          onChange={(e) =>
            dispatch({ type: 'UPDATE_ROW', sectionId, rowId: row.id, field: 'refRange', value: e.target.value })
          }
        />
      </td>

      {/* Flag (H / L) */}
      <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 'bold', fontSize: '11px', color: isHigh ? '#dc2626' : isLow ? '#2563eb' : '#777', border: '1px solid #cbd5e1' }}>
        {flag || ''}
      </td>

      {/* Screen Remove Button */}
      <td style={{ padding: '3px 4px', textAlign: 'center' }} className="no-print">
        <button
          onClick={() => dispatch({ type: 'REMOVE_ROW', sectionId, rowId: row.id })}
          style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}
          title="Delete row"
        >
          ×
        </button>
      </td>
    </tr>
  );
});

/* ═══════════════════════════════════════════════════════════════
   TEST SECTION COMPONENT (Clean Black Heading & Border Layout)
═══════════════════════════════════════════════════════════════ */
const TestSection = memo(({ section, gender, age, dispatch, onSaveTemplate, onAddRow }) => {
  const [savingTpl, setSavingTpl] = useState(false);

  const handleSaveTpl = async () => {
    setSavingTpl(true);
    await onSaveTemplate(section);
    setSavingTpl(false);
  };

  return (
    <div className="test-section-block" style={{ marginBottom: '12px' }}>
      {/* Test Title Bar — Clean Black Underline Heading for sharp B&W print */}
      <div style={{ borderBottom: '2px solid #111', padding: '4px 2px', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '12.5px', fontWeight: '900', letterSpacing: '0.5px', color: '#111' }}>
          {section.testName.toUpperCase()}
        </span>
        
        <div className="no-print" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={handleSaveTpl}
            disabled={savingTpl}
            style={{ fontSize: '10px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontWeight: '600' }}
            title="Save these parameters into the Master Test Template for future reports"
          >
            {savingTpl ? 'Saving...' : '💾 Save Template'}
          </button>
          <button
            onClick={() => dispatch({ type: 'REMOVE_SECTION', id: section.id })}
            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}
            title="Remove section"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Parameters Table (Clean High-Contrast Structure) */}
      <table className="test-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderTop: '1px solid #111', borderBottom: '1px solid #111' }}>
            {[
              ['Parameter', '34%'],
              ['Result', '14%'],
              ['Unit', '11%'],
              ['Reference Range', '30%'],
              ['Flag', '6%'],
              ['', '5%']
            ].map(([h, w]) => (
              <th
                key={h}
                className={h === '' ? 'no-print' : ''}
                style={{
                  padding: '4px 6px',
                  fontSize: '10.5px',
                  fontWeight: '800',
                  color: '#111',
                  textAlign: h === 'Result' || h === 'Unit' || h === 'Flag' ? 'center' : 'left',
                  width: w,
                  border: '1px solid #cbd5e1',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row, i) => (
            <ParamRow key={row.id} row={row} sectionId={section.id} gender={gender} age={age} dispatch={dispatch} idx={i} />
          ))}
        </tbody>
      </table>

      {/* Screen Add Row buttons */}
      <div className="no-print" style={{ marginTop: '4px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => onAddRow(section.id, false)}
          style={{ fontSize: '11px', color: '#1e3a5f', background: 'none', border: '1px dashed #1e3a5f', borderRadius: '4px', padding: '2px 10px', cursor: 'pointer' }}
        >
          + Add Row
        </button>
        <button
          onClick={() => onAddRow(section.id, true)}
          style={{ fontSize: '11px', color: '#0369a1', background: 'none', border: '1px dashed #0284c7', borderRadius: '4px', padding: '2px 10px', cursor: 'pointer' }}
        >
          + Add Subheader
        </button>
      </div>

      {/* Method / Comments / Interpretation Box if available */}
      {section.comments && (
        <div style={{ marginTop: '6px', padding: '5px 8px', border: '1px solid #666', borderRadius: '2px', fontSize: '9px', lineHeight: '1.35', color: '#111' }}>
          <div style={{ fontWeight: '700', marginBottom: '2px' }}>Interpretation / Comments:</div>
          <div style={{ whiteSpace: 'pre-line' }}>{section.comments}</div>
        </div>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   ORIGINAL LAB HEADER (Satyam Pathology Center)
═══════════════════════════════════════════════════════════════ */
const LabHeader = memo(({ logoUrl, settings }) => {
  const s = settings || {};
  const name    = s.name    || 'SATYAM PATHOLOGY CENTER';
  const tagline = s.tagline || 'Accurate | Caring | Instant';
  const address = s.address || 'Inside Gopi Medical, Sheetla Mai Chauraha, Jabalpur';
  const phone   = s.phone   || '9165144073, 9340311506, 9516128613';
  const email   = s.email   || 'lp93403115@gmail.com';

  return (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingBottom: '8px' }}>
        {/* Logo left — use uploaded image or SVG microscope */}
        <div style={{ flexShrink: 0 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Lab Logo" style={{ width: '80px', height: '100px', objectFit: 'contain' }} />
          ) : (
            <MicroscopeSVG size={72} color="#111" />
          )}
        </div>

        {/* Clinic details center */}
        <div style={{ flex: 1, textAlign: 'center', lineHeight: '1.2' }}>
          <div style={{
            fontSize: '30px',
            fontWeight: '900',
            color: '#c62828',
            fontFamily: '"Arial Black", "Arial", sans-serif',
            letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            {name}
          </div>
          <div style={{
            fontSize: '13.5px',
            fontWeight: '800',
            color: '#1a237e',
            marginTop: '2px',
            letterSpacing: '0.5px',
          }}>
            {tagline}
          </div>
          <div style={{ fontSize: '11px', color: '#1a237e', marginTop: '4px', fontWeight: '500' }}>
            {address}
          </div>
          <div style={{ fontSize: '11px', color: '#1a237e', marginTop: '2px' }}>
            {phone} {email ? `| ${email}` : ''}
          </div>
        </div>
      </div>

      {/* Top separator — double line */}
      <div style={{ borderTop: '1px solid #111', borderBottom: '3px solid #111', height: '4px', marginBottom: '8px' }} />
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   ORIGINAL PATIENT INFO BOX (Satyam Pathology)
═══════════════════════════════════════════════════════════════ */
const PatientInfoSection = memo(({ patient, meta, dispatch }) => {
  const upMeta = useCallback((field, val) => dispatch({ type: 'SET_META', payload: { [field]: val } }), [dispatch]);

  const fmtTime = (t) => {
    if (!t) return '';
    const [h, min] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${String(hh).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div style={{ fontSize: '11.5px', borderBottom: '2px solid #1e3a5f', paddingBottom: '6px', marginBottom: '8px' }}>
      {/* Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px 16px', marginBottom: '3px' }}>
        <div><b>Patient Name:</b> {patient?.fullName || '—'}</div>
        <div>
          <b>Age / Sex:</b> {patient?.age ? `${patient.age} Yrs` : '—'} /{' '}
          <strong style={{ color: patient?.gender ? '#111' : '#dc2626' }}>
            {patient?.gender || 'Missing (Required)'}
          </strong>
        </div>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <b>Report No:</b>
          <input
            value={meta.reportNo}
            onChange={(e) => upMeta('reportNo', e.target.value)}
            style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '1px 4px', width: '130px', fontSize: '11px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '3px 16px', marginBottom: '3px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <b>Ref. Doctor:</b>
          <input
            value={meta.refDoctor}
            onChange={(e) => upMeta('refDoctor', e.target.value)}
            placeholder="Doctor name"
            style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '1px 4px', flex: 1, fontSize: '11px', outline: 'none' }}
          />
          <button
            className="no-print"
            onClick={() => upMeta('refDoctor', 'Self')}
            style={{ fontSize: '9px', padding: '1px 5px', border: '1px solid #ccc', borderRadius: '3px', background: meta.refDoctor === 'Self' ? '#1e3a5f' : '#f3f4f6', color: meta.refDoctor === 'Self' ? 'white' : '#374151', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            Self
          </button>
        </div>
        <div><b>Mobile:</b> {patient?.mobile || '—'}</div>
        {/* Date + Time */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <b>Date &amp; Time:</b>
          <span className="no-print" style={{ display: 'flex', gap: '3px' }}>
            <input
              type="date"
              value={meta.sampleDate}
              onChange={(e) => upMeta('sampleDate', e.target.value)}
              style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '1px 4px', fontSize: '11px', outline: 'none' }}
            />
            <input
              value={meta.sampleTime || ''}
              onChange={(e) => upMeta('sampleTime', e.target.value)}
              placeholder="10:30 AM"
              style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '1px 4px', fontSize: '11px', outline: 'none', width: '78px' }}
            />
          </span>
          <span className="print-only" style={{ display: 'none' }}>
            {fmtDate(meta.sampleDate)} {formatAMPM(meta.sampleTime)}
          </span>
        </div>
      </div>

      {/* Row 3 */}
      <div>
        <b>Address:</b> {[patient?.address?.street, patient?.address?.city, patient?.address?.state].filter(Boolean).join(', ') || '—'}
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   ORIGINAL REPORT FOOTER (Fixed at the bottom)
═══════════════════════════════════════════════════════════════ */
const ReportFooter = memo(({ meta, dispatch, signatureUrl, settings }) => {
  const upMeta = useCallback((field, val) => dispatch({ type: 'SET_META', payload: { [field]: val } }), [dispatch]);
  const s = settings || {};
  const docName = s.doctorName || 'Dr. KHUSHBOO SHAH';
  const docDegree = s.doctorDegree || '(MD. Pathology)';
  const notesText = s.notes || s.disclaimer || `Results of investigation depends upon test methods and instrument used. Interpretation may vary from lab to lab, our Pathology will not assume any liability for any controversy in interpretation or report. Claims if any are subject to Jabalpur (M.P.) Jurisdiction.`;

  return (
    <div className="page-footer-container" style={{ marginTop: '24px', fontSize: '10px' }}>
      {/* Top separator — same double line style as header */}
      <div style={{ borderTop: '1px solid #111', borderBottom: '3px solid #111', height: '4px', marginBottom: '10px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '20px' }}>
        {/* Left: Prepared By + Notes */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '11px' }}>
            <span style={{ fontWeight: '600' }}>Prepared By :</span>
            <input
              value={meta.preparedBy}
              onChange={(e) => upMeta('preparedBy', e.target.value)}
              placeholder="____________"
              style={{ border: 'none', borderBottom: '1px solid #444', outline: 'none', width: '140px', fontSize: '11px', background: 'transparent' }}
            />
          </div>
          <div style={{ color: '#333', lineHeight: '1.45', maxWidth: '380px', fontSize: '9px' }}>
            <span style={{ fontWeight: '700' }}>Notes: </span>
            {notesText}
          </div>
        </div>

        {/* Right: Signature + Dr. Name */}
        <div style={{ textAlign: 'center', minWidth: '160px', flexShrink: 0 }}>
          {signatureUrl ? (
            <img src={signatureUrl} alt="Signature" style={{ height: '48px', objectFit: 'contain', display: 'block', margin: '0 auto 2px' }} />
          ) : (
            <div style={{ height: '48px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: '"Dancing Script", "Brush Script MT", cursive', fontSize: '22px', color: '#222', lineHeight: '1' }}>
              Khushboo.
            </div>
          )}
          <div style={{ borderTop: '1px solid #333', paddingTop: '3px', marginTop: '2px' }}>
            <div style={{ fontWeight: '900', fontSize: '11.5px', letterSpacing: '0.3px' }}>{docName}</div>
            <div style={{ color: '#444', fontSize: '10px' }}>{docDegree}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   MAIN LAB REPORT PAGE
═══════════════════════════════════════════════════════════════ */
export default function LabReportPage() {
  const navigate = useNavigate();
  const { id: routeId, patientId: routePatientId } = useParams();
  const { user } = useAuth();

  const [state, dispatch] = useReducer(reducer, null, () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    return {
      ...initState,
      meta: {
        ...initState.meta,
        reportNo: `STP-${dd}${mm}${yyyy}-`,
        sampleTime: now.toTimeString().slice(0, 5),
      },
    };
  });

  const [patients, setPatients] = useState([]);
  const [patSearch, setPatSearch] = useState('');
  const [selPatient, setSelPatient] = useState(null);
  const [showPatDrop, setShowPatDrop] = useState(false);

  const [allTests, setAllTests] = useState([]);
  const [testSearch, setTestSearch] = useState('');
  const [addingTest, setAddingTest] = useState(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selCat, setSelCat] = useState('All');

  // Clinic assets & persistent DB settings
  const [assets, setAssets] = useState({ logo: null, signature: null, settings: {} });

  const loadAssets = useCallback(() => {
    api.get('/clinic/assets')
      .then((r) => {
        setAssets({
          logo: r.data.logo,
          signature: r.data.signature,
          settings: r.data.settings || {},
        });
      })
      .catch(() => {});
  }, []);

  // Inject print styles
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'lab-rpt-print-css';
    el.textContent = PRINT_CSS;
    document.head.appendChild(el);
    return () => document.getElementById('lab-rpt-print-css')?.remove();
  }, []);

  // Load clinic settings, logo & signature on mount
  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Load next incremental report number on mount
  useEffect(() => {
    if (!routeId) {
      api.get('/saved-reports/next-number')
        .then((r) => {
          if (r.data?.nextNumber) {
            dispatch({ type: 'SET_META', payload: { reportNo: r.data.nextNumber } });
          }
        })
        .catch(() => {});
    }
  }, [routeId]);

  // Load all tests from database
  const loadAllTests = useCallback(() => {
    api.get('/tests', { params: { limit: 300 } })
      .then((r) => {
        const t = r.data?.data || [];
        setAllTests(t);
        const cats = ['All', ...new Set(t.map((x) => x.category).filter(Boolean))];
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadAllTests();
  }, [loadAllTests]);

  // ── LOAD SAVED REPORT IF ROUTE ID PRESENT (Reprint functionality) ──
  useEffect(() => {
    if (routeId) {
      api.get(`/saved-reports/${routeId}`)
        .then((r) => {
          const report = r.data?.data;
          if (!report) return;
          if (report.patient) {
            setSelPatient(report.patient);
            setPatSearch(report.patient.fullName || '');
          }
          const loadedSections = (report.sections || []).map((sec) => ({
            id: uid(),
            testId: sec.testId || null,
            testName: sec.testName,
            comments: sec.comments || '',
            rows: (sec.rows || []).map((rw) => ({
              id: uid(),
              param: rw.param,
              result: rw.result || '',
              unit: rw.unit || '',
              refRange: rw.refRange || '',
              isSubheader: rw.isSubheader || false,
            })),
          }));

          dispatch({
            type: 'LOAD_SAVED_REPORT',
            payload: {
              meta: {
                reportNo: report.reportNo || '',
                refDoctor: report.refDoctor || '',
                sampleDate: report.sampleDate ? report.sampleDate.slice(0, 10) : todayISO(),
                sampleTime: report.sampleTime || '',
                sampleType: report.sampleType || '',
                preparedBy: report.preparedBy || '',
              },
              sections: loadedSections,
            },
          });
          toast.success(`Loaded saved report: ${report.reportNo}`);
        })
        .catch(() => {
          toast.error('Could not load saved report');
        });
    } else if (routePatientId) {
      api.get(`/patients/${routePatientId}`)
        .then((r) => {
          const p = r.data?.data;
          if (p) {
            setSelPatient(p);
            setPatSearch(p.fullName);
          }
        })
        .catch(() => {});
    }
  }, [routeId, routePatientId]);

  // Patient search
  useEffect(() => {
    if (!patSearch || patSearch.length < 1) {
      setPatients([]);
      return;
    }
    const timer = setTimeout(() => {
      api.get('/patients', { params: { q: patSearch, limit: 8 } })
        .then((r) => {
          setPatients(r.data?.data || []);
          setShowPatDrop(true);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [patSearch]);

  const selectPatient = useCallback((p) => {
    setSelPatient(p);
    setShowPatDrop(false);
  }, []);

  // Add Test to Report (PRESERVES search text as per Rule #11!)
  const addTest = useCallback(
    async (test) => {
      if (state.sections.find((s) => s.testName === test.testName)) {
        toast.info('This test is already added');
        return;
      }
      setAddingTest(test._id);
      try {
        const r = await api.get(`/tests/${test._id}/parameters`);
        const params = r.data?.data || [];
        const gender = selPatient?.gender || 'Male';
        const age = selPatient?.age || 30;

        const rows =
          params.length > 0
            ? params.map((p) => ({
                id: uid(),
                param: p.paramName,
                paramCode: p.paramCode,
                result: '',
                unit: p.unit || '',
                refRange: refFromParam(p, gender, age),
                formula: p.formula || '',
                dependencies: p.dependencies || [],
                isSubheader: p.isSubheader || p.resultType === 'subheader',
              }))
            : [{ id: uid(), param: '', result: '', unit: '', refRange: '', isSubheader: false }];

        dispatch({
          type: 'ADD_SECTION',
          section: {
            id: uid(),
            testId: test._id,
            testName: test.testName,
            comments: test.comments || '',
            rows,
          },
        });
        // testSearch is intentionally preserved (NOT cleared) as requested
      } catch {
        toast.error('Could not load test parameters');
      } finally {
        setAddingTest(null);
      }
    },
    [state.sections, selPatient]
  );

  // Add custom test (PRESERVES search text)
  const addCustomTest = useCallback(() => {
    const name = testSearch.trim();
    if (!name) {
      toast.info('Enter a test name first');
      return;
    }
    dispatch({
      type: 'ADD_SECTION',
      section: {
        id: uid(),
        testId: null,
        testName: name,
        comments: '',
        rows: [{ id: uid(), param: '', result: '', unit: '', refRange: '', isSubheader: false }],
      },
    });
  }, [testSearch]);

  // Save changes to Test Master Template (Automatically updates MongoDB template!)
  const handleSaveTemplate = useCallback(async (section) => {
    try {
      const res = await api.put(`/tests/${section.testId || 'custom'}/template`, {
        testName: section.testName,
        rows: section.rows,
        comments: section.comments,
      });
      if (res.data?.success) {
        const savedTest = res.data?.data?.test;
        if (savedTest?._id) {
          dispatch({
            type: 'SET_SECTION_TEST_ID',
            sectionId: section.id,
            testId: savedTest._id,
          });
        }
        toast.success(`✅ Saved "${section.testName}" template (${res.data?.data?.parameters?.length || 0} parameters)! Next reports will automatically use these.`);
        loadAllTests();
      } else {
        toast.error(res.data?.message || 'Failed to update test template');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update test template');
    }
  }, [loadAllTests]);

  // Add row
  const handleAddRow = useCallback((sectionId, isSubheader) => {
    dispatch({ type: 'ADD_ROW', sectionId, isSubheader });
  }, []);

  // Save Report
  const saveReport = useCallback(async () => {
    if (!selPatient) {
      toast.error('Please select a patient');
      return;
    }
    // Mandatory Gender Validation (Section 12 & 13)
    if (!selPatient.gender) {
      toast.error('Patient gender is required for accurate reference ranges. Please edit patient to add gender.');
      return;
    }
    if (state.sections.length === 0) {
      toast.error('Add at least one test');
      return;
    }
    setSaving(true);
    try {
      const reportableSections = filterReportableSections(state.sections);
      if (reportableSections.length === 0) {
        toast.error('Please enter at least one test result reading');
        setSaving(false);
        return;
      }

      // Auto-save templates for all sections so parameters are preserved for next patients
      for (const sec of state.sections) {
        if (sec.testName && sec.rows?.length > 0) {
          api.put(`/tests/${sec.testId || 'custom'}/template`, {
            testName: sec.testName,
            rows: sec.rows,
            comments: sec.comments,
          }).catch(() => {});
        }
      }

      const payload = {
        patient: selPatient._id,
        reportNo: state.meta.reportNo,
        refDoctor: state.meta.refDoctor,
        sampleDate: state.meta.sampleDate,
        sampleTime: state.meta.sampleTime,
        sampleType: state.meta.sampleType || undefined,
        preparedBy: state.meta.preparedBy,
        sections: reportableSections.map((s) => ({
          testName: s.testName,
          comments: s.comments || '',
          rows: s.rows.map((r) => ({
            param: r.param,
            result: r.result,
            unit: r.unit,
            refRange: r.refRange,
            isSubheader: r.isSubheader || false,
          })),
        })),
      };
      const res = await api.post('/saved-reports', payload);
      const serverNo = res.data?.data?.reportNo;
      if (serverNo) dispatch({ type: 'SET_META', payload: { reportNo: serverNo } });
      toast.success(`Report saved! No: ${serverNo || ''}`);
    } catch {
      toast.error('Could not save report');
    } finally {
      setSaving(false);
    }
  }, [selPatient, state]);

  // Print Report
  const handlePrint = useCallback(
    async (withHeader) => {
      if (!selPatient) {
        toast.error('Please select a patient');
        return;
      }
      if (!selPatient.gender) {
        toast.error('Patient gender is required for accurate reference ranges. Please edit patient to add gender.');
        return;
      }
      if (state.sections.length === 0) {
        toast.error('Add at least one test');
        return;
      }
      dispatch({ type: 'SET_HEADER', val: withHeader });
      await saveReport();
      setTimeout(() => window.print(), 200);
    },
    [selPatient, state, saveReport]
  );

  const filteredTests = allTests.filter((t) => {
    const matchCat = selCat === 'All' || t.category === selCat;
    const matchQ =
      !testSearch ||
      t.testName.toLowerCase().includes(testSearch.toLowerCase()) ||
      t.testCode.toLowerCase().includes(testSearch.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#f8fafc', fontFamily: 'Arial, sans-serif' }}>
      
      {/* ── LEFT SIDEBAR (Controls & Test Selector) ──────────────── */}
      <div className="no-print" style={{ width: '280px', flexShrink: 0, background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Navigation */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => navigate('/patients')}
            style={{ fontSize: '11px', color: '#475569', background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
          >
            ← Patients
          </button>
          <button
            onClick={() => navigate('/report-history')}
            style={{ fontSize: '11px', color: '#475569', background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
          >
            History
          </button>
          {user?.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              style={{ fontSize: '11px', color: 'white', background: '#1e40af', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontWeight: '700' }}
            >
              🛡️ Admin
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          
          {/* Patient Search */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>Select Patient</div>
            <div style={{ position: 'relative' }}>
              <input
                value={patSearch}
                onChange={(e) => {
                  setPatSearch(e.target.value);
                  setShowPatDrop(true);
                }}
                placeholder="Search patient name..."
                style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', outline: 'none', boxSizing: 'border-box' }}
              />
              {showPatDrop && patients.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #cbd5e1', borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 999, maxHeight: '180px', overflowY: 'auto' }}>
                  {patients.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => selectPatient(p)}
                      style={{ padding: '7px 10px', cursor: 'pointer', fontSize: '11.5px', borderBottom: '1px solid #f1f5f9' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'white')}
                    >
                      <div style={{ fontWeight: '700', color: '#1e40af' }}>{p.fullName}</div>
                      <div style={{ color: '#64748b', fontSize: '10px' }}>
                        {p.patientId} · {p.age ? `${p.age}y` : ''} · <strong style={{ color: p.gender ? '#0f172a' : '#dc2626' }}>{p.gender || 'No Gender'}</strong> {p.mobile ? `· ${p.mobile}` : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selPatient && (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '6px 8px', marginTop: '6px', fontSize: '11px' }}>
                <div style={{ fontWeight: '700', color: '#166534' }}>✓ {selPatient.fullName}</div>
                <div style={{ color: '#475569', fontSize: '10px' }}>
                  {selPatient.patientId} · {selPatient.age ? `${selPatient.age}y` : ''} · <strong style={{ color: '#0f172a' }}>{selPatient.gender}</strong>
                </div>
                {!selPatient.gender && (
                  <div style={{ color: '#dc2626', fontSize: '10px', marginTop: '2px', fontWeight: 'bold' }}>
                    ⚠️ Missing Gender: Edit patient to add gender before printing.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Selector (Preserves Search Text on Click as requested!) */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '4px', textTransform: 'uppercase' }}>Add Test</div>
            <input
              value={testSearch}
              onChange={(e) => setTestSearch(e.target.value)}
              placeholder="Search tests (CBC, LFT, KFT...)"
              style={{ width: '100%', padding: '6px 10px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', marginBottom: '4px' }}
            />
            <select
              value={selCat}
              onChange={(e) => setSelCat(e.target.value)}
              style={{ width: '100%', padding: '4px 6px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '11px', outline: 'none', background: 'white', marginBottom: '6px', boxSizing: 'border-box' }}
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', maxHeight: '250px', overflowY: 'auto' }}>
              {filteredTests.slice(0, 50).map((t) => {
                const added = state.sections.some((s) => s.testId === t._id);
                return (
                  <div
                    key={t._id}
                    onClick={() => !added && addTest(t)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 8px',
                      borderBottom: '1px solid #f1f5f9',
                      cursor: added ? 'default' : 'pointer',
                      background: added ? '#f0fdf4' : 'white',
                    }}
                    onMouseEnter={(e) => !added && (e.currentTarget.style.background = '#eff6ff')}
                    onMouseLeave={(e) => !added && (e.currentTarget.style.background = 'white')}
                  >
                    <div style={{ fontSize: '11px', fontWeight: '600', color: added ? '#15803d' : '#1e293b' }}>
                      {t.testName}
                    </div>
                    {addingTest === t._id ? (
                      <div style={{ width: '12px', height: '12px', border: '2px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                    ) : added ? (
                      <span style={{ color: '#16a34a', fontSize: '12px', fontWeight: 'bold' }}>✓</span>
                    ) : (
                      <span style={{ color: '#2563eb', fontSize: '16px', fontWeight: 'bold' }}>+</span>
                    )}
                  </div>
                );
              })}
            </div>

            {testSearch.trim() && (
              <button
                onClick={addCustomTest}
                style={{ width: '100%', marginTop: '4px', padding: '5px', background: '#eff6ff', border: '1px dashed #3b82f6', borderRadius: '6px', fontSize: '11px', color: '#1d4ed8', cursor: 'pointer', fontWeight: '600' }}
              >
                + Add "{testSearch.trim()}"
              </button>
            )}
          </div>

          <div style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '10px', color: '#64748b' }}>
            💡 <strong>Smart Template:</strong> Added parameters are auto-saved to the Master Test database so they automatically appear for every new patient!
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => handlePrint(true)}
            disabled={!selPatient || state.sections.length === 0}
            style={{
              padding: '9px',
              background: !selPatient || state.sections.length === 0 ? '#cbd5e1' : '#1e3a5f',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12.5px',
              cursor: !selPatient || state.sections.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            🖨️ Print WITH Header
          </button>

          <button
            onClick={() => handlePrint(false)}
            disabled={!selPatient || state.sections.length === 0}
            style={{
              padding: '8px',
              background: !selPatient || state.sections.length === 0 ? '#cbd5e1' : '#475569',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '12px',
              cursor: !selPatient || state.sections.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            📄 Print WITHOUT Header
          </button>

          <button
            onClick={saveReport}
            disabled={!selPatient || state.sections.length === 0 || saving}
            style={{
              padding: '7px',
              background: '#ffffff',
              color: '#1e3a5f',
              border: '1px solid #1e3a5f',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '11.5px',
              cursor: !selPatient || state.sections.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving...' : '💾 Save Report'}
          </button>
        </div>
      </div>

      {/* ── RIGHT: LIVE A4 REPORT PREVIEW (EXACT ORIGINAL SATYAM PATHOLOGY FORMAT) ─────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        
        {/* Preview Control Bar */}
        <div className="no-print" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '10px' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: '#334155' }}>Preview Mode:</span>
          {[true, false].map((h) => (
            <button
              key={String(h)}
              onClick={() => dispatch({ type: 'SET_HEADER', val: h })}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: state.showHeader === h ? '#1e3a5f' : 'white',
                color: state.showHeader === h ? 'white' : '#334155',
                fontSize: '11.5px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {h ? 'With Header' : 'Without Header'}
            </button>
          ))}
          <span style={{ fontSize: '11px', color: '#64748b', marginLeft: 'auto' }}>
            {state.sections.length} test section(s) · Header & Footer repeat on every page
          </span>
        </div>

        {/* The Printable Root A4 Document */}
        <div
          id="REPORT_PRINT_ROOT"
          style={{
            background: 'white',
            minHeight: '297mm',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            maxWidth: '820px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif',
            position: 'relative',
            padding: '24px 30px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          {/* Watermark Logo / Microscope */}
          <div className="report-watermark" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: 0.08,
          }}>
            {assets.logo ? (
              <img src={assets.logo} alt="Watermark" style={{ width: '280px', height: '280px', objectFit: 'contain', filter: 'grayscale(100%)' }} />
            ) : (
              <MicroscopeSVG size={220} color="#111" opacity={1} />
            )}
          </div>

          {/* Content Layer with Native Print Table Header/Footer Structure */}
          <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <table className="print-page-table" style={{ width: '100%', borderCollapse: 'collapse', border: 'none', flex: 1, height: '100%' }}>
              {/* THEAD: Repeats on the TOP of EVERY page in print */}
              <thead>
                <tr>
                  <td style={{ border: 'none', padding: 0 }}>
                    {state.showHeader && (
                      <LabHeader logoUrl={assets.logo} settings={assets.settings} />
                    )}
                    {selPatient ? (
                      <PatientInfoSection
                        patient={selPatient}
                        meta={state.meta}
                        dispatch={dispatch}
                      />
                    ) : (
                      <div className="no-print" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '8px', marginBottom: '12px', fontSize: '12px' }}>
                        👈 Please select a patient from the left panel
                      </div>
                    )}
                  </td>
                </tr>
              </thead>

              {/* TBODY: Test Content & Result Tables (Flows across pages) */}
              <tbody>
                <tr>
                  <td style={{ border: 'none', padding: '6px 0', verticalAlign: 'top', height: '100%' }}>
                    {state.sections.length === 0 ? (
                      <div className="no-print" style={{ textAlign: 'center', padding: '48px 20px', color: '#94a3b8' }}>
                        <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔬</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#334155' }}>No tests added yet</div>
                        <div style={{ fontSize: '12px', marginTop: '2px' }}>Search and add tests from the left panel to populate parameters</div>
                      </div>
                    ) : (
                      state.sections.map((sec) => (
                        <TestSection
                          key={sec.id}
                          section={sec}
                          gender={selPatient?.gender || 'Male'}
                          age={selPatient?.age || 30}
                          dispatch={dispatch}
                          onSaveTemplate={handleSaveTemplate}
                          onAddRow={handleAddRow}
                        />
                      ))
                    )}
                  </td>
                </tr>
              </tbody>

              {/* TFOOT: Repeats on the BOTTOM of EVERY page in print */}
              <tfoot>
                <tr>
                  <td style={{ border: 'none', padding: 0, verticalAlign: 'bottom' }}>
                    {state.showHeader && (
                      <ReportFooter
                        meta={state.meta}
                        dispatch={dispatch}
                        signatureUrl={assets.signature}
                        settings={assets.settings}
                      />
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
