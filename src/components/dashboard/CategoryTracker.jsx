import React from 'react';
import { motion } from 'framer-motion';
import { Target, CheckCircle2, AlertTriangle, AlertCircle, TrendingUp } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function CategoryTracker({ formatLKR }) {
  const { transactions = [], categories = [] } = useAppContext();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const categoriesWithLimits = categories.filter(c => c.target && c.type !== 'Income');
  const totalBudget = categoriesWithLimits.reduce((sum, cat) => sum + parseFloat(cat.target || 0), 0);

  const getSpentThisMonth = (catName) => {
    return transactions
      .filter(t => t.type === 'Expense' && t.category === catName)
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
  };

  const totalSpentAcrossTargets = categoriesWithLimits.reduce((sum, cat) => sum + getSpentThisMonth(cat.name), 0);
  const overallPercentage = totalBudget > 0 ? Math.min(100, Math.round((totalSpentAcrossTargets / totalBudget) * 100)) : 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, amount: 0.1 }} 
      transition={{ duration: 0.5, delay: 0.2 }} 
      className="lg:col-span-4 bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] p-5 sm:p-6 rounded-[2rem] border border-gray-800/80 shadow-2xl relative overflow-hidden flex flex-col justify-start group"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="flex justify-between items-center w-full mb-4 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-widest">
              Monthly Budgets
            </h3>
            <p className="text-[10px] text-gray-500 font-medium">Category spending targets</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-black text-cyan-300 font-mono bg-cyan-950/40 border border-cyan-500/30 px-2.5 py-1 rounded-xl shadow-sm">
            {formatLKR ? formatLKR(totalBudget) : `Rs. ${totalBudget.toLocaleString('en-US')}`}
          </span>
        </div>
      </div>

      {/* Overall Progress Mini Bar */}
      {totalBudget > 0 && (
        <div className="mb-4 p-3.5 bg-gradient-to-r from-cyan-950/40 via-blue-950/30 to-indigo-950/40 rounded-2xl border border-cyan-500/25 shadow-lg shadow-cyan-950/20 relative z-10 overflow-hidden group/bar">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 pointer-events-none" />
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider mb-2 relative z-10">
            <div className="flex items-center gap-1.5 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Overall Budget Used</span>
            </div>
            <span className={`font-mono font-black ${
              overallPercentage >= 100 
                ? "text-rose-400" 
                : overallPercentage >= 80 
                ? "text-amber-400" 
                : "text-cyan-300"
            }`}>
              {overallPercentage}% <span className="text-gray-400 font-medium">({formatLKR ? formatLKR(totalSpentAcrossTargets) : `Rs. ${totalSpentAcrossTargets.toLocaleString('en-US')}`})</span>
            </span>
          </div>
          <div className="w-full h-2 bg-gray-900/90 rounded-full overflow-hidden border border-cyan-500/20 relative z-10 p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                overallPercentage >= 100 
                  ? 'bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_10px_rgba(244,63,94,0.7)]' 
                  : overallPercentage >= 80 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]' 
                  : 'bg-gradient-to-r from-cyan-400 via-sky-500 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.6)]'
              }`}
              style={{ width: `${overallPercentage}%` }}
            ></div>
          </div>
        </div>
      )}
      
      {/* List of Categories */}
      <div className="w-full flex flex-col gap-2.5 overflow-y-auto max-h-[360px] pr-1.5 hide-scrollbar relative z-10">
        {categoriesWithLimits.length === 0 ? (
          <div className="text-gray-500 text-xs text-center py-10 bg-gray-950/30 rounded-2xl border border-dashed border-gray-800">
            <Target className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="font-semibold text-gray-400">No category limits set.</p>
            <p className="text-[10px] text-gray-600 mt-0.5">Set monthly targets in Settings to track your limits.</p>
          </div>
        ) : (
          categoriesWithLimits.map((cat) => {
            const spent = getSpentThisMonth(cat.name);
            const target = parseFloat(cat.target);
            const actualRatio = target > 0 ? (spent / target) : 0;
            const percent = Math.min(Math.round(actualRatio * 100), 100);
            const isOver = spent > target;
            const isNearLimit = !isOver && percent >= 80;

            let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            let barColor = 'from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]';
            let statusLabel = 'On Track';

            if (isOver) {
              statusColor = 'text-rose-400 bg-rose-500/15 border-rose-500/30';
              barColor = 'from-rose-500 to-pink-600 shadow-[0_0_8px_rgba(244,63,94,0.5)]';
              statusLabel = `+Rs. ${(spent - target).toLocaleString('en-US')} Over`;
            } else if (isNearLimit) {
              statusColor = 'text-amber-400 bg-amber-500/15 border-amber-500/30';
              barColor = 'from-amber-500 to-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]';
              statusLabel = 'Near Limit';
            }

            return (
              <div 
                key={cat.id} 
                className={`bg-gray-950/50 hover:bg-gray-900/60 p-3 rounded-xl border transition-all duration-200 ${
                  isOver ? 'border-rose-500/30' : 'border-gray-800/80 hover:border-gray-700/80'
                }`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color || '#10b981' }}></span>
                    <h4 className="text-white font-bold text-xs truncate">{cat.name}</h4>
                  </div>
                  
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${statusColor}`}>
                    {statusLabel}
                  </span>
                </div>

                {/* Progress Track */}
                <div className="w-full h-1.5 bg-gray-900 rounded-full overflow-hidden border border-gray-800 my-1.5">
                  <div 
                    className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-1000`}
                    style={{ width: `${percent}%` }}
                  ></div>
                </div>

                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                  <span>Rs. {spent.toLocaleString('en-US')} spent</span>
                  <span>Limit: Rs. {target.toLocaleString('en-US')} ({Math.round(actualRatio * 100)}%)</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
