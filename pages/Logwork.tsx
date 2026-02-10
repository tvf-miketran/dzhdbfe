
import React from 'react';

const LOGWORK_DATA = [
  { id: 1, name: 'Alice Smith', initials: 'AS', role: 'Senior Dev', hours: [160, 152, 168, 160, 176, 160, 168, 176, 160, 168, 0, 0], color: 'bg-blue-500' },
  { id: 2, name: 'Bob Jones', initials: 'BJ', role: 'QA Lead', hours: [160, 140, 160, 160, 170, 155, 168, 176, 150, 160, 0, 0], color: 'bg-purple-500' },
  { id: 3, name: 'Charlie Day', initials: 'CD', role: 'UX Designer', hours: [160, 152, 168, 160, 176, 160, 100, 80, 160, 168, 0, 0], color: 'bg-emerald-500' },
  { id: 4, name: 'Diana Prince', initials: 'DP', role: 'PM', hours: [160, 152, 168, 160, 176, 160, 168, 176, 160, 168, 0, 0], color: 'bg-orange-500' },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Logwork: React.FC = () => {
  return (
    <div className="flex flex-col h-full overflow-hidden bg-background-light animate-in fade-in duration-500">
      <div className="shrink-0 p-6 md:p-8 flex flex-col gap-8 border-b border-border-light bg-slate-50">
        <div className="flex flex-wrap items-end gap-6">
          <div className="w-80">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Project</label>
            <div className="relative">
              <select className="w-full h-11 pl-4 pr-10 bg-background-light border border-border-light rounded-xl text-sm font-semibold text-slate-900 appearance-none focus:ring-2 focus:ring-primary/20 outline-none">
                <option>Alpha ODC - Q3 Development</option>
                <option>Beta FinTech - Core API</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
            </div>
          </div>
          <div className="w-40">
            <label className="block text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-2">Year</label>
            <div className="relative">
              <select className="w-full h-11 pl-4 pr-10 bg-background-light border border-border-light rounded-xl text-sm font-semibold text-slate-900 appearance-none focus:ring-2 focus:ring-primary/20 outline-none">
                <option>2023</option>
                <option>2022</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">calendar_today</span>
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-4 pb-2">
            <button className="flex items-center gap-2 h-10 px-5 rounded-lg bg-primary hover:bg-emerald-600 text-white font-semibold text-xs transition-all shadow-xl shadow-primary/20">
              <span className="material-symbols-outlined text-[18px]">save</span>
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6 custom-scrollbar">
        <div className="rounded-xl border border-border-light bg-surface-light shadow-lg overflow-hidden min-w-[1200px]">
          <table className="w-full border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-20">
              <tr className="border-b border-border-light">
                <th className="sticky left-0 z-30 bg-slate-50 px-6 py-5 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-600 border-r border-border-light min-w-[260px]">User Name</th>
                <th className="px-6 py-5 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-600 border-r border-border-light min-w-[160px]">Role</th>
                {MONTHS.map(m => (
                  <th key={m} className="px-2 py-5 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-600 border-r border-border-light min-w-[100px]">{m}</th>
                ))}
                <th className="px-6 py-5 text-center text-[11px] font-semibold uppercase tracking-widest text-slate-600 bg-slate-100 min-w-[120px]">YTD Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light">
              {LOGWORK_DATA.map((user) => {
                const total = user.hours.reduce((a, b) => a + b, 0);
                return (
                  <tr key={user.id} className="group hover:bg-slate-50 transition-colors">
                    <td className="sticky left-0 z-10 bg-surface-light group-hover:bg-slate-100 transition-colors px-6 py-4 border-r border-border-light text-center">
                      <div className="flex items-center justify-center gap-4">
                        <div className={`h-10 w-10 rounded-full ${user.color}/10 flex items-center justify-center font-semibold text-xs ${user.color.replace('bg-', 'text-')}`}>
                          {user.initials}
                        </div>
                        <span className="text-sm font-semibold text-slate-900 truncate">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm font-normal text-slate-600 border-r border-border-light">{user.role}</td>
                    {user.hours.map((h, i) => (
                      <td key={i} className="p-1 border-r border-border-light group-hover:bg-slate-100/50 transition-colors">
                        <input 
                          type="text" 
                          defaultValue={h === 0 ? '' : h}
                          placeholder="-"
                          className="w-full h-10 bg-transparent border-0 text-center text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-primary rounded transition-all"
                        />
                      </td>
                    ))}
                    <td className="px-6 py-4 text-center font-semibold text-slate-900 bg-slate-100/50">
                      {total.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="shrink-0 p-5 bg-slate-50 border-t border-border-light flex items-center justify-between">
        <div className="text-xs font-medium text-slate-600">
          Showing <span className="text-slate-900">1</span> to <span className="text-slate-900">4</span> of <span className="text-slate-900">12</span> entries
        </div>
        <div className="flex items-center gap-2">
           <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-border-light text-slate-500 hover:text-slate-900 transition-colors">
             <span className="material-symbols-outlined text-[18px]">chevron_left</span>
           </button>
           <button className="h-9 w-9 flex items-center justify-center rounded-lg bg-primary text-white text-xs font-semibold shadow-lg shadow-primary/20">1</button>
           <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-border-light text-slate-500 hover:text-slate-900 text-xs font-semibold transition-colors">2</button>
           <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-border-light text-slate-500 hover:text-slate-900 text-xs font-semibold transition-colors">3</button>
           <span className="px-2 text-slate-400">...</span>
           <button className="h-9 w-9 flex items-center justify-center rounded-lg border border-border-light text-slate-500 hover:text-slate-900 transition-colors">
             <span className="material-symbols-outlined text-[18px]">chevron_right</span>
           </button>
        </div>
      </div>
    </div>
  );
};

export default Logwork;
