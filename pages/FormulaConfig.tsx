
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

const FormulaConfig: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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
  const [ticketEditMode, setTicketEditMode] = useState(false);
  const [ticketEditValues, setTicketEditValues] = useState<Record<string, string>>({});

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
    const fetchFormulas = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get<ApiResponse>('/formulas');
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
  }, []);

  const handleFormulaSelect = (index: number) => {
    setSelectedFormulaIndex(index);
    if (formulas[index]) {
      setFormula(formulas[index].value);
    }
  };

  const handleRoleEditStart = () => {
    setRoleEditValues(
      Object.entries(roleWeights).reduce((acc, [key, value]) => {
        acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    );
    setRoleEditMode(true);
  };

  const handleRoleEditSave = () => {
    const newRoleWeights: Record<string, number> = {};
    let valid = true;

    for (const [key, value] of Object.entries(roleEditValues)) {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 1) {
        valid = false;
        break;
      }
      newRoleWeights[key] = num;
    }

    if (valid) {
      setRoleWeights(newRoleWeights);
      setRoleEditMode(false);
    }
  };

  const handleTicketEditStart = () => {
    setTicketEditValues(
      Object.entries(ticketTypeWeights).reduce((acc, [key, value]) => {
        acc[key] = value.toString();
        return acc;
      }, {} as Record<string, string>)
    );
    setTicketEditMode(true);
  };

  const handleTicketEditSave = () => {
    const newTicketWeights: Record<string, number> = {};
    let valid = true;

    for (const [key, value] of Object.entries(ticketEditValues)) {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0) {
        valid = false;
        break;
      }
      newTicketWeights[key] = num;
    }

    if (valid) {
      setTicketTypeWeights(newTicketWeights);
      setTicketEditMode(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Formula Configuration</h1>
          <p className="text-gray-500">Configure KPI calculation formulas and weights for different roles and ticket types</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading formula configuration...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Formula Builder */}
            <div className="mb-12">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="inline-block w-1 h-6 bg-blue-600 rounded-full"></span>
                  Expression Editor
                </h2>
                <button
                  onClick={() => {}}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
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
                    onClick={() => {
                      setRoleEditValues(
                        Object.entries(roleWeights).reduce((acc, [key, value]) => {
                          acc[key] = value.toString();
                          return acc;
                        }, {} as Record<string, string>)
                      );
                      setRoleEditMode(true);
                    }}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newRoleWeights: Record<string, number> = {};
                        let valid = true;

                        for (const [key, value] of Object.entries(roleEditValues)) {
                          const num = parseFloat(value);
                          if (isNaN(num) || num < 0 || num > 1) {
                            valid = false;
                            break;
                          }
                          newRoleWeights[key] = num;
                        }

                        if (valid) {
                          setRoleWeights(newRoleWeights);
                          setRoleEditMode(false);
                        }
                      }}
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
                              onChange={(e) => setRoleEditValues(prev => ({ ...prev, [role.id]: e.target.value }))}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-gray-900">{(roleWeights[role.id] || 0).toFixed(2)}</span>
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
                    onClick={() => {
                      setTicketEditValues(
                        Object.entries(ticketTypeWeights).reduce((acc, [key, value]) => {
                          acc[key] = value.toString();
                          return acc;
                        }, {} as Record<string, string>)
                      );
                      setTicketEditMode(true);
                    }}
                    className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const newTicketWeights: Record<string, number> = {};
                        let valid = true;

                        for (const [key, value] of Object.entries(ticketEditValues)) {
                          const num = parseFloat(value);
                          if (isNaN(num) || num < 0) {
                            valid = false;
                            break;
                          }
                          newTicketWeights[key] = num;
                        }

                        if (valid) {
                          setTicketTypeWeights(newTicketWeights);
                          setTicketEditMode(false);
                        }
                      }}
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
                            <input 
                              type="number" 
                              min="0" 
                              step="0.1"
                              value={ticketEditValues[type.id] || ''}
                              onChange={(e) => setTicketEditValues(prev => ({ ...prev, [type.id]: e.target.value }))}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          ) : (
                            <span className="text-sm font-semibold text-gray-900">{ticketTypeWeights[type.id] ?? '-'}</span>
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
    </div>
  );
};

export default FormulaConfig;
