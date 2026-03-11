import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { useCalculateKPI } from '../hooks/mutations/useKPIMutations';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface KPIData {
  standardKPI: number;
  currentKPI: number;
  lastCalculated?: string;
  breakdown?: {
    tickets: number;
    logwork: number;
    quality: number;
  };
}

const ODashboard: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.UUID || '';

  // Use KPI mutation hook
  const calculateKPIMutation = useCalculateKPI();
  
  // Mock KPI data - replace with actual API data
  const [odcKPI, setOdcKPI] = useState<KPIData>({
    standardKPI: 8.5,
    currentKPI: 8.1,
    lastCalculated: '1 hour ago',
    breakdown: {
      tickets: 3.2,
      logwork: 2.1,
      quality: 2.8,
    }
  });

  // KPI Trend data
  const kpiTrendData = [
    { date: 'Jan', odc: 7.8 },
    { date: 'Feb', odc: 7.9 },
    { date: 'Mar', odc: 8.1 },
    { date: 'Apr', odc: 8.0 },
    { date: 'May', odc: 8.2 },
    { date: 'Jun', odc: 8.1 },
  ];

  // Team composition data
  const teamData = [
    { role: 'Developer', count: 12, kpi: 8.2 },
    { role: 'QA', count: 8, kpi: 8.0 },
    { role: 'BA', count: 5, kpi: 8.4 },
    { role: 'DevOps', count: 3, kpi: 7.9 },
  ];

  // Handle Calculate KPI
  const handleCalculateKPI = async () => {
    try {
      const response = await calculateKPIMutation.mutateAsync({
        viewType: 'odc',
        userId: undefined,
      });

      // Update KPI state with API response
      const kpiData: KPIData = {
        standardKPI: response.data.standardKPI,
        currentKPI: response.data.currentKPI,
        lastCalculated: 'just now',
        breakdown: response.data.breakdown,
      };

      setOdcKPI(kpiData);
    } catch (error) {
      console.error('Failed to calculate KPI:', error);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="w-full px-6 py-8 md:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            ODC KPI Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Monitor overall ODC performance metrics
          </p>
        </div>

        {/* Main KPI Section */}
        <div className="mb-8 rounded-2xl border border-border-light bg-white shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
            {/* Left: KPI Scores */}
            <div className="flex flex-col justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-4">KPI Score</p>
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-baseline gap-3">
                    <span className="text-6xl font-bold text-primary">
                      {odcKPI.currentKPI.toFixed(1)}
                    </span>
                    <span className="text-lg font-semibold text-slate-500">/ {odcKPI.standardKPI.toFixed(1)}</span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="material-symbols-outlined text-sm text-emerald-600">trending_up</span>
                      <span className="text-sm font-semibold text-emerald-700">
                        {Math.abs(odcKPI.currentKPI - odcKPI.standardKPI).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">↑ vs Standard</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-6">Last calculated: <span className="font-medium text-slate-600">{odcKPI.lastCalculated}</span></p>

                {/* KPI Breakdown */}
                {odcKPI.breakdown && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Breakdown</p>
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-blue-500">assignment_turned_in</span>
                            Ticket Completion
                          </span>
                          <span className="text-sm font-bold text-blue-600">{odcKPI.breakdown.tickets.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                            style={{ width: `${Math.min((odcKPI.breakdown.tickets / odcKPI.standardKPI) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-purple-500">schedule</span>
                            Logwork Compliance
                          </span>
                          <span className="text-sm font-bold text-purple-600">{odcKPI.breakdown.logwork.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                            style={{ width: `${Math.min((odcKPI.breakdown.logwork / odcKPI.standardKPI) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-emerald-500">code</span>
                            Code Quality
                          </span>
                          <span className="text-sm font-bold text-emerald-600">{odcKPI.breakdown.quality.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                            style={{ width: `${Math.min((odcKPI.breakdown.quality / odcKPI.standardKPI) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Calculate Button */}
              <div className="mt-10 pt-6 border-t border-slate-200">
                <button
                  onClick={handleCalculateKPI}
                  disabled={calculateKPIMutation.isPending}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${
                    calculateKPIMutation.isPending
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 hover:shadow-xl hover:shadow-primary/30'
                  }`}
                >
                  <span className={`material-symbols-outlined ${calculateKPIMutation.isPending ? 'animate-spin' : ''}`}>
                    calculate
                  </span>
                  {calculateKPIMutation.isPending ? 'Calculating...' : 'Calculate KPI'}
                </button>
              </div>
            </div>

            {/* Right: KPI Score Gauge */}
            <div className="flex items-center justify-center">
              <div className="relative w-56 h-56">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  {/* Background circle */}
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.9155" 
                    fill="none" 
                    stroke="#e2e8f0" 
                    strokeWidth="2.5"
                  />
                  
                  {/* Progress circle */}
                  <circle 
                    cx="18" 
                    cy="18" 
                    r="15.9155" 
                    fill="none" 
                    stroke="url(#gradient)" 
                    strokeWidth="2.5"
                    strokeDasharray={`${(odcKPI.currentKPI / 10) * 100}, 100`}
                    strokeLinecap="round"
                    transform="rotate(-90 18 18)"
                  />
                  
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>

                  {/* Center text */}
                  <text 
                    x="50%" 
                    y="50%" 
                    textAnchor="middle" 
                    dy="0.3em" 
                    fontSize="10"
                    fontWeight="700"
                    fill="#3b82f6"
                  >
                    {odcKPI.currentKPI.toFixed(1)}
                  </text>
                  <text 
                    x="50%" 
                    y="65%" 
                    textAnchor="middle" 
                    dy="0.3em"
                    fontSize="4"
                    fontWeight="500"
                    fill="#64748b"
                  >
                    of {odcKPI.standardKPI.toFixed(1)}
                  </text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* KPI Trend Chart */}
          <div className="rounded-2xl border border-border-light bg-white shadow-lg p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">KPI Trend</h3>
              <p className="text-sm text-slate-600 mt-1">Monthly progress</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={kpiTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} domain={[7, 8.5]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
                    formatter={(value) => (value as number).toFixed(1)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="odc" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#8b5cf6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Team Performance */}
          <div className="rounded-2xl border border-border-light bg-white shadow-lg p-8">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900">Team Performance</h3>
              <p className="text-sm text-slate-600 mt-1">By role</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="role" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} yAxisId="left" />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} yAxisId="right" orientation="right" />
                  <Tooltip contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Team Size" />
                  <Bar yAxisId="right" dataKey="kpi" fill="#8b5cf6" name="Avg KPI" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* KPI Contribution Table */}
        <div className="mb-8 rounded-2xl border border-border-light bg-white shadow-lg overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">KPI Contribution Detail</h3>
              <p className="text-sm text-slate-500 mt-0.5">Team performance breakdown by week</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th rowSpan={2} className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Member's Name</th>
                  <th rowSpan={2} className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Weight Role</th>
                  {(['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'] as string[]).map((w) => (
                    <th key={w} colSpan={2} className="text-center px-4 py-2 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">{w}</th>
                  ))}
                  <th rowSpan={2} className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Ticket Contribution Point</th>
                  <th rowSpan={2} className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">LogWork Contr. Point</th>
                  <th rowSpan={2} className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Member Contr. Point</th>
                  <th rowSpan={2} className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Billable</th>
                  <th rowSpan={2} className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">EE</th>
                  <th rowSpan={2} className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap">Status</th>
                </tr>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {(['w1','w2','w3','w4','w5'] as string[]).map((w) => (
                    <>
                      <th key={`${w}-task`} className="text-center px-3 py-2 font-medium text-blue-600 whitespace-nowrap border-r border-slate-100 text-xs">Task</th>
                      <th key={`${w}-bug`} className="text-center px-3 py-2 font-medium text-red-500 whitespace-nowrap border-r border-slate-200 text-xs">Bug</th>
                    </>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Alex Morgan', avatar: 'alex', weight: '1.0', weeks: [[5,1],[6,0],[4,2],[7,1],[5,0]], ticket: 3.5, logwork: 2.0, member: 7.8, billable: true, ee: '95%', status: 'Active' },
                  { name: 'Sarah Johnson', avatar: 'sarah', weight: '0.9', weeks: [[4,0],[5,1],[6,0],[5,2],[4,1]], ticket: 3.2, logwork: 2.1, member: 7.5, billable: true, ee: '92%', status: 'Active' },
                  { name: 'Mike Chen', avatar: 'mike', weight: '1.0', weeks: [[7,0],[6,1],[7,0],[8,0],[6,1]], ticket: 3.8, logwork: 2.2, member: 8.2, billable: true, ee: '100%', status: 'Active' },
                  { name: 'Emily Davis', avatar: 'emily', weight: '0.8', weeks: [[3,2],[4,1],[3,0],[4,1],[3,2]], ticket: 2.9, logwork: 1.8, member: 7.1, billable: false, ee: '88%', status: 'On Leave' },
                  { name: 'Tom Wilson', avatar: 'tom', weight: '1.0', weeks: [[6,0],[5,0],[7,1],[6,0],[7,0]], ticket: 3.6, logwork: 2.3, member: 8.4, billable: true, ee: '98%', status: 'Active' },
                ].map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 border-r border-slate-100">
                      <div className="flex items-center gap-2">
                        <img src={`https://picsum.photos/seed/${row.avatar}/40/40`} alt="" className="w-7 h-7 rounded-full border border-slate-200" />
                        <span className="font-medium text-slate-800 whitespace-nowrap">{row.name}</span>
                      </div>
                    </td>
                    <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">{row.weight}</td>
                    {row.weeks.map(([task, bug], wi) => (
                      <>
                        <td key={`task-${wi}`} className="text-center px-3 py-3 text-slate-700 border-r border-slate-100">{task}</td>
                        <td key={`bug-${wi}`} className={`text-center px-3 py-3 border-r border-slate-200 ${bug > 0 ? 'text-red-500 font-medium' : 'text-slate-400'}`}>{bug}</td>
                      </>
                    ))}
                    <td className="text-center px-4 py-3 font-semibold text-blue-600 border-r border-slate-100">{row.ticket.toFixed(1)}</td>
                    <td className="text-center px-4 py-3 font-semibold text-purple-600 border-r border-slate-100">{row.logwork.toFixed(1)}</td>
                    <td className={`text-center px-4 py-3 font-bold border-r border-slate-100 ${row.member >= 8 ? 'text-emerald-600' : row.member >= 7.5 ? 'text-blue-600' : 'text-amber-600'}`}>{row.member.toFixed(1)}</td>
                    <td className="text-center px-4 py-3 border-r border-slate-100">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.billable ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {row.billable ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">{row.ee}</td>
                    <td className="text-center px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        row.status === 'Active' ? 'bg-blue-100 text-blue-700' :
                        row.status === 'On Leave' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border-light bg-white shadow-lg p-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-6">Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">description</span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Log Tickets</p>
                <p className="text-xs text-slate-600">Add new tickets</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">schedule</span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Log Hours</p>
                <p className="text-xs text-slate-600">Log work hours</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">trending_up</span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">View Reports</p>
                <p className="text-xs text-slate-600">Detailed analytics</p>
              </div>
            </button>
            <button className="flex items-center gap-3 p-4 rounded-lg border border-border-light hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-primary text-[28px]">help</span>
              <div className="text-left">
                <p className="font-semibold text-slate-900">Help</p>
                <p className="text-xs text-slate-600">Documentation</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ODashboard;
