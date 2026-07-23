import React, { useState } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LabelList } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, Clock, Handshake, RefreshCw } from 'lucide-react';
import { PieChart as PieChartIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchNewSalesSum } from '../../utils/posSync';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

// Custom Tooltip for AreaChart
const CustomAreaTooltip = ({ active, payload, label, formatLKR }) => {
  if (active && payload && payload.length) {
    const dateStr = payload[0].payload.date;
    return (
      <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 p-4 rounded-2xl shadow-2xl">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">{dateStr}</p>
        <div className="space-y-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></div>
              <p className="text-sm font-bold text-white flex-1">
                {entry.name}: <span style={{ color: entry.color }}>Rs. {formatLKR(entry.value)}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const DashboardTab = ({ transactions, totalIncome, totalExpense, netBalance, totalPendingLent, lentMoney = [], formatLKR, chartData, COLORS }) => {

  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncPOS = async () => {
    setIsSyncing(true);
    try {
      const lastSync = localStorage.getItem('lastPosSyncTimestamp');
      toast.loading('Fetching new POS sales...', { id: 'dash-sync' });
      
      const result = await fetchNewSalesSum(lastSync);
      
      if (result.success) {
        if (result.count === 0 || result.sum === 0) {
          toast.success('No new sales to sync!', { id: 'dash-sync' });
        } else {
          await addDoc(collection(db, 'transactions'), {
            type: 'Income',
            category: 'Business',
            subcategory: 'POS Batch Sync',
            amount: parseFloat(result.sum),
            description: `Last sync at ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            date: new Date().toISOString(),
            isTracked: true
          });
          
          if (result.latestTimestamp) {
            localStorage.setItem('lastPosSyncTimestamp', result.latestTimestamp);
            // Dispatch a custom event to notify IncomeTab to update its UI if needed
            window.dispatchEvent(new Event('pos-sync-completed'));
          }
          
          toast.success(`Successfully synced Rs. ${result.sum.toLocaleString()}!`, { id: 'dash-sync' });
        }
      } else {
        toast.error('Failed to connect to POS database', { id: 'dash-sync' });
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while syncing.', { id: 'dash-sync' });
    } finally {
      setIsSyncing(false);
    }
  };

  // New Metrics Calculations
  const today = new Date();
  const todayStr = today.toDateString();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const todayExpenses = transactions
    .filter(t => t.type === 'Expense' && new Date(t.date).toDateString() === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisMonthExpenses = transactions
    .filter(t => {
      if (t.type !== 'Expense') return false;
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Process data for Cash Flow AreaChart (This Month)
  const thisMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Group by date string
  const groupedFlow = thisMonthTransactions.reduce((acc, curr) => {
    const dateStr = new Date(curr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, Income: 0, Expense: 0 };
    acc[dateStr][curr.type] += curr.amount;
    return acc;
  }, {});

  // Generate all dates from 1st to today
  const cashFlowArray = [];
  const currentDate = today.getDate(); // 1 to 31
  
  for (let i = 1; i <= currentDate; i++) {
    const d = new Date(currentYear, currentMonth, i);
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const dayStr = String(i).padStart(2, '0');
    if (groupedFlow[dateStr]) {
      cashFlowArray.push({ ...groupedFlow[dateStr], day: dayStr });
    } else {
      cashFlowArray.push({ date: dateStr, day: dayStr, Income: 0, Expense: 0 });
    }
  }

  // Process data for Expenses by Category (This Month)
  const thisMonthExpensesTransactions = transactions.filter(t => {
    if (t.type !== 'Expense') return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const expensesByCategory = thisMonthExpensesTransactions.reduce((acc, curr) => {
    const cat = curr.category || 'Other';
    acc[cat] = (acc[cat] || 0) + curr.amount;
    return acc;
  }, {});

  const pieChartData = Object.keys(expensesByCategory)
    .map((key, index) => ({
      name: key,
      value: expensesByCategory[key],
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.value - a.value); // Sort highest first

  const expensesBySubCategory = thisMonthExpensesTransactions.reduce((acc, curr) => {
    const subcat = curr.subcategory || 'Other';
    acc[subcat] = (acc[subcat] || 0) + curr.amount;
    return acc;
  }, {});

  const subCategoryChartData = Object.keys(expensesBySubCategory)
    .map((key, index) => ({
      name: key,
      value: expensesBySubCategory[key],
      color: COLORS[index % COLORS.length]
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Show top 10

  // Process data for Lent Chart (This Month)
  const thisMonthLent = lentMoney.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const groupedLent = thisMonthLent.reduce((acc, curr) => {
    const dateStr = new Date(curr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, Lent: 0 };
    acc[dateStr].Lent += curr.amount;
    return acc;
  }, {});

  const lentFlowArray = [];
  for (let i = 1; i <= currentDate; i++) {
    const d = new Date(currentYear, currentMonth, i);
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    const dayStr = String(i).padStart(2, '0');
    if (groupedLent[dateStr]) {
      lentFlowArray.push({ ...groupedLent[dateStr], day: dayStr });
    } else {
      lentFlowArray.push({ date: dateStr, day: dayStr, Lent: 0 });
    }
  }

  // Process Recent Activity
  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-950/50 border-y border-gray-800/80 shadow-2xl backdrop-blur-sm">
      <div className="px-4 md:px-8 py-8 space-y-8 w-full max-w-full">
      
        {/* 1. TOP ROW: COMMAND CENTER METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-8 mx-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-900/40 backdrop-blur-xl p-5 md:p-6 rounded-[1.5rem] border border-gray-800 hover:border-rose-500/40 hover:bg-gray-800/60 shadow-xl relative overflow-hidden group transition-all duration-500 flex items-center gap-5"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-[60px] group-hover:bg-rose-500/30 transition-all duration-700"></div>
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-inner group-hover:scale-110 group-hover:border-rose-500/50 transition-all duration-500 z-10 flex-shrink-0">
            <Clock className="w-7 h-7 text-rose-400 drop-shadow-md" />
          </div>
          <div className="z-10 relative">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-rose-300 transition-colors">Today Expenses</p>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
              <span className="text-sm text-gray-500 mr-1 font-bold">Rs.</span>
              {formatLKR(todayExpenses)}
            </h2>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-gray-900/40 backdrop-blur-xl p-5 md:p-6 rounded-[1.5rem] border border-gray-800 hover:border-orange-500/40 hover:bg-gray-800/60 shadow-xl relative overflow-hidden group transition-all duration-500 flex items-center gap-5"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-[60px] group-hover:bg-orange-500/30 transition-all duration-700"></div>
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-inner group-hover:scale-110 group-hover:border-orange-500/50 transition-all duration-500 z-10 flex-shrink-0">
            <TrendingDown className="w-7 h-7 text-orange-400 drop-shadow-md" />
          </div>
          <div className="z-10 relative">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-orange-300 transition-colors">This Month</p>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
              <span className="text-sm text-gray-500 mr-1 font-bold">Rs.</span>
              {formatLKR(thisMonthExpenses)}
            </h2>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-900/40 backdrop-blur-xl p-5 md:p-6 rounded-[1.5rem] border border-gray-800 hover:border-emerald-500/40 hover:bg-gray-800/60 shadow-xl relative overflow-hidden group transition-all duration-500 flex items-center gap-5"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px] group-hover:bg-emerald-500/30 transition-all duration-700"></div>
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-inner group-hover:scale-110 group-hover:border-emerald-500/50 transition-all duration-500 z-10 flex-shrink-0">
            <TrendingUp className="w-7 h-7 text-emerald-400 drop-shadow-md" />
          </div>
          <div className="z-10 relative flex-1">
            <div className="flex justify-between items-center mb-1">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] group-hover:text-emerald-300 transition-colors">Total Income</p>
              <button 
                onClick={handleSyncPOS} 
                disabled={isSyncing}
                className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-md font-bold uppercase tracking-wider flex items-center gap-1 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> Sync
              </button>
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
              <span className="text-sm text-gray-500 mr-1 font-bold">Rs.</span>
              {formatLKR(totalIncome)}
            </h2>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-900/40 backdrop-blur-xl p-5 md:p-6 rounded-[1.5rem] border border-gray-800 hover:border-blue-500/40 hover:bg-gray-800/60 shadow-xl relative overflow-hidden group transition-all duration-500 flex items-center gap-5"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[60px] group-hover:bg-blue-500/30 transition-all duration-700"></div>
          <div className="p-4 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-inner group-hover:scale-110 group-hover:border-blue-500/50 transition-all duration-500 z-10 flex-shrink-0">
            <Handshake className="w-7 h-7 text-blue-400 drop-shadow-md" />
          </div>
          <div className="z-10 relative">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-blue-300 transition-colors">Total Lent</p>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
              <span className="text-sm text-gray-500 mr-1 font-bold">Rs.</span>
              {formatLKR(totalPendingLent)}
            </h2>
          </div>
        </motion.div>

      </div>

      {/* 2. MIDDLE ROW: ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow AreaChart */}
        <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl lg:col-span-2 relative overflow-hidden group transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-blue-400" />
              </div>
              Cash Flow Overview
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20">This Month</span>
          </div>
          
          <div className="h-[350px] w-full relative z-10">
            {cashFlowArray.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#4b5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={10} minTickGap={5} />
                  <YAxis stroke="#4b5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(val) => val === 0 ? 'Rs0' : val} />
                  <Tooltip content={<CustomAreaTooltip formatLKR={formatLKR} />} cursor={{ stroke: '#4b5563', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }} />
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

        {/* Recent Activity Timeline (Moved from bottom) */}
        <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl flex flex-col max-h-[466px] relative overflow-hidden group transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] group-hover:bg-purple-500/20 transition-all duration-700"></div>

          <div className="flex items-center justify-between mb-8 flex-shrink-0 relative z-10">
            <h3 className="text-xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <Clock className="w-5 h-5 text-purple-400" />
              </div>
              Recent Activity
            </h3>
          </div>

          <div className="space-y-4 overflow-y-auto hide-scrollbar flex-1 pr-2 relative z-10">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 italic text-sm">No recent transactions.</p>
            ) : (
              recentTransactions.map(t => {
                const isIncome = t.type === 'Income';
                return (
                  <div key={t.id} className="flex items-center justify-between p-4 bg-gray-800/40 rounded-2xl border border-gray-700/50 hover:bg-gray-700/40 hover:border-gray-600/50 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl shadow-inner ${isIncome ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/10 border border-rose-500/20'}`}>
                        {isIncome ? <TrendingUp className={`w-5 h-5 text-emerald-400`} /> : <TrendingDown className={`w-5 h-5 text-rose-400`} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-100 text-sm md:text-base line-clamp-1 max-w-[120px]">{t.description || 'Untitled'}</h4>
                        <p className="text-xs text-gray-500 font-medium tracking-wide mt-0.5">{t.category} • {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className={`font-black whitespace-nowrap text-lg ${isIncome ? 'text-emerald-400' : 'text-white'}`}>
                      {isIncome ? '+' : '-'}Rs. {formatLKR(t.amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM ROW: INSIGHTS & ACTIVITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-4">
        
        {/* Expenses by Category Widget */}
        <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl flex flex-col relative overflow-hidden group lg:col-span-1 transition-all duration-500">
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-700"></div>
          
          <div className="relative z-10 mb-2">
            <h3 className="text-xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <PieChartIcon className="w-5 h-5 text-orange-400" />
              </div>
              Expense Breakdown
            </h3>
          </div>

          <div className="flex-1 min-h-[220px] relative z-10 -ml-4 flex items-center justify-center">
            {pieChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RechartsPieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '1rem', border: '1px solid rgba(55, 65, 81, 0.5)' }} 
                    itemStyle={{ color: '#fff', fontWeight: 'bold' }} 
                    formatter={(value) => `Rs. ${formatLKR(value)}`} 
                  />
                  <Legend 
                    layout="vertical" 
                    verticalAlign="middle" 
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-900/30 rounded-2xl border border-dashed border-gray-700 ml-4">
                <PieChartIcon className="w-12 h-12 text-gray-700 mb-4" />
                <p>No expenses this month.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Lent Overview Chart */}
        <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl lg:col-span-2 relative overflow-hidden group transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] group-hover:bg-cyan-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-cyan-500/10 rounded-xl">
                <Handshake className="w-5 h-5 text-cyan-400" />
              </div>
              Lent Overview
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/20">This Month</span>
          </div>
          
          <div className="h-[220px] w-full relative z-10">
            {lentFlowArray.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={lentFlowArray} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorLent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#4b5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={10} minTickGap={5} />
                  <YAxis stroke="#4b5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(val) => val === 0 ? 'Rs0' : val} />
                  <Tooltip content={<CustomAreaTooltip formatLKR={formatLKR} />} cursor={{ stroke: '#4b5563', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Area type="monotone" dataKey="Lent" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorLent)" activeDot={{ r: 6, strokeWidth: 0, fill: '#06b6d4' }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-900/30 rounded-2xl border border-dashed border-gray-700">
                <Handshake className="w-12 h-12 text-gray-700 mb-4" />
                <p>No data for money lent this month.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. DETAILED BREAKDOWNS (SUB-CATEGORIES) */}
      <div className="grid grid-cols-1 gap-6 pb-4 mt-6">
        {/* Expenses by Subcategory Chart */}
        <div className="bg-gray-900/40 backdrop-blur-xl p-8 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl flex flex-col relative overflow-hidden group transition-all duration-500">
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-sm font-bold flex items-center gap-3 text-white tracking-[0.1em] uppercase">
              Expense By Subcategory (This Month)
            </h3>
          </div>
          
          <div className="w-full relative z-10">
            {subCategoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={Math.max(300, subCategoryChartData.length * 45 + 50)}>
                 <BarChart layout="vertical" data={subCategoryChartData} margin={{ top: 0, right: 80, left: 20, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={150} tick={{ fill: '#9ca3af', fontSize: 13, fontWeight: 600 }} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '1rem', border: '1px solid rgba(55, 65, 81, 0.5)' }} itemStyle={{ color: '#fff', fontWeight: 'bold' }} formatter={(value) => `Rs. ${formatLKR(value)}`} />
                    <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={24}>
                      {subCategoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <LabelList dataKey="value" position="right" formatter={(val) => `Rs ${val}`} fill="#f3f4f6" fontSize={13} fontWeight={600} />
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-900/30 rounded-2xl border border-dashed border-gray-700">
                <p>No subcategory expenses this month.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      </div>
    </div>
  );
};

export default DashboardTab;
