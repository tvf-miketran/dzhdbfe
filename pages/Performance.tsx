
import React, { useState } from 'react';

const Performance: React.FC = () => {
  const [weights, setWeights] = useState({
    tickets: 60,
    logwork: 25,
    quality: 15
  });

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <nav className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">
             <span>Settings</span>
             <span className="material-symbols-outlined text-[14px]">chevron_right</span>
             <span className="text-slate-400">Configuration</span>
          </nav>
          <h1 className="text-3xl font-semibold text-slate-900 tracking-tight">Performance Algorithm</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2.5 rounded-lg border border-border-light bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors">Reset to Default</button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary hover:bg-emerald-600 text-white font-semibold shadow-md hover:shadow-lg transition-all">
            <span className="material-symbols-outlined text-[20px]">save</span>
            Save Changes
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-border-light bg-surface-light overflow-hidden shadow-lg">
        <div className="p-4 bg-slate-50 border-b border-border-light flex items-center justify-between">
           <div className="flex items-center gap-3">
             <span className="material-symbols-outlined text-primary text-[22px]">tune</span>
             <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Metric Weighting</h3>
           </div>
           <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-medium uppercase tracking-widest border border-emerald-500/20">Total: 100%</span>
        </div>
        
        <div className="p-8 flex flex-col gap-10">
          {[
            { key: 'tickets', label: 'Ticket Completion', icon: 'info', desc: 'High priority metric reflecting output volume.', color: 'primary' },
            { key: 'logwork', label: 'Logwork Compliance', icon: 'info', desc: 'Ensures accurate billing and time tracking.', color: 'primary' },
            { key: 'quality', label: 'Code Quality / Review', icon: 'info', desc: 'Quality over quantity factor.', color: 'primary' }
          ].map((metric) => (
            <div key={metric.key} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">{metric.label}</span>
                  <span className="material-symbols-outlined text-slate-400 text-[16px] cursor-help">{metric.icon}</span>
                </div>
                <span className="text-sm font-semibold text-primary">{weights[metric.key as keyof typeof weights]}%</span>
              </div>
              <div className="flex items-center gap-6">
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={weights[metric.key as keyof typeof weights]} 
                  onChange={(e) => setWeights({ ...weights, [metric.key]: parseInt(e.target.value) })}
                  className="flex-1 h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="w-16 h-10 flex items-center justify-center bg-slate-50 border border-border-light rounded-lg text-sm font-mono text-slate-900">
                  {(weights[metric.key as keyof typeof weights] / 100).toFixed(2)}
                </div>
              </div>
              <p className="text-xs text-slate-600 font-light italic">{metric.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Role-Based Access Control</h3>
            <p className="text-sm text-slate-500 font-light">Define who can view performance data and edit system settings.</p>
          </div>
          <button className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
            <span className="material-symbols-outlined text-[18px]">add</span> Add New Role
          </button>
        </div>

        <div className="bg-surface-light border border-border-light rounded-xl overflow-hidden shadow-lg">
           <table className="w-full text-left border-collapse">
             <thead className="bg-slate-50 border-b border-border-light">
               <tr>
                 <th className="py-4 px-6 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Role Name</th>
                 <th className="py-4 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600 text-center">View Dashboard</th>
                 <th className="py-4 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600 text-center">Edit Weights</th>
                 <th className="py-4 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600 text-center">Manage Users</th>
                 <th className="py-4 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-600 text-center">Export Reports</th>
                 <th className="py-4 px-6 text-[10px] font-semibold uppercase tracking-widest text-slate-600 text-right"></th>
               </tr>
             </thead>
             <tbody className="divide-y divide-border-light">
               {[
                 { role: 'Super Admin', desc: 'Full system access', icon: 'security', checked: [true, true, true, true], system: true },
                 { role: 'Project Manager', desc: 'Team oversight', icon: 'assignment_ind', checked: [true, false, true, true], system: false },
                 { role: 'Developer', desc: 'Individual contributor', icon: 'person', checked: [true, false, false, false], system: false },
               ].map((role, i) => (
                 <tr key={i} className="hover:bg-slate-50 transition-colors">
                   <td className="py-5 px-6">
                     <div className="flex items-center gap-3">
                       <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                         <span className="material-symbols-outlined fill-1 text-[20px]">{role.icon}</span>
                       </div>
                       <div>
                         <div className="text-sm font-bold text-slate-900 tracking-tight">{role.role}</div>
                         <div className="text-[11px] font-medium text-slate-500">{role.desc}</div>
                       </div>
                     </div>
                   </td>
                   {role.checked.map((c, j) => (
                     <td key={j} className="py-5 px-2 text-center">
                       <div className="flex justify-center">
                         <input type="checkbox" checked={c} readOnly className="h-4 w-4 rounded border-border-light bg-slate-200 text-primary focus:ring-primary/20" />
                       </div>
                     </td>
                   ))}
                   <td className="py-5 px-6 text-right">
                     {role.system ? (
                       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">System Locked</span>
                     ) : (
                       <button className="text-slate-400 hover:text-slate-900 transition-colors">
                         <span className="material-symbols-outlined">more_vert</span>
                       </button>
                     )}
                   </td>
                 </tr>
               ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default Performance;
