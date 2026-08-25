import React, { useState, useEffect } from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, AreaChart, Area, XAxis, YAxis, CartesianGrid, BarChart, Bar, LabelList, ReferenceLine } from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, Clock, Handshake, RefreshCw, PiggyBank, CalendarClock, History, Users } from 'lucide-react';
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

const CustomAreaMaxLabel = (props) => {
  const { x, y, value, maxValue, color, formatCompact } = props;
  if (value === maxValue && value > 0) {
    return (
      <text x={x} y={y - 12} fill={color} fontSize={11} fontWeight="900" textAnchor="middle" className="drop-shadow-md">
        Rs.{formatCompact(value)}
      </text>
    );
  }
  return null;
};

const CustomBarMaxLabel = (props) => {
  const { x, y, width, height, index, data, maxTotal, formatCompact } = props;
  const total = data[index]?.total || 0;
  if (total === maxTotal && total > 0) {
    return (
      <text x={x + width + 8} y={y + height / 2} fill="#e5e7eb" fontSize={11} fontWeight="900" dominantBaseline="central" className="drop-shadow-md">
        Rs.{formatCompact(total)}
      </text>
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
  const toggleCategory = (cat) => setExpandedCategories(prev => ({...prev, [cat]: !prev[cat]}));

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
  const todayFormattedStr = today.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
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

  const todayExpenses = liveTransactions
    .filter(t => t.type === 'Expense' && new Date(t.date).toDateString() === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const yesterdayExpenses = transactions
    .filter(t => t.type === 'Expense' && new Date(t.date).toDateString() === yesterdayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const todayIncome = liveTransactions
    .filter(t => (t.type === 'Income' || t.type === 'POS Income') && new Date(t.date).toDateString() === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const yesterdayIncome = transactions
    .filter(t => (t.type === 'Income' || t.type === 'POS Income') && new Date(t.date).toDateString() === yesterdayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisMonthExpenses = transactions
    .filter(t => {
      if (t.type !== 'Expense') return false;
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const liveThisMonthIncome = liveTransactions
    .filter(t => {
      const d = new Date(t.date);
      return (t.type === 'Income' || t.type === 'POS Income') && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisYearExpenses = liveTransactions
    .filter(t => t.type === 'Expense' && new Date(t.date).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisYearIncome = liveTransactions
    .filter(t => (t.type === 'Income' || t.type === 'POS Income') && new Date(t.date).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const yearlyOverviewData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return {
      month: d.toLocaleDateString(undefined, { month: 'short' }),
      Income: 0,
      Expense: 0,
      Lent: 0,
      Savings: 0
    };
  });

  transactions.forEach(t => {
    const td = new Date(t.date);
    if (td.getFullYear() === currentYear) {
      const m = td.getMonth();
      if (t.type === 'Income' || t.type === 'POS Income') yearlyOverviewData[m].Income += t.amount;
      else if (t.type === 'Expense') yearlyOverviewData[m].Expense += t.amount;
    }
  });

  lentMoney.forEach(t => {
    const td = new Date(t.date);
    if (td.getFullYear() === currentYear) {
      yearlyOverviewData[td.getMonth()].Lent += t.amount;
    }
  });

  savings.forEach(t => {
    const td = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    if (td.getFullYear() === currentYear) {
      if (t.type === 'Deposit' || t.type === 'Initial') {
         yearlyOverviewData[td.getMonth()].Savings += t.amount;
      }
    }
  });

  const startOfThisWeek = new Date(today);
  const currentDayOfWeekNum = startOfThisWeek.getDay();
  startOfThisWeek.setDate(startOfThisWeek.getDate() - currentDayOfWeekNum + (currentDayOfWeekNum === 0 ? -6 : 1));
  startOfThisWeek.setHours(0, 0, 0, 0);
  const endOfThisWeek = new Date(startOfThisWeek);
  endOfThisWeek.setDate(endOfThisWeek.getDate() + 6);
  endOfThisWeek.setHours(23, 59, 59, 999);

  const liveThisWeekIncome = liveTransactions
    .filter(t => {
      const d = new Date(t.date);
      return (t.type === 'Income' || t.type === 'POS Income') && d >= startOfThisWeek && d <= endOfThisWeek;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const liveThisWeekExpense = liveTransactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'Expense' && d >= startOfThisWeek && d <= endOfThisWeek;
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
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, Income: 0, Expense: 0, Lent: 0, Planned: 0, Received: 0, Deposit: 0, Withdrawal: 0, Savings: 0 };
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
    .filter(t => t.type === 'Deposit' || t.type === 'Initial')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisMonthWithdrawal = thisMonthSavingsFlow
    .filter(t => t.type === 'Withdrawal')
    .reduce((acc, curr) => acc + curr.amount, 0);

  thisMonthLentFlow.forEach(curr => {
    const dateStr = new Date(curr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!groupedFlow[dateStr]) groupedFlow[dateStr] = { date: dateStr, Income: 0, Expense: 0, Lent: 0, Planned: 0, Received: 0, Deposit: 0, Withdrawal: 0, Savings: 0 };
    groupedFlow[dateStr].Lent += curr.amount;
  });

  lentMoney.forEach(record => {
    if (record.paymentHistory) {
      record.paymentHistory.forEach(payment => {
        const pd = new Date(payment.date);
        if (pd.getMonth() === currentMonth && pd.getFullYear() === currentYear) {
          const dateStr = pd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          if (!groupedFlow[dateStr]) groupedFlow[dateStr] = { date: dateStr, Income: 0, Expense: 0, Lent: 0, Planned: 0, Received: 0, Deposit: 0, Withdrawal: 0, Savings: 0 };
          groupedFlow[dateStr].Received += payment.amount;
        }
      });
    }
  });

  thisMonthSavingsFlow.forEach(curr => {
    const d = curr.date?.toDate ? curr.date.toDate() : new Date(curr.date);
    const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!groupedFlow[dateStr]) groupedFlow[dateStr] = { date: dateStr, Income: 0, Expense: 0, Lent: 0, Planned: 0, Received: 0, Deposit: 0, Withdrawal: 0, Savings: 0 };
    groupedFlow[dateStr].Savings += curr.amount; // legacy fallback
    if (curr.type === 'Deposit' || curr.type === 'Initial') {
      groupedFlow[dateStr].Deposit += curr.amount;
    } else if (curr.type === 'Withdrawal') {
      groupedFlow[dateStr].Withdrawal += curr.amount;
    }
  });

  const activeSchedules = schedules.filter(s => s.status === 'active');
  const startOfMonth = new Date(currentYear, currentMonth, 1);
  const endOfMonth = new Date(currentYear, currentMonth + 1, 0, 23, 59, 59);

  activeSchedules.forEach(schedule => {
    let d = new Date(schedule.nextDate);
    let safetyCounter = 0; 
    while (d <= endOfMonth && safetyCounter < 100) {
      safetyCounter++;
      if (d >= startOfMonth && d <= endOfMonth) {
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
  
  let lastMonthIncome = 0;
  let lastMonthExpense = 0;
  let lastMonthLent = 0;
  let lastMonthPlanned = 0;
  
  if (cashFlowFilter === 'month' || cashFlowFilter === 'lastMonth') {
    const isLastMonth = cashFlowFilter === 'lastMonth';
    const targetMonth = isLastMonth ? lastMonth : currentMonth;
    const targetYear = isLastMonth ? lastMonthYear : currentYear;
    const targetDaysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    for (let i = 1; i <= targetDaysInMonth; i++) {
      const d = new Date(targetYear, targetMonth, i);
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const dayStr = String(i).padStart(2, '0');
      
      if (!isLastMonth) {
        // Reuse groupedFlow for current month to avoid recomputing
        if (groupedFlow[dateStr]) {
          cashFlowArray.push({
            date: dateStr,
            day: dayStr,
            Income: groupedFlow[dateStr].Income || 0,
            Expense: groupedFlow[dateStr].Expense || 0,
            Lent: groupedFlow[dateStr].Lent || 0,
            Received: groupedFlow[dateStr].Received || 0,
            Deposit: groupedFlow[dateStr].Deposit || 0,
            Withdrawal: groupedFlow[dateStr].Withdrawal || 0,
            Planned: groupedFlow[dateStr].Planned || 0,
            Savings: groupedFlow[dateStr].Savings || 0
          });
        } else {
          cashFlowArray.push({ date: dateStr, day: dayStr, Income: 0, Expense: 0, Lent: 0, Received: 0, Deposit: 0, Withdrawal: 0, Planned: 0, Savings: 0 });
        }
      } else {
        // Compute dynamically for last month
        let dayIncome = 0;
        let dayExpense = 0;
        let dayLent = 0;
        let dayReceived = 0;
        let dayPlanned = 0;
        let daySavings = 0;
        let dayDeposit = 0;
        let dayWithdrawal = 0;

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
          if (t.paymentHistory) {
            t.paymentHistory.forEach(payment => {
              const pd = new Date(payment.date);
              if (pd.toDateString() === d.toDateString()) {
                dayReceived += payment.amount;
              }
            });
          }
        });
        
        savings.forEach(t => {
          const td = t.date?.toDate ? t.date.toDate() : new Date(t.date);
          if (td.toDateString() === d.toDateString()) {
            daySavings += t.amount;
            if (t.type === 'Deposit' || t.type === 'Initial') dayDeposit += t.amount;
            else if (t.type === 'Withdrawal') dayWithdrawal += t.amount;
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

        lastMonthIncome += dayIncome;
        lastMonthExpense += dayExpense;
        lastMonthLent += dayLent;
        lastMonthPlanned += dayPlanned;
        
        cashFlowArray.push({
          date: dateStr,
          day: dayStr,
          Income: dayIncome,
          Expense: dayExpense,
          Lent: dayLent,
          Received: dayReceived,
          Deposit: dayDeposit,
          Withdrawal: dayWithdrawal,
          Planned: dayPlanned,
          Savings: daySavings
        });
      }
    }
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
      let dayReceived = 0;
      let dayPlanned = 0;
      let dayDeposit = 0;
      let dayWithdrawal = 0;
      
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
        if (t.paymentHistory) {
          t.paymentHistory.forEach(payment => {
            const pd = new Date(payment.date);
            if (pd.toDateString() === d.toDateString()) {
              dayReceived += payment.amount;
            }
          });
        }
      });

      savings.forEach(t => {
        const td = t.date?.toDate ? t.date.toDate() : new Date(t.date);
        if (td.toDateString() === d.toDateString()) {
           if (t.type === 'Deposit' || t.type === 'Initial') dayDeposit += t.amount;
           else if (t.type === 'Withdrawal') dayWithdrawal += t.amount;
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
        Received: dayReceived,
        Deposit: dayDeposit,
        Withdrawal: dayWithdrawal,
        Planned: dayPlanned,
        Savings: dayDeposit // fallback
      });
    }
  }

  // We need to calculate thisWeek sums for the UI if week is selected but filter isn't week
  if (cashFlowFilter !== 'week') {
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
  }

  // Calculate This Month totals
  let thisMonthIncome = 0;
  let thisMonthLentSum = 0;
  Object.values(groupedFlow).forEach(dayData => {
    thisMonthIncome += dayData.Income;
    thisMonthLentSum += dayData.Lent;
  });

  const displayedIncome = cashFlowFilter === 'week' ? thisWeekIncome : (cashFlowFilter === 'lastMonth' ? lastMonthIncome : thisMonthIncome);
  const displayedExpense = cashFlowFilter === 'week' ? thisWeekExpense : (cashFlowFilter === 'lastMonth' ? lastMonthExpense : thisMonthExpenses);
  const displayedLent = cashFlowFilter === 'week' ? thisWeekLent : (cashFlowFilter === 'lastMonth' ? lastMonthLent : thisMonthLentSum);
  const displayedPlanned = cashFlowFilter === 'week' ? thisWeekPlanned : (cashFlowFilter === 'lastMonth' ? lastMonthPlanned : thisMonthPlanned);

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

  const getDaysString = (dateObj) => {
    const todayZero = new Date();
    todayZero.setHours(0, 0, 0, 0);
    const target = new Date(dateObj);
    target.setHours(0, 0, 0, 0);
    
    const diffTime = target.getTime() - todayZero.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays > 1) return `In ${diffDays} days`;
    if (diffDays === -1) return 'Yesterday';
    return `${Math.abs(diffDays)} days ago`;
  };

  const recentTransactions = transactions.slice(0, 5);

  const pendingWishlistItems = liveWishlistItems.filter(item => item.status === 'pending');
  const totalWishlistEstCost = pendingWishlistItems.reduce((acc, curr) => acc + (Number(curr.estimatedCost) || 0), 0);
  const wishlistPendingCount = pendingWishlistItems.length;

  let todayReferenceX = null;
  if (cashFlowFilter === 'week') {
    todayReferenceX = today.toLocaleDateString(undefined, { weekday: 'short' });
  } else if (cashFlowFilter === 'month') {
    todayReferenceX = String(today.getDate()).padStart(2, '0');
  }

  const chartTotalIncome = cashFlowArray.reduce((acc, curr) => acc + (curr.Income || 0), 0);
  const chartTotalExpense = cashFlowArray.reduce((acc, curr) => acc + (curr.Expense || 0), 0);
  const chartTotalLent = cashFlowArray.reduce((acc, curr) => acc + (curr.Lent || 0), 0);
  const chartTotalSavings = cashFlowArray.reduce((acc, curr) => acc + (curr.Savings || 0), 0);

  // Savings this month
  const thisMonthSavingsList = savings.filter(s => {
    const d = new Date(s.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const thisMonthSavingsDeposits = thisMonthSavingsList.filter(s => s.type === 'Deposit').reduce((acc, curr) => acc + curr.amount, 0);
  const thisMonthSavingsWithdrawals = thisMonthSavingsList.filter(s => s.type === 'Withdrawal').reduce((acc, curr) => acc + curr.amount, 0);

  // Lent money people count
  const pendingLentRecords = lentMoney.filter(r => r.status !== 'paid');
  const uniqueLentPeopleCount = new Set(pendingLentRecords.map(r => r.name)).size;


  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-950/50 border-b border-gray-800/80 shadow-2xl backdrop-blur-sm" style={{ fontFamily: "'Roboto', sans-serif" }}>
      <div className="px-4 md:px-8 pb-8 pt-4 space-y-6 w-full max-w-[1600px] mx-auto">
        
        {/* 1. TOP TILES */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
          
          {/* Today Expenses */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-gray-800/80 shadow-xl relative overflow-hidden h-28 flex flex-col justify-center hover:-translate-y-1 hover:shadow-2xl hover:border-gray-700/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-rose-600/10 rounded-full blur-[40px] mix-blend-screen pointer-events-none"></div>
            <div className="flex justify-between items-start mb-1.5 relative z-10">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> Today Expenses
              </p>
            </div>
            <h2 className="text-2xl font-black text-white relative z-10">
              <span className="text-sm text-gray-500">Rs.</span> {formatCompact(todayExpenses)}
            </h2>
            <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold uppercase relative z-10 tracking-widest mt-1 pt-1 border-t border-gray-800/50">
               <span>Yesterday: Rs. {formatCompact(yesterdayExpenses)}</span>
            </div>
          </motion.div>

          {/* Today Income */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-gray-800/80 shadow-xl relative overflow-hidden h-28 flex flex-col justify-center hover:-translate-y-1 hover:shadow-2xl hover:border-gray-700/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-emerald-600/10 rounded-full blur-[40px] mix-blend-screen pointer-events-none"></div>
            <div className="flex justify-between items-start mb-1.5 relative z-10">
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Today Income
              </p>
              <button onClick={async () => { await handleSyncPOS(); handleRefresh(); }} disabled={isSyncing} className="p-1 bg-gray-800/80 rounded-md hover:bg-gray-700 transition-colors group">
                <RefreshCw className={`w-3.5 h-3.5 text-gray-400 group-hover:text-white ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <h2 className="text-2xl font-black text-white relative z-10">
              <span className="text-sm text-gray-500">Rs.</span> {formatCompact(todayIncome)}
            </h2>
            <div className="flex items-center gap-1 text-[9px] text-gray-500 font-bold uppercase relative z-10 tracking-widest mt-1 pt-1 border-t border-gray-800/50">
               <span>Yesterday: Rs. {formatCompact(yesterdayIncome)}</span>
            </div>
          </motion.div>

          {/* Savings Balance */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-gray-800/80 shadow-xl relative overflow-hidden h-28 flex flex-col justify-center hover:-translate-y-1 hover:shadow-2xl hover:border-gray-700/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-pink-600/10 rounded-full blur-[40px] mix-blend-screen pointer-events-none"></div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 relative z-10">
              <PiggyBank className="w-3.5 h-3.5 text-pink-400" /> Savings Balance
            </p>
            <h2 className="text-2xl font-black text-white relative z-10 mb-1.5">
              <span className="text-sm text-gray-500">Rs.</span> {formatCompact(totalSavings)}
            </h2>
            <div className="flex gap-3 text-[9px] text-gray-500 font-bold uppercase relative z-10 tracking-widest border-t border-gray-800 pt-1.5 mt-auto">
               <span className="flex items-center gap-1" title="This Month Deposits"><TrendingUp className="w-2.5 h-2.5 text-emerald-400"/> {formatCompact(thisMonthSavingsDeposits)}</span>
               <span className="flex items-center gap-1" title="This Month Withdrawals"><TrendingDown className="w-2.5 h-2.5 text-rose-400"/> {formatCompact(thisMonthSavingsWithdrawals)}</span>
            </div>
          </motion.div>

          {/* Total Lent */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-gray-800/80 shadow-xl relative overflow-hidden h-28 flex flex-col justify-center hover:-translate-y-1 hover:shadow-2xl hover:border-gray-700/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-blue-600/10 rounded-full blur-[40px] mix-blend-screen pointer-events-none"></div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 relative z-10">
              <Handshake className="w-3.5 h-3.5 text-blue-400" /> Total Lent
            </p>
            <div className="flex items-end justify-between relative z-10 mt-0.5">
              <h2 className="text-2xl font-black text-white">
                <span className="text-sm text-gray-500">Rs.</span> {formatCompact(totalPendingLent)}
              </h2>
              <div className="flex flex-col items-center justify-center px-2 py-0.5 bg-gray-800/50 rounded-md border border-gray-700/50">
                <Users className="w-3 h-3 text-blue-400 mb-0.5" />
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{uniqueLentPeopleCount} Ppl</span>
              </div>
            </div>
          </motion.div>

          {/* Wishlist */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.5 }} className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-gray-800/80 shadow-xl relative overflow-hidden h-28 flex flex-col justify-center hover:-translate-y-1 hover:shadow-2xl hover:border-gray-700/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-purple-600/10 rounded-full blur-[40px] mix-blend-screen pointer-events-none"></div>
            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1.5 relative z-10">
              <Target className="w-3.5 h-3.5 text-purple-400" /> Wishlist
            </p>
            <div className="flex items-end justify-between relative z-10 mt-0.5">
              <h2 className="text-2xl font-black text-white">
                <span className="text-sm text-gray-500">Rs.</span> {formatCompact(totalWishlistEstCost)}
              </h2>
              <div className="flex flex-col items-center justify-center px-2 py-0.5 bg-gray-800/50 rounded-md border border-gray-700/50">
                <Target className="w-3 h-3 text-purple-400 mb-0.5" />
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{wishlistPendingCount} Itms</span>
              </div>
            </div>
          </motion.div>

        </div>

        {/* 2. VISUALIZATIONS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-8 bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl relative overflow-hidden group">
             <div className="flex justify-between items-center mb-6">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cash Flow</h3>
               <div className="flex bg-gray-800/50 rounded-lg p-1">
                 <button onClick={() => setCashFlowFilter('month')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${cashFlowFilter === 'month' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>This Month</button>
                 <button onClick={() => setCashFlowFilter('lastMonth')} className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${cashFlowFilter === 'lastMonth' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>Last Month</button>
               </div>
             </div>
             
             {/* Chart Totals Summary */}
             <div className="flex items-center gap-6 mb-6">
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Income</span>
                 <span className="text-sm font-black text-emerald-400">Rs. {formatCompact(chartTotalIncome)}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Expense</span>
                 <span className="text-sm font-black text-rose-400">Rs. {formatCompact(chartTotalExpense)}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lent</span>
                 <span className="text-sm font-black text-yellow-500">Rs. {formatCompact(chartTotalLent)}</span>
               </div>
               <div className="flex flex-col">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Savings</span>
                 <span className="text-sm font-black text-purple-400">Rs. {formatCompact(chartTotalSavings)}</span>
               </div>
             </div>

             <div className="h-[250px] w-full">
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
                   <XAxis dataKey="day" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                   <YAxis stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} tickFormatter={val => formatCompact(val)} />
                   <Tooltip content={<CustomAreaTooltip formatLKR={formatLKR} />} />
                   
                   <ReferenceLine y={1000} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'Limit: 1k', fill: '#ef4444', fontSize: 10, fontWeight: 'bold' }} />
                   {todayReferenceX && cashFlowFilter === 'month' && (
                     <ReferenceLine x={todayReferenceX} stroke="#3b82f6" strokeDasharray="3 3" label={{ position: 'insideTopRight', value: 'Today', fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' }} />
                   )}
                   
                   <Area type="monotone" dataKey="Lent" stroke="#eab308" strokeWidth={2} fillOpacity={0.1} fill="#eab308" />
                   <Area type="monotone" dataKey="Savings" stroke="#a855f7" strokeWidth={2} fillOpacity={0.1} fill="#a855f7" />
                   <Area type="monotone" dataKey="Income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                   <Area type="monotone" dataKey="Expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-4 bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl relative overflow-hidden flex flex-col justify-center">
             <div className="flex justify-between items-center w-full mb-6">
               <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                 <Activity className="w-4 h-4 text-purple-400" /> SUMMARY
               </h3>
             </div>
             
             <div className="w-full flex flex-col gap-6">
               
               {/* Today */}
               <div className="w-full flex flex-col gap-2">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Today</span>
                 <div className="flex items-center gap-3">
                   <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
                     <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${(todayIncome / Math.max(todayIncome, todayExpenses, 1)) * 100}%` }}></div>
                   </div>
                   <span className="text-emerald-400 text-[10px] font-black w-12 text-right">{formatCompact(todayIncome)}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
                     <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(todayExpenses / Math.max(todayIncome, todayExpenses, 1)) * 100}%` }}></div>
                   </div>
                   <span className="text-red-400 text-[10px] font-black w-12 text-right">{formatCompact(todayExpenses)}</span>
                 </div>
               </div>

               {/* This Week */}
               <div className="w-full flex flex-col gap-2">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">This Week</span>
                 <div className="flex items-center gap-3">
                   <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
                     <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${(liveThisWeekIncome / Math.max(liveThisWeekIncome, liveThisWeekExpense, 1)) * 100}%` }}></div>
                   </div>
                   <span className="text-emerald-400 text-[10px] font-black w-12 text-right">{formatCompact(liveThisWeekIncome)}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
                     <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(liveThisWeekExpense / Math.max(liveThisWeekIncome, liveThisWeekExpense, 1)) * 100}%` }}></div>
                   </div>
                   <span className="text-red-400 text-[10px] font-black w-12 text-right">{formatCompact(liveThisWeekExpense)}</span>
                 </div>
               </div>

               {/* This Month */}
               <div className="w-full flex flex-col gap-2">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">This Month</span>
                 <div className="flex items-center gap-3">
                   <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
                     <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${(liveThisMonthIncome / Math.max(liveThisMonthIncome, thisMonthExpenses, 1)) * 100}%` }}></div>
                   </div>
                   <span className="text-emerald-400 text-[10px] font-black w-12 text-right">{formatCompact(liveThisMonthIncome)}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
                     <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(thisMonthExpenses / Math.max(liveThisMonthIncome, thisMonthExpenses, 1)) * 100}%` }}></div>
                   </div>
                   <span className="text-red-400 text-[10px] font-black w-12 text-right">{formatCompact(thisMonthExpenses)}</span>
                 </div>
               </div>

               {/* This Year */}
               <div className="w-full flex flex-col gap-2">
                 <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">This Year</span>
                 <div className="flex items-center gap-3">
                   <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
                     <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${(thisYearIncome / Math.max(thisYearIncome, thisYearExpenses, 1)) * 100}%` }}></div>
                   </div>
                   <span className="text-emerald-400 text-[10px] font-black w-12 text-right">{formatCompact(thisYearIncome)}</span>
                 </div>
                 <div className="flex items-center gap-3">
                   <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
                     <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(thisYearExpenses / Math.max(thisYearIncome, thisYearExpenses, 1)) * 100}%` }}></div>
                   </div>
                   <span className="text-red-400 text-[10px] font-black w-12 text-right">{formatCompact(thisYearExpenses)}</span>
                 </div>
               </div>

             </div>
           </motion.div>
        </div>

        {/* 3. LENT & SAVINGS CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Lent Money Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl flex flex-col h-64">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Handshake className="w-4 h-4 text-blue-400"/></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lent Money Trend</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-black text-blue-400">Rs. {formatCompact(liveTotalPendingLent)}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Pending</span>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowArray} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis stroke="#4b5563" fontSize={10} tickFormatter={(val) => formatCompact(val)} tickLine={false} axisLine={false} width={35} />
                  <ReferenceLine x={todayFormattedStr} stroke="#f59e0b" strokeDasharray="3 3" />
                  <defs>
                    <linearGradient id="colorLentChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorReceivedChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomAreaTooltip formatLKR={formatLKR} />} />
                  <Area type="monotone" dataKey="Lent" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorLentChart)" />
                  <Area type="monotone" dataKey="Received" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorReceivedChart)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Savings Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl flex flex-col h-64">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><PiggyBank className="w-4 h-4 text-emerald-400"/></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Savings Trend</span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xl font-black text-emerald-400">Rs. {formatCompact(liveTotalSavings)}</span>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Total Balance</span>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={cashFlowArray} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} minTickGap={20} />
                  <YAxis stroke="#4b5563" fontSize={10} tickFormatter={(val) => formatCompact(val)} tickLine={false} axisLine={false} width={35} />
                  <ReferenceLine x={todayFormattedStr} stroke="#f59e0b" strokeDasharray="3 3" />
                  <defs>
                    <linearGradient id="colorDepositChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorWithdrawalChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip content={<CustomAreaTooltip formatLKR={formatLKR} />} />
                  <Area type="monotone" dataKey="Deposit" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDepositChart)" />
                  <Area type="monotone" dataKey="Withdrawal" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorWithdrawalChart)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

        </div>

        {/* 4. EXPENSE BREAKDOWN COMPARISON */}
        {(() => {
          const categoryGroups = comparisonArray.reduce((acc, curr) => {
            if (!acc[curr.category]) {
              acc[curr.category] = { category: curr.category, thisMonth: 0, lastMonth: 0, subcategories: [] };
            }
            acc[curr.category].thisMonth += curr.thisMonth;
            acc[curr.category].lastMonth += curr.lastMonth;
            if (curr.subcategory !== 'Other') {
              acc[curr.category].subcategories.push(curr);
            }
            return acc;
          }, {});
          const groupedComparisonArray = Object.values(categoryGroups).sort((a, b) => b.thisMonth - a.thisMonth);

          const uniqueSubcategories = Array.from(new Set(comparisonArray.map(c => c.subcategory).filter(s => s !== 'Other')));
          uniqueSubcategories.push('Other'); // Keep 'Other' at the end

          const CHART_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#f59e0b', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9'];

          const subcatColorMap = {};
          uniqueSubcategories.forEach((subcat, i) => {
            subcatColorMap[subcat] = CHART_COLORS[i % CHART_COLORS.length];
          });

          const chartData = groupedComparisonArray.map(group => {
            const row = { category: group.category, lastMonth: group.lastMonth };
            let subcatSum = 0;
            group.subcategories.forEach(sub => {
              row[`${sub.subcategory}_thisMonth`] = sub.thisMonth;
              subcatSum += sub.thisMonth;
            });
            const otherAmount = group.thisMonth - subcatSum;
            if (otherAmount > 0) {
              row['Other_thisMonth'] = (row['Other_thisMonth'] || 0) + otherAmount;
            }
            return row;
          });

          return (
            <div className="bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl mt-6 flex flex-col">
              <div className="flex justify-between items-center w-full mb-6">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-emerald-500" /> EXPENSE BREAKDOWN COMPARISON
                </h3>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>This Month</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-slate-500"></div>Last Month</div>
                </div>
              </div>
              
              {/* Chart */}
              <div className="w-full h-[300px] mb-8 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1f2937" />
                    <XAxis type="number" stroke="#4b5563" fontSize={10} tickFormatter={(val) => `Rs${formatCompact(val)}`} />
                    <YAxis dataKey="category" type="category" stroke="#9ca3af" fontSize={10} width={120} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{fill: '#1f2937', opacity: 0.4}} content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-gray-900/90 border border-gray-700 p-3 rounded-lg shadow-xl z-50">
                            <p className="text-gray-300 text-xs font-bold uppercase mb-2">{label}</p>
                            {payload.map((entry, index) => {
                              const name = entry.name.replace('_thisMonth', '');
                              return (
                                <div key={index} className="flex items-center gap-2 text-[11px] font-bold mb-1">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                                  <span className="text-gray-300">{name}: <span className="text-white">Rs. {formatLKR(entry.value)}</span></span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      }
                      return null;
                    }} />
                    <Bar dataKey="lastMonth" fill="#4b5563" name="Last Month" radius={[0, 4, 4, 0]} barSize={8} />
                    {uniqueSubcategories.map((subcat) => (
                      <Bar 
                        key={subcat} 
                        dataKey={`${subcat}_thisMonth`} 
                        stackId="thisMonth" 
                        fill={subcatColorMap[subcat]} 
                        name={`${subcat}_thisMonth`} 
                        barSize={8} 
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-wider pb-3 border-b border-gray-800">
                <div className="col-span-6 pl-2">Category</div>
                <div className="col-span-2 text-right">This Month</div>
                <div className="col-span-2 text-right">Last Month</div>
                <div className="col-span-2 text-right">Growth</div>
              </div>
              
              {/* Table Body */}
              <div className="flex flex-col gap-1 mt-2">
                {groupedComparisonArray.map(group => {
                  const growth = group.lastMonth === 0 
                    ? (group.thisMonth > 0 ? 100 : 0)
                    : ((group.thisMonth - group.lastMonth) / group.lastMonth) * 100;
                  
                  const isExpanded = expandedCategories[group.category];
                  
                  return (
                    <div key={group.category} className="flex flex-col">
                      <div 
                        className="grid grid-cols-12 gap-4 py-3 items-center border-b border-gray-800/50 hover:bg-gray-800/20 cursor-pointer transition-colors"
                        onClick={() => toggleCategory(group.category)}
                      >
                        <div className="col-span-6 flex items-center gap-2 text-xs font-bold text-gray-200">
                          {group.subcategories.length > 0 ? (
                            <span className="text-gray-500 text-lg leading-none w-4 text-center">{isExpanded ? '˅' : '›'}</span>
                          ) : <span className="w-4"></span>}
                          {group.category}
                        </div>
                        <div className="col-span-2 text-right text-xs font-bold text-emerald-400">Rs {formatCompact(group.thisMonth)}</div>
                        <div className="col-span-2 text-right text-xs font-bold text-gray-400">Rs {formatCompact(group.lastMonth)}</div>
                        <div className={`col-span-2 text-right text-xs font-bold ${growth > 0 ? 'text-rose-400' : growth < 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                        </div>
                      </div>
                      
                      {isExpanded && group.subcategories.length > 0 && (
                        <div className="flex flex-col pl-6 bg-gray-900/20 py-2 border-b border-gray-800/50">
                          {group.subcategories.map(sub => {
                            const subGrowth = sub.lastMonth === 0 
                              ? (sub.thisMonth > 0 ? 100 : 0)
                              : ((sub.thisMonth - sub.lastMonth) / sub.lastMonth) * 100;
                            return (
                              <div key={sub.subcategory} className="grid grid-cols-12 gap-4 py-2 items-center">
                                <div className="col-span-6 flex items-center gap-2 text-[11px] font-semibold text-gray-400 pl-4 border-l-2 border-gray-700">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: subcatColorMap[sub.subcategory] }}></div>
                                  {sub.subcategory}
                                </div>
                                <div className="col-span-2 text-right text-[11px] font-bold text-emerald-500">Rs {formatCompact(sub.thisMonth)}</div>
                                <div className="col-span-2 text-right text-[11px] font-bold text-gray-500">Rs {formatCompact(sub.lastMonth)}</div>
                                <div className={`col-span-2 text-right text-[11px] font-bold ${subGrowth > 0 ? 'text-rose-500' : subGrowth < 0 ? 'text-emerald-500' : 'text-gray-600'}`}>
                                  {subGrowth > 0 ? '+' : ''}{subGrowth.toFixed(1)}%
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 5. YEARLY OVERVIEW BAR CHART */}
        <div className="mt-6">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.6 }} className="bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl flex flex-col h-80">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 rounded-lg"><Activity className="w-4 h-4 text-indigo-400"/></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Yearly Overview ({currentYear})</span>
              </div>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearlyOverviewData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                  <XAxis dataKey="month" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4b5563" fontSize={10} tickFormatter={(val) => formatCompact(val)} tickLine={false} axisLine={false} width={40} />
                  <Tooltip cursor={{fill: '#1f2937', opacity: 0.4}} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem' }} itemStyle={{ fontWeight: 'bold' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Lent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Savings" fill="#a855f7" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default DashboardTab;
