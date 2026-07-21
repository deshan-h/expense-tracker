import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, Clock, Handshake } from 'lucide-react';
import { PieChart } from 'lucide-react';

// Custom Tooltip for AreaChart
const CustomAreaTooltip = ({ active, payload, label, formatLKR }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800 border border-gray-700 p-4 rounded-xl shadow-xl">
        <p className="text-gray-300 font-bold mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-semibold" style={{ color: entry.color }}>
            {entry.name}: Rs. {formatLKR(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardTab = ({ transactions, totalIncome, totalExpense, netBalance, totalPendingLent, formatLKR, chartData, COLORS }) => {

  // Process data for Cash Flow AreaChart (group by Date string)
  // Get last 14 active days
  const last30Days = [...transactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) // sort oldest to newest
    .reduce((acc, curr) => {
      const dateStr = new Date(curr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (!acc[dateStr]) acc[dateStr] = { date: dateStr, Income: 0, Expense: 0 };
      acc[dateStr][curr.type] += curr.amount;
      return acc;
    }, {});
  const cashFlowArray = Object.values(last30Days).slice(-14);

  // Process data for Tracking Health
  const expenseTransactions = transactions.filter(t => t.type === 'Expense');
  const trackedCount = expenseTransactions.filter(t => t.isTracked !== false).length;
  const untrackedCount = expenseTransactions.filter(t => t.isTracked === false).length;
  const trackingHealthPercentage = expenseTransactions.length > 0 
    ? Math.round((trackedCount / expenseTransactions.length) * 100) 
    : 100;

  // Process Recent Activity
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-8">
      
      {/* 1. TOP ROW: COMMAND CENTER METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-3xl border border-gray-700 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Available Balance</p>
          <h2 className={`text-3xl md:text-4xl font-black mt-2 tracking-tight ${netBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            <span className="text-xl text-gray-500 mr-1">Rs.</span>
            {formatLKR(netBalance)}
          </h2>
          <div className="absolute bottom-4 right-4 p-3 bg-gray-800 rounded-2xl border border-gray-700 shadow-inner">
            <DollarSign className="w-6 h-6 text-blue-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-3xl border border-gray-700 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Income</p>
          <h2 className="text-3xl font-black text-emerald-400 mt-2 tracking-tight">
             <span className="text-xl text-emerald-500/50 mr-1">Rs.</span>
             {formatLKR(totalIncome)}
          </h2>
          <div className="absolute bottom-4 right-4 p-3 bg-gray-800 rounded-2xl border border-gray-700 shadow-inner">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-3xl border border-gray-700 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-3xl group-hover:bg-rose-500/20 transition-all"></div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Expenses</p>
          <h2 className="text-3xl font-black text-rose-400 mt-2 tracking-tight">
             <span className="text-xl text-rose-500/50 mr-1">Rs.</span>
             {formatLKR(totalExpense)}
          </h2>
          <div className="absolute bottom-4 right-4 p-3 bg-gray-800 rounded-2xl border border-gray-700 shadow-inner">
            <TrendingDown className="w-6 h-6 text-rose-400" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-3xl border border-gray-700 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-all"></div>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Owed To You</p>
          <h2 className="text-3xl font-black text-amber-400 mt-2 tracking-tight">
             <span className="text-xl text-amber-500/50 mr-1">Rs.</span>
             {formatLKR(totalPendingLent)}
          </h2>
          <div className="absolute bottom-4 right-4 p-3 bg-gray-800 rounded-2xl border border-gray-700 shadow-inner">
            <Handshake className="w-6 h-6 text-amber-400" />
          </div>
        </div>

      </div>

      {/* 2. MIDDLE ROW: ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow AreaChart */}
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <Activity className="w-5 h-5 text-blue-400" /> Cash Flow Overview
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-900 px-3 py-1 rounded-full">Last 14 Active Days</span>
          </div>
          
          <div className="h-[350px] w-full">
            {cashFlowArray.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val > 1000 ? (val/1000).toFixed(0)+'k' : val}`} />
                  <Tooltip content={<CustomAreaTooltip formatLKR={formatLKR} />} />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-900/30 rounded-2xl border border-dashed border-gray-700">
                <Activity className="w-12 h-12 text-gray-700 mb-4" />
                <p>Not enough data for cash flow trend.</p>
              </div>
            )}
          </div>
        </div>

        {/* Category Donut Chart */}
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
            <PieChart className="w-5 h-5 text-purple-400" /> Expense Breakdown
          </h3>
          <div className="h-[350px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie 
                    data={chartData} 
                    cx="50%" cy="45%" 
                    innerRadius={80} 
                    outerRadius={120} 
                    paddingAngle={5} 
                    dataKey="value" 
                    stroke="none"
                    cornerRadius={8}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `Rs. ${formatLKR(value)}`} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '1rem', color: '#fff', fontWeight: 'bold' }} itemStyle={{ color: '#fff' }} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', fontWeight: '600', color: '#9ca3af' }}/>
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-900/30 rounded-2xl border border-dashed border-gray-700">
                <PieChart className="w-12 h-12 text-gray-700 mb-4" />
                <p>No expenses to breakdown.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. BOTTOM ROW: INSIGHTS & ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Tracking Health Widget */}
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-all"></div>
          
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2 text-white mb-2">
              <Target className="w-5 h-5 text-emerald-400" /> Tracking Health
            </h3>
            <p className="text-sm text-gray-400 mb-6">Percentage of properly tracked expenses.</p>
          </div>

          <div className="flex items-center justify-center relative">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" className="text-gray-700" strokeWidth="12" fill="none" stroke="currentColor" />
              <circle 
                cx="64" cy="64" r="56" 
                className="text-emerald-500" 
                strokeWidth="12" fill="none" stroke="currentColor" 
                strokeLinecap="round"
                strokeDasharray="351.8" 
                strokeDashoffset={351.8 - (351.8 * trackingHealthPercentage) / 100} 
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white">{trackingHealthPercentage}%</span>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between text-xs font-bold uppercase tracking-wider text-gray-500">
            <span>Tracked: {trackedCount}</span>
            <span>Untracked: {untrackedCount}</span>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-xl lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-purple-400" /> Recent Activity
            </h3>
          </div>

          <div className="space-y-4">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 italic text-sm">No recent transactions.</p>
            ) : (
              recentTransactions.map(t => {
                const isIncome = t.type === 'Income';
                return (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-gray-900/50 rounded-2xl border border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${isIncome ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        {isIncome ? <TrendingUp className={`w-5 h-5 text-emerald-400`} /> : <TrendingDown className={`w-5 h-5 text-rose-400`} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-100 text-sm md:text-base line-clamp-1">{t.description || 'Untitled'}</h4>
                        <p className="text-xs text-gray-500 font-medium">{t.category} • {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className={`font-black whitespace-nowrap ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                      {isIncome ? '+' : '-'}Rs. {formatLKR(t.amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default DashboardTab;
