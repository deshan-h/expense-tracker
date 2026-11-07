import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Target, Handshake, RefreshCw, PiggyBank, Users } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function SummaryCards({ formatCompact, timeAgo }) {
  const {
    transactions = [],
    totalSavings = 0,
    totalPendingLent = 0,
    totalPendingBorrowed = 0,
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

  const uniqueLentPeopleCount = new Set(lentMoney.filter(l => (l.debtType || 'lent') === 'lent').map(l => l.name)).size;
  
  const totalWishlistEstCost = wishlistItems.reduce((acc, item) => {
    if (item.status === 'completed') return acc;
    if (item.subItems && item.subItems.length > 0) {
       return acc + item.subItems.reduce((subAcc, sub) => subAcc + (sub.isCompleted ? 0 : sub.cost), 0);
    }
    return acc + (item.estimatedCost || 0);
  }, 0);
  
  const wishlistPendingCount = wishlistItems.filter(i => i.status !== 'completed').length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 md:gap-5 mb-6">
      
      {/* 1. Today Expenses */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, amount: 0.1 }} 
        transition={{ duration: 0.4, delay: 0.05 }} 
        className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] p-4 sm:p-5 rounded-[1.5rem] border border-gray-800/80 hover:border-rose-500/30 shadow-xl relative overflow-hidden h-[124px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-rose-950/20 transition-all duration-300 group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform"></div>
        <div className="flex justify-between items-center relative z-10">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-rose-500/15 border border-rose-500/25 text-rose-400">
              <TrendingDown className="w-3 h-3" />
            </span>
            Today Expenses
          </p>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-mono relative z-10 tracking-tight">
          <span className="text-xs text-gray-500 font-sans mr-1">Rs.</span>{formatCompact(todayExpenses)}
        </h2>
        <div className="flex items-center justify-between text-[10px] text-gray-500 relative z-10 pt-1.5 border-t border-gray-800/60 font-medium">
          <span>Yest: Rs. {formatCompact(yesterdayExpenses)}</span>
          <span className={todayExpenses > yesterdayExpenses ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
            {todayExpenses > yesterdayExpenses ? "▲ Up" : "▼ Down"}
          </span>
        </div>
      </motion.div>

      {/* 2. Today's Income */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, amount: 0.1 }} 
        transition={{ duration: 0.4, delay: 0.1 }} 
        className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] p-4 sm:p-5 rounded-[1.5rem] border border-gray-800/80 hover:border-emerald-500/30 shadow-xl relative overflow-hidden h-[124px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-950/20 transition-all duration-300 group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform"></div>
        <div className="flex justify-between items-center relative z-10">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400">
              <DollarSign className="w-3 h-3" />
            </span>
            Today Income
          </p>
          <button 
            onClick={handleRefresh} 
            disabled={isSyncing} 
            className="p-1 bg-gray-900/80 border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-all shadow-inner"
            title="Sync POS / Transactions"
          >
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-emerald-400 font-mono relative z-10 tracking-tight">
          <span className="text-xs text-gray-500 font-sans mr-1">Rs.</span>{formatCompact(todayIncome)}
        </h2>
        <div className="flex items-center justify-between text-[10px] text-gray-500 relative z-10 pt-1.5 border-t border-gray-800/60 font-medium">
          <span>Yest: Rs. {formatCompact(yesterdayIncome)}</span>
          <span className="text-emerald-400/90 font-bold">Revenue</span>
        </div>
      </motion.div>

      {/* 3. Savings Balance */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, amount: 0.1 }} 
        transition={{ duration: 0.4, delay: 0.15 }} 
        className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] p-4 sm:p-5 rounded-[1.5rem] border border-gray-800/80 hover:border-pink-500/30 shadow-xl relative overflow-hidden h-[124px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-pink-950/20 transition-all duration-300 group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform"></div>
        <div className="flex justify-between items-center relative z-10">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-pink-500/15 border border-pink-500/25 text-pink-400">
              <PiggyBank className="w-3 h-3" />
            </span>
            Savings Balance
          </p>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-mono relative z-10 tracking-tight">
          <span className="text-xs text-gray-500 font-sans mr-1">Rs.</span>{formatCompact(totalSavings)}
        </h2>
        <div className="flex items-center justify-between text-[10px] text-gray-500 relative z-10 pt-1.5 border-t border-gray-800/60 font-medium">
          <span className="flex items-center gap-1 text-emerald-400 font-bold">
            <TrendingUp className="w-2.5 h-2.5" /> +{formatCompact(thisMonthSavingsDeposits)}
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-bold">
            <TrendingDown className="w-2.5 h-2.5" /> -{formatCompact(thisMonthSavingsWithdrawals)}
          </span>
        </div>
      </motion.div>

      {/* 4. Total Lent & Debts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, amount: 0.1 }} 
        transition={{ duration: 0.4, delay: 0.2 }} 
        className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] p-4 sm:p-5 rounded-[1.5rem] border border-gray-800/80 hover:border-blue-500/30 shadow-xl relative overflow-hidden h-[124px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-950/20 transition-all duration-300 group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform"></div>
        <div className="flex items-center justify-between relative z-10">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-400">
              <Handshake className="w-3 h-3" />
            </span>
            Total Lent
          </p>
          {totalPendingBorrowed > 0 && (
            <span className="text-[9px] text-rose-400 font-black bg-rose-500/15 border border-rose-500/25 px-1.5 py-0.5 rounded-full">
              Owe: {formatCompact(totalPendingBorrowed)}
            </span>
          )}
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-white font-mono relative z-10 tracking-tight">
          <span className="text-xs text-gray-500 font-sans mr-1">Rs.</span>{formatCompact(totalPendingLent)}
        </h2>
        <div className="flex items-center justify-between text-[10px] text-gray-500 relative z-10 pt-1.5 border-t border-gray-800/60 font-medium">
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3 text-blue-400" /> {uniqueLentPeopleCount} Borrowers
          </span>
          <span className="text-blue-400 font-bold">Receivable</span>
        </div>
      </motion.div>

      {/* 5. Wishlist Goals */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        whileInView={{ opacity: 1, y: 0 }} 
        viewport={{ once: true, amount: 0.1 }} 
        transition={{ duration: 0.4, delay: 0.25 }} 
        className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] p-4 sm:p-5 rounded-[1.5rem] border border-gray-800/80 hover:border-purple-500/30 shadow-xl relative overflow-hidden h-[124px] flex flex-col justify-between hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/20 transition-all duration-300 group"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform"></div>
        <div className="flex items-center justify-between relative z-10">
          <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
            <span className="p-1 rounded-lg bg-purple-500/15 border border-purple-500/25 text-purple-400">
              <Target className="w-3 h-3" />
            </span>
            Wishlist Goals
          </p>
          <span className="text-[9px] font-black text-purple-400 bg-purple-500/15 border border-purple-500/25 px-1.5 py-0.5 rounded-full">
            {wishlistPendingCount} Active
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-purple-400 font-mono relative z-10 tracking-tight">
          <span className="text-xs text-gray-500 font-sans mr-1">Rs.</span>{formatCompact(totalWishlistEstCost)}
        </h2>
        <div className="flex items-center justify-between text-[10px] text-gray-500 relative z-10 pt-1.5 border-t border-gray-800/60 font-medium">
          <span>Est. Target Budget</span>
          <span className="text-purple-400 font-bold">Milestones</span>
        </div>
      </motion.div>

    </div>
  );
}
