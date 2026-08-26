import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function CashFlowSummary({ formatCompact }) {
  const { transactions = [] } = useAppContext();

  const today = new Date();
  const todayStr = today.toDateString();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const startOfWeek = new Date(today);
  const dayOfWeek = startOfWeek.getDay();
  const diffToMonday = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  startOfWeek.setDate(diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const todayIncome = transactions
    .filter(t => (t.type === 'Income' || t.type === 'POS Income') && new Date(t.date).toDateString() === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const todayExpenses = transactions
    .filter(t => t.type === 'Expense' && new Date(t.date).toDateString() === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisWeekIncome = transactions
    .filter(t => {
      const d = new Date(t.date);
      return (t.type === 'Income' || t.type === 'POS Income') && d >= startOfWeek && d <= endOfWeek;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisWeekExpense = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'Expense' && d >= startOfWeek && d <= endOfWeek;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisMonthIncome = transactions
    .filter(t => {
      const d = new Date(t.date);
      return (t.type === 'Income' || t.type === 'POS Income') && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisMonthExpenses = transactions
    .filter(t => {
      const d = new Date(t.date);
      return t.type === 'Expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisYearIncome = transactions
    .filter(t => (t.type === 'Income' || t.type === 'POS Income') && new Date(t.date).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisYearExpenses = transactions
    .filter(t => t.type === 'Expense' && new Date(t.date).getFullYear() === currentYear)
    .reduce((acc, curr) => acc + curr.amount, 0);


  return (
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
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${(thisWeekIncome / Math.max(thisWeekIncome, thisWeekExpense, 1)) * 100}%` }}></div>
            </div>
            <span className="text-emerald-400 text-[10px] font-black w-12 text-right">{formatCompact(thisWeekIncome)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
              <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(thisWeekExpense / Math.max(thisWeekIncome, thisWeekExpense, 1)) * 100}%` }}></div>
            </div>
            <span className="text-red-400 text-[10px] font-black w-12 text-right">{formatCompact(thisWeekExpense)}</span>
          </div>
        </div>

        {/* This Month */}
        <div className="w-full flex flex-col gap-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">This Month</span>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" style={{ width: `${(thisMonthIncome / Math.max(thisMonthIncome, thisMonthExpenses, 1)) * 100}%` }}></div>
            </div>
            <span className="text-emerald-400 text-[10px] font-black w-12 text-right">{formatCompact(thisMonthIncome)}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-gray-800/60 rounded-full overflow-hidden border border-gray-700/30">
              <div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full" style={{ width: `${(thisMonthExpenses / Math.max(thisMonthIncome, thisMonthExpenses, 1)) * 100}%` }}></div>
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
  );
}
