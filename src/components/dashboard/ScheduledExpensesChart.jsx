import React, { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { CalendarClock } from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const ScheduledExpensesChart = ({ schedules, formatLKR, formatCompact }) => {
  const { weeklyTotal, monthlyTotal, chartData } = useMemo(() => {
    let week = 0;
    let month = 0;
    const categoryTotals = {};
    
    const now = new Date();
    // Normalize 'now' to start of day for comparison
    now.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + 7);

    const endOfMonth = new Date(now);
    endOfMonth.setDate(now.getDate() + 30);

    (schedules || []).forEach(schedule => {
      if (schedule.status !== 'active' || schedule.askBefore) return;

      const amt = parseFloat(schedule.amount) || 0;
      if (amt <= 0 || !schedule.nextDate) return;

      let nextDate = new Date(schedule.nextDate);
      nextDate.setHours(0, 0, 0, 0);

      // Fast-forward past due dates if frequency is not Once to avoid infinite loops on old data
      // though typically they process past ones, let's just simulate from its current nextDate
      let iterations = 0;
      const maxIterations = 365; // safety net

      while (nextDate <= endOfMonth && iterations < maxIterations) {
        iterations++;
        
        if (nextDate >= now || nextDate.getTime() === now.getTime()) {
          // Count for month (next 30 days)
          month += amt;
          
          const cat = schedule.category || 'Other';
          if (!categoryTotals[cat]) categoryTotals[cat] = 0;
          categoryTotals[cat] += amt;

          // Count for week (next 7 days)
          if (nextDate <= endOfWeek) {
            week += amt;
          }
        }

        // Advance date
        if (schedule.frequency === 'Once') {
          break;
        } else if (schedule.frequency === 'Daily') {
          nextDate.setDate(nextDate.getDate() + 1);
        } else if (schedule.frequency === 'Weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (schedule.frequency === 'Monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (schedule.frequency === 'Yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        } else {
          break; // safety fallback
        }
      }
    });

    const data = Object.keys(categoryTotals)
      .map(cat => ({
        name: cat,
        value: categoryTotals[cat]
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return { weeklyTotal: week, monthlyTotal: month, chartData: data };
  }, [schedules]);

  if (!chartData || chartData.length === 0) {
    return null; // Don't show if no recurring scheduled expenses
  }

  return (
    <div className="w-full bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors duration-500"></div>
      
      <div className="flex items-center gap-3 mb-6 relative z-10">
        <div className="p-3 bg-indigo-500/20 rounded-2xl shadow-inner border border-indigo-500/20">
          <CalendarClock className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white tracking-wide">Scheduled Projections</h2>
          <p className="text-gray-400 text-sm">Expected future recurring expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
        {/* PROJECTION STATS */}
        <div className="flex flex-col justify-center gap-4">
          <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700/50 flex flex-col items-center justify-center text-center">
            <span className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">This Week Expected</span>
            <span className="text-3xl font-black text-white drop-shadow-md">{formatCompact(weeklyTotal)}</span>
            <span className="text-xs text-gray-500 mt-1">{formatLKR(weeklyTotal)}</span>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-2xl border border-gray-700/50 flex flex-col items-center justify-center text-center">
            <span className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">This Month Expected</span>
            <span className="text-3xl font-black text-white drop-shadow-md">{formatCompact(monthlyTotal)}</span>
            <span className="text-xs text-gray-500 mt-1">{formatLKR(monthlyTotal)}</span>
          </div>
        </div>

        {/* PIE CHART */}
        <div className="h-[250px] w-full flex flex-col relative">
          <h3 className="text-center text-gray-400 font-semibold text-sm mb-2">Monthly Breakdown</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value) => formatLKR(value)}
                contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px', color: '#fff', fontWeight: 'bold' }}
                itemStyle={{ color: '#e5e7eb' }}
              />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ACTIVE SCHEDULES LIST */}
      {schedules && schedules.some(s => s.status === 'active' && s.frequency !== 'Once' && !s.askBefore) && (
        <div className="mt-8 pt-6 border-t border-gray-800/50 relative z-10">
          <h3 className="text-gray-400 font-bold text-sm mb-4 uppercase tracking-wider">Active Schedules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[250px] overflow-y-auto hide-scrollbar pr-2">
            {schedules.filter(s => s.status === 'active' && s.frequency !== 'Once' && !s.askBefore).map(schedule => (
              <div key={schedule.id} className="bg-gray-800/30 border border-gray-700/50 p-3 rounded-xl flex items-center justify-between hover:bg-gray-800/50 transition-colors">
                <div className="flex flex-col overflow-hidden mr-2">
                  <span className="text-white font-bold text-sm truncate">{schedule.description || schedule.category}</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] bg-gray-700/50 text-gray-300 px-1.5 rounded">{schedule.category}</span>
                    <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-1.5 rounded">{schedule.frequency}</span>
                  </div>
                </div>
                <div className="font-black text-rose-400 text-sm whitespace-nowrap bg-rose-500/10 px-2 py-1 rounded-lg">
                  {formatCompact(schedule.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledExpensesChart;
