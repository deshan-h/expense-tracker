import React from 'react';
import { motion } from 'framer-motion';
import { Target } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const COLORS = [
  { bg: 'bg-[#0f766e]/40', bar: 'bg-[#14b8a6]' },
  { bg: 'bg-[#4338ca]/40', bar: 'bg-[#6366f1]' },
  { bg: 'bg-[#b45309]/40', bar: 'bg-[#f59e0b]' },
  { bg: 'bg-[#6b21a8]/40', bar: 'bg-[#a855f7]' },
  { bg: 'bg-[#be123c]/40', bar: 'bg-[#f43f5e]' },
  { bg: 'bg-[#0369a1]/40', bar: 'bg-[#0ea5e9]' },
];

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

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.2 }} className="lg:col-span-4 bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl relative overflow-hidden flex flex-col justify-start">
      <div className="flex justify-between items-center w-full mb-6">
        <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
          MONTHLY BUDGETS
        </h3>
        <span className="text-xs font-black text-gray-300 bg-gray-800/80 px-2.5 py-1 rounded-md border border-gray-700/50 shadow-inner">
          Total: Rs {totalBudget.toLocaleString('en-US')}
        </span>
      </div>
      
      <div className="w-full flex flex-col gap-2 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
        {categoriesWithLimits.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-10 italic">
            No category targets set for this month.
          </div>
        ) : (
          categoriesWithLimits.map((cat, idx) => {
            const spent = getSpentThisMonth(cat.name);
            const target = parseFloat(cat.target);
            const percent = Math.min(Math.round((spent / target) * 100), 100);
            const isOver = spent > target;
            const colorObj = COLORS[idx % COLORS.length];

            return (
              <div key={cat.id} className={`relative rounded-lg overflow-hidden px-3 py-1.5 ${colorObj.bg} shadow-sm border border-white/5`}>
                <div 
                  className={`absolute left-0 top-0 bottom-0 ${isOver ? 'bg-rose-500' : colorObj.bar} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(0,0,0,0.1)]`}
                  style={{ width: `${percent}%` }}
                ></div>
                <div className="relative z-10 flex flex-row justify-between items-center gap-2">
                  <h4 className="text-white font-bold text-[13px] tracking-wide drop-shadow-md truncate">{cat.name}</h4>
                  <div className="text-white text-[11px] font-medium drop-shadow-sm whitespace-nowrap">
                    Rs {spent.toLocaleString('en-US')} / {target.toLocaleString('en-US')} ({Math.round((spent / target) * 100)}%)
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
