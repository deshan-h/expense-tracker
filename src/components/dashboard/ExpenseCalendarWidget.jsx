import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const ExpenseCalendarWidget = ({ formatCompact }) => {
  const { transactions } = useAppContext();
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // Calculate grid
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Sun) to 6 (Sat)
  
  // Create an array of days to render the grid (including padding for empty cells)
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Empty cells for days before the 1st (Monday start: 0=Sun->6 padding, 1=Mon->0 padding)
    const padding = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    for (let i = 0; i < padding; i++) {
      days.push(null);
    }
    
    // Calculate total expenses for each day in this month
    const expenseMap = {}; // key: day number, value: { total: number, categories: object }
    
    if (transactions) {
      transactions.forEach(t => {
        if (t.type === 'Expense') {
          const d = t.date?.toDate ? t.date.toDate() : new Date(t.date);
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            const day = d.getDate();
            if (!expenseMap[day]) {
              expenseMap[day] = { total: 0, categories: {} };
            }
            expenseMap[day].total += (Number(t.amount) || 0);
            
            const cat = t.category || 'Expense';
            if (!expenseMap[day].categories[cat]) {
              expenseMap[day].categories[cat] = [];
            }
            
            expenseMap[day].categories[cat].push({
              subcategory: t.subcategory || '',
              description: t.description || '',
              amount: Number(t.amount) || 0
            });
          }
        }
      });
    }
    
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        date: i,
        expense: expenseMap[i]?.total || 0,
        categories: expenseMap[i]?.categories || {},
        isToday: today.getDate() === i && today.getMonth() === currentMonth && today.getFullYear() === currentYear
      });
    }
    
    return days;
  }, [transactions, currentMonth, currentYear, today, daysInMonth, firstDayOfMonth]);
  
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getExpenseIntensityClass = (amount) => {
    if (amount > 10000) return 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[inset_0_0_20px_rgba(244,63,94,0.15)] hover:bg-rose-500/30 hover:border-rose-400';
    if (amount > 5000) return 'bg-orange-500/20 border-orange-500/40 text-orange-300 shadow-[inset_0_0_15px_rgba(249,115,22,0.15)] hover:bg-orange-500/30 hover:border-orange-400';
    if (amount > 1000) return 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[inset_0_0_15px_rgba(245,158,11,0.15)] hover:bg-amber-500/30 hover:border-amber-400';
    return 'bg-blue-500/10 border-blue-500/30 text-blue-300 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)] hover:bg-blue-500/20 hover:border-blue-400';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, amount: 0.1 }} 
      transition={{ duration: 0.5, delay: 0.5 }} 
      className="bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl flex flex-col h-full min-h-[550px]"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-rose-500/10 rounded-lg">
            <Calendar className="w-4 h-4 text-rose-400"/>
          </div>
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Expense Calendar</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[12px] font-black text-gray-300">
            {today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-0 flex flex-col">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="text-center text-[9px] font-bold text-gray-500 uppercase tracking-wider py-1">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1 flex-1">
          {calendarDays.map((dayObj, index) => {
            if (!dayObj) {
              return (
                <div key={`empty-${index}`} className="bg-gray-900/20 rounded-lg border border-transparent"></div>
              );
            }
            
            const hasExpense = dayObj.expense > 0;
            const intensityClass = hasExpense ? getExpenseIntensityClass(dayObj.expense) : 'bg-gray-900/40 border-gray-800/50';
            
            return (
              <div 
                key={`day-${dayObj.date}`} 
                className={`group relative flex flex-col items-center justify-start p-1 sm:p-2 rounded-lg border transition-all duration-300 ${
                  dayObj.isToday 
                    ? 'bg-purple-500/20 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:bg-purple-500/30 z-10' 
                    : intensityClass
                }`}
              >
                <span className={`text-[10px] sm:text-xs font-bold mb-1 ${
                  dayObj.isToday ? 'text-purple-300' : hasExpense ? '' : 'text-gray-500'
                }`}>
                  {dayObj.date}
                </span>
                
                {hasExpense && (
                  <>
                    <div className="mt-auto w-full text-center">
                      <span className={`text-[8px] sm:text-[9px] font-black leading-tight block break-all ${
                        dayObj.expense > 10000 ? 'text-rose-400/90' : 
                        dayObj.expense > 5000 ? 'text-orange-400/90' : 
                        dayObj.expense > 1000 ? 'text-amber-400/90' : 'text-blue-400/90'
                      }`}>
                        {formatCompact(dayObj.expense)}
                      </span>
                    </div>

                    {/* Hover Tooltip */}
                    <div className="absolute z-50 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bottom-full left-1/2 -translate-x-1/2 mb-2 w-max min-w-[200px] sm:min-w-[240px] max-w-sm bg-gray-950/95 backdrop-blur-xl border border-gray-700/80 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] rounded-2xl p-4 pointer-events-none">
                      <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                           Expenses
                         </h4>
                         <span className="text-[10px] font-bold bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full">
                           Rs. {formatCompact(dayObj.expense)}
                         </span>
                      </div>
                      <div className="flex flex-col gap-3 max-h-48 overflow-y-auto hide-scrollbar pr-1">
                        {Object.keys(dayObj.categories || {}).map((catName, idx) => {
                          const items = dayObj.categories[catName];
                          const catTotal = items.reduce((acc, curr) => acc + curr.amount, 0);
                          
                          // Generate a color based on index for the category
                          const colors = ['text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-purple-400', 'text-pink-400', 'text-cyan-400'];
                          const colorClass = colors[idx % colors.length];
                          
                          return (
                            <div key={idx} className="flex flex-col gap-1">
                              <div className="flex justify-between items-center">
                                <span className={`text-[10px] font-black uppercase tracking-wider ${colorClass}`}>{catName}</span>
                                <span className={`text-[10px] font-bold ${colorClass} opacity-80`}>Rs. {formatCompact(catTotal)}</span>
                              </div>
                              <div className="flex flex-col gap-1 pl-2 border-l border-gray-800 ml-1 mt-0.5">
                                {items.map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex justify-between items-center gap-4 text-[10px]">
                                    <div className="flex flex-col">
                                      <span className="text-gray-300 font-medium truncate max-w-[120px]" title={item.subcategory || 'General'}>
                                        {item.subcategory || 'General'}
                                      </span>
                                    </div>
                                    <span className="font-bold text-gray-400 shrink-0">
                                      {formatCompact(item.amount)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export default ExpenseCalendarWidget;
