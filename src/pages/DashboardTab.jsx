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
  wishlistItems: liveWishlistItems = [],
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
    savings: liveSavings,
    wishlistItems: liveWishlistItems
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
  const [showComparisonTable, setShowComparisonTable] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({});

  // Auto-refresh when entering the tab (on mount)
  useEffect(() => {
    setDisplayData(liveData);
    const nowTime = Date.now();
    setLastRefreshed(nowTime);
    localStorage.setItem(CACHE_KEY, JSON.stringify(liveData));
    localStorage.setItem(`${CACHE_KEY}_time`, nowTime.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  const categoryComparisonData = {};
  transactions.forEach(t => {
    if (t.type !== 'Expense') return;
    const d = new Date(t.date);
    const m = d.getMonth();
    const y = d.getFullYear();
    
    const isThisMonth = m === currentMonth && y === currentYear;
    const isLastMonth = m === lastMonth && y === lastMonthYear;
    
    if (!isThisMonth && !isLastMonth) return;

    const cat = t.category || 'Other';
    const subcat = t.subcategory || 'Other';
    const key = `${cat}___${subcat}`;

    if (!categoryComparisonData[key]) {
      categoryComparisonData[key] = {
        category: cat,
        subcategory: subcat,
        thisMonth: 0,
        lastMonth: 0
      };
    }

    if (isThisMonth) {
      categoryComparisonData[key].thisMonth += t.amount;
    } else {
      categoryComparisonData[key].lastMonth += t.amount;
    }
  });

  const comparisonArray = Object.values(categoryComparisonData).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return b.thisMonth - a.thisMonth;
  });

  const todayExpenses = transactions
    .filter(t => t.type === 'Expense' && new Date(t.date).toDateString() === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const yesterdayExpenses = transactions
    .filter(t => t.type === 'Expense' && new Date(t.date).toDateString() === yesterdayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const todayIncome = transactions
    .filter(t => (t.type === 'Income' || t.type === 'POS Income') && new Date(t.date).toDateString() === todayStr)
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
  
  const thisMonthLentTotal = thisMonthLentFlow.reduce((acc, curr) => acc + curr.amount, 0);

  const thisMonthSavingsFlow = savings.filter(t => {
    const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const thisMonthDeposit = thisMonthSavingsFlow
    .filter(t => t.type === 'Deposit')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisMonthWithdrawal = thisMonthSavingsFlow
    .filter(t => t.type === 'Withdrawal')
    .reduce((acc, curr) => acc + curr.amount, 0);

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

  const sortedSchedules = activeSchedules
    .map(s => ({ ...s, dateObj: new Date(s.nextDate) }))
    .sort((a, b) => a.dateObj - b.dateObj);

  const nextPlannedSchedule = sortedSchedules.length > 0 ? sortedSchedules[0] : null;

  const todayPlanned = sortedSchedules
    .filter(s => s.dateObj.toDateString() === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

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

  const pendingWishlistItems = (displayData?.wishlistItems || []).filter(item => item.status === 'pending');
  const totalWishlistEstCost = pendingWishlistItems.reduce((acc, curr) => acc + (Number(curr.estimatedCost) || 0), 0);
  const wishlistPendingCount = pendingWishlistItems.length;

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-950/50 border-y border-gray-800/80 shadow-2xl backdrop-blur-sm">
      <div className="px-4 md:px-8 pb-8 pt-6 space-y-8 w-full max-w-full">
      

      {/* 1. TOP ROW: COMMAND CENTER METRICS */}
        <div className="flex flex-col xl:flex-row gap-4 mx-auto w-full">
        
        {/* Left Side: Main Summary */}
        <div className="xl:w-[450px] flex-shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#0b1120] p-4 md:p-5 rounded-[1.25rem] border border-gray-800/80 shadow-xl relative overflow-hidden group transition-all duration-500 flex flex-col h-full justify-center"
          >
            {/* Header Row */}
            <div className="flex justify-between items-center w-full relative z-10 mb-4">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <p className="text-gray-100 text-xs font-bold uppercase tracking-[0.15em]">Today's Summary</p>
              </div>
              {todayExpenses > yesterdayExpenses && (
                <div className="flex items-center gap-1.5 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 text-rose-400 text-[10px] font-bold" title={`+${formatCompact(todayExpenses - yesterdayExpenses)} vs yesterday`}>
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Rs. {formatCompact(todayExpenses - yesterdayExpenses)}</span>
                </div>
              )}
              {todayExpenses < yesterdayExpenses && (
                <div className="flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 text-emerald-400 text-[10px] font-bold" title={`${formatCompact(yesterdayExpenses - todayExpenses)} less than yesterday`}>
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Rs. {formatCompact(yesterdayExpenses - todayExpenses)}</span>
                </div>
              )}
            </div>
            
            {/* Metrics Row */}
            <div className="flex items-center w-full relative z-10 mt-2 mb-2">
              <div className="flex flex-col flex-1">
                <span className="text-[10px] uppercase text-rose-500 font-bold tracking-widest mb-2">Expense (Out)</span>
                <h2 title={`Rs. ${formatLKR(todayExpenses)}`} className="text-3xl font-black text-rose-400 tracking-tight drop-shadow-md flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-rose-600">Rs.</span>
                  {formatCompact(todayExpenses)}
                </h2>
              </div>
              
              <div className="w-px h-16 bg-gray-700/60 mx-4 lg:mx-6"></div>
              
              <div className="flex flex-col flex-1 pl-2">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] uppercase text-emerald-500 font-bold tracking-widest">Income (In)</span>
                  <button 
                    onClick={async () => {
                      await handleSyncPOS();
                      handleRefresh();
                    }}
                    disabled={isSyncing}
                    className="text-emerald-400 hover:text-emerald-300 transition-all disabled:opacity-50 shrink-0"
                    title={`Business Sync : ${timeAgo(lastSyncTimeStr)}`}
                  >
                    <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> 
                  </button>
                </div>
                <h2 title={`Rs. ${formatLKR(todayIncome)}`} className="text-3xl font-black text-emerald-400 tracking-tight drop-shadow-md flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-emerald-600">Rs.</span>
                  {formatCompact(todayIncome)}
                </h2>
              </div>
            </div>
            
            <div className="w-full h-px bg-gray-800/80 mt-4 mb-3 z-10 relative"></div>
            
            <div className="flex justify-between items-center w-full z-10 relative mt-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Week Out:</span>
                <span className="text-[10px] font-bold text-rose-500">Rs. {formatCompact(thisWeekExpense)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Week In:</span>
                <span className="text-[10px] font-bold text-emerald-500">Rs. {formatCompact(thisWeekIncome)}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: 4 Tiles Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="bg-[#0b1120] p-4 md:p-5 rounded-[1.25rem] border border-gray-800/80 shadow-xl relative overflow-hidden group transition-all duration-500 flex flex-col items-center justify-center min-h-[100px] h-full"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/20 rounded-full blur-[60px] group-hover:bg-amber-500/30 transition-all duration-700 pointer-events-none"></div>
            
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex-shrink-0 w-8 h-8 rounded-xl border border-gray-700/50 bg-gray-800/30 flex items-center justify-center group-hover:border-amber-500/50 transition-all duration-500 z-10 shadow-inner">
              <CalendarClock className="w-4 h-4 text-amber-500 drop-shadow-md" />
            </div>

            <div className="w-full flex items-center justify-center gap-5 sm:gap-8 z-10 mt-3">
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1 truncate">Today Planned</span>
                <h2 title={`Rs. ${formatLKR(todayPlanned)}`} className="text-lg sm:text-xl font-black text-amber-500 tracking-tight flex items-baseline gap-1">
                  <span className="text-[11px] font-bold text-amber-600">Rs.</span>{formatCompact(todayPlanned)}
                </h2>
              </div>
              
              <div className="w-px h-8 bg-gray-700/50"></div>
              
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1 truncate">Month Total</span>
                <h2 title={`Rs. ${formatLKR(thisMonthPlanned)}`} className="text-lg sm:text-xl font-black text-white tracking-tight flex items-baseline gap-1">
                  <span className="text-[11px] font-bold text-gray-500">Rs.</span>{formatCompact(thisMonthPlanned)}
                </h2>
              </div>
            </div>
            
            <div className="w-full h-px bg-gray-800/80 z-10 mt-3 mb-2"></div>
            
            <div className="w-full z-10">
              {nextPlannedSchedule ? (
                <div className="flex justify-between items-center w-full">
                  <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis pr-2">
                    <span className="font-bold mr-1.5 text-gray-500">{new Date(nextPlannedSchedule.nextDate).toLocaleDateString(undefined, {month: 'short', day:'numeric'})}</span> 
                    {nextPlannedSchedule.description || nextPlannedSchedule.category}
                  </span>
                  <span className="text-[10px] font-bold text-amber-500 whitespace-nowrap">
                    Rs. {formatCompact(nextPlannedSchedule.amount)}
                  </span>
                </div>
              ) : (
                <div className="text-[10px] text-gray-600 font-bold uppercase tracking-widest text-center">No upcoming</div>
              )}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-[#0b1120] p-4 md:p-5 rounded-[1.25rem] border border-gray-800/80 shadow-xl relative overflow-hidden group transition-all duration-500 flex flex-col items-center justify-center min-h-[100px] h-full"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-[60px] group-hover:bg-blue-500/30 transition-all duration-700 pointer-events-none"></div>
            
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex-shrink-0 w-8 h-8 rounded-xl border border-gray-700/50 bg-gray-800/30 flex items-center justify-center group-hover:border-blue-500/50 transition-all duration-500 z-10 shadow-inner">
              <Handshake className="w-4 h-4 text-blue-400 drop-shadow-md" />
            </div>
            
            <div className="w-full flex items-center justify-center gap-5 sm:gap-8 z-10 mt-3">
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1 truncate">Total Pending</span>
                <h2 title={`Rs. ${formatLKR(totalPendingLent)}`} className="text-lg sm:text-xl font-black text-white tracking-tight flex items-baseline gap-1">
                  <span className="text-[11px] font-bold text-gray-500">Rs.</span>{formatCompact(totalPendingLent)}
                </h2>
              </div>
              
              <div className="w-px h-8 bg-gray-700/50"></div>
              
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1 truncate">This Month</span>
                <h2 title={`Rs. ${formatLKR(thisMonthLentTotal)}`} className="text-lg sm:text-xl font-black text-blue-400 tracking-tight flex items-baseline gap-1">
                  <span className="text-[11px] font-bold text-blue-600">Rs.</span>{formatCompact(thisMonthLentTotal)}
                </h2>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-[#0b1120] p-4 md:p-5 rounded-[1.25rem] border border-gray-800/80 shadow-xl relative overflow-hidden group transition-all duration-500 flex flex-col items-center justify-center min-h-[100px] h-full"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[60px] group-hover:bg-purple-500/30 transition-all duration-700 pointer-events-none"></div>
            
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex-shrink-0 w-8 h-8 rounded-xl border border-gray-700/50 bg-gray-800/30 flex items-center justify-center group-hover:border-purple-500/50 transition-all duration-500 z-10 shadow-inner">
              <Target className="w-4 h-4 text-purple-400 drop-shadow-md" />
            </div>
            
            <div className="w-full flex items-center justify-center gap-5 sm:gap-8 z-10 mt-3">
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1 truncate">Wishlist Plans</span>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-baseline gap-1">
                  {wishlistPendingCount} <span className="text-[11px] font-bold text-gray-500">Items</span>
                </h2>
              </div>
              
              <div className="w-px h-8 bg-gray-700/50"></div>
              
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1 truncate">Total Est. Cost</span>
                <h2 title={`Rs. ${formatLKR(totalWishlistEstCost)}`} className="text-lg sm:text-xl font-black text-purple-400 tracking-tight flex items-baseline gap-1">
                  <span className="text-[11px] font-bold text-purple-600">Rs.</span>{formatCompact(totalWishlistEstCost)}
                </h2>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-[#0b1120] p-4 md:p-5 rounded-[1.25rem] border border-gray-800/80 shadow-xl relative overflow-hidden group transition-all duration-500 flex flex-col items-center justify-center min-h-[100px] h-full"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/20 rounded-full blur-[60px] group-hover:bg-pink-500/30 transition-all duration-700 pointer-events-none"></div>
            
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex-shrink-0 w-8 h-8 rounded-xl border border-gray-700/50 bg-gray-800/30 flex items-center justify-center group-hover:border-pink-500/50 transition-all duration-500 z-10 shadow-inner">
              <PiggyBank className="w-4 h-4 text-pink-400 drop-shadow-md" />
            </div>
            
            <div className="w-full flex flex-col items-center justify-center z-10 mt-1">
              <div className="flex flex-col items-center text-center mb-1.5">
                <span className="text-[11px] uppercase text-gray-400 font-bold tracking-widest mb-0.5 truncate">Total Savings</span>
                <h2 title={`Rs. ${formatLKR(totalSavings)}`} className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-baseline gap-1">
                  <span className="text-xs sm:text-sm font-bold text-gray-500">Rs.</span>{formatCompact(totalSavings)}
                </h2>
              </div>
              
              <div className="flex items-center gap-3 mt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">In:</span>
                  <span className="text-xs font-bold text-emerald-500">Rs. {formatCompact(thisMonthDeposit)}</span>
                </div>
                <div className="w-px h-3.5 bg-gray-700/50"></div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">Out:</span>
                  <span className="text-xs font-bold text-rose-500">Rs. {formatCompact(thisMonthWithdrawal)}</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
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
        <div className="bg-gray-900/40 backdrop-blur-xl p-6 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl flex flex-col h-full relative overflow-hidden group transition-all duration-500">
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
      <div className="w-full mb-10 mt-6 relative z-10 bg-gray-900/60 backdrop-blur-2xl p-6 md:p-8 rounded-[1.75rem] border border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden group hover:border-indigo-500/30 transition-all duration-700">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] group-hover:bg-indigo-500/20 transition-all duration-1000 pointer-events-none -translate-y-1/2 translate-x-1/3"></div>
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[100px] group-hover:bg-cyan-500/20 transition-all duration-1000 pointer-events-none translate-y-1/3 -translate-x-1/4"></div>
        
        <div className="flex items-center gap-4 mb-8 pl-2 relative z-10">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-xl border border-indigo-500/30 shadow-inner group-hover:scale-110 transition-transform duration-500">
            <PieChartIcon className="w-5 h-5 text-indigo-400 drop-shadow-md" />
          </div>
          <h3 className="text-sm md:text-base font-black tracking-[0.2em] uppercase bg-clip-text text-transparent bg-gradient-to-r from-gray-100 via-gray-200 to-gray-400 drop-shadow-sm">
            Expense Breakdown <span className="text-[10px] md:text-xs font-bold tracking-widest text-indigo-400/80 ml-2">(THIS MONTH)</span>
          </h3>
        </div>
        
        {advancedCategoryCards.length > 0 ? (
          (() => {
            const stackedBarData = advancedCategoryCards.map(cat => {
              const dataObj = { category: cat.category, total: cat.total };
              cat.subcategories.forEach(sub => {
                dataObj[sub.name] = sub.value;
              });
              return dataObj;
            });
            
            const allSubcategories = Array.from(new Set(
              advancedCategoryCards.flatMap(cat => cat.subcategories.map(sub => sub.name))
            ));
            
            // Calculate a dynamic height based on the number of categories to prevent excessive spacing
            const chartHeight = Math.max(250, stackedBarData.length * 45 + 100);
            
            return (
              <div className="flex flex-col gap-2">
                <div 
                  className="w-full relative z-10 bg-[#0f172a]/40 rounded-[1.25rem] border border-gray-700/30 p-4 sm:p-6 mt-4 shadow-inner"
                  style={{ height: `${chartHeight}px` }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={stackedBarData}
                      margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
                      barSize={14}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                      <XAxis type="number" stroke="#6b7280" fontSize={10} tickFormatter={(val) => `Rs ${formatCompact(val)}`} axisLine={false} tickLine={false} />
                      <YAxis dataKey="category" type="category" stroke="#d1d5db" fontSize={11} fontWeight={700} tickLine={false} axisLine={false} width={80} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }} 
                        contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)', borderRadius: '1rem', border: '1px solid rgba(71, 85, 105, 0.4)', padding: '12px', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }} 
                        itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                        formatter={(value) => `Rs. ${formatCompact(value)}`} 
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '20px', fontWeight: 'bold', color: '#9ca3af' }} iconType="circle" iconSize={8} />
                      {allSubcategories.map((subName, idx) => (
                        <Bar key={subName} dataKey={subName} stackId="a" fill={COLORS[idx % COLORS.length]} radius={[2, 2, 2, 2]} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full mt-2 flex flex-col gap-3">
                  <button 
                    onClick={() => setShowComparisonTable(!showComparisonTable)}
                    className="flex items-center justify-between w-full p-4 bg-[#0f172a]/40 hover:bg-[#0f172a]/70 rounded-xl border border-gray-700/50 transition-colors shadow-inner group cursor-pointer relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-indigo-500/5 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="text-xs font-bold tracking-widest uppercase text-gray-400 group-hover:text-gray-200 transition-colors relative z-10">Compare with Last Month</span>
                    <div className={`transform transition-transform duration-300 relative z-10 ${showComparisonTable ? 'rotate-180' : ''}`}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </div>
                  </button>

                  {showComparisonTable && (
                    <div className="w-full relative z-10 bg-[#0f172a]/40 rounded-[1.25rem] border border-gray-700/30 overflow-hidden shadow-inner">
                      <div className="overflow-x-auto hide-scrollbar">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-gray-800/50 text-gray-400 text-[10px] uppercase tracking-wider">
                            <tr>
                              <th className="px-4 py-3 font-bold">Category & Subcategory</th>
                              <th className="px-4 py-3 font-bold text-right">Last Month</th>
                              <th className="px-4 py-3 font-bold text-right">This Month</th>
                              <th className="px-4 py-3 font-bold text-right">Difference</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-700/30 text-gray-300">
                            {(() => {
                              const grouped = {};
                              comparisonArray.forEach(row => {
                                if (!grouped[row.category]) {
                                  grouped[row.category] = {
                                    category: row.category,
                                    thisMonthTotal: 0,
                                    lastMonthTotal: 0,
                                    subcategories: []
                                  };
                                }
                                grouped[row.category].thisMonthTotal += row.thisMonth;
                                grouped[row.category].lastMonthTotal += row.lastMonth;
                                grouped[row.category].subcategories.push(row);
                              });
                              
                              const groupedArray = Object.values(grouped).sort((a, b) => b.thisMonthTotal - a.thisMonthTotal);

                              if (groupedArray.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan="4" className="px-4 py-8 text-center text-gray-500 text-xs">No expense data found for comparison.</td>
                                  </tr>
                                )
                              }

                              return groupedArray.map((group, gIdx) => {
                                const diff = group.thisMonthTotal - group.lastMonthTotal;
                                const isLess = group.thisMonthTotal < group.lastMonthTotal;
                                const isMore = group.thisMonthTotal > group.lastMonthTotal;
                                const isExpanded = expandedCategories[group.category] || false;
                                
                                return (
                                  <React.Fragment key={gIdx}>
                                    <tr 
                                      className="hover:bg-gray-800/50 transition-colors cursor-pointer group/row"
                                      onClick={() => setExpandedCategories(prev => ({ ...prev, [group.category]: !prev[group.category] }))}
                                    >
                                      <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                          <div className={`transform transition-transform duration-300 text-gray-500 group-hover/row:text-indigo-400 ${isExpanded ? 'rotate-90' : ''}`}>
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                          </div>
                                          <span className="font-black text-gray-200">{group.category}</span>
                                        </div>
                                      </td>
                                      <td className="px-4 py-3 text-right font-bold text-gray-400">Rs {formatCompact(group.lastMonthTotal)}</td>
                                      <td className="px-4 py-3 text-right font-black text-white">Rs {formatCompact(group.thisMonthTotal)}</td>
                                      <td className="px-4 py-3 text-right">
                                        {diff === 0 ? (
                                          <span className="text-gray-500 font-medium">-</span>
                                        ) : (
                                          <div className={`flex items-center justify-end gap-1 font-bold ${isLess ? 'text-emerald-400' : 'text-rose-400'}`}>
                                            {isLess ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                                            Rs {formatCompact(Math.abs(diff))}
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                    {isExpanded && group.subcategories.map((sub, sIdx) => {
                                      const subDiff = sub.thisMonth - sub.lastMonth;
                                      const subIsLess = sub.thisMonth < sub.lastMonth;
                                      
                                      return (
                                        <tr key={`${gIdx}-${sIdx}`} className="bg-gray-900/30 hover:bg-gray-800/30 transition-colors">
                                          <td className="px-4 py-2.5 pl-[38px]">
                                            <span className="text-[11px] font-medium text-gray-400 flex items-center gap-2">
                                              <div className="w-1 h-1 rounded-full bg-gray-600"></div>
                                              {sub.subcategory}
                                            </span>
                                          </td>
                                          <td className="px-4 py-2.5 text-right font-medium text-xs text-gray-500">Rs {formatCompact(sub.lastMonth)}</td>
                                          <td className="px-4 py-2.5 text-right font-bold text-xs text-gray-300">Rs {formatCompact(sub.thisMonth)}</td>
                                          <td className="px-4 py-2.5 text-right text-xs">
                                            {subDiff === 0 ? (
                                              <span className="text-gray-600">-</span>
                                            ) : (
                                              <div className={`flex items-center justify-end gap-1 font-bold ${subIsLess ? 'text-emerald-500/80' : 'text-rose-500/80'}`}>
                                                {subIsLess ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                                Rs {formatCompact(Math.abs(subDiff))}
                                              </div>
                                            )}
                                          </td>
                                        </tr>
                                      )
                                    })}
                                  </React.Fragment>
                                )
                              })
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
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
