
import React, { useState } from 'react';
import { TicketEntry } from '../types';

const PROJECT_LIST: string[] = ['Alpha Banking Portal', 'Cloud Migration II', 'Mobile App Refresh', 'Internal HR Tool', 'E-commerce Engine'];
const DEFAULT_TYPE = 'Feature';
const ROLES: string[] = ['Senior Dev', 'Junior Dev', 'QA Lead', 'UX Designer', 'Team Lead'];

const INITIAL_FINAL_ENTRIES: TicketEntry[] = [
    { id: '1', ticketId: 'ODC-120', projectName: 'Alpha Banking Portal', type: 'Feature', role: 'Senior Dev', status: 'InQA', timestamp: '2023-10-01' },
    { id: '2', ticketId: 'ODC-341', projectName: 'Mobile App Refresh', type: 'Bug Fix', role: 'QA Lead', status: 'Closed', timestamp: '2023-10-02' },
];

const LogTickets: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'draft' | 'final'>('draft');
  const [draftEntries, setDraftEntries] = useState<TicketEntry[]>([]);
  const [finalEntries, setFinalEntries] = useState<TicketEntry[]>(INITIAL_FINAL_ENTRIES);

  const [formData, setFormData] = useState({
    ticketId: '',
    project: PROJECT_LIST[0],
    type: DEFAULT_TYPE,
    role: ROLES[0]
  });

  const handleAddTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ticketId.trim()) return;

    const ids = formData.ticketId.split(',').map(s => s.trim()).filter(s => s);
    
    const newEntries: TicketEntry[] = ids.map(id => ({
      id: Math.random().toString(36).substr(2, 9),
      ticketId: id,
      projectName: formData.project,
      type: formData.type,
      role: formData.role,
      status: 'Open',
      timestamp: new Date().toISOString().split('T')[0]
    }));

    setDraftEntries(prev => [...prev, ...newEntries]);
    setFormData({ ...formData, ticketId: '' });
  };

  const handleSubmitDraft = () => {
    if (draftEntries.length === 0) return;
    setFinalEntries(prev => [...prev, ...draftEntries]);
    setDraftEntries([]);
    setActiveTab('final');
  };

  const updateStatus = (id: string, newStatus: 'Open' | 'Closed' | 'InQA') => {
    setFinalEntries(prev => prev.map(entry => 
      entry.id === id ? { ...entry, status: newStatus } : entry
    ));
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'Bug Fix': return 'bg-red-100 text-red-700 border-red-200';
      case 'Feature': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Refactor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Hotfix': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Research': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Open': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'InQA': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Closed': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="flex flex-col gap-8 p-6 md:p-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('draft')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full transition-colors ${
              activeTab === 'draft'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Draft ({draftEntries.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('final')}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-widest rounded-full transition-colors ${
              activeTab === 'final'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Final ({finalEntries.length})
          </button>
        </div>

        {activeTab === 'draft' && (
          <button
            type="button"
            onClick={handleSubmitDraft}
            disabled={draftEntries.length === 0}
            className="h-10 px-4 rounded-lg bg-primary text-white text-sm font-semibold shadow-md transition-colors hover:bg-emerald-600 disabled:bg-slate-300 disabled:text-slate-500"
          >
            Submit to Final
          </button>
        )}
      </div>

      {activeTab === 'draft' && (
        <>
          <div className="bg-surface-light border border-border-light rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-border-light bg-slate-50 flex items-center gap-3">
              <span className="material-symbols-outlined text-primary text-[18px]">add_task</span>
              <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-widest">Draft Ticket Entry</h3>
            </div>
            
            <form onSubmit={handleAddTicket} className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">Ticket ID(s)</label>
                <input 
                  type="text" 
                  value={formData.ticketId}
                  onChange={(e) => setFormData({...formData, ticketId: e.target.value})}
                  placeholder="e.g. ODC-123, ODC-124"
                  className="h-10 px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">Project</label>
                <div className="relative">
                  <select 
                    value={formData.project}
                    onChange={(e) => setFormData({...formData, project: e.target.value})}
                    className="h-10 w-full px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer transition-all"
                  >
                    {PROJECT_LIST.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-semibold text-slate-700 uppercase tracking-widest">Role</label>
                <div className="relative">
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="h-10 w-full px-3 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer transition-all"
                  >
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-[11px] font-semibold text-transparent select-none" aria-hidden="true">Action</span>
                <button 
                  type="submit"
                  className="h-10 w-full bg-primary hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add to Draft
                </button>
              </div>
            </form>
          </div>

          <div className="bg-surface-light border border-border-light rounded-xl shadow-lg overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-border-light bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Draft Tickets</h3>
              <span className="text-xs font-semibold py-1 px-3 bg-primary/10 text-primary border border-primary/20 rounded-full">
                {draftEntries.length} {draftEntries.length === 1 ? 'Entry' : 'Entries'}
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 border-b border-border-light">
                  <tr>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Ticket ID</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Project</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Type</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Role</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Status</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Date</th>
                    <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light">
                  {draftEntries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center">
                          <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">inbox</span>
                          <p className="text-slate-500 font-medium">No draft tickets yet</p>
                          <p className="text-slate-400 text-sm">Add a ticket entry to get started</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    draftEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-6 text-center">
                          <span className="font-mono font-bold text-slate-900 text-sm">{entry.ticketId}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-sm font-medium text-slate-700">{entry.projectName}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-tight ${getTypeColor(entry.type)}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="text-sm text-slate-700">{entry.role}</span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className="inline-flex px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-tight bg-slate-100 text-slate-700 border-slate-200">
                            Draft
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center text-xs text-slate-600">{entry.timestamp}</td>
                        <td className="py-4 px-6 text-center">
                          <button 
                            onClick={() => setDraftEntries(prev => prev.filter(e => e.id !== entry.id))}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete ticket"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'final' && (
        <div className="bg-surface-light border border-border-light rounded-xl shadow-lg overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border-light bg-slate-50 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-widest">Final Tickets</h3>
            <span className="text-xs font-semibold py-1 px-3 bg-primary/10 text-primary border border-primary/20 rounded-full">
              {finalEntries.length} {finalEntries.length === 1 ? 'Entry' : 'Entries'}
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 border-b border-border-light">
                <tr>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Ticket ID</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Project</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Type</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Role</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Status</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Date</th>
                  <th className="py-4 px-6 text-[11px] font-semibold uppercase tracking-widest text-slate-600 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light">
                {finalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <span className="material-symbols-outlined text-4xl text-slate-300 mb-3">inbox</span>
                        <p className="text-slate-500 font-medium">No final tickets yet</p>
                        <p className="text-slate-400 text-sm">Submit draft entries to publish</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  finalEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="py-4 px-6 text-center">
                        <span className="font-mono font-bold text-slate-900 text-sm">{entry.ticketId}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm font-medium text-slate-700">{entry.projectName}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-tight ${getTypeColor(entry.type)}`}>
                          {entry.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm text-slate-700">{entry.role}</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="relative inline-block w-full max-w-[120px]">
                          <select 
                            value={entry.status}
                            onChange={(e) => updateStatus(entry.id, e.target.value as any)}
                            className={`w-full h-8 pl-2 pr-7 rounded border text-xs font-semibold uppercase tracking-tight appearance-none outline-none cursor-pointer transition-all ${getStatusColor(entry.status)}`}
                          >
                            <option value="Open">Open</option>
                            <option value="InQA">InQA</option>
                            <option value="Closed">Closed</option>
                          </select>
                          <span className="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none text-slate-500">expand_more</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center text-xs text-slate-600">{entry.timestamp}</td>
                      <td className="py-4 px-6 text-center">
                        <button 
                          onClick={() => setFinalEntries(prev => prev.filter(e => e.id !== entry.id))}
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete ticket"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogTickets;
