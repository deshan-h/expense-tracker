import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { useAppContext } from '../../context/AppContext';

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

export default function CashFlowChart({ formatCompact, formatLKR }) {
  const {
    transactions = [],
    lentMoney = [],
    savings = [],
    schedules = []
  } = useAppContext();

  const [cashFlowFilter, setCashFlowFilter] = useState('month'); // 'week' | 'month' | 'lastMonth'

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Process data for Cash Flow AreaChart (This Month)
  const thisMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Group by date string
  const groupedFlow = thisMonthTransactions.reduce((acc, curr) => {
    const dateStr = new Date(curr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, Income: 0, Expense: 0, Lent: 0, Planned: 0, Received: 0, Deposit: 0, Withdrawal: 0, Savings: 0 };
    if (curr.type === 'Income' || curr.type === 'POS Income') {
      acc[dateStr].Income += curr.amount;
    } else if (curr.type === 'Expense') {
      acc[dateStr].Expense += curr.amount;
    }
    return acc;
  }, {});

  lentMoney.forEach(person => {
    if (person.history) {
      person.history.forEach(item => {
        const d = new Date(item.date);
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          if (!groupedFlow[dateStr]) {
            groupedFlow[dateStr] = { date: dateStr, Income: 0, Expense: 0, Lent: 0, Planned: 0, Received: 0, Deposit: 0, Withdrawal: 0, Savings: 0 };
          }
          if (item.entryType === 'borrow') {
            groupedFlow[dateStr].Lent += item.amount;
          } else if (item.entryType === 'payment') {
            groupedFlow[dateStr].Received += item.amount;
          }
        }
      });
    }
  });

  const thisMonthSavingsFlow = savings.filter(t => {
    const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
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
        
        lentMoney.forEach(person => {
          if (person.history) {
            person.history.forEach(item => {
              const td = new Date(item.date);
              if (td.toDateString() === d.toDateString()) {
                if (item.entryType === 'borrow') {
                  dayLent += item.amount;
                } else if (item.entryType === 'payment') {
                  dayReceived += item.amount;
                }
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
      
      lentMoney.forEach(person => {
        if (person.history) {
          person.history.forEach(item => {
            const td = new Date(item.date);
            if (td.toDateString() === d.toDateString()) {
              if (item.entryType === 'borrow') {
                dayLent += item.amount;
              } else if (item.entryType === 'payment') {
                dayReceived += item.amount;
              }
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
    
    lentMoney.forEach(person => {
      if (person.history) {
        person.history.forEach(item => {
          const d = new Date(item.date);
          if (d >= startOfWeek && d <= endOfWeek) {
            if (item.entryType === 'borrow') {
              thisWeekLent += item.amount;
            }
          }
        });
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
  let thisMonthExpenses = 0;
  let thisMonthPlanned = 0;
  Object.values(groupedFlow).forEach(dayData => {
    thisMonthIncome += dayData.Income;
    thisMonthLentSum += dayData.Lent;
    thisMonthExpenses += dayData.Expense || 0;
    thisMonthPlanned += dayData.Planned || 0;
  });

  const displayedIncome = cashFlowFilter === 'week' ? thisWeekIncome : (cashFlowFilter === 'lastMonth' ? lastMonthIncome : thisMonthIncome);
  const displayedExpense = cashFlowFilter === 'week' ? thisWeekExpense : (cashFlowFilter === 'lastMonth' ? lastMonthExpense : thisMonthExpenses);
  const displayedLent = cashFlowFilter === 'week' ? thisWeekLent : (cashFlowFilter === 'lastMonth' ? lastMonthLent : thisMonthLentSum);
  const displayedPlanned = cashFlowFilter === 'week' ? thisWeekPlanned : (cashFlowFilter === 'lastMonth' ? lastMonthPlanned : thisMonthPlanned);

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

  return (
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
  );
}// test