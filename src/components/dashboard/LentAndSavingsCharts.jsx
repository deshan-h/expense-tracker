import React from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { Handshake, PiggyBank } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import ExpenseCalendarWidget from './ExpenseCalendarWidget';

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

export default function LentAndSavingsCharts({ formatCompact, formatLKR }) {
  const {
    transactions = [],
    lentMoney = [],
    savings = [],
    totalPendingLent = 0,
    totalSavings = 0,
    schedules = []
  } = useAppContext();

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const todayFormattedStr = today.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  // Compute CashFlowArray strictly for this month (default filter in dashboard)
  const thisMonthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const groupedFlow = thisMonthTransactions.reduce((acc, curr) => {
    const dateStr = new Date(curr.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    if (!acc[dateStr]) acc[dateStr] = { date: dateStr, Income: 0, Expense: 0, Lent: 0, Planned: 0, Received: 0, Deposit: 0, Withdrawal: 0, Savings: 0 };
    acc[dateStr][curr.type] += curr.amount;
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
    groupedFlow[dateStr].Savings += curr.amount; 
    if (curr.type === 'Deposit' || curr.type === 'Initial') {
      groupedFlow[dateStr].Deposit += curr.amount;
    } else if (curr.type === 'Withdrawal') {
      groupedFlow[dateStr].Withdrawal += curr.amount;
    }
  });

  const targetDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const cashFlowArray = [];

  for (let i = 1; i <= targetDaysInMonth; i++) {
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
        Received: groupedFlow[dateStr].Received || 0,
        Deposit: groupedFlow[dateStr].Deposit || 0,
        Withdrawal: groupedFlow[dateStr].Withdrawal || 0,
        Planned: groupedFlow[dateStr].Planned || 0,
        Savings: groupedFlow[dateStr].Savings || 0
      });
    } else {
      cashFlowArray.push({ date: dateStr, day: dayStr, Income: 0, Expense: 0, Lent: 0, Received: 0, Deposit: 0, Withdrawal: 0, Planned: 0, Savings: 0 });
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Left Column: Stacked Charts */}
      <div className="flex flex-col gap-6 h-full">
        {/* Lent Money Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl flex flex-col flex-1 min-h-[250px]">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg"><Handshake className="w-4 h-4 text-blue-400"/></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Lent Money Trend</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xl font-black text-blue-400">Rs. {formatCompact(totalPendingLent)}</span>
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
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.4 }} className="bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl flex flex-col flex-1 min-h-[250px]">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><PiggyBank className="w-4 h-4 text-emerald-400"/></div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Savings Trend</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xl font-black text-emerald-400">Rs. {formatCompact(totalSavings)}</span>
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

      {/* Right Column: Expense Calendar */}
      <div className="flex flex-col h-full">
        <ExpenseCalendarWidget formatCompact={formatCompact} />
      </div>

    </div>
  );
}
