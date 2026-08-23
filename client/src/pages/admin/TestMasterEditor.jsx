/**
 * Test Master Editor — Super Admin Only
 * Full CRUD for Tests and their Parameters (reference ranges, units, formulas, etc.)
 */
import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const RESULT_TYPES = ['numeric', 'text', 'calculated', 'subheader'];
const CATEGORIES = [
  'Haematology', 'Biochemistry', 'Microbiology', 'Serology / Immunology',
  'Hormones / Endocrinology', 'Urine Analysis', 'Stool Analysis',
  'Coagulation', 'Histopathology', 'Cytology', 'Radiology', 'General', 'Other'
];

const emptyTest = { testName: '', testCode: '', category: 'General', price: 0, sampleType: '', isActive: true };
const emptyParam = {
  paramName: '', paramCode: '', unit: '', textRange: '',
  resultType: 'numeric', formula: '',
  maleRange: { low: '', high: '' },
  femaleRange: { low: '', high: '' },
  childRange: { low: '', high: '' },
  isSubheader: false, displayOrder: 0, isActive: true,
};

export default function TestMasterEditor() {
  const [tests, setTests]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [page, setPage]             = useState(1);
  const [search, setSearch]         = useState('');
  const [catFilter, setCatFilter]   = useState('');
  const [loading, setLoading]       = useState(false);

  // Test form modal
  const [showTestModal, setShowTestModal]   = useState(false);
  const [editingTest, setEditingTest]       = useState(null);
  const [testForm, setTestForm]             = useState(emptyTest);
  const [savingTest, setSavingTest]         = useState(false);

  // Parameter editor panel
  const [selectedTest, setSelectedTest]   = useState(null);
  const [params, setParams]               = useState([]);
  const [loadingParams, setLoadingParams] = useState(false);
  const [editingParam, setEditingParam]   = useState(null);
  const [paramForm, setParamForm]         = useState(emptyParam);
  const [savingParam, setSavingParam]     = useState(false);
  const [showParamForm, setShowParamForm] = useState(false);

  const LIMIT = 20;

  const loadTests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.q = search;
      if (catFilter) params.category = catFilter;
      const r = await api.get('/tests', { params });
      setTests(r.data?.data || []);
      setTotal(r.data?.total || 0);
    } catch { toast.error('Failed to load tests'); }
    finally { setLoading(false); }
  }, [page, search, catFilter]);

  useEffect(() => { loadTests(); }, [loadTests]);

  const loadParams = useCallback(async (testId) => {
    setLoadingParams(true);
    try {
      const r = await api.get(`/tests/${testId}/parameters`);
      setParams(r.data?.data || []);
    } catch { toast.error('Failed to load parameters'); }
    finally { setLoadingParams(false); }
  }, []);

  const selectTest = (test) => {
    setSelectedTest(test);
    setEditingParam(null);
    setShowParamForm(false);
    loadParams(test._id);
  };

  // ── TEST CRUD ──────────────────────────────────────────────
  const openAddTest = () => {
    setEditingTest(null);
    setTestForm(emptyTest);
    setShowTestModal(true);
  };

  const openEditTest = (test) => {
    setEditingTest(test);
    setTestForm({
      testName: test.testName, testCode: test.testCode,
      category: test.category, price: test.price || 0,
      sampleType: test.sampleType || '', isActive: test.isActive !== false,
    });
    setShowTestModal(true);
  };

  const saveTest = async () => {
    if (!testForm.testName.trim()) { toast.error('Test name is required'); return; }
    setSavingTest(true);
    try {
      if (editingTest) {
        await api.put(`/tests/${editingTest._id}`, testForm);
        toast.success('Test updated');
      } else {
        const code = testForm.testCode.trim().toUpperCase() ||
          testForm.testName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
        await api.post('/tests', { ...testForm, testCode: code });
        toast.success('Test created');
      }
      setShowTestModal(false);
      loadTests();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save test'); }
    finally { setSavingTest(false); }
  };

  const toggleTestActive = async (test) => {
    try {
      await api.put(`/tests/${test._id}`, { isActive: !test.isActive });
      toast.success(test.isActive ? 'Test deactivated' : 'Test activated');
      loadTests();
      if (selectedTest?._id === test._id) setSelectedTest(t => ({ ...t, isActive: !t.isActive }));
    } catch { toast.error('Failed to toggle test'); }
  };

  // ── PARAMETER CRUD ──────────────────────────────────────────
  const openAddParam = () => {
    setEditingParam(null);
    setParamForm({ ...emptyParam, displayOrder: params.length + 1 });
    setShowParamForm(true);
  };

  const openEditParam = (p) => {
    setEditingParam(p);
    setParamForm({
      paramName: p.paramName || '', paramCode: p.paramCode || '',
      unit: p.unit || '', textRange: p.textRange || '',
      resultType: p.resultType || 'numeric', formula: p.formula || '',
      maleRange: { low: p.maleRange?.low ?? '', high: p.maleRange?.high ?? '' },
      femaleRange: { low: p.femaleRange?.low ?? '', high: p.femaleRange?.high ?? '' },
      childRange: { low: p.childRange?.low ?? '', high: p.childRange?.high ?? '' },
      isSubheader: p.isSubheader || false,
      displayOrder: p.displayOrder || 0,
      isActive: p.isActive !== false,
    });
    setShowParamForm(true);
  };

  const saveParam = async () => {
    if (!paramForm.paramName.trim()) { toast.error('Parameter name is required'); return; }
    setSavingParam(true);
    try {
      const payload = {
        ...paramForm,
        paramCode: paramForm.paramCode.trim().toUpperCase() ||
          paramForm.paramName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10),
        maleRange: {
          low: paramForm.maleRange.low !== '' ? Number(paramForm.maleRange.low) : undefined,
          high: paramForm.maleRange.high !== '' ? Number(paramForm.maleRange.high) : undefined,
        },
        femaleRange: {
          low: paramForm.femaleRange.low !== '' ? Number(paramForm.femaleRange.low) : undefined,
          high: paramForm.femaleRange.high !== '' ? Number(paramForm.femaleRange.high) : undefined,
        },
        childRange: {
          low: paramForm.childRange.low !== '' ? Number(paramForm.childRange.low) : undefined,
          high: paramForm.childRange.high !== '' ? Number(paramForm.childRange.high) : undefined,
        },
      };
      if (editingParam) {
        await api.put(`/tests/${selectedTest._id}/parameters/${editingParam._id}`, payload);
        toast.success('Parameter updated');
      } else {
        await api.post(`/tests/${selectedTest._id}/parameters`, payload);
        toast.success('Parameter added');
      }
      setShowParamForm(false);
      loadParams(selectedTest._id);
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to save parameter'); }
    finally { setSavingParam(false); }
  };

  const deleteParam = async (paramId, paramName) => {
    if (!window.confirm(`Delete parameter "${paramName}"?`)) return;
    try {
      await api.delete(`/tests/${selectedTest._id}/parameters/${paramId}`);
      toast.success('Parameter deleted');
      loadParams(selectedTest._id);
    } catch { toast.error('Failed to delete parameter'); }
  };

  const upParam = (field, val) => setParamForm(f => ({ ...f, [field]: val }));
  const upRange = (rangeKey, subKey, val) =>
    setParamForm(f => ({ ...f, [rangeKey]: { ...f[rangeKey], [subKey]: val } }));

  return (
    <div style={{ display: 'flex', gap: '16px', height: '100%', minHeight: '70vh' }}>

      {/* ── LEFT: Test List ─────────────────────────── */}
      <div style={{ width: '340px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {/* Search + Add */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tests..."
            style={{ flex: 1, padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
          />
          <button
            onClick={openAddTest}
            style={{ padding: '7px 12px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
          >
            + New Test
          </button>
        </div>

        {/* Category filter */}
        <select
          value={catFilter}
          onChange={e => { setCatFilter(e.target.value); setPage(1); }}
          style={{ padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', outline: 'none' }}
        >
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        {/* Test list */}
        <div style={{ flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px', background: 'white' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Loading...</div>
          ) : tests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '12px' }}>No tests found</div>
          ) : (
            tests.map(t => (
              <div
                key={t._id}
                onClick={() => selectTest(t)}
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid #f1f5f9',
                  cursor: 'pointer',
                  background: selectedTest?._id === t._id ? '#eff6ff' : 'white',
                  transition: 'background 0.1s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '12px', color: t.isActive ? '#1e293b' : '#94a3b8' }}>
                      {t.testName}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      {t.testCode} · {t.category} · {t.parameterCount || 0} params
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                    <button
                      onClick={e => { e.stopPropagation(); openEditTest(t); }}
                      style={{ fontSize: '10px', padding: '2px 6px', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '4px', cursor: 'pointer', color: '#475569' }}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); toggleTestActive(t); }}
                      style={{ fontSize: '10px', padding: '2px 6px', background: t.isActive ? '#dcfce7' : '#fee2e2', border: 'none', borderRadius: '4px', cursor: 'pointer', color: t.isActive ? '#16a34a' : '#dc2626' }}
                    >
                      {t.isActive ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {total > LIMIT && (
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', background: 'white' }}>
              ← Prev
            </button>
            <span style={{ fontSize: '11px', color: '#64748b', padding: '4px 0' }}>
              Page {page} / {Math.ceil(total / LIMIT)}
            </span>
            <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / LIMIT)}
              style={{ padding: '4px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', background: 'white' }}>
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── RIGHT: Parameter Editor ──────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!selectedTest ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', flexDirection: 'column', gap: '8px', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
            <div style={{ fontSize: '32px' }}>🔬</div>
            <div style={{ fontSize: '13px', fontWeight: '600' }}>Select a test to edit its parameters</div>
          </div>
        ) : (
          <>
            {/* Selected test header */}
            <div style={{ background: '#1e3a5f', color: 'white', borderRadius: '10px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '14px' }}>{selectedTest.testName}</div>
                <div style={{ fontSize: '11px', opacity: 0.75, marginTop: '2px' }}>
                  {selectedTest.testCode} · {selectedTest.category} · ₹{selectedTest.price}
                </div>
              </div>
              <button
                onClick={openAddParam}
                style={{ padding: '6px 14px', background: 'white', color: '#1e3a5f', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}
              >
                + Add Parameter
              </button>
            </div>

            {/* Parameter Form */}
            {showParamForm && (
              <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px' }}>
                <div style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b', marginBottom: '12px' }}>
                  {editingParam ? `Edit: ${editingParam.paramName}` : 'Add New Parameter'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  {/* Name */}
                  <div style={{ gridColumn: '1 / 3' }}>
                    <label style={labelSt}>Parameter Name *</label>
                    <input value={paramForm.paramName} onChange={e => upParam('paramName', e.target.value)}
                      placeholder="e.g. Hemoglobin" style={inputSt} />
                  </div>
                  {/* Code */}
                  <div>
                    <label style={labelSt}>Param Code</label>
                    <input value={paramForm.paramCode} onChange={e => upParam('paramCode', e.target.value.toUpperCase())}
                      placeholder="e.g. HB" style={inputSt} />
                  </div>
                  {/* Result Type */}
                  <div>
                    <label style={labelSt}>Result Type</label>
                    <select value={paramForm.resultType} onChange={e => upParam('resultType', e.target.value)} style={inputSt}>
                      {RESULT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  {/* Unit */}
                  <div>
                    <label style={labelSt}>Unit</label>
                    <input value={paramForm.unit} onChange={e => upParam('unit', e.target.value)}
                      placeholder="e.g. g/dL" style={inputSt} />
                  </div>
                  {/* Display Order */}
                  <div>
                    <label style={labelSt}>Display Order</label>
                    <input type="number" value={paramForm.displayOrder} onChange={e => upParam('displayOrder', Number(e.target.value))}
                      style={inputSt} />
                  </div>
                  {/* Text/Qualitative Range */}
                  <div style={{ gridColumn: '1 / 4' }}>
                    <label style={labelSt}>Reference Range / Expected Value (text, e.g. "12 - 15" or "Negative")</label>
                    <input value={paramForm.textRange} onChange={e => upParam('textRange', e.target.value)}
                      placeholder="e.g. 13.5 - 17.5 or Negative" style={inputSt} />
                  </div>
                  {/* Gender ranges */}
                  <div style={{ gridColumn: '1 / 4', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                    {[
                      { key: 'maleRange', label: 'Male Range (Low – High)' },
                      { key: 'femaleRange', label: 'Female Range (Low – High)' },
                      { key: 'childRange', label: 'Child Range (Low – High)' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label style={labelSt}>{label}</label>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <input type="number" value={paramForm[key].low} onChange={e => upRange(key, 'low', e.target.value)}
                            placeholder="Low" style={{ ...inputSt, flex: 1 }} />
                          <span style={{ padding: '0 4px', lineHeight: '32px', fontSize: '11px', color: '#64748b' }}>–</span>
                          <input type="number" value={paramForm[key].high} onChange={e => upRange(key, 'high', e.target.value)}
                            placeholder="High" style={{ ...inputSt, flex: 1 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Formula */}
                  <div style={{ gridColumn: '1 / 3' }}>
                    <label style={labelSt}>Formula (for calculated params, e.g. "TBIL - DBIL")</label>
                    <input value={paramForm.formula} onChange={e => upParam('formula', e.target.value)}
                      placeholder="e.g. TBIL - DBIL" style={inputSt} />
                  </div>
                  {/* Flags */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'flex-end' }}>
                    <label style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', color: '#374151', cursor: 'pointer' }}>
                      <input type="checkbox" checked={paramForm.isSubheader} onChange={e => upParam('isSubheader', e.target.checked)} />
                      Is Subheader / Heading
                    </label>
                    <label style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', color: '#374151', cursor: 'pointer' }}>
                      <input type="checkbox" checked={paramForm.isActive} onChange={e => upParam('isActive', e.target.checked)} />
                      Is Active
                    </label>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button onClick={saveParam} disabled={savingParam}
                    style={{ padding: '7px 20px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer' }}>
                    {savingParam ? 'Saving...' : (editingParam ? 'Update Parameter' : 'Add Parameter')}
                  </button>
                  <button onClick={() => setShowParamForm(false)}
                    style={{ padding: '7px 14px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Parameters Table */}
            <div style={{ flex: 1, overflowY: 'auto', background: 'white', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              {loadingParams ? (
                <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>Loading parameters...</div>
              ) : params.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8' }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📋</div>
                  <div style={{ fontSize: '12px' }}>No parameters yet. Click "+ Add Parameter" to start.</div>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {['#', 'Parameter Name', 'Code', 'Type', 'Unit', 'Reference Range', 'Male', 'Female', 'Formula', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {params.map((p, i) => (
                      <tr key={p._id} style={{ borderBottom: '1px solid #f1f5f9', background: p.isSubheader ? '#fafafa' : (i % 2 === 0 ? 'white' : '#fafcff') }}>
                        <td style={{ padding: '7px 10px', color: '#94a3b8' }}>{i + 1}</td>
                        <td style={{ padding: '7px 10px', fontWeight: p.isSubheader ? '800' : '500', color: p.isActive ? '#1e293b' : '#94a3b8' }}>
                          {p.isSubheader && <span style={{ fontSize: '9px', background: '#dbeafe', color: '#1d4ed8', padding: '1px 4px', borderRadius: '3px', marginRight: '4px' }}>HEADER</span>}
                          {p.paramName}
                        </td>
                        <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'monospace', fontSize: '11px' }}>{p.paramCode}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: p.resultType === 'calculated' ? '#fef9c3' : p.resultType === 'text' ? '#f0fdf4' : '#f0f9ff', color: '#374151' }}>
                            {p.resultType}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px', color: '#64748b' }}>{p.unit || '—'}</td>
                        <td style={{ padding: '7px 10px', color: '#64748b' }}>{p.textRange || '—'}</td>
                        <td style={{ padding: '7px 10px', color: '#64748b', fontSize: '11px' }}>
                          {p.maleRange?.low != null && p.maleRange?.high != null ? `${p.maleRange.low}–${p.maleRange.high}` : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', color: '#64748b', fontSize: '11px' }}>
                          {p.femaleRange?.low != null && p.femaleRange?.high != null ? `${p.femaleRange.low}–${p.femaleRange.high}` : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', color: '#64748b', fontFamily: 'monospace', fontSize: '10px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.formula || '—'}
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => openEditParam(p)}
                              style={{ padding: '3px 8px', background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>
                              Edit
                            </button>
                            <button onClick={() => deleteParam(p._id, p.paramName)}
                              style={{ padding: '3px 8px', background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>
                              Del
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Test Form Modal ──────────────────────────── */}
      {showTestModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: '14px', padding: '24px', width: '480px', maxWidth: '90vw', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 18px', fontSize: '15px', fontWeight: '800', color: '#1e293b' }}>
              {editingTest ? 'Edit Test' : 'Add New Test'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ gridColumn: '1 / 3' }}>
                <label style={labelSt}>Test Name *</label>
                <input value={testForm.testName} onChange={e => setTestForm(f => ({ ...f, testName: e.target.value }))}
                  placeholder="e.g. Complete Blood Count" style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Test Code</label>
                <input value={testForm.testCode} onChange={e => setTestForm(f => ({ ...f, testCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g. CBC" style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Price (₹)</label>
                <input type="number" value={testForm.price} onChange={e => setTestForm(f => ({ ...f, price: Number(e.target.value) }))}
                  style={inputSt} />
              </div>
              <div>
                <label style={labelSt}>Category *</label>
                <select value={testForm.category} onChange={e => setTestForm(f => ({ ...f, category: e.target.value }))} style={inputSt}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={labelSt}>Sample Type</label>
                <input value={testForm.sampleType} onChange={e => setTestForm(f => ({ ...f, sampleType: e.target.value }))}
                  placeholder="e.g. Blood" style={inputSt} />
              </div>
              <div style={{ gridColumn: '1 / 3' }}>
                <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#374151', cursor: 'pointer' }}>
                  <input type="checkbox" checked={testForm.isActive} onChange={e => setTestForm(f => ({ ...f, isActive: e.target.checked }))} />
                  Test is Active (visible in report builder)
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={saveTest} disabled={savingTest}
                style={{ flex: 1, padding: '10px', background: '#1e3a5f', color: 'white', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                {savingTest ? 'Saving...' : (editingTest ? 'Update Test' : 'Create Test')}
              </button>
              <button onClick={() => setShowTestModal(false)}
                style={{ padding: '10px 18px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelSt = { display: 'block', fontSize: '10.5px', fontWeight: '600', color: '#475569', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.3px' };
const inputSt = { width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '12px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
