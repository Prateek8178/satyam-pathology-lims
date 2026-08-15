import React, { useState, useEffect, useReducer, useCallback, useRef, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/* ═══════════════════════════════════════════════════════════════
   PRINT STYLES (injected once into <head>)
═══════════════════════════════════════════════════════════════ */
const PRINT_CSS = `
  @media print {
    @page { size: A4 portrait; margin: 10mm 12mm; }

    /* Hide everything on screen */
    body * { visibility: hidden !important; }

    /* Show only the report and its contents */
    #REPORT_PRINT_ROOT,
    #REPORT_PRINT_ROOT * { visibility: visible !important; }

    /* KEY FIX: use absolute (not fixed) so content overflows to multiple pages */
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
    }

    /* Hide all interactive controls */
    .no-print { display: none !important; visibility: hidden !important; }
    /* Show print-only elements (formatted date/time text) */
    .print-only { display: inline !important; visibility: visible !important; }

    /* Inputs appear as plain text */
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

    /* Table borders */
    table { border-collapse: collapse !important; width: 100% !important; }
    td, th { border-color: #b0c4d8 !important; }

    /* Keep each test section together — avoid page break inside a single test */
    .test-section-block {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }

    /* Allow natural page breaks between sections */
    .test-section-block + .test-section-block {
      page-break-before: auto !important;
    }

    /* Watermark visible on all pages */
    .report-watermark {
      position: fixed !important;
      top: 50% !important;
      left: 50% !important;
      transform: translate(-50%, -50%) !important;
      z-index: 0 !important;
      pointer-events: none !important;
    }

    /* Forced page break class */
    .page-break { page-break-before: always !important; break-before: page !important; }
  }
`;


/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */
const todayISO = () => new Date().toISOString().split('T')[0];
const fmtDate  = d => d ? new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : '';

let _uid = 0;
const uid = () => ++_uid;

const calcFlag = (result, refRange, gender) => {
  const num = parseFloat(result);
  if (!result || isNaN(num) || !refRange) return null;
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

/* Gender-specific reference range — shows only the range relevant to this patient */
const refFromParam = (p, gender) => {
  const isF = gender === 'Female';
  // If both male and female ranges exist, pick the one matching patient gender
  if (p.femaleRange?.low != null && p.maleRange?.low != null) {
    const rng = isF ? p.femaleRange : p.maleRange;
    return `${rng.low} - ${rng.high}`;
  }
  // Only one range exists — use it
  if (p.maleRange?.low != null)   return `${p.maleRange.low} - ${p.maleRange.high}`;
  if (p.femaleRange?.low != null) return `${p.femaleRange.low} - ${p.femaleRange.high}`;
  return '';
};

/* ═══════════════════════════════════════════════════════════════
   STATE MANAGEMENT (useReducer — stable dispatch = no cursor loss)
═══════════════════════════════════════════════════════════════ */
const makeSTPPrefix = () => {
  const n = new Date();
  const dd = String(n.getDate()).padStart(2,'0');
  const mm = String(n.getMonth()+1).padStart(2,'0');
  return `STP-${dd}${mm}${n.getFullYear()}-`;
};

const initState = {
  patientId: '',
  meta: { reportNo: '', refDoctor: '', sampleDate: todayISO(), sampleTime: new Date().toTimeString().slice(0,5), sampleType: 'Blood', preparedBy: '' },
  sections: [],
  showHeader: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PATIENT': return { ...state, patientId: action.id };
    case 'SET_META':    return { ...state, meta: { ...state.meta, ...action.payload } };
    case 'TOGGLE_HEADER': return { ...state, showHeader: !state.showHeader };
    case 'SET_HEADER': return { ...state, showHeader: action.val };
    case 'ADD_SECTION':
      if (state.sections.find(s => s.testName === action.section.testName)) return state;
      return { ...state, sections: [...state.sections, action.section] };
    case 'REMOVE_SECTION':
      return { ...state, sections: state.sections.filter(s => s.id !== action.id) };
    case 'ADD_ROW':
      return { ...state, sections: state.sections.map(s =>
        s.id === action.sectionId ? { ...s, rows: [...s.rows, { id: uid(), param:'', result:'', unit:'', refRange:'' }] } : s
      )};
    case 'REMOVE_ROW':
      return { ...state, sections: state.sections.map(s =>
        s.id === action.sectionId ? { ...s, rows: s.rows.filter(r => r.id !== action.rowId) } : s
      )};
    case 'UPDATE_ROW':
      return { ...state, sections: state.sections.map(s =>
        s.id === action.sectionId ? { ...s, rows: s.rows.map(r =>
          r.id === action.rowId ? { ...r, [action.field]: action.value } : r
        )} : s
      )};
    case 'CLEAR': return { ...initState, meta: { ...initState.meta, reportNo: makeSTPPrefix(), sampleDate: todayISO(), sampleTime: new Date().toTimeString().slice(0,5) } };
    default: return state;
  }
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS — all defined at MODULE LEVEL (cursor fix!)
═══════════════════════════════════════════════════════════════ */

/* Editable inline input (used in report table) */
const Editable = memo(({ value, onChange, style, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    style={{ background:'transparent', border:'1px solid #d1d5db', borderRadius:'3px',
      padding:'1px 4px', fontSize:'11px', color:'inherit', width:'100%', outline:'none',
      fontFamily:'inherit', ...style }}
  />
));

/* One parameter row */
const ParamRow = memo(({ row, sectionId, gender, dispatch, idx }) => {
  const flag = calcFlag(row.result, row.refRange, gender);
  const abn  = flag === 'H' || flag === 'L';
  return (
    <tr style={{ background: abn ? '#fff0f0' : idx % 2 === 0 ? '#fff' : '#f9fbff', borderBottom:'1px solid #e5e7eb' }}>
      <td style={{ padding:'3px 6px', fontSize:'11px' }}>
        <Editable value={row.param} placeholder="Parameter name"
          onChange={e => dispatch({ type:'UPDATE_ROW', sectionId, rowId:row.id, field:'param', value:e.target.value })} />
      </td>
      <td style={{ padding:'3px 6px', textAlign:'center' }}>
        <Editable value={row.result} placeholder="—" style={{ textAlign:'center', fontWeight: abn?'bold':'normal', color: flag==='H'?'#cc0000':flag==='L'?'#0055cc':'inherit', width:'65px' }}
          onChange={e => dispatch({ type:'UPDATE_ROW', sectionId, rowId:row.id, field:'result', value:e.target.value })} />
      </td>
      <td style={{ padding:'3px 6px', textAlign:'center' }}>
        <Editable value={row.unit} placeholder="unit" style={{ textAlign:'center', width:'55px' }}
          onChange={e => dispatch({ type:'UPDATE_ROW', sectionId, rowId:row.id, field:'unit', value:e.target.value })} />
      </td>
      <td style={{ padding:'3px 6px' }}>
        <Editable value={row.refRange} placeholder="e.g. M: 13.5-17.5"
          onChange={e => dispatch({ type:'UPDATE_ROW', sectionId, rowId:row.id, field:'refRange', value:e.target.value })} />
      </td>
      <td style={{ padding:'3px 6px', textAlign:'center', fontWeight:'bold', fontSize:'11px',
        color: flag==='H'?'#cc0000':flag==='L'?'#0055cc':'#aaa' }}>
        {flag || ''}
      </td>
      <td style={{ padding:'3px 4px', textAlign:'center' }} className="no-print">
        <button onClick={() => dispatch({ type:'REMOVE_ROW', sectionId, rowId:row.id })}
          style={{ color:'#dc2626', background:'none', border:'none', cursor:'pointer', fontSize:'15px', lineHeight:'1' }}>×</button>
      </td>
    </tr>
  );
});

/* Test section (header bar + rows table) */
const TestSection = memo(({ section, gender, dispatch }) => (
  <div className="test-section-block" style={{ marginBottom:'10px' }}>
    <div style={{ background:'#1e3a5f', color:'white', padding:'4px 10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
      <span style={{ fontSize:'12px', fontWeight:'bold', letterSpacing:'0.5px' }}>{section.testName.toUpperCase()}</span>
      <button className="no-print" onClick={() => dispatch({ type:'REMOVE_SECTION', id:section.id })}
        style={{ background:'none', border:'none', color:'#aaa', cursor:'pointer', fontSize:'14px' }}>✕</button>
    </div>
    <table style={{ width:'100%', borderCollapse:'collapse' }}>
      <thead>
        <tr style={{ background:'#dce8f5', borderBottom:'1px solid #b0c4d8' }}>
          {[['Parameter','34%'],['Result','14%'],['Unit','11%'],['Reference Range','30%'],['Flag','6%'],['','5%']].map(([h,w]) => (
            <th key={h} className={h===''?'no-print':''} style={{ padding:'4px 6px', fontSize:'10px', fontWeight:'700', color:'#1e3a5f', textAlign: h==='Result'||h==='Unit'||h==='Flag'?'center':'left', width:w, border:'1px solid #b0c4d8' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {section.rows.map((row, i) => (
          <ParamRow key={row.id} row={row} sectionId={section.id} gender={gender} dispatch={dispatch} idx={i} />
        ))}
      </tbody>
    </table>
    <button className="no-print" onClick={() => dispatch({ type:'ADD_ROW', sectionId:section.id })}
      style={{ fontSize:'11px', color:'#1e3a5f', background:'none', border:'1px dashed #1e3a5f', borderRadius:'4px', padding:'2px 10px', cursor:'pointer', marginTop:'3px' }}>
      + Add Row
    </button>
  </div>
));

/* ═══ MICROSCOPE SVG (shared between header logo and watermark) ═══
   Realistic silhouette matching the Satyam Pathology letterhead     */
const MicroscopeSVG = ({ size = 80, color = '#111', opacity = 1 }) => (
  <svg width={size} height={size * 1.25} viewBox="0 0 160 200"
       xmlns="http://www.w3.org/2000/svg" style={{ opacity, display:'block' }}>
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

/* Satyam Pathology Header — uses settings from clinic API */
const LabHeader = memo(({ logoUrl, settings }) => {
  const s = settings || {};
  const name    = s.name    || 'SATYAM PATHOLOGY CENTER';
  const tagline = s.tagline || 'Accurate | Caring | Instant';
  const address = s.address || 'Inside Gopi Medical, Sheetla Mai Chauraha, Jabalpur';
  const phone   = s.phone   || '9165144073, 9340311506, 9516128613';
  const email   = s.email   || 'lp93403115@gmail.com';
  return (
  <div style={{ marginBottom:'10px' }}>
    <div style={{ display:'flex', alignItems:'center', gap:'16px', paddingBottom:'10px' }}>
      {/* Logo left — use uploaded image or SVG microscope */}
      <div style={{ flexShrink:0 }}>
        {logoUrl
          ? <img src={logoUrl} alt="Lab Logo" style={{ width:'80px', height:'100px', objectFit:'contain' }} />
          : <MicroscopeSVG size={72} color="#111" />}
      </div>
      {/* Clinic details center */}
      <div style={{ flex:1, textAlign:'center', lineHeight:'1.2' }}>
        <div style={{
          fontSize:'32px', fontWeight:'900', color:'#c62828',
          fontFamily:'"Arial Black", "Arial", sans-serif',
          letterSpacing:'1px', textTransform:'uppercase'
        }}>
          {name}
        </div>
        <div style={{
          fontSize:'14px', fontWeight:'800',
          color:'#1a237e', marginTop:'3px', letterSpacing:'0.5px'
        }}>
          {tagline}
        </div>
        <div style={{ fontSize:'11.5px', color:'#1a237e', marginTop:'5px', fontWeight:'500' }}>
          {address}
        </div>
        <div style={{ fontSize:'11.5px', color:'#1a237e', marginTop:'1px', fontWeight:'500' }}>
          {phone} &nbsp;&nbsp;|&nbsp;&nbsp; {email}
        </div>
      </div>
    </div>
    {/* Separator line */}
    <div style={{ borderTop:'2px solid #111', marginTop:'8px' }} />
  </div>
);
});


/* Patient info row — date+time shown as readable text in print */
const PatientInfoSection = memo(({ patient, meta, dispatch }) => {
  const upMeta = useCallback((field, val) => dispatch({ type:'SET_META', payload:{ [field]: val } }), [dispatch]);

  // Format date as DD/MM/YYYY
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const [y,m,d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  // Format time as HH:MM AM/PM
  const fmtTime = (t) => {
    if (!t) return '';
    const [h, min] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hh = h % 12 || 12;
    return `${String(hh).padStart(2,'0')}:${String(min).padStart(2,'0')} ${ampm}`;
  };

  return (
    <div style={{ fontSize:'11.5px', borderBottom:'2px solid #1e3a5f', paddingBottom:'6px', marginBottom:'8px' }}>
      {/* Row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'3px 16px', marginBottom:'3px' }}>
        <div><b>Patient Name:</b> {patient?.fullName || '—'}</div>
        <div><b>Age / Sex:</b> {patient?.age ? `${patient.age} Yrs` : '—'} / {patient?.gender || '—'}</div>
        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          <b>Report No:</b>
          {/* Editable only on screen, shows clean text when printed */}
          <input value={meta.reportNo} onChange={e => upMeta('reportNo', e.target.value)}
            style={{ border:'1px solid #ccc', borderRadius:'3px', padding:'1px 4px', width:'130px', fontSize:'11px', outline:'none' }} />
        </div>
      </div>
      {/* Row 2 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'3px 16px', marginBottom:'3px' }}>
        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          <b>Ref. Doctor:</b>
          <input value={meta.refDoctor} onChange={e => upMeta('refDoctor', e.target.value)} placeholder="Doctor name"
            style={{ border:'1px solid #ccc', borderRadius:'3px', padding:'1px 4px', flex:1, fontSize:'11px', outline:'none' }} />
          <button className="no-print" onClick={() => upMeta('refDoctor', 'Self')}
            style={{ fontSize:'9px', padding:'1px 5px', border:'1px solid #ccc', borderRadius:'3px', background: meta.refDoctor==='Self'?'#1e3a5f':'#f3f4f6', color: meta.refDoctor==='Self'?'white':'#374151', cursor:'pointer', whiteSpace:'nowrap' }}>Self</button>
        </div>
        <div><b>Mobile:</b> {patient?.mobile || '—'}</div>
        {/* Date + Time — inputs for editing, formatted text on print */}
        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          <b>Date &amp; Time:</b>
          <span className="no-print" style={{ display:'flex', gap:'3px' }}>
            <input type="date" value={meta.sampleDate} onChange={e => upMeta('sampleDate', e.target.value)}
              style={{ border:'1px solid #ccc', borderRadius:'3px', padding:'1px 4px', fontSize:'11px', outline:'none' }} />
            <input type="time" value={meta.sampleTime || ''} onChange={e => upMeta('sampleTime', e.target.value)}
              style={{ border:'1px solid #ccc', borderRadius:'3px', padding:'1px 4px', fontSize:'11px', outline:'none', width:'72px' }} />
          </span>
          {/* Print-only: formatted date + time */}
          <span className="print-only" style={{ display:'none' }}>
            {fmtDate(meta.sampleDate)}{meta.sampleTime ? ` ${fmtTime(meta.sampleTime)}` : ''}
          </span>
        </div>
      </div>
      {/* Row 3 */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'3px 16px' }}>
        <div>
          <b>Address:</b> {[
            patient?.address?.street, patient?.address?.city, patient?.address?.state
          ].filter(Boolean).join(', ') || '—'}
        </div>
        <div style={{ display:'flex', gap:'4px', alignItems:'center' }}>
          <b>Sample Type:</b>
          <input value={meta.sampleType} onChange={e => upMeta('sampleType', e.target.value)}
            style={{ border:'1px solid #ccc', borderRadius:'3px', padding:'1px 4px', flex:1, fontSize:'11px', outline:'none' }} />
        </div>
      </div>
    </div>
  );
});


/* Report Footer — exactly matches letterhead bottom */
const ReportFooter = memo(({ meta, dispatch, signatureUrl }) => {
  const upMeta = useCallback((field, val) => dispatch({ type:'SET_META', payload:{ [field]: val } }), [dispatch]);
  return (
    <div style={{ marginTop:'32px', fontSize:'10px' }}>
      {/* Top separator — same double line style as header */}
      <div style={{ borderTop:'1px solid #111', borderBottom:'3px solid #111', height:'4px', marginBottom:'14px' }} />
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', gap:'20px' }}>
        {/* Left: Prepared By + Notes */}
        <div style={{ flex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'14px', fontSize:'11px' }}>
            <span style={{ fontWeight:'600' }}>Prepared By :</span>
            <input value={meta.preparedBy} onChange={e => upMeta('preparedBy', e.target.value)}
              placeholder="____________"
              style={{ border:'none', borderBottom:'1px solid #444', outline:'none', width:'140px', fontSize:'11px', background:'transparent' }} />
          </div>
          <div style={{ color:'#333', lineHeight:'1.55', maxWidth:'380px', fontSize:'9.5px' }}>
            <span style={{ fontWeight:'700' }}>Notes: </span>
            Results of investigation depends upon test methods and instrument used.
            Interpretation may vary from lab to lab, our Pathology will not be assume
            any liability for any controversy in interpretation or report. Claims if
            any are subject to Jabalpur (M.P.) Jurisdiction.
          </div>
        </div>
        {/* Right: Signature + Dr. Name */}
        <div style={{ textAlign:'center', minWidth:'160px', flexShrink:0 }}>
          {signatureUrl ? (
            <img src={signatureUrl} alt="Signature"
              style={{ height:'52px', objectFit:'contain', display:'block', margin:'0 auto 2px' }} />
          ) : (
            <div style={{ height:'52px', display:'flex', alignItems:'flex-end', justifyContent:'center',
              fontFamily:'"Dancing Script", "Brush Script MT", cursive',
              fontSize:'22px', color:'#222', lineHeight:'1' }}>
              Khushboo.
            </div>
          )}
          <div style={{ borderTop:'1px solid #333', paddingTop:'4px', marginTop:'2px' }}>
            <div style={{ fontWeight:'900', fontSize:'12px', letterSpacing:'0.3px' }}>Dr. KHUSHBOO SHAH</div>
            <div style={{ color:'#444', fontSize:'10.5px' }}>(MD. Pathology)</div>
          </div>
        </div>
      </div>
    </div>
  );
});


/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════════════════════ */
export default function LabReportPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [state, dispatch]  = useReducer(reducer, null, () => {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2,'0');
    const mm = String(now.getMonth()+1).padStart(2,'0');
    const yyyy = now.getFullYear();
    return {
      ...initState,
      meta: {
        ...initState.meta,
        reportNo: `STP-${dd}${mm}${yyyy}-`,
        sampleTime: now.toTimeString().slice(0,5),
      },
    };
  });

  const [patients, setPatients]       = useState([]);
  const [patSearch, setPatSearch]     = useState('');
  const [selPatient, setSelPatient]   = useState(null);
  const [showPatDrop, setShowPatDrop] = useState(false);

  const [allTests, setAllTests]     = useState([]);
  const [testSearch, setTestSearch] = useState('');
  const [addingTest, setAddingTest] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [categories, setCategories] = useState([]);
  const [selCat, setSelCat]         = useState('All');

  // Clinic assets + settings
  const [assets, setAssets] = useState({ logo: null, signature: null, settings: {} });

  const loadAssets = useCallback(() => {
    api.get('/clinic/assets').then(r => {
      setAssets({ logo: r.data.logo, signature: r.data.signature, settings: r.data.settings || {} });
    }).catch(() => {});
  }, []);

  // Inject print CSS
  useEffect(() => {
    const el = document.createElement('style');
    el.id = 'lab-rpt-css';
    el.textContent = PRINT_CSS;
    document.head.appendChild(el);
    return () => document.getElementById('lab-rpt-css')?.remove();
  }, []);

  // Load clinic assets on mount
  useEffect(() => { loadAssets(); }, [loadAssets]);

  // Load tests
  useEffect(() => {
    api.get('/tests', { params: { limit: 300 } }).then(r => {
      const t = r.data?.data || [];
      setAllTests(t);
      const cats = ['All', ...new Set(t.map(x => x.category).filter(Boolean))];
      setCategories(cats);
    }).catch(() => {});
  }, []);

  // Patient search
  useEffect(() => {
    if (!patSearch || patSearch.length < 1) { setPatients([]); return; }
    const timer = setTimeout(() => {
      api.get('/patients', { params: { q: patSearch, limit: 8 } }).then(r => {
        setPatients(r.data?.data || []);
        setShowPatDrop(true);
      }).catch(() => {});
    }, 300);
    return () => clearTimeout(timer);
  }, [patSearch]);

  const selectPatient = useCallback((p) => {
    setSelPatient(p);
    setPatSearch(p.fullName);
    setShowPatDrop(false);
    dispatch({ type:'SET_META', payload:{ refDoctor: p.referringDoctor?.name || '' } });
  }, []);

  const addTest = useCallback(async (test) => {
    if (state.sections.find(s => s.testName === test.testName)) {
      toast.info('This test is already added'); return;
    }
    setAddingTest(test._id);
    try {
      const r = await api.get(`/tests/${test._id}/parameters`);
      const params = r.data?.data || [];
      const gender = selPatient?.gender || 'Male';
      const rows = params.length > 0
        ? params.map(p => ({ id: uid(), param: p.paramName, result:'', unit: p.unit||'', refRange: refFromParam(p, gender) }))
        : [{ id: uid(), param:'', result:'', unit:'', refRange:'' }];
      dispatch({ type:'ADD_SECTION', section: { id: uid(), testId: test._id, testName: test.testName, rows } });
      setTestSearch('');
    } catch { toast.error('Could not load test parameters'); }
    finally { setAddingTest(null); }
  }, [state.sections, selPatient]);

  const addCustomTest = useCallback(() => {
    const name = testSearch.trim();
    if (!name) { toast.info('Enter a test name first'); return; }
    dispatch({ type:'ADD_SECTION', section: { id: uid(), testId: null, testName: name, rows:[{ id:uid(), param:'', result:'', unit:'', refRange:'' }] } });
    setTestSearch('');
  }, [testSearch]);

  const saveReport = useCallback(async () => {
    if (!selPatient) { toast.error('Please select a patient'); return; }
    if (state.sections.length === 0) { toast.error('Add at least one test'); return; }
    setSaving(true);
    try {
      const payload = {
        patient: selPatient._id,
        reportNo: state.meta.reportNo,
        refDoctor: state.meta.refDoctor,
        sampleDate: state.meta.sampleDate,
        sampleTime: state.meta.sampleTime,
        sampleType: state.meta.sampleType,
        preparedBy: state.meta.preparedBy,
        sections: state.sections.map(s => ({
          testName: s.testName,
          rows: s.rows.map(r => ({ param: r.param, result: r.result, unit: r.unit, refRange: r.refRange })),
        })),
      };
      const res = await api.post('/saved-reports', payload);
      // Update reportNo with server-assigned serial number
      const serverNo = res.data?.data?.reportNo;
      if (serverNo) dispatch({ type:'SET_META', payload:{ reportNo: serverNo } });
      toast.success(`Report saved! No: ${serverNo || ''}`);
    } catch { toast.error('Could not save report'); }
    finally { setSaving(false); }
  }, [selPatient, state]);

  const handlePrint = useCallback(async (withHeader) => {
    if (!selPatient) { toast.error('Please select a patient'); return; }
    if (state.sections.length === 0) { toast.error('Add at least one test'); return; }
    dispatch({ type:'SET_HEADER', val: withHeader });
    // Save first
    await saveReport();
    setTimeout(() => window.print(), 200);
  }, [selPatient, state, saveReport]);

  const filteredTests = allTests.filter(t => {
    const matchCat = selCat === 'All' || t.category === selCat;
    const matchQ = !testSearch || t.testName.toLowerCase().includes(testSearch.toLowerCase()) || t.testCode.toLowerCase().includes(testSearch.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#f1f5f9', fontFamily:'Arial,sans-serif' }}>

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <div className="no-print" style={{ width:'270px', flexShrink:0, background:'white', borderRight:'1px solid #e2e8f0', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Back nav */}
        <div style={{ padding:'10px 12px', borderBottom:'1px solid #f1f5f9', display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/patients')}
            style={{ fontSize:'12px', color:'#64748b', background:'none', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'5px 10px', cursor:'pointer' }}>
            ← Patients
          </button>
          <button onClick={() => navigate('/report-history')}
            style={{ fontSize:'12px', color:'#64748b', background:'none', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'5px 10px', cursor:'pointer' }}>
            History
          </button>
          {user?.role === 'SUPER_ADMIN' && (
            <button onClick={() => navigate('/admin')}
              style={{ fontSize:'12px', color:'white', background:'#1e40af', border:'none', borderRadius:'8px', padding:'5px 10px', cursor:'pointer', fontWeight:'700' }}>
              🛡️ Admin Panel
            </button>
          )}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:'10px' }}>

          {/* Patient select */}
          <div>
            <div style={{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Patient</div>
            <div style={{ position:'relative' }}>
              <input value={patSearch} onChange={e => { setPatSearch(e.target.value); setShowPatDrop(true); }}
                placeholder="Search patient name..."
                style={{ width:'100%', padding:'7px 10px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'12px', outline:'none', boxSizing:'border-box' }} />
              {showPatDrop && patients.length > 0 && (
                <div style={{ position:'absolute', top:'100%', left:0, right:0, background:'white', border:'1px solid #d1d5db', borderRadius:'8px', boxShadow:'0 4px 12px rgba(0,0,0,0.1)', zIndex:999, maxHeight:'180px', overflowY:'auto' }}>
                  {patients.map(p => (
                    <div key={p._id} onClick={() => selectPatient(p)}
                      style={{ padding:'8px 12px', cursor:'pointer', fontSize:'12px', borderBottom:'1px solid #f1f5f9' }}
                      onMouseEnter={e => e.currentTarget.style.background='#eff6ff'}
                      onMouseLeave={e => e.currentTarget.style.background='white'}>
                      <div style={{ fontWeight:'600', color:'#1e40af' }}>{p.fullName}</div>
                      <div style={{ color:'#6b7280', fontSize:'10px' }}>{p.patientId} · {p.age}y · {p.gender}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {selPatient && (
              <div style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:'8px', padding:'8px 10px', marginTop:'5px', fontSize:'11px' }}>
                <div style={{ fontWeight:'700', color:'#1e40af' }}>{selPatient.fullName}</div>
                <div style={{ color:'#475569' }}>{selPatient.age}y · {selPatient.gender} · {selPatient.mobile}</div>
                <div style={{ color:'#6b7280' }}>{selPatient.patientId}</div>
              </div>
            )}
          </div>

          {/* Add test */}
          <div>
            <div style={{ fontSize:'11px', fontWeight:'700', color:'#374151', marginBottom:'5px', textTransform:'uppercase', letterSpacing:'0.5px' }}>Add Test</div>
            <input value={testSearch} onChange={e => setTestSearch(e.target.value)}
              placeholder="Search test name or code..."
              style={{ width:'100%', padding:'7px 10px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'12px', outline:'none', boxSizing:'border-box', marginBottom:'5px' }} />
            {/* Category filter */}
            <select value={selCat} onChange={e => setSelCat(e.target.value)}
              style={{ width:'100%', padding:'5px 8px', border:'1px solid #d1d5db', borderRadius:'8px', fontSize:'11px', outline:'none', background:'white', marginBottom:'6px', boxSizing:'border-box' }}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {/* Test list */}
            <div style={{ border:'1px solid #e5e7eb', borderRadius:'8px', maxHeight:'240px', overflowY:'auto' }}>
              {filteredTests.slice(0, 50).map(t => {
                const added = state.sections.some(s => s.testId === t._id);
                return (
                  <div key={t._id} onClick={() => !added && addTest(t)}
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 10px', borderBottom:'1px solid #f3f4f6', cursor: added?'default':'pointer', background: added?'#f0fdf4':'white' }}
                    onMouseEnter={e => !added && (e.currentTarget.style.background='#eff6ff')}
                    onMouseLeave={e => !added && (e.currentTarget.style.background='white')}>
                    <div style={{ fontSize:'11.5px', fontWeight:'500', color: added?'#16a34a':'#1e293b' }}>{t.testName}</div>
                    {addingTest === t._id
                      ? <div style={{ width:'12px', height:'12px', border:'2px solid #3b82f6', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.6s linear infinite' }} />
                      : added
                        ? <span style={{ color:'#16a34a', fontSize:'14px' }}>✓</span>
                        : <span style={{ color:'#3b82f6', fontSize:'18px', lineHeight:'1' }}>+</span>}
                  </div>
                );
              })}
              {filteredTests.length === 0 && (
                <div style={{ padding:'12px', textAlign:'center', fontSize:'11px', color:'#9ca3af' }}>No test found</div>
              )}
            </div>
            {/* Add custom test */}
            {testSearch.trim() && (
              <button onClick={addCustomTest}
                style={{ width:'100%', marginTop:'6px', padding:'7px', background:'#eff6ff', border:'1px dashed #3b82f6', borderRadius:'8px', fontSize:'11px', color:'#1d4ed8', cursor:'pointer', fontWeight:'600' }}>
                + Add "{testSearch.trim()}" as custom test
              </button>
            )}
          </div>
        </div>

        {/* ── Clinic Settings Note (Super Admin only) ───────── */}
        <div style={{ padding:'8px 12px', borderTop:'1px solid #f1f5f9' }}>
          <div style={{ fontSize:'10px', color:'#94a3b8', textAlign:'center', lineHeight:'1.4' }}>
            🔒 Logo, Signature &amp; Header settings<br/>can be changed by <b>Super Admin</b> only
          </div>
        </div>

        {/* Print/Save buttons */}
        <div style={{ padding:'10px 12px', borderTop:'1px solid #e5e7eb', display:'flex', flexDirection:'column', gap:'6px' }}>
          <button onClick={() => handlePrint(true)} disabled={!selPatient || state.sections.length === 0}
            style={{ padding:'10px', background: !selPatient||state.sections.length===0?'#cbd5e1':'#1e3a5f', color:'white', border:'none', borderRadius:'10px', fontWeight:'700', fontSize:'13px', cursor: !selPatient||state.sections.length===0?'not-allowed':'pointer' }}>
            🖨️ Print WITH Header
          </button>
          <button onClick={() => handlePrint(false)} disabled={!selPatient || state.sections.length === 0}
            style={{ padding:'10px', background: !selPatient||state.sections.length===0?'#cbd5e1':'#334155', color:'white', border:'none', borderRadius:'10px', fontWeight:'700', fontSize:'13px', cursor: !selPatient||state.sections.length===0?'not-allowed':'pointer' }}>
            📄 Print WITHOUT Header
          </button>
          <button onClick={saveReport} disabled={!selPatient || state.sections.length === 0 || saving}
            style={{ padding:'8px', background:'#f8fafc', color:'#1e3a5f', border:'1px solid #1e3a5f', borderRadius:'10px', fontWeight:'600', fontSize:'12px', cursor: !selPatient||state.sections.length===0?'not-allowed':'pointer' }}>
            {saving ? 'Saving...' : '💾 Save Report'}
          </button>
        </div>
      </div>

      {/* ── RIGHT: PRINTABLE REPORT ───────────────────────────────── */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px' }}>

        {/* Screen toolbar */}
        <div className="no-print" style={{ display:'flex', gap:'8px', alignItems:'center', marginBottom:'10px' }}>
          <label style={{ fontSize:'12px', fontWeight:'600', color:'#374151' }}>Preview:</label>
          {[true, false].map(h => (
            <button key={String(h)} onClick={() => dispatch({ type:'SET_HEADER', val:h })}
              style={{ padding:'4px 12px', borderRadius:'6px', border:'1px solid #d1d5db', background: state.showHeader===h?'#1e3a5f':'white', color: state.showHeader===h?'white':'#374151', fontSize:'12px', fontWeight:'600', cursor:'pointer' }}>
              {h ? 'With Header' : 'Without Header'}
            </button>
          ))}
          {state.sections.length > 0 && (
            <span style={{ fontSize:'11px', color:'#6b7280', marginLeft:'auto' }}>{state.sections.length} test(s) added</span>
          )}
        </div>

        {/* A4 Report — this div is what gets printed */}
        <div id="REPORT_PRINT_ROOT" style={{
          background:'white', minHeight:'297mm',
          boxShadow:'0 2px 16px rgba(0,0,0,0.12)', maxWidth:'800px',
          margin:'0 auto', fontFamily:'Arial, sans-serif', position:'relative'
        }}>

          {/* Watermark — use uploaded logo if available, else microscope SVG */}
          <div className="report-watermark" style={{
            position:'absolute', top:'50%', left:'50%',
            transform:'translate(-50%,-50%)',
            pointerEvents:'none', zIndex:0
          }}>
            {assets.logo
              ? <img
                  src={`http://localhost:5000${assets.logo}`}
                  alt="watermark"
                  style={{ width:'280px', height:'280px', objectFit:'contain', opacity:0.12, filter:'grayscale(100%)' }}
                />
              : <MicroscopeSVG size={280} color="#aaa" opacity={0.28} />
            }
          </div>

          {/* All report content above watermark — with padding for print */}
          <div style={{ position:'relative', zIndex:1, padding:'20px 28px' }}>

          {/* Header — passes settings */}
          {state.showHeader ? (
            <LabHeader logoUrl={assets.logo ? `http://localhost:5000${assets.logo}` : null} settings={assets.settings} />
          ) : (
            <div style={{ height:'6px', borderBottom:'2px solid #1e3a5f', marginBottom:'8px' }} />
          )}

          {/* Patient info */}
          {selPatient ? (
            <PatientInfoSection patient={selPatient} meta={state.meta} dispatch={dispatch} />
          ) : (
            <div className="no-print" style={{ textAlign:'center', padding:'16px', color:'#9ca3af', border:'2px dashed #e5e7eb', borderRadius:'8px', marginBottom:'10px', fontSize:'12px' }}>
              ← Select a patient from the left panel
            </div>
          )}

          {/* Tests */}
          {state.sections.length === 0 ? (
            <div className="no-print" style={{ textAlign:'center', padding:'48px 20px', color:'#9ca3af' }}>
              <div style={{ fontSize:'36px', marginBottom:'10px' }}>🔬</div>
              <div style={{ fontSize:'15px', fontWeight:'600', marginBottom:'4px' }}>No tests added yet</div>
              <div style={{ fontSize:'12px' }}>Search and add tests from the left panel</div>
            </div>
          ) : (
            state.sections.map(sec => (
              <TestSection key={sec.id} section={sec} gender={selPatient?.gender || 'Male'} dispatch={dispatch} />
            ))
          )}

          {/* Footer — only shown WITH header */}
          {state.showHeader && state.sections.length > 0 && (
            <ReportFooter meta={state.meta} dispatch={dispatch} signatureUrl={assets.signature ? `http://localhost:5000${assets.signature}` : null} />
          )}
          </div>{/* end zIndex:1 content wrapper */}
        </div>{/* end REPORT_PRINT_ROOT */}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
