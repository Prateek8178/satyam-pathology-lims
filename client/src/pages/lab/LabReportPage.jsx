import React, { useState, useEffect, useReducer, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import QRCode from 'qrcode';
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
   Maintains the EXACT old report layout, fonts, borders, alignments,
   and ensures the Doctor Signature & Liability note repeats on every page!
═══════════════════════════════════════════════════════════════ */
const PRINT_CSS = `
  @media print {
    @page {
      size: A4 portrait;
      margin: 8mm 10mm 10mm 10mm;
    }

    /* Hide screen-only UI */
    body * { visibility: hidden !important; }

    /* Show print root */
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

    .no-print { display: none !important; visibility: hidden !important; }
    .print-only { display: block !important; visibility: visible !important; }
    .print-inline { display: inline !important; visibility: visible !important; }

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
    }

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

    /* Watermark */
    .report-watermark {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      z-index: 0 !important;
      pointer-events: none !important;
      opacity: 0.08 !important;
    }

    /* Footer repeating on every page */
    .page-footer-container {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
  }
`;

/* ═══════════════════════════════════════════════════════════════
   HELPERS & REFERENCE RANGE ENGINE (Gender & Age Aware)
═══════════════════════════════════════════════════════════════ */
const todayISO = () => new Date().toISOString().split('T')[0];

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
  if (hi !== null && num > hi) return 'High';
  if (lo !== null && num < lo) return 'Low';
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
   STATE MANAGEMENT (useReducer)
═══════════════════════════════════════════════════════════════ */
const makeSTPPrefix = () => {
  const n = new Date();
  const dd = String(n.getDate()).padStart(2, '0');
  const mm = String(n.getMonth() + 1).padStart(2, '0');
  return `STP-${dd}${mm}${n.getFullYear()}-`;
};

const initState = {
  patientId: '',
  meta: {
    reportNo: '',
    refDoctor: '',
    sampleDate: todayISO(),
    sampleTime: new Date().toTimeString().slice(0, 5),
    sampleType: '', // Optional, no hardcoded Blood
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
    case 'UPDATE_SECTION_META':
      return {
        ...state,
        sections: state.sections.map((s) => (s.id === action.id ? { ...s, [action.field]: action.val } : s)),
      };
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
   MICROSCOPE VECTOR ICON
═══════════════════════════════════════════════════════════════ */
const MicroscopeIcon = ({ size = 64, color = '#1a365d' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 18h8" />
    <path d="M3 22h18" />
    <path d="M14 22a7 7 0 1 0 0-14h-1" />
    <path d="M9 14h2" />
    <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
    <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
  </svg>
);

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
      border: '1px solid #cbd5e1',
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
   PARAMETER ROW COMPONENT
═══════════════════════════════════════════════════════════════ */
const ParamRow = memo(({ row, sectionId, gender, age, dispatch, idx }) => {
  // If row is a subheader (e.g. "DIFFERENTIAL WBC COUNT", "BILLIRUBIN")
  if (row.isSubheader) {
    return (
      <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1' }} className="test-row-item">
        <td colSpan={5} style={{ padding: '4px 8px' }}>
          <Editable
            value={row.param}
            placeholder="CATEGORY / SUBHEADER TITLE"
            style={{ fontWeight: '800', color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '11px', border: '1px dashed #93c5fd' }}
            onChange={(e) =>
              dispatch({ type: 'UPDATE_ROW', sectionId, rowId: row.id, field: 'param', value: e.target.value })
            }
          />
        </td>
        <td className="no-print" style={{ padding: '3px 4px', textAlign: 'center' }}>
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
  const isHigh = flag === 'High';
  const isLow = flag === 'Low';
  const isAbnormal = isHigh || isLow;

  return (
    <tr
      className={`test-row-item ${!hasValue ? 'row-unentered' : ''}`}
      style={{
        background: isAbnormal ? '#fff5f5' : idx % 2 === 0 ? '#ffffff' : '#fafcff',
        borderBottom: '1px solid #e2e8f0',
      }}
    >
      {/* Parameter Name */}
      <td style={{ padding: '4px 8px', fontSize: '11.5px', color: '#1e293b', fontWeight: '500' }}>
        <Editable
          value={row.param}
          placeholder="Parameter name"
          onChange={(e) =>
            dispatch({ type: 'UPDATE_ROW', sectionId, rowId: row.id, field: 'param', value: e.target.value })
          }
        />
      </td>

      {/* Result */}
      <td style={{ padding: '4px 8px', textAlign: 'center' }}>
        <Editable
          value={row.result}
          placeholder="—"
          style={{
            textAlign: 'center',
            fontWeight: isAbnormal ? 'bold' : '600',
            color: isHigh ? '#dc2626' : isLow ? '#2563eb' : '#0f172a',
            width: '80px',
          }}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_ROW', sectionId, rowId: row.id, field: 'result', value: e.target.value })
          }
        />
      </td>

      {/* Flag (High / Low) */}
      <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: '700', fontSize: '11px', color: isHigh ? '#dc2626' : isLow ? '#2563eb' : '#94a3b8' }}>
        {flag || ''}
      </td>

      {/* Reference Value */}
      <td style={{ padding: '4px 8px', fontSize: '11px', color: '#334155' }}>
        <Editable
          value={row.refRange}
          placeholder="e.g. 12 - 15"
          onChange={(e) =>
            dispatch({ type: 'UPDATE_ROW', sectionId, rowId: row.id, field: 'refRange', value: e.target.value })
          }
        />
      </td>

      {/* Unit */}
      <td style={{ padding: '4px 8px', textAlign: 'center', fontSize: '11px', color: '#475569' }}>
        <Editable
          value={row.unit}
          placeholder="unit"
          style={{ textAlign: 'center', width: '65px' }}
          onChange={(e) =>
            dispatch({ type: 'UPDATE_ROW', sectionId, rowId: row.id, field: 'unit', value: e.target.value })
          }
        />
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
   TEST SECTION COMPONENT (Matching Sample Report)
═══════════════════════════════════════════════════════════════ */
const TestSection = memo(({ section, gender, age, dispatch, onSaveTemplate }) => {
  const [savingTpl, setSavingTpl] = useState(false);

  const handleSaveTpl = async () => {
    setSavingTpl(true);
    await onSaveTemplate(section);
    setSavingTpl(false);
  };

  return (
    <div className="test-section-block" style={{ marginBottom: '14px' }}>
      {/* Test Title Bar */}
      <div style={{ textAlign: 'center', margin: '6px 0 4px 0', borderBottom: '1.5px solid #1e3a5f', paddingBottom: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <span style={{ fontSize: '13px', fontWeight: '800', color: '#0f172a', letterSpacing: '0.3px', textTransform: 'none' }}>
          {section.testName}
        </span>
        
        {/* Actions for Section Template Management */}
        <div className="no-print" style={{ position: 'absolute', right: 0, display: 'flex', gap: '6px' }}>
          <button
            onClick={handleSaveTpl}
            disabled={savingTpl}
            style={{ fontSize: '10.5px', background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontWeight: '600' }}
            title="Save these parameters and formulas into the Master Test Template for future reports"
          >
            {savingTpl ? 'Saving...' : '💾 Save as Test Template'}
          </button>
          <button
            onClick={() => dispatch({ type: 'REMOVE_SECTION', id: section.id })}
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}
            title="Remove from current report"
          >
            [Delete]
          </button>
        </div>
      </div>

      {/* Parameters Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderTop: '2px solid #0f172a', borderBottom: '1.5px solid #0f172a' }}>
            <th style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '800', color: '#0f172a', textAlign: 'left', width: '38%' }}>Test</th>
            <th style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '800', color: '#0f172a', textAlign: 'center', width: '16%' }}>Result</th>
            <th style={{ padding: '4px 6px', fontSize: '11px', fontWeight: '800', color: '#0f172a', textAlign: 'center', width: '10%' }}></th>
            <th style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '800', color: '#0f172a', textAlign: 'left', width: '22%' }}>Ref. Value</th>
            <th style={{ padding: '4px 8px', fontSize: '11px', fontWeight: '800', color: '#0f172a', textAlign: 'center', width: '14%' }}>Unit</th>
            <th className="no-print" style={{ width: '24px' }}></th>
          </tr>
        </thead>
        <tbody>
          {section.rows.map((row, i) => (
            <ParamRow key={row.id} row={row} sectionId={section.id} gender={gender} age={age} dispatch={dispatch} idx={i} />
          ))}
        </tbody>
      </table>

      {/* Screen Add Row & Subheader buttons */}
      <div className="no-print" style={{ marginTop: '5px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button
          onClick={() => dispatch({ type: 'ADD_ROW', sectionId: section.id, isSubheader: false })}
          style={{ fontSize: '11px', color: '#1e40af', background: 'none', border: '1px dashed #93c5fd', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}
        >
          + Add Parameter Row
        </button>
        <button
          onClick={() => dispatch({ type: 'ADD_ROW', sectionId: section.id, isSubheader: true })}
          style={{ fontSize: '11px', color: '#0369a1', background: 'none', border: '1px dashed #7dd3fc', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer' }}
        >
          + Add Category / Subheader
        </button>
      </div>

      {/* Method / Comments / Interpretation Box if available */}
      {section.comments && (
        <div style={{ marginTop: '8px', padding: '6px 8px', border: '1px solid #1e293b', borderRadius: '2px', fontSize: '9px', lineHeight: '1.35', color: '#1e293b' }}>
          <div style={{ fontWeight: '700', marginBottom: '2px' }}>Interpretation / Comments:</div>
          <div style={{ whiteSpace: 'pre-line' }}>{section.comments}</div>
        </div>
      )}
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   HEADER COMPONENT (Matching 12-Page Sample)
═══════════════════════════════════════════════════════════════ */
const LabHeader = memo(({ logoUrl, settings }) => {
  const s = settings || {};
  const labName = s.name || 'We Care PATHOLOGY LAB';
  const tagline = s.tagline || 'Accurate Results Timely Delivered';
  const address = s.address || '1283, BT Road near Maruti Marbal, Choti Bajariya, Garha Jabalpur (M.P.)';
  const support = s.customerSupport || s.phone || '9131709514';

  return (
    <div style={{ marginBottom: '8px', borderBottom: '2px solid #0f172a', paddingBottom: '6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        
        {/* Left: Blue Banner Badge */}
        <div style={{
          background: '#1d3557',
          color: 'white',
          padding: '8px 14px',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          minWidth: '180px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '0.8px', textTransform: 'uppercase', color: '#ffffff' }}>
            PATHOLOGY REPORTS
          </div>
          <div style={{
            background: '#e63946',
            color: '#ffffff',
            fontSize: '9.5px',
            fontWeight: '700',
            padding: '2px 6px',
            borderRadius: '2px',
            marginTop: '3px',
            letterSpacing: '0.3px',
            textAlign: 'center'
          }}>
            {tagline}
          </div>
        </div>

        {/* Center: Microscope Logo */}
        <div style={{ flexShrink: 0, textAlign: 'center' }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ height: '62px', width: 'auto', objectFit: 'contain' }} />
          ) : (
            <MicroscopeIcon size={56} color="#1d3557" />
          )}
        </div>

        {/* Right: Lab Name & Address */}
        <div style={{ textAlign: 'right', flex: 1 }}>
          <div style={{
            fontFamily: '"Brush Script MT", "Dancing Script", "Lucida Calligraphy", cursive, sans-serif',
            fontSize: '28px',
            fontWeight: '700',
            color: '#e63946',
            lineHeight: '1',
            letterSpacing: '0.5px'
          }}>
            {labName.includes('We Care') ? 'We Care' : labName}
          </div>
          <div style={{ fontSize: '10px', fontWeight: '800', color: '#1d3557', letterSpacing: '0.8px', textTransform: 'uppercase', marginTop: '2px' }}>
            {labName.includes('We Care') ? 'PATHOLOGY LAB' : 'DIAGNOSTIC CENTER'}
          </div>
          <div style={{ fontSize: '9px', color: '#334155', marginTop: '2px', lineHeight: '1.25', maxWidth: '300px', marginLeft: 'auto' }}>
            {address}
          </div>
          <div style={{ fontSize: '9.5px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>
            Customer Support :- {support}
          </div>
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   PATIENT INFO BOX (Matching 12-Page Sample)
═══════════════════════════════════════════════════════════════ */
const PatientInfoSection = memo(({ patient, meta, dispatch, qrDataUrl }) => {
  const upMeta = useCallback((field, val) => dispatch({ type: 'SET_META', payload: { [field]: val } }), [dispatch]);

  const pName = patient?.fullName || '—';
  const uhid = patient?.patientId || meta.reportNo || 'UHID 1742';
  const refBy = meta.refDoctor || patient?.referredByName || patient?.referringDoctor?.name || 'Self';
  const mobile = patient?.mobile;

  return (
    <div style={{
      fontSize: '11px',
      borderBottom: '2px solid #0f172a',
      paddingBottom: '6px',
      marginBottom: '10px',
      lineHeight: '1.35',
      color: '#0f172a',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1.1fr 1.2fr', gap: '4px 16px', alignItems: 'center' }}>
        
        {/* Col 1: Name, Age, Sex, UHID */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: '800', color: '#0f172a' }}>
            {pName}
          </div>
          <div style={{ marginTop: '2px' }}>
            <span style={{ fontWeight: '600' }}>Age : </span>
            {patient?.age ? `${patient.age} Years` : '—'}
          </div>
          <div style={{ marginTop: '1px' }}>
            <span style={{ fontWeight: '600' }}>Sex : </span>
            <span style={{ fontWeight: '700', color: patient?.gender ? '#0f172a' : '#dc2626' }}>
              {patient?.gender || 'Missing (Required)'}
            </span>
          </div>
          <div style={{ marginTop: '1px' }}>
            <span style={{ fontWeight: '600' }}>UHID : </span>
            {uhid}
          </div>
          {mobile && (
            <div style={{ marginTop: '1px', fontSize: '10px', color: '#475569' }}>
              <span style={{ fontWeight: '600' }}>Mob: </span>
              {mobile}
            </div>
          )}
        </div>

        {/* Col 2: QR Code & Ref. By */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR" style={{ width: '52px', height: '52px', flexShrink: 0 }} />
          )}
          <div>
            <div style={{ fontWeight: '700', fontSize: '10.5px' }}>Ref. By :</div>
            <div className="no-print">
              <input
                value={meta.refDoctor}
                onChange={(e) => upMeta('refDoctor', e.target.value)}
                placeholder="Doctor name"
                style={{ border: '1px solid #ccc', borderRadius: '3px', padding: '1px 4px', fontSize: '11px', width: '120px' }}
              />
            </div>
            <div className="print-only" style={{ fontWeight: '700', fontSize: '11px', textTransform: 'uppercase' }}>
              {refBy}
            </div>
          </div>
        </div>

        {/* Col 3: Timestamps */}
        <div style={{ fontSize: '10px', textAlign: 'right' }}>
          <div>
            <span style={{ fontWeight: '600' }}>Registered : </span>
            {meta.sampleDate || todayISO()} 09:00 AM
          </div>
          <div style={{ marginTop: '2px' }}>
            <span style={{ fontWeight: '600' }}>Collected : </span>
            {meta.sampleDate || todayISO()} 09:45 AM
          </div>
          <div style={{ marginTop: '2px' }}>
            <span style={{ fontWeight: '600' }}>Reported : </span>
            {meta.sampleDate || todayISO()} 04:00 PM
          </div>
        </div>
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   FOOTER COMPONENT (Repeating on Every Page)
═══════════════════════════════════════════════════════════════ */
const ReportFooter = memo(({ signatureUrl, settings }) => {
  const s = settings || {};
  const docName = s.doctorName || 'DR. R K SAGARIYA';
  const docDegree = s.doctorDegree || 'MD PATHOLOGY';
  const disclaimer = s.disclaimer || 'Note: Pathological Test Have Technical, For Any Disparity, retested Examination Are Required. No Legal Liability Is Accepted. Clinical Correlation Is Also Requested.';

  return (
    <div className="page-footer-container" style={{ marginTop: '16px', fontSize: '9px', color: '#1e293b' }}>
      {/* Doctor Signature Block (Right-aligned) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
        <div style={{ textAlign: 'center', minWidth: '170px' }}>
          {signatureUrl ? (
            <img src={signatureUrl} alt="Signature" style={{ height: '42px', width: 'auto', objectFit: 'contain', margin: '0 auto 2px' }} />
          ) : (
            <div style={{ height: '36px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', fontFamily: '"Dancing Script", cursive', fontSize: '20px', color: '#111' }}>
              R.K. Sagariya
            </div>
          )}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '3px' }}>
            <div style={{ fontWeight: '900', fontSize: '11px', letterSpacing: '0.3px', color: '#0f172a' }}>{docName}</div>
            <div style={{ fontSize: '9.5px', color: '#475569', fontWeight: '600' }}>{docDegree}</div>
          </div>
        </div>
      </div>

      {/* Bottom Legal Disclaimer Note */}
      <div style={{ borderTop: '1px solid #cbd5e1', paddingTop: '4px', textAlign: 'center', fontSize: '8px', color: '#64748b', lineHeight: '1.3' }}>
        {disclaimer}
      </div>
    </div>
  );
});

/* ═══════════════════════════════════════════════════════════════
   MAIN LAB REPORT PAGE
═══════════════════════════════════════════════════════════════ */
export default function LabReportPage() {
  const navigate = useNavigate();
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
  const [qrDataUrl, setQrDataUrl] = useState('');

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

  // Load clinic settings on mount
  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  // Generate QR Code for verification
  useEffect(() => {
    const reportId = state.meta.reportNo || 'STP-VERIFY-001';
    QRCode.toDataURL(`https://satyam-pathology-lims.com/verify/${reportId}`, { width: 100, margin: 1 })
      .then((url) => setQrDataUrl(url))
      .catch(() => {});
  }, [state.meta.reportNo]);

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
    dispatch({ type: 'SET_META', payload: { refDoctor: p.referredByName || p.referringDoctor?.name || 'Self' } });
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
        // Notice: testSearch is intentionally PRESERVED (NOT cleared) as requested in Rule #11!
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

  // Save changes to Test Master Template (Section 6, 7, 8, 9)
  const handleSaveTemplate = useCallback(async (section) => {
    try {
      const res = await api.put(`/tests/${section.testId || 'custom'}/template`, {
        testName: section.testName,
        rows: section.rows,
        comments: section.comments,
      });
      if (res.data?.success) {
        toast.success(`✅ Saved "${section.testName}" template! Next reports will automatically use these parameters.`);
        loadAllTests();
      }
    } catch {
      toast.error('Failed to update test template');
    }
  }, [loadAllTests]);

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
            💡 <strong>Smart Master:</strong> You can add/remove rows or formulas in any test and click <em>"Save as Test Template"</em> to update it for all future reports!
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ padding: '10px 12px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => handlePrint(true)}
            disabled={!selPatient || state.sections.length === 0}
            style={{
              padding: '9px',
              background: !selPatient || state.sections.length === 0 ? '#cbd5e1' : '#1d3557',
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
              color: '#1d3557',
              border: '1px solid #1d3557',
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

      {/* ── RIGHT: LIVE A4 REPORT PREVIEW (EXACT OLD REPORT FORMAT) ─────────────────── */}
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
                background: state.showHeader === h ? '#1d3557' : 'white',
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
            {state.sections.length} test section(s) · Blank parameters auto-hide on print
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
          }}
        >
          {/* Watermark Logo / Icon */}
          <div className="report-watermark" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: 0.1,
          }}>
            {assets.logo ? (
              <img src={assets.logo} alt="Watermark" style={{ width: '280px', height: '280px', objectFit: 'contain', filter: 'grayscale(100%)' }} />
            ) : (
              <MicroscopeIcon size={260} color="#64748b" />
            )}
          </div>

          {/* Content Layer above watermark */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            
            {/* Header Section */}
            {state.showHeader && (
              <LabHeader logoUrl={assets.logo} settings={assets.settings} />
            )}

            {/* Patient Information Section */}
            {selPatient ? (
              <PatientInfoSection
                patient={selPatient}
                meta={state.meta}
                dispatch={dispatch}
                qrDataUrl={qrDataUrl}
              />
            ) : (
              <div className="no-print" style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '8px', marginBottom: '12px', fontSize: '12px' }}>
                👈 Please select a patient from the left panel
              </div>
            )}

            {/* Tests & Parameters */}
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
                />
              ))
            )}

            {/* Footer with Doctor Signature & Disclaimer */}
            {state.showHeader && state.sections.length > 0 && (
              <ReportFooter
                signatureUrl={assets.signature}
                settings={assets.settings}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
