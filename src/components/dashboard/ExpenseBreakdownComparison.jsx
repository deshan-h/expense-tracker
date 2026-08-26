import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
import { PieChart as PieChartIcon } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export default function ExpenseBreakdownComparison({ formatCompact, formatLKR }) {
  const { transactions = [] } = useAppContext();
  
  const [expandedCategories, setExpandedCategories] = useState({});
  const toggleCategory = (cat) => setExpandedCategories(prev => ({...prev, [cat]: !prev[cat]}));

  const today = new Date();
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
                <div className="flex flex-col bg-gray-900/40 rounded-b-lg border-x border-b border-gray-800/50 p-2 mb-1">
                  {group.subcategories.map(sub => {
                    const subGrowth = sub.lastMonth === 0 
                      ? (sub.thisMonth > 0 ? 100 : 0)
                      : ((sub.thisMonth - sub.lastMonth) / sub.lastMonth) * 100;
                    return (
                      <div key={sub.subcategory} className="grid grid-cols-12 gap-4 py-2 items-center text-[11px]">
                        <div className="col-span-6 pl-8 flex items-center gap-2 text-gray-400 font-medium">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: subcatColorMap[sub.subcategory] }}></div>
                          {sub.subcategory}
                        </div>
                        <div className="col-span-2 text-right text-emerald-400/80">Rs {formatCompact(sub.thisMonth)}</div>
                        <div className="col-span-2 text-right text-gray-500">Rs {formatCompact(sub.lastMonth)}</div>
                        <div className={`col-span-2 text-right ${subGrowth > 0 ? 'text-rose-400/80' : subGrowth < 0 ? 'text-emerald-400/80' : 'text-gray-600'}`}>
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
}
