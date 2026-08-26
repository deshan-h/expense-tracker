import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Target, Handshake, RefreshCw, PiggyBank, Users } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function SummaryCards({ formatCompact, timeAgo }) {
  const {
    transactions = [],
    totalSavings = 0,
    totalPendingLent = 0,
    lentMoney = [],
    wishlistItems = [],
    isSyncing,
    handleSyncPOS
  } = useAppContext();

  // Refresh
  const handleRefresh = async () => {
    if (handleSyncPOS) await handleSyncPOS();
  };

  const today = new Date();
  const todayStr = today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const todayIncome = transactions
    .filter(t => (t.type === 'Income' || t.type === 'POS Income') && new Date(t.date).toDateString() === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const yesterdayIncome = transactions
    .filter(t => (t.type === 'Income' || t.type === 'POS Income') && new Date(t.date).toDateString() === yesterdayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const todayExpenses = transactions
    .filter(t => t.type === 'Expense' && new Date(t.date).toDateString() === todayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const yesterdayExpenses = transactions
    .filter(t => t.type === 'Expense' && new Date(t.date).toDateString() === yesterdayStr)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const thisMonthExpensesTransactions = transactions.filter(t => {
    if (t.type !== 'Expense') return false;
    const d = new Date(t.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  // Calculate Savings Breakdown
  const { savings = [] } = useAppContext();
  let thisMonthSavingsDeposits = 0;
  let thisMonthSavingsWithdrawals = 0;
  
  savings.forEach(t => {
    const td = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    if (td.getMonth() === currentMonth && td.getFullYear() === currentYear) {
      if (t.type === 'Deposit' || t.type === 'Initial') thisMonthSavingsDeposits += t.amount;
      else if (t.type === 'Withdrawal') thisMonthSavingsWithdrawals += t.amount;
    }
  });

  const uniqueLentPeopleCount = new Set(lentMoney.map(l => l.name)).size;
  
  const totalWishlistEstCost = wishlistItems.reduce((acc, item) => {
    if (item.status === 'completed') return acc;
    if (item.subItems && item.subItems.length > 0) {
       return acc + item.subItems.reduce((subAcc, sub) => subAcc + (sub.isCompleted ? 0 : sub.cost), 0);
    }
    return acc + (item.estimatedCost || 0);
  }, 0);
  
  const wishlistPendingCount = wishlistItems.filter(i => i.status !== 'completed').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 mb-6">
      
      {/* Today Expenses */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.1 }} className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-gray-800/80 shadow-xl relative overflow-hidden h-28 flex flex-col justify-center hover:-translate-y-1 hover:shadow-2xl hover:border-gray-700/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-rose-600/10 rounded-full blur-[40px] mix-blend-screen pointer-events-none"></div>
        <div className="flex justify-between items-start mb-1.5 relative z-10">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
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
      {/* Today's Income */}
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.2 }} className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 rounded-2xl border border-gray-800/80 shadow-xl relative overflow-hidden h-28 flex flex-col justify-center hover:-translate-y-1 hover:shadow-2xl hover:border-gray-700/50 transition-all duration-300">
        <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-emerald-600/10 rounded-full blur-[40px] mix-blend-screen pointer-events-none"></div>
        <div className="flex justify-between items-start mb-1.5 relative z-10">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 mt-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Today's Income
          </p>
          <button onClick={handleRefresh} disabled={isSyncing} className="p-1 bg-gray-800/80 rounded-md hover:bg-gray-700 transition-colors group">
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
  );
}
