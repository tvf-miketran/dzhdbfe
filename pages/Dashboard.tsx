import React, { useState, useEffect } from 'react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
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

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const userId = user?.UUID || '';

  // Use KPI mutation hook
  const calculateKPIMutation = useCalculateKPI();
  
  // Mock KPI data - replace with actual API data
  const [personalKPI, setPersonalKPI] = useState<KPIData>({
    standardKPI: 8.5,
    currentKPI: 7.8,
    lastCalculated: '2 hours ago',
    breakdown: {
      tickets: 3.5,
      logwork: 2.0,
      quality: 2.3,
    }
  });

  // KPI Trend data
  const kpiTrendData = [
    { date: 'Jan', personal: 7.2 },
    { date: 'Feb', personal: 7.5 },
    { date: 'Mar', personal: 7.8 },
    { date: 'Apr', personal: 8.0 },
    { date: 'May', personal: 7.9 },
    { date: 'Jun', personal: 7.8 },
  ];

  // Handle Calculate KPI
  const handleCalculateKPI = async () => {
    try {
      const response = await calculateKPIMutation.mutateAsync({
        viewType: 'personal',
        userId: userId,
      });

      // Update KPI state with API response
      const kpiData: KPIData = {
        standardKPI: response.data.standardKPI,
        currentKPI: response.data.currentKPI,
        lastCalculated: 'just now',
        breakdown: response.data.breakdown,
      };

      setPersonalKPI(kpiData);
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
            Your KPI Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-2">
            Track your individual performance metrics
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
                      {personalKPI.currentKPI.toFixed(1)}
                    </span>
                    <span className="text-lg font-semibold text-slate-500">/ {personalKPI.standardKPI.toFixed(1)}</span>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 rounded-lg border border-emerald-200">
                      <span className="material-symbols-outlined text-sm text-emerald-600">trending_up</span>
                      <span className="text-sm font-semibold text-emerald-700">
                        {Math.abs(personalKPI.currentKPI - personalKPI.standardKPI).toFixed(1)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">↑ vs Standard</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-6">Last calculated: <span className="font-medium text-slate-600">{personalKPI.lastCalculated}</span></p>

                {/* KPI Breakdown */}
                {personalKPI.breakdown && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-4">Breakdown</p>
                    <div className="space-y-5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-blue-500">assignment_turned_in</span>
                            Ticket Completion
                          </span>
                          <span className="text-sm font-bold text-blue-600">{personalKPI.breakdown.tickets.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-blue-400 to-blue-600"
                            style={{ width: `${Math.min((personalKPI.breakdown.tickets / personalKPI.standardKPI) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-purple-500">schedule</span>
                            Logwork Compliance
                          </span>
                          <span className="text-sm font-bold text-purple-600">{personalKPI.breakdown.logwork.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-purple-400 to-purple-600"
                            style={{ width: `${Math.min((personalKPI.breakdown.logwork / personalKPI.standardKPI) * 100, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-slate-600 flex items-center gap-2">
                            <span className="material-symbols-outlined text-sm text-emerald-500">code</span>
                            Code Quality
                          </span>
                          <span className="text-sm font-bold text-emerald-600">{personalKPI.breakdown.quality.toFixed(1)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div 
                            className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
                            style={{ width: `${Math.min((personalKPI.breakdown.quality / personalKPI.standardKPI) * 100, 100)}%` }}
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
                    strokeDasharray={`${(personalKPI.currentKPI / 10) * 100}, 100`}
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
                    {personalKPI.currentKPI.toFixed(1)}
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
                    of {personalKPI.standardKPI.toFixed(1)}
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
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height={256}>
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
                    dataKey="personal" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3b82f6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Personal Stat Cards */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-border-light bg-white shadow-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Tickets This Month</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">24</p>
                  <p className="text-xs text-emerald-600 mt-1">↑ 8% from last month</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-lg">
                  <span className="material-symbols-outlined text-blue-600 text-[32px]">assignment</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border-light bg-white shadow-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Logwork Hours</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">156</p>
                  <p className="text-xs text-slate-600 mt-1">This month</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <span className="material-symbols-outlined text-purple-600 text-[32px]">schedule</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border-light bg-white shadow-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Code Reviews</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">18</p>
                  <p className="text-xs text-slate-600 mt-1">Completed</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <span className="material-symbols-outlined text-emerald-600 text-[32px]">done_all</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Contribution Table */}
        <div className="mb-8 rounded-2xl border border-border-light bg-white shadow-lg overflow-hidden">
          <div className="px-8 py-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">KPI Contribution Detail</h3>
              <p className="text-sm text-slate-500 mt-0.5">Your performance breakdown by week</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th rowSpan={2} className="text-left px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Member's Name</th>
                  <th rowSpan={2} className="text-center px-4 py-3 font-semibold text-slate-600 whitespace-nowrap border-r border-slate-200">Weight Role</th>
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((w) => (
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
                  {['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'].map((w) => (
                    <React.Fragment key={w}>
                      <th className="text-center px-3 py-2 font-medium text-blue-600 whitespace-nowrap border-r border-slate-100 text-xs">Task</th>
                      <th className="text-center px-3 py-2 font-medium text-red-500 whitespace-nowrap border-r border-slate-200 text-xs">Bug</th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 border-r border-slate-100">
                    <div className="flex items-center gap-2">
                      <img src="https://picsum.photos/seed/user/40/40" alt="" className="w-7 h-7 rounded-full border border-slate-200" />
                      <span className="font-medium text-slate-800 whitespace-nowrap">{user?.fullname || 'You'}</span>
                    </div>
                  </td>
                  <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">1.0</td>
                  {/* Week 1 */}
                  <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-100">5</td>
                  <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-200">1</td>
                  {/* Week 2 */}
                  <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-100">6</td>
                  <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-200">0</td>
                  {/* Week 3 */}
                  <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-100">4</td>
                  <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-200">2</td>
                  {/* Week 4 */}
                  <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-100">7</td>
                  <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-200">1</td>
                  {/* Week 5 */}
                  <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-100">5</td>
                  <td className="text-center px-3 py-3 text-slate-700 border-r border-slate-200">0</td>
                  {/* Summary */}
                  <td className="text-center px-4 py-3 font-semibold text-blue-600 border-r border-slate-100">3.5</td>
                  <td className="text-center px-4 py-3 font-semibold text-purple-600 border-r border-slate-100">2.0</td>
                  <td className="text-center px-4 py-3 font-bold text-primary border-r border-slate-100">7.8</td>
                  <td className="text-center px-4 py-3 border-r border-slate-100">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">Yes</span>
                  </td>
                  <td className="text-center px-4 py-3 text-slate-700 border-r border-slate-100">95%</td>
                  <td className="text-center px-4 py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Active</span>
                  </td>
                </tr>
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

export default Dashboard;
