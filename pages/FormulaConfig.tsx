
import React, { useState, useEffect } from 'react';
import axiosInstance from '../helpers/axios';

interface ApiResponse {
  data: {
    dynamic_variables: Record<string, string>;
    formulas: Array<{
      name: string;
      required_params: string[];
      value: string;
    }>;
    parameters: Record<string, string>;
  };
  message: string;
  success: boolean;
}

interface ConfirmItem {
  label: string;
  paramKey: string;
  oldValue: string;
  newValue: string;
  description: string;
}

interface ConfirmModal {
  open: boolean;
  type: 'role' | 'ticket' | 'formula';
  items: ConfirmItem[];
}

const FormulaConfig: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formulaSaving, setFormulaSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingFormulaSave, setPendingFormulaSave] = useState<{ formulaName: string; newValue: string } | null>(null);
  
  const [formulas, setFormulas] = useState<Array<{
    name: string;
    value: string;
  }>>([]);
  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState(0);
  const [formula, setFormula] = useState("");
  
  const [variables, setVariables] = useState<Array<{ name: string; description?: string }>>([]);
  const [parameters, setParameters] = useState<Array<{ name: string; value: string }>>([]);
  
  const [roleWeights, setRoleWeights] = useState<Record<string, number>>({});
  const [ticketTypeWeights, setTicketTypeWeights] = useState<Record<string, number>>({});

  const [roleEditMode, setRoleEditMode] = useState(false);
  const [roleEditValues, setRoleEditValues] = useState<Record<string, string>>({});
  const [roleOriginalValues, setRoleOriginalValues] = useState<Record<string, string>>({});
  const [ticketEditMode, setTicketEditMode] = useState(false);
  const [ticketEditValues, setTicketEditValues] = useState<Record<string, string>>({});
  const [ticketOriginalValues, setTicketOriginalValues] = useState<Record<string, string>>({});

  const [confirmModal, setConfirmModal] = useState<ConfirmModal>({
    open: false,
    type: 'role',
    items: [],
  });

  const roles = [
    { id: 'ba', title: 'BA', paramKey: 'BA_ROLE_WEIGHT' },
    { id: 'iqa', title: 'QA (TVF)', paramKey: 'IQA_ROLE_WEIGHT' },
    { id: 'eqa', title: 'QA', paramKey: 'EQA_ROLE_WEIGHT' },
    { id: 'dev', title: 'DEV', paramKey: 'DEV_ROLE_WEIGHT' },
    { id: 'reviewer', title: 'REVIEWER', paramKey: 'REVIEWER_ROLE_WEIGHT' },
  ];

  const ticketTypes = [
    { id: 'task', label: 'Task', paramKey: 'TASK_WEIGHT' },
    { id: 'bug', label: 'Bug', paramKey: 'BUG_WEIGHT' },
    { id: 'story', label: 'Story', paramKey: null },
    { id: 'epic', label: 'Epic', paramKey: null },
    { id: 'subtask', label: 'Sub-task', paramKey: null },
  ];

  useEffect(() => {
    if (!selectedMonth) return;
    const fetchFormulas = async () => {
      try {
        setLoading(true);
        setError(null);
        // Reset previous data
        setFormulas([]);
        setFormula('');
        setVariables([]);
        setParameters([]);
        setRoleWeights({});
        setTicketTypeWeights({});
        setRoleEditMode(false);
        setTicketEditMode(false);
        const response = await axiosInstance.get<ApiResponse>(`/formulas?month=${selectedMonth}`);
        const data = response.data.data;

        // Process variables
        const vars = Object.entries(data.dynamic_variables).map(([name, description]) => ({
          name,
          description
        }));
        setVariables(vars);

        // Process parameters
        const params = Object.entries(data.parameters).map(([name, value]) => ({
          name,
          value
        }));
        setParameters(params);

        // Process formulas
        const formulasData = data.formulas.map(f => ({
          name: f.name,
          value: f.value
        }));
        setFormulas(formulasData);
        if (formulasData.length > 0) {
          setFormula(formulasData[0].value);
        }

        // Process role weights
        const roleWeightsData: Record<string, number> = {};
        roles.forEach(role => {
          if (role.paramKey && data.parameters[role.paramKey]) {
            roleWeightsData[role.id] = parseFloat(data.parameters[role.paramKey]);
          }
        });
        setRoleWeights(roleWeightsData);

        // Process ticket type weights
        const ticketWeightsData: Record<string, number> = {};
        ticketTypes.forEach(type => {
          if (type.paramKey && data.parameters[type.paramKey]) {
            ticketWeightsData[type.id] = parseFloat(data.parameters[type.paramKey]);
          }
        });
        setTicketTypeWeights(ticketWeightsData);

        setError(null);
      } catch (err) {
        console.error('Error fetching formulas:', err);
        setError('Failed to load formula configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchFormulas();
  }, [selectedMonth]);

  const handleFormulaSelect = (index: number) => {
    setSelectedFormulaIndex(index);
    if (formulas[index]) {
      setFormula(formulas[index].value);
    }
  };

  const handleFormulaSave = () => {
    const currentFormula = formulas[selectedFormulaIndex];
    if (!currentFormula || formula === currentFormula.value) return;
    setPendingFormulaSave({ formulaName: currentFormula.name, newValue: formula });
    setConfirmModal({
      open: true,
      type: 'formula',
      items: [{
        label: currentFormula.name,
        paramKey: currentFormula.name,
        oldValue: currentFormula.value,
        newValue: formula,
        description: `${currentFormula.name} formula for ${MONTHS.find(m => m.value === selectedMonth)?.label ?? selectedMonth}`,
      }],
    });
  };

  const handleRoleEditStart = () => {
    const vals = Object.entries(roleWeights).reduce((acc, [key, value]) => {
      acc[key] = value.toString();
      return acc;
    }, {} as Record<string, string>);
    setRoleEditValues(vals);
    setRoleOriginalValues(vals);
    setRoleEditMode(true);
  };

  const handleRoleEditSave = async () => {
    let valid = true;
    for (const value of Object.values(roleEditValues)) {
      const num = parseFloat(value as string);
      if (isNaN(num) || num < 0 || num > 1) { valid = false; break; }
    }

    if (!valid) return;

    // Find only changed items (compare as numbers to avoid float string mismatch)
    const changedItems: ConfirmItem[] = roles
      .filter(role =>
        role.paramKey &&
        roleEditValues[role.id] !== undefined &&
        parseFloat(roleEditValues[role.id] || '0') !== parseFloat(roleOriginalValues[role.id] || '0')
      )
      .map(role => ({
        label: role.title,
        paramKey: role.paramKey!,
        oldValue: roleOriginalValues[role.id] ?? '-',
        newValue: roleEditValues[role.id],
        description: `${role.title} role weight for ${MONTHS.find(m => m.value === selectedMonth)?.label ?? selectedMonth}`,
      }));

    if (changedItems.length === 0) {
      setRoleEditMode(false);
      return;
    }

    setConfirmModal({ open: true, type: 'role', items: changedItems });
  };

  const handleTicketEditStart = () => {
    const vals = ticketTypes.reduce((acc, type) => {
      if (type.paramKey && ticketTypeWeights[type.id] !== undefined) {
        acc[type.id] = ticketTypeWeights[type.id].toString();
      }
      return acc;
    }, {} as Record<string, string>);
    setTicketEditValues(vals);
    setTicketOriginalValues(vals);
    setTicketEditMode(true);
  };

  const handleTicketEditSave = async () => {
    let valid = true;
    for (const type of ticketTypes) {
      if (!type.paramKey) continue; // skip types without paramKey
      const value = ticketEditValues[type.id];
      if (value === undefined) continue;
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) { valid = false; break; }
    }

    if (!valid) return;

    // Find only changed items (compare as numbers to avoid float string mismatch)
    const changedItems: ConfirmItem[] = ticketTypes
      .filter(type =>
        type.paramKey &&
        ticketEditValues[type.id] !== undefined &&
        parseFloat(ticketEditValues[type.id] || '0') !== parseFloat(ticketOriginalValues[type.id] || '0')
      )
      .map(type => ({
        label: type.label,
        paramKey: type.paramKey!,
        oldValue: ticketOriginalValues[type.id] ?? '-',
        newValue: ticketEditValues[type.id],
        description: `${type.label} ticket type weight for ${MONTHS.find(m => m.value === selectedMonth)?.label ?? selectedMonth}`,
      }));

    if (changedItems.length === 0) {
      setTicketEditMode(false);
      return;
    }

    setConfirmModal({ open: true, type: 'ticket', items: changedItems });
  };

  const handleConfirmedSave = async () => {
    const { type, items } = confirmModal;
    setSaving(true);
    try {
      await axiosInstance.post('/formulas/params', {
        params: items.map(item => ({
          param_key: item.paramKey,
          param_value: item.newValue,
          description: item.description,
        })),
        month: parseInt(selectedMonth, 10),
      });
      if (type === 'role') {
        // Only patch the changed keys in state
        setRoleWeights(prev => {
          const updated = { ...prev };
          items.forEach(item => {
            const role = roles.find(r => r.paramKey === item.paramKey);
            if (role) updated[role.id] = parseFloat(item.newValue);
          });
          return updated;
        });
        setRoleEditMode(false);
      } else if (type === 'ticket') {
        // Only patch the changed keys in state
        setTicketTypeWeights(prev => {
          const updated = { ...prev };
          items.forEach(item => {
            const tt = ticketTypes.find(t => t.paramKey === item.paramKey);
            if (tt) updated[tt.id] = parseFloat(item.newValue);
          });
          return updated;
        });
        setTicketEditMode(false);
      } else if (type === 'formula') {
        // Update formulas
        setFormulas(prev => prev.map((f, i) => i === selectedFormulaIndex ? { ...f, value: items[0].newValue } : f));
        setFormula(items[0].newValue);
      }
      setConfirmModal(prev => ({ ...prev, open: false }));
      setPendingFormulaSave(null);
    } catch (err) {
      console.error('Failed to save:', err);
      setError('Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const MONTHS = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Formula Configuration</h1>
          <p className="text-gray-500">Configure KPI calculation formulas and weights for different roles and ticket types</p>
        </div>

        {/* Month Selector */}
        <div className="mb-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">calendar_month</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Select Month</p>
              <p className="text-xs text-blue-600">Required to load configuration</p>
            </div>
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full sm:w-56 px-4 py-2.5 border-2 border-blue-300 rounded-xl bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="" disabled>-- Choose a month --</option>
              {MONTHS.map(m => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          {selectedMonth && (
            <span className="text-xs font-medium text-blue-700 bg-blue-100 px-3 py-1.5 rounded-full shrink-0">
              Showing: {MONTHS.find(m => m.value === selectedMonth)?.label}
            </span>
          )}
        </div>

        {/* Prompt to select month */}
        {!selectedMonth && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-gray-400 text-[40px]">calendar_month</span>
            </div>
            <p className="text-gray-500 text-base font-medium">Please select a month above to load the configuration.</p>
          </div>
        )}

        {/* Loading State */}
        {selectedMonth && loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading formula configuration...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {selectedMonth && error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        {selectedMonth && !loading && !error && (
          <>
            {/* Formula Builder */}
            <div className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="inline-block w-1 h-6 bg-blue-600 rounded-full"></span>
                  Expression Editor
                </h2>
                <button
                  onClick={handleFormulaSave}
                  disabled={formulaSaving || formula === formulas[selectedFormulaIndex]?.value}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
                >
                  {formulaSaving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Save
                </button>
              </div>
              
              {/* Formula Editor */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-900 mb-2">Select Formula</label>
                  <select
                    value={selectedFormulaIndex}
                    onChange={(e) => handleFormulaSelect(parseInt(e.target.value))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {formulas.map((f, idx) => (
                      <option key={idx} value={idx}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea 
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="w-full h-32 p-4 font-mono text-sm text-gray-900 bg-white rounded-lg border border-gray-300 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  placeholder="Enter formula..."
                />
                
                {/* Quick Select Operators */}
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-xs font-medium text-gray-700">Quick Select:</span>
                  {['(', ')', '+', '-', '*', '/'].map((op, idx) => (
                    <button
                      key={idx}
                      onClick={() => setFormula(f => `${f}${op}`)}
                      className="px-3 py-1.5 text-sm font-medium bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                    >
                      {op}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parameters and Variables Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Parameters */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Parameters (Click to insert)</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {parameters.map((p, i) => (
                      <div 
                        key={i} 
                        onClick={() => setFormula(f => `${f}${p.name}`)}
                        className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <p className="text-xs font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-600 mt-0.5">Value: {p.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Variables Reference */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-sm mb-4">Variables Reference (Click to insert)</h3>
                  
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {variables.map((v, i) => (
                      <div 
                        key={i} 
                        onClick={() => setFormula(f => `${f}${v.name}`)}
                        className="bg-white p-2 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <p className="text-xs font-semibold text-gray-900">{v.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{v.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Role Weighting */}
            <div className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="inline-block w-1 h-6 bg-blue-600 rounded-full"></span>
                  Role Weighting
                </h2>
                {!roleEditMode ? (
                  <button
                    onClick={handleRoleEditStart}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleRoleEditSave}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setRoleEditMode(false)}
                      className="px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-white">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.map((role, idx) => (
                      <tr key={role.id} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{role.title}</td>
                        <td className="px-6 py-4">
                          {roleEditMode ? (
                            <input 
                              type="number" 
                              min="0" 
                              max="1" 
                              step="0.01"
                              value={roleEditValues[role.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '-') {
                                  setRoleEditValues(prev => ({ ...prev, [role.id]: val }));
                                  return;
                                }
                                const num = parseFloat(val);
                                if (!isNaN(num)) {
                                  setRoleEditValues(prev => ({ ...prev, [role.id]: String(Math.min(1, Math.max(0, num))) }));
                                }
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-gray-900">{(roleWeights[role.id] || 0).toFixed(1)}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ticket Type Weighting */}
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="inline-block w-1 h-6 bg-blue-600 rounded-full"></span>
                  Ticket Type Weighting
                </h2>
                {!ticketEditMode ? (
                  <button
                    onClick={handleTicketEditStart}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={handleTicketEditSave}
                      className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setTicketEditMode(false)}
                      className="px-4 py-2 text-sm font-medium bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-white">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Ticket Type</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ticketTypes.map((type, idx) => (
                      <tr key={type.id} className={`border-b border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{type.label}</td>
                        <td className="px-6 py-4">
                          {ticketEditMode ? (
                            type.paramKey ? (
                            <input 
                              type="number" 
                              min="0" 
                              step="0.1"
                              value={ticketEditValues[type.id] || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === '' || val === '-') {
                                  setTicketEditValues(prev => ({ ...prev, [type.id]: val }));
                                  return;
                                }
                                const num = parseFloat(val);
                                if (!isNaN(num) && num >= 0) {
                                  setTicketEditValues(prev => ({ ...prev, [type.id]: val }));
                                }
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )
                          ) : (
                            <span className="text-sm font-semibold text-gray-900">{ticketTypeWeights[type.id] != null ? ticketTypeWeights[type.id].toFixed(1) : '-'}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirm Save Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !saving && setConfirmModal(prev => ({ ...prev, open: false }))} />
          <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-5 border-b border-gray-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-amber-600 text-[20px]">edit_note</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">Confirm Changes</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {confirmModal.items.length} item{confirmModal.items.length > 1 ? 's' : ''} will be updated
                </p>
              </div>
            </div>

            {/* Changed Items */}
            <div className="px-6 py-4">
              {confirmModal.type === 'formula' ? (
                <div className="space-y-4">
                  {confirmModal.items.map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <p className="text-sm font-semibold text-gray-900 mb-3">{item.label}</p>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">Old Value:</p>
                          <div className="bg-white border border-gray-200 rounded p-2 text-xs text-gray-700 max-h-24 overflow-y-auto font-mono whitespace-pre-wrap break-words">
                            {item.oldValue || '-'}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1">New Value:</p>
                          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-900 max-h-24 overflow-y-auto font-mono whitespace-pre-wrap break-words">
                            {item.newValue}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-gray-200">
                      <th className="pb-2 font-semibold text-gray-600">Name</th>
                      <th className="pb-2 font-semibold text-gray-600 text-center">Old</th>
                      <th className="pb-2 font-semibold text-gray-600 text-center">New</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmModal.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-100 last:border-0">
                        <td className="py-3 font-medium text-gray-800">{item.label}</td>
                        <td className="py-3 text-center text-gray-500">{item.oldValue}</td>
                        <td className="py-3 text-center">
                          <span className="font-semibold text-blue-600">{item.newValue}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setConfirmModal(prev => ({ ...prev, open: false }))}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSave}
                disabled={saving}
                className="px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {saving && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                {saving ? 'Saving...' : 'Confirm Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulaConfig;
