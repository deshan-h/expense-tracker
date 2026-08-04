import React, { useState, useEffect } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LabelList } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, Clock, Handshake, RefreshCw, PiggyBank, CalendarClock } from 'lucide-react';
import { PieChart as PieChartIcon } from 'lucide-react';
import { getIconComponent, getIconColor } from '../utils/icons';

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

const DashboardTab = ({ 
  transactions: liveTransactions = [], 
  totalIncome: liveTotalIncome = 0, 
  totalExpense: liveTotalExpense = 0, 
  netBalance: liveNetBalance = 0, 
  totalPendingLent: liveTotalPendingLent = 0, 
  totalSavings: liveTotalSavings = 0,
  thisMonthWithdrawals: liveThisMonthWithdrawals = 0,
  thisMonthPlanned: liveThisMonthPlanned = 0,
  schedules: liveSchedules = [],
  lentMoney: liveLentMoney = [], 
  savings: liveSavings = [],
  formatLKR, 
  chartData, 
  COLORS,
  handleSyncPOS,
  isSyncing,
  lastSyncTimeStr,
  categories = []
}) => {

  // Auto-refresh Time Ago
  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000); // refresh every minute
    return () => clearInterval(timer);
  }, []);

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Never';
    const seconds = Math.floor((now - new Date(dateStr).getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    let interval = seconds / 31536000;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " yr ago" : " yrs ago");
    interval = seconds / 2592000;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " mo ago" : " mos ago");
    interval = seconds / 86400;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hr ago" : " hrs ago");
    interval = seconds / 60;
    return Math.floor(interval) + (Math.floor(interval) === 1 ? " min ago" : " mins ago");
  };

  // Local Storage Cache System
  const CACHE_KEY = 'dashboard_data_cache';
  
  const liveData = {
    transactions: liveTransactions,
    totalIncome: liveTotalIncome,
    totalExpense: liveTotalExpense,
    netBalance: liveNetBalance,
    totalPendingLent: liveTotalPendingLent,
    totalSavings: liveTotalSavings,
    thisMonthWithdrawals: liveThisMonthWithdrawals,
    thisMonthPlanned: liveThisMonthPlanned,
    schedules: liveSchedules,
    lentMoney: liveLentMoney,
    savings: liveSavings
  };

  const [displayData, setDisplayData] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try { return JSON.parse(cached); } catch (e) { return null; }
    }
    return null;
  });

  const [lastRefreshed, setLastRefreshed] = useState(() => {
    const cachedTime = localStorage.getItem(`${CACHE_KEY}_time`);
    return cachedTime ? parseInt(cachedTime, 10) : Date.now();
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [cashFlowFilter, setCashFlowFilter] = useState('month'); // 'week' | 'month'

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setDisplayData(liveData);
      const nowTime = Date.now();
      setLastRefreshed(nowTime);
      localStorage.setItem(CACHE_KEY, JSON.stringify(liveData));
      localStorage.setItem(`${CACHE_KEY}_time`, nowTime.toString());
      setIsRefreshing(false);
    }, 600);
  };



  const currentData = displayData || liveData;
  const {
    transactions = [], totalIncome = 0, totalExpense = 0, netBalance = 0, totalPendingLent = 0, 
    totalSavings = 0, thisMonthWithdrawals = 0, thisMonthPlanned = 0, schedules = [], lentMoney = [], savings = []
  } = currentData;

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
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, Income: 0, Expense: 0, Lent: 0, Planned: 0 };
    acc[dateStr][curr.type] += curr.amount;
    return acc;
  }, {});

  const thisMonthLentFlow = lentMoney.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  
  thisMonthLentFlow.forEach(curr => {
    const dateStr = new Date(curr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!groupedFlow[dateStr]) groupedFlow[dateStr] = { date: dateStr, Income: 0, Expense: 0, Lent: 0, Planned: 0 };
    groupedFlow[dateStr].Lent = (groupedFlow[dateStr].Lent || 0) + curr.amount;
  });

  const activeSchedules = schedules.filter(s => s.status === 'active');
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  activeSchedules.forEach(schedule => {
    let d = new Date(schedule.nextDate);
    let safetyCounter = 0; 
    while (d <= endOfMonth && safetyCounter < 100) {
      safetyCounter++;
      if (d >= startOfMonth && d <= today) {
        const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        if (!groupedFlow[dateStr]) groupedFlow[dateStr] = { date: dateStr, Income: 0, Expense: 0, Lent: 0, Planned: 0 };
        groupedFlow[dateStr].Planned = (groupedFlow[dateStr].Planned || 0) + schedule.amount;
      }
      if (schedule.frequency === 'Once') break;
      else if (schedule.frequency === 'Daily') d.setDate(d.getDate() + 1);
      else if (schedule.frequency === 'Weekly') d.setDate(d.getDate() + 7);
      else if (schedule.frequency === 'Monthly') d.setMonth(d.getMonth() + 1);
      else if (schedule.frequency === 'Yearly') d.setFullYear(d.getFullYear() + 1);
      else break;
    }
  });

  // --- THIS WEEK CALCULATIONS ---
  const startOfWeek = new Date(today);
  const dayOfWeek = startOfWeek.getDay();
  const diffToMonday = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  startOfWeek.setDate(diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  let thisWeekIncome = 0;
  let thisWeekExpense = 0;
  let thisWeekLent = 0;
  let thisWeekPlanned = 0;

  // Generate Cash Flow Data based on filter
  const cashFlowArray = [];
  
  if (cashFlowFilter === 'month') {
    const currentDate = today.getDate(); // 1 to 31
    for (let i = 1; i <= currentDate; i++) {
      const d = new Date(currentYear, currentMonth, i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dayStr = String(i).padStart(2, '0');
      if (groupedFlow[dateStr]) {
        cashFlowArray.push({
          date: dateStr,
          day: dayStr,
          Income: groupedFlow[dateStr].Income || 0,
          Expense: groupedFlow[dateStr].Expense || 0,
          Lent: groupedFlow[dateStr].Lent || 0,
          Planned: groupedFlow[dateStr].Planned || 0
        });
      } else {
        cashFlowArray.push({ date: dateStr, day: dayStr, Income: 0, Expense: 0, Lent: 0, Planned: 0 });
      }
    }
    
    // Still need to calculate thisWeek* for the UI if week is selected
    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d >= startOfWeek && d <= endOfWeek) {
        if (t.type === 'Income' || t.type === 'POS Income') thisWeekIncome += t.amount;
        else if (t.type === 'Expense') thisWeekExpense += t.amount;
      }
    });
    
    lentMoney.forEach(t => {
      const d = new Date(t.date);
      if (d >= startOfWeek && d <= endOfWeek) {
        thisWeekLent += t.amount;
      }
    });
    
    activeSchedules.forEach(schedule => {
      let d = new Date(schedule.nextDate);
      let safetyCounter = 0; 
      while (d <= endOfWeek && safetyCounter < 100) {
        safetyCounter++;
        if (d >= startOfWeek && d <= endOfWeek) {
          thisWeekPlanned += schedule.amount;
        }
        if (schedule.frequency === 'Once') break;
        else if (schedule.frequency === 'Daily') d.setDate(d.getDate() + 1);
        else if (schedule.frequency === 'Weekly') d.setDate(d.getDate() + 7);
        else if (schedule.frequency === 'Monthly') d.setMonth(d.getMonth() + 1);
        else if (schedule.frequency === 'Yearly') d.setFullYear(d.getFullYear() + 1);
        else break;
      }
    });

  } else {
    // Week
    const currentDayOfWeek = today.getDay() || 7; // 1-7 (Mon-Sun)
    for (let i = 0; i < currentDayOfWeek; i++) {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dayStr = d.toLocaleDateString(undefined, { weekday: 'short' }); // Mon, Tue, etc
      
      // Calculate data for this specific day using all transactions
      let dayIncome = 0;
      let dayExpense = 0;
      let dayLent = 0;
      let dayPlanned = 0;
      
      transactions.forEach(t => {
        const td = new Date(t.date);
        if (td.toDateString() === d.toDateString()) {
          if (t.type === 'Income' || t.type === 'POS Income') dayIncome += t.amount;
          else if (t.type === 'Expense') dayExpense += t.amount;
        }
      });
      
      lentMoney.forEach(t => {
        const td = new Date(t.date);
        if (td.toDateString() === d.toDateString()) {
          dayLent += t.amount;
        }
      });
      
      activeSchedules.forEach(schedule => {
        let sd = new Date(schedule.nextDate);
        let safetyCounter = 0; 
        while (sd <= d && safetyCounter < 100) {
          safetyCounter++;
          if (sd.toDateString() === d.toDateString()) {
            dayPlanned += schedule.amount;
          }
          if (schedule.frequency === 'Once') break;
          else if (schedule.frequency === 'Daily') sd.setDate(sd.getDate() + 1);
          else if (schedule.frequency === 'Weekly') sd.setDate(sd.getDate() + 7);
          else if (schedule.frequency === 'Monthly') sd.setMonth(sd.getMonth() + 1);
          else if (schedule.frequency === 'Yearly') sd.setFullYear(sd.getFullYear() + 1);
          else break;
        }
      });
      
      thisWeekIncome += dayIncome;
      thisWeekExpense += dayExpense;
      thisWeekLent += dayLent;
      thisWeekPlanned += dayPlanned;
      
      cashFlowArray.push({
        date: dateStr,
        day: dayStr,
        Income: dayIncome,
        Expense: dayExpense,
        Lent: dayLent,
        Planned: dayPlanned
      });
    }
  }

  // Calculate This Month totals
  let thisMonthIncome = 0;
  let thisMonthLentSum = 0;
  Object.values(groupedFlow).forEach(dayData => {
    thisMonthIncome += dayData.Income;
    thisMonthLentSum += dayData.Lent;
  });

  const displayedIncome = cashFlowFilter === 'week' ? thisWeekIncome : thisMonthIncome;
  const displayedExpense = cashFlowFilter === 'week' ? thisWeekExpense : thisMonthExpenses;
  const displayedLent = cashFlowFilter === 'week' ? thisWeekLent : thisMonthLentSum;
  const displayedPlanned = cashFlowFilter === 'week' ? thisWeekPlanned : thisMonthPlanned;

  // Process data for Expenses by Category (This Month)
  const thisMonthExpensesTransactions = transactions.filter(t => {
    if (t.type !== 'Expense') return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const categoryBreakdownData = {};
  
  thisMonthExpensesTransactions.forEach(t => {
    const cat = t.category || 'Other';
    const subcat = t.subcategory || 'Other';
    
    if (!categoryBreakdownData[cat]) {
      categoryBreakdownData[cat] = {
        total: 0,
        subcategories: {}
      };
    }
    

    categoryBreakdownData[cat].total += t.amount;
    categoryBreakdownData[cat].subcategories[subcat] = (categoryBreakdownData[cat].subcategories[subcat] || 0) + t.amount;
  });

  const advancedCategoryCards = Object.entries(categoryBreakdownData)
    .sort((a, b) => b[1].total - a[1].total)
    .map(([catName, data], catIndex) => {
      const catObj = categories.find(c => c.name === catName);
      const iconName = catObj ? catObj.icon : 'Folder';
      
      const subcats = Object.entries(data.subcategories)
        .sort((a, b) => b[1] - a[1])
        .map(([subName, val], index) => ({
          name: subName,
          value: val,
          color: COLORS[(catIndex * 3 + index) % COLORS.length]
        }));
      
      return {
        category: catName,
        icon: iconName,
        total: data.total,
        subcategories: subcats
      };
    });

  // Process data for Yearly Overview Chart (BarChart)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const yearlyData = months.map(m => ({ month: m, Income: 0, Expense: 0, Lent: 0, 'Net Savings': 0, Deposit: 0, Withdrawal: 0 }));

  const thisYearTransactions = transactions.filter(t => new Date(t.date).getFullYear() === currentYear);
  thisYearTransactions.forEach(t => {
    const monthIndex = new Date(t.date).getMonth();
    if (t.type === 'Income' || t.type === 'Expense') {
      yearlyData[monthIndex][t.type] += t.amount;
    }
  });

  const thisYearLent = lentMoney.filter(t => new Date(t.date).getFullYear() === currentYear);
  thisYearLent.forEach(t => {
    const monthIndex = new Date(t.date).getMonth();
    yearlyData[monthIndex].Lent += t.amount;
  });

  const thisYearSavings = savings.filter(t => {
    const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    return d.getFullYear() === currentYear;
  });
  thisYearSavings.forEach(t => {
    const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    const monthIndex = d.getMonth();
    if (t.type === 'Deposit') {
      yearlyData[monthIndex].Deposit += t.amount;
    } else if (t.type === 'Withdrawal') {
      yearlyData[monthIndex].Withdrawal += t.amount;
    }
  });

  // Calculate Net Savings for each month
  yearlyData.forEach(data => {
    data['Net Savings'] = data.Deposit - data.Withdrawal;
  });

  // Process Recent Activity
  const formatCompact = (value) => {
    if (!value) return "0.00";
    if (Math.abs(value) >= 1000000) {
      return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(value);
    }
    return formatLKR(value);
  };

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-950/50 border-y border-gray-800/80 shadow-2xl backdrop-blur-sm">
      <div className="px-4 md:px-8 pb-8 pt-14 space-y-8 w-full max-w-full">
      
        {/* Dashboard Top Bar */}
        <div className="absolute top-3 right-4 md:right-10 z-50">
          <div className="flex items-center gap-4 bg-gray-900/80 backdrop-blur-md border border-gray-700/50 rounded-full py-1.5 px-3 shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                Updated: <span className="text-gray-200">{timeAgo(lastRefreshed)}</span>
              </span>
            </div>
            <div className="w-px h-3 bg-gray-700"></div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-all active:scale-95 disabled:opacity-50 group"
            >
              <RefreshCw className={`w-3.5 h-3.5 transition-transform duration-500 ${isRefreshing ? 'animate-spin' : 'group-hover:rotate-180'}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      
        {/* 1. TOP ROW: COMMAND CENTER METRICS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4 mx-auto">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-5 rounded-[1.25rem] border border-gray-800 hover:border-rose-500/40 hover:bg-gray-800/60 shadow-xl relative overflow-hidden group transition-all duration-500 flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-[60px] group-hover:bg-rose-500/30 transition-all duration-700"></div>
          
          <div className="flex items-start gap-4 w-full relative z-10">
            <div className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-inner group-hover:scale-110 group-hover:border-rose-500/50 transition-all duration-500 flex-shrink-0">
              <Clock className="w-6 h-6 text-rose-400 drop-shadow-md" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-rose-300 transition-colors truncate">Today Expenses</p>
              <h2 title={`Rs. ${formatLKR(todayExpenses)}`} className="text-xl sm:text-2xl lg:text-3xl xl:text-xl 2xl:text-2xl font-black text-white tracking-tight drop-shadow-md truncate">
                {formatCompact(todayExpenses)}
              </h2>
            </div>
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-gray-700/80 via-rose-800/30 to-transparent my-4 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex justify-between items-center w-full z-10 relative mt-auto">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.1em] group-hover:text-rose-300 transition-colors">
              This Month
            </span>
            <span title={`Rs. ${formatLKR(thisMonthExpenses)}`} className="text-sm font-black text-gray-200 tracking-wide">
              {formatCompact(thisMonthExpenses)}
            </span>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-5 rounded-[1.25rem] border border-gray-800 hover:border-emerald-500/40 hover:bg-gray-800/60 shadow-xl relative overflow-hidden group transition-all duration-500 flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-[60px] group-hover:bg-emerald-500/30 transition-all duration-700"></div>
          
          <div className="flex items-start gap-4 w-full relative z-10">
            <div className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-inner group-hover:scale-110 group-hover:border-emerald-500/50 transition-all duration-500 flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-emerald-400 drop-shadow-md" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-1">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] group-hover:text-emerald-300 transition-colors truncate">Total Income</p>
              </div>
              <h2 title={`Rs. ${formatLKR(totalIncome)}`} className="text-xl sm:text-2xl lg:text-3xl xl:text-xl 2xl:text-2xl font-black text-white tracking-tight drop-shadow-md truncate">
                {formatCompact(totalIncome)}
              </h2>
            </div>
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-gray-700/80 via-emerald-800/30 to-transparent my-4 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex justify-between items-center w-full z-10 relative mt-auto">
            <span className="text-[11px] text-gray-400 font-medium tracking-wide whitespace-nowrap overflow-hidden text-ellipsis mr-2" title={`Business Sync : ${timeAgo(lastSyncTimeStr)}`}>
              Business Sync : {timeAgo(lastSyncTimeStr)}
            </span>
            <button 
              onClick={handleSyncPOS} 
              disabled={isSyncing}
              className="text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-50 shrink-0"
              title="Sync POS"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} /> 
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-5 rounded-[1.25rem] border border-gray-800 hover:border-amber-500/40 hover:bg-gray-800/60 shadow-xl relative overflow-hidden group transition-all duration-500 flex items-start gap-4"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-[60px] group-hover:bg-amber-500/30 transition-all duration-700"></div>
          <div className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-inner group-hover:scale-110 group-hover:border-amber-500/50 transition-all duration-500 z-10 flex-shrink-0">
            <CalendarClock className="w-6 h-6 text-amber-400 drop-shadow-md" />
          </div>
          <div className="z-10 relative flex-1 min-w-0">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-amber-300 transition-colors truncate">Planned</p>
            <h2 title={`Rs. ${formatLKR(thisMonthPlanned)}`} className="text-xl sm:text-2xl lg:text-3xl xl:text-xl 2xl:text-2xl font-black text-white tracking-tight drop-shadow-md truncate">
              {formatCompact(thisMonthPlanned)}
            </h2>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-5 rounded-[1.25rem] border border-gray-800 hover:border-blue-500/40 hover:bg-gray-800/60 shadow-xl relative overflow-hidden group transition-all duration-500 flex items-start gap-4"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[60px] group-hover:bg-blue-500/30 transition-all duration-700"></div>
          <div className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-inner group-hover:scale-110 group-hover:border-blue-500/50 transition-all duration-500 z-10 flex-shrink-0">
            <Handshake className="w-6 h-6 text-blue-400 drop-shadow-md" />
          </div>
          <div className="z-10 relative flex-1 min-w-0">
            <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-blue-300 transition-colors truncate">Total Lent</p>
            <h2 title={`Rs. ${formatLKR(totalPendingLent)}`} className="text-xl sm:text-2xl lg:text-3xl xl:text-xl 2xl:text-2xl font-black text-white tracking-tight drop-shadow-md truncate">
              {formatCompact(totalPendingLent)}
            </h2>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-5 rounded-[1.25rem] border border-gray-800 hover:border-pink-500/40 hover:bg-gray-800/60 shadow-xl relative overflow-hidden group transition-all duration-500 flex flex-col"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-[60px] group-hover:bg-pink-500/30 transition-all duration-700"></div>
          
          <div className="flex items-start gap-4 w-full relative z-10">
            <div className="p-3 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl border border-gray-700 shadow-inner group-hover:scale-110 group-hover:border-pink-500/50 transition-all duration-500 flex-shrink-0">
              <PiggyBank className="w-6 h-6 text-pink-400 drop-shadow-md" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em] mb-1 group-hover:text-pink-300 transition-colors truncate">Total Savings</p>
              <h2 title={`Rs. ${formatLKR(totalSavings)}`} className="text-xl sm:text-2xl lg:text-3xl xl:text-xl 2xl:text-2xl font-black text-white tracking-tight drop-shadow-md truncate">
                {formatCompact(totalSavings)}
              </h2>
            </div>
          </div>
          
          <div className="w-full h-px bg-gradient-to-r from-gray-700/80 via-pink-800/30 to-transparent my-4 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"></div>
          
          <div className="flex justify-between items-center w-full z-10 relative mt-auto">
            <span className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.1em] group-hover:text-pink-300 transition-colors">
              Withdrawals
            </span>
            <span title={`Rs. ${formatLKR(thisMonthWithdrawals)}`} className="text-sm font-black text-gray-200 tracking-wide">
              {formatCompact(thisMonthWithdrawals)}
            </span>
          </div>
        </motion.div>

      </div>

      {/* 2. MIDDLE ROW: ANALYTICS CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cash Flow AreaChart */}
        <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl lg:col-span-2 relative overflow-hidden group transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] group-hover:bg-blue-500/20 transition-all duration-700"></div>
          
          <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-8 relative z-10 gap-6">
            <div className="flex flex-col gap-3">
              <h3 className="text-[13px] md:text-sm font-bold tracking-[0.15em] uppercase text-gray-200">
                Cash Flow Overview <span className="text-gray-500">({cashFlowFilter === 'week' ? 'THIS WEEK' : 'THIS MONTH'})</span>
              </h3>
              <div className="flex bg-[#0f172a] rounded-lg p-1 border border-gray-800/80 w-max shadow-inner">
                <button 
                  onClick={() => setCashFlowFilter('week')}
                  className={`px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${cashFlowFilter === 'week' ? 'bg-[#064e3b] text-[#34d399]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  THIS WEEK
                </button>
                <button 
                  onClick={() => setCashFlowFilter('month')}
                  className={`px-4 py-1.5 text-[10px] md:text-xs font-bold rounded-md transition-all ${cashFlowFilter === 'month' ? 'bg-[#064e3b] text-[#34d399]' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  THIS MONTH
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-4 bg-[#0f172a]/80 py-3 px-5 rounded-xl border border-gray-800/60 shadow-lg w-full xl:w-auto overflow-x-auto hide-scrollbar">
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Total Income</span>
                <span className="text-sm md:text-base font-black text-[#34d399] whitespace-nowrap">Rs {formatLKR(displayedIncome)}</span>
              </div>
              <div className="w-px h-8 bg-gray-700/50 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Total Expenses</span>
                <span className="text-sm md:text-base font-black text-rose-400 whitespace-nowrap">Rs {formatLKR(displayedExpense)}</span>
              </div>
              <div className="w-px h-8 bg-gray-700/50 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Total Lent</span>
                <span className="text-sm md:text-base font-black text-blue-400 whitespace-nowrap">Rs {formatLKR(displayedLent)}</span>
              </div>
              <div className="w-px h-8 bg-gray-700/50 hidden md:block"></div>
              <div className="flex flex-col">
                <span className="text-[9px] md:text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Total Planned</span>
                <span className="text-sm md:text-base font-black text-amber-500 whitespace-nowrap">Rs {formatLKR(displayedPlanned)}</span>
              </div>
            </div>
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
                    <linearGradient id="colorLent" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPlanned" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#4b5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={10} minTickGap={5} />
                  <YAxis stroke="#4b5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(val) => val === 0 ? 'Rs0' : val} />
                  <Tooltip content={<CustomAreaTooltip formatLKR={formatLKR} />} cursor={{ stroke: '#4b5563', strokeWidth: 1, strokeDasharray: '5 5' }} />
                  <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                  <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }} />
                  <Area type="monotone" dataKey="Lent" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLent)" activeDot={{ r: 6, strokeWidth: 0, fill: '#3b82f6' }} />
                  <Area type="monotone" dataKey="Planned" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorPlanned)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f59e0b' }} />
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
      
      {/* EXPENSE BREAKDOWN */}
      <div className="w-full mb-10 mt-6 relative z-10 bg-gray-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[1.5rem] border border-gray-800 shadow-xl overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] group-hover:bg-indigo-500/20 transition-all duration-700 pointer-events-none"></div>
        <h3 className="text-[13px] md:text-sm font-bold tracking-[0.15em] uppercase text-gray-200 mb-8 flex items-center gap-2 pl-2">
          <PieChartIcon className="w-4 h-4 text-indigo-400" />
          EXPENSE BREAKDOWN <span className="text-gray-500">(THIS MONTH)</span>
        </h3>
        
        {advancedCategoryCards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {advancedCategoryCards.map((cat, idx) => {
              const IconComp = getIconComponent(cat.icon);
              const iconColors = getIconColor(cat.icon);
              return (
              <div key={idx} className="bg-[#0b1120] border border-gray-800/80 rounded-2xl overflow-hidden flex flex-col shadow-xl hover:border-gray-700/60 transition-colors">
                {/* Card Header */}
                <div className="flex justify-between items-center p-4 pb-3 border-b border-gray-800/40 bg-[#0f172a]/30">
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-200">
                    <div className={`p-1.5 rounded-md ${iconColors.bg}`}>
                      <IconComp className={`w-3.5 h-3.5 ${iconColors.color}`} />
                    </div>
                    {cat.category}
                  </div>
                  <div className="text-sm font-black text-rose-400 tracking-wide">
                    Rs {formatCompact(cat.total)}
                  </div>
                </div>
                
                {/* Card Body */}
                <div className="p-5 flex items-center gap-6">
                  {/* Donut Chart */}
                  <div className="w-[100px] h-[100px] flex-shrink-0 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={cat.subcategories}
                          cx="50%"
                          cy="50%"
                          innerRadius={28}
                          outerRadius={44}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {cat.subcategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.95)', backdropFilter: 'blur(16px)', borderRadius: '0.75rem', border: '1px solid rgba(55, 65, 81, 0.5)', padding: '6px 10px' }} 
                          itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}
                          formatter={(value) => `Rs. ${formatCompact(value)}`} 
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {/* Subcategories List */}
                  <div className="flex-1 flex flex-col gap-3 overflow-y-auto max-h-[110px] hide-scrollbar pr-1">
                    {cat.subcategories.map((sub, sIdx) => (
                      <div key={sIdx} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: sub.color }}></div>
                          <span className="text-gray-400 truncate tracking-wide">{sub.name}</span>
                        </div>
                        <span className="text-gray-300 font-bold ml-3 flex-shrink-0">Rs {formatCompact(sub.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        ) : (
           <div className="w-full flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-900/30 rounded-2xl border border-dashed border-gray-700 py-12">
             <PieChartIcon className="w-12 h-12 text-gray-700 mb-4" />
             <p>No expenses this month.</p>
           </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 gap-6 pb-4">
        
        {/* Yearly Overview Chart */}
        <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl relative overflow-hidden group transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] group-hover:bg-cyan-500/20 transition-all duration-700"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-xl font-bold flex items-center gap-3 text-white">
              <div className="p-2 bg-cyan-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-cyan-400" />
              </div>
              Yearly Overview
            </h3>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/20">This Year</span>
          </div>
          
          <div className="h-[220px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#4b5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#4b5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(val) => val === 0 ? 'Rs0' : formatCompact(val)} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                  contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '1rem', border: '1px solid rgba(55, 65, 81, 0.5)' }} 
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }} 
                  formatter={(value) => `Rs. ${formatLKR(value)}`} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', paddingTop: '20px' }} />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={8} />
                <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={8} />
                <Bar dataKey="Lent" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={8} />
                <Bar dataKey="Net Savings" fill="#d946ef" radius={[4, 4, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 4. SAVINGS TREND */}
      <div className="grid grid-cols-1 gap-6 pb-4 mt-6">
        <div className="bg-gray-900/40 backdrop-blur-xl p-8 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl flex flex-col relative overflow-hidden group transition-all duration-500">
          <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[80px] group-hover:bg-pink-500/20 transition-all duration-700 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-sm font-bold flex items-center gap-3 text-white tracking-[0.1em] uppercase">
              <div className="p-2 bg-pink-500/10 rounded-xl">
                <PiggyBank className="w-4 h-4 text-pink-400" />
              </div>
              Savings Trend (This Year)
            </h3>
          </div>
          
          <div className="w-full h-[250px] relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={yearlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorWithdrawal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#4b5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#4b5563" fontSize={11} fontWeight={600} tickLine={false} axisLine={false} tickFormatter={(val) => val === 0 ? 'Rs0' : formatCompact(val)} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(16px)', borderRadius: '1rem', border: '1px solid rgba(55, 65, 81, 0.5)' }} 
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }} 
                  formatter={(value) => `Rs. ${formatLKR(value)}`} 
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', paddingTop: '20px' }} />
                <Area type="monotone" dataKey="Deposit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDeposit)" activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }} />
                <Area type="monotone" dataKey="Withdrawal" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorWithdrawal)" activeDot={{ r: 6, strokeWidth: 0, fill: '#f43f5e' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>



      </div>
    </div>
  );
};

export default DashboardTab;
