
import React from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { MetricCardProps, Ticket } from '../types';

const METRICS: MetricCardProps[] = [
  { title: 'Total Headcount', value: '142', change: '2%', isUp: true, icon: 'group', colorClass: 'text-primary', progress: 78 },
  { title: 'Project Health', value: '96%', subtitle: 'Healthy', icon: 'health_and_safety', colorClass: 'text-emerald-500', progress: 96 },
  { title: 'Avg KPI Score', value: '8.7', change: '+0.3', subtitle: '/ 10', icon: 'military_tech', colorClass: 'text-purple-500', progress: 87 },
  { title: 'Billable Hours', value: '12.5k', subtitle: 'hrs', icon: 'attach_money', colorClass: 'text-blue-400', progress: 65 },
];

const PERFORMANCE_DATA = [
  { month: 'Aug', value: 40 },
  { month: 'Sep', value: 55 },
  { month: 'Oct', value: 50 },
  { month: 'Nov', value: 80 },
  { month: 'Dec', value: 70 },
  { month: 'Jan', value: 90 },
];

const TICKETS: Ticket[] = [
  { id: 'ODC-204', title: 'Fix Login Auth Bug', code: 'ODC-204', due: 'Due in 2 days', status: 'In Progress', assignees: ['u1', 'u2'], type: 'bug' },
  { id: 'ODC-319', title: 'API Integration for Dashboard', code: 'ODC-319', due: 'Due Today', status: 'Urgent', assignees: ['u3'], type: 'code' },
  { id: 'ODC-112', title: 'Unit Testing Implementation', code: 'ODC-112', due: 'Completed', status: 'Done', assignees: ['u4'], type: 'check' },
];

const Dashboard: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-6 md:px-8 md:py-8 flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {METRICS.map((metric, idx) => (
        <div className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface-light p-6 shadow-lg transition-transform hover:scale-[1.02]">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-600">{metric.title}</p>
              <span className={`material-symbols-outlined ${metric.colorClass} fill-1 text-[22px]`}>{metric.icon}</span>
            </div>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-semibold text-slate-900">{metric.value}</p>
              {metric.change && (
                <div className={`mb-1.5 flex items-center text-xs font-semibold ${metric.isUp ? 'text-emerald-500' : 'text-red-500'}`}>
                  <span className="material-symbols-outlined text-[14px]">{metric.isUp ? 'arrow_upward' : 'arrow_downward'}</span>
                  {metric.change}
                </div>
              )}
              {metric.subtitle && <span className="mb-1 text-sm font-normal text-slate-500">{metric.subtitle}</span>}
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200">
              <div 
                className={`h-1.5 rounded-full transition-all duration-1000 ${metric.colorClass.replace('text-', 'bg-')}`} 
                style={{ width: `${metric.progress}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border-light bg-surface-light p-6">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Resource Utilization</h3>
              <p className="text-sm text-slate-500 font-light">Weekly heatmap by department</p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500"></div> Over
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500"></div> Optimal
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div> Under
              </div>
            </div>
          </div>
          
          <div className="flex flex-col gap-5">
            {['Frontend', 'Backend', 'QA', 'DevOps'].map((dept, i) => (
              <div key={dept} className="flex items-center gap-6">
                <span className="w-20 shrink-0 text-sm font-bold text-slate-600">{dept}</span>
                <div className="grid flex-1 grid-cols-5 gap-2">
                  {[...Array(5)].map((_, j) => {
                    const status = i === 1 && j === 3 ? 'over' : (i === 0 && j === 2 ? 'over' : (i === 2 && j < 2 ? 'under' : 'optimal'));
                    const colors = {
                      over: 'bg-red-500/80 hover:bg-red-500',
                      optimal: 'bg-emerald-500/80 hover:bg-emerald-500',
                      under: 'bg-slate-300/50 hover:bg-slate-200'
                    };
                    return (
                      <div key={j} className={`h-10 rounded-md transition-colors cursor-pointer ${colors[status as keyof typeof colors]}`}></div>
                    );
                  })}
                </div>
              </div>
            ))}
            <div className="mt-2 flex justify-between pl-26 text-xs font-light text-slate-500">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-border-light bg-surface-light p-6">
          <h3 className="mb-6 text-lg font-semibold text-slate-900 tracking-tight">Team Performance</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={PERFORMANCE_DATA}>
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
                  contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {PERFORMANCE_DATA.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`rgba(34, 197, 94, ${0.4 + (index * 0.1)})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-border-light bg-surface-light p-6 flex flex-col">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Logwork Status</h3>
            <button className="text-xs font-semibold text-primary hover:underline">View All</button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-6 py-4">
            <div className="relative h-44 w-44">
              <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                <path className="text-slate-300" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="2.5"></path>
                <path className="text-primary" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="82, 100" strokeLinecap="round" strokeWidth="2.5"></path>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-semibold text-slate-900">82%</span>
                <span className="text-xs font-light text-slate-500 uppercase tracking-widest">Submitted</span>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                <span className="text-sm font-normal text-slate-600">Done</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-300"></div>
                <span className="text-sm font-normal text-slate-600">Pending</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-1 lg:col-span-2 rounded-2xl border border-border-light bg-surface-light p-6">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 tracking-tight">Assigned Tickets</h3>
            <button className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Assign New
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {TICKETS.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 hover:border-border-light p-4 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    ticket.type === 'bug' ? 'bg-red-500/10 text-red-500' : ticket.type === 'code' ? 'bg-purple-500/10 text-purple-500' : 'bg-emerald-500/10 text-emerald-500'
                  }`}>
                    <span className="material-symbols-outlined fill-1 text-[22px]">
                      {ticket.type === 'bug' ? 'bug_report' : ticket.type === 'code' ? 'code' : 'verified'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate font-bold text-slate-900 group-hover:text-primary transition-colors">{ticket.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{ticket.code} • {ticket.due}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex -space-x-2">
                    {ticket.assignees.map((a, i) => (
                      <img key={i} src={`https://i.pravatar.cc/150?u=${a}`} className="h-7 w-7 rounded-full border-2 border-surface-light" alt="User" />
                    ))}
                  </div>
                  <span className={`min-w-[84px] text-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${
                    ticket.status === 'Urgent' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                    ticket.status === 'Done' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                  }`}>
                    {ticket.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
