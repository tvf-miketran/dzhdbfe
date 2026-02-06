
import React, { useState } from 'react';

const FormulaConfig: React.FC = () => {
  const [formula, setFormula] = useState("({Ticket_Count} * 1.5) + (({Logwork_Hours} / 160) * 100) + ({Quality_Score} * 0.8)");
  
  const variables = [
    { name: 'Ticket_Count', color: 'bg-emerald-600' },
    { name: 'Logwork_Hours', color: 'bg-blue-600' },
    { name: 'Quality_Score', color: 'bg-purple-600' },
    { name: 'Code_Review_Pts', color: 'bg-orange-600' },
  ];

  const roles = [
    { id: 'sr', title: 'Senior Developer', icon: 'code', multiplier: 120, range: [80, 150] },
    { id: 'jr', title: 'Junior Developer', icon: 'laptop', multiplier: 85, range: [50, 100] },
    { id: 'qa', title: 'QA Engineer', icon: 'bug_report', multiplier: 100, range: [80, 120] },
    { id: 'ba', title: 'Business Analyst', icon: 'analytics', multiplier: 110, range: [80, 140] },
    { id: 'tl', title: 'Team Lead', icon: 'groups', multiplier: 140, range: [100, 200] },
  ];

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Formula & Role Configuration</h1>
          <p className="text-sm text-slate-500 font-light max-w-2xl">
            Define the mathematical models for KPI calculation and adjust performance weighting by role.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 rounded-lg border border-border-light bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors">
            Discard
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all">
            <span className="material-symbols-outlined text-[18px]">save</span>
            Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formula Builder */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-1">
            <span className="material-symbols-outlined text-primary text-[20px]">functions</span>
            Expression Editor
            <span className="ml-auto text-[10px] text-slate-500 bg-slate-50 px-2 py-1 rounded border border-border-light font-mono">Basic Math: + − × ÷</span>
          </div>
          
          <div className="flex flex-col rounded-xl border border-border-light bg-surface-light overflow-hidden shadow-lg">
            <div className="bg-slate-50 border-b border-border-light px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase text-slate-600 tracking-widest">Edit Formula</span>
            </div>
            <textarea 
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              className="w-full h-48 p-4 bg-white text-slate-900 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 border-none leading-relaxed"
            />
            <div className="p-4 border-t border-border-light bg-slate-50 flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-semibold uppercase text-slate-600 tracking-widest mr-2">Variables:</span>
              {variables.map((v, i) => (
                <button 
                  key={i} 
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-light hover:border-primary hover:bg-primary/5 bg-white text-[11px] font-semibold text-slate-700 transition-all"
                  onClick={() => setFormula(f => `${f} {${v.name}}`)}
                >
                  <span className={`w-2 h-2 rounded-full ${v.color}`}></span>
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Preview Sidebar */}
        <div className="rounded-xl border border-border-light bg-surface-light p-6 flex flex-col gap-6 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Preview</h3>
            <span className="material-symbols-outlined text-slate-400 text-[18px]">preview</span>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: 'Ticket_Count', val: 24 },
              { label: 'Logwork_Hours', val: 160 },
              { label: 'Quality_Score', val: 92 },
            ].map((v, i) => (
              <div key={i} className="flex items-center justify-between group">
                <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{v.label}</span>
                <div className="px-3 py-1.5 bg-slate-50 border border-border-light rounded text-xs font-mono text-slate-900 font-semibold">
                  {v.val}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600">Score</span>
              <span className="text-3xl font-bold text-primary">209.6</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[75%] rounded-full shadow-md"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Weighting Section */}
      <div className="rounded-xl border border-border-light bg-surface-light overflow-hidden shadow-lg mt-4">
        <div className="p-6 border-b border-border-light flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-primary text-[20px]">assignment_ind</span>
             <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Role Weighting</h3>
          </div>
          <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Baseline: <span className="text-slate-900 font-bold">100%</span></span>
        </div>
        
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
          {roles.map((role) => (
            <div key={role.id} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-lg bg-slate-100 border border-border-light flex items-center justify-center text-primary">
                     <span className="material-symbols-outlined text-[18px]">{role.icon}</span>
                   </div>
                   <div>
                     <p className="text-sm font-semibold text-slate-900 leading-tight">{role.title}</p>
                     <p className="text-[10px] text-slate-600 uppercase font-semibold tracking-widest mt-0.5">Expectation Multiplier</p>
                   </div>
                </div>
                <span className="text-sm font-bold text-primary">{role.multiplier}%</span>
              </div>
              <div className="flex flex-col gap-2">
                <input 
                  type="range" 
                  min={role.range[0]} 
                  max={role.range[1]} 
                  defaultValue={role.multiplier}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[10px] font-semibold text-slate-600 px-1">
                  <span>{role.range[0]}%</span>
                  <span>{role.range[1]}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-slate-50 border-t border-border-light flex items-center gap-3">
          <span className="material-symbols-outlined text-slate-500 text-[18px]">info</span>
          <p className="text-xs text-slate-600 font-medium">
            Higher role weights increase the base expectation for KPIs. A 120% weight means 20% more output than baseline.
          </p>
        </div>
      </div>

      {/* Advanced Accordion */}
      <div className="rounded-xl border border-border-light bg-surface-light overflow-hidden shadow-lg transition-all hover:shadow-md hover:border-slate-300 cursor-pointer">
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-slate-600">tune</span>
            <span className="text-sm font-semibold text-slate-900">Advanced Settings</span>
          </div>
          <span className="material-symbols-outlined text-slate-500">expand_more</span>
        </div>
      </div>
    </div>
  );
};

export default FormulaConfig;
