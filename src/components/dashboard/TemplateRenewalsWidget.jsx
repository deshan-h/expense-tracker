import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bookmark, RotateCw, AlertCircle, CheckCircle2, Calendar, Clock, Bell, ArrowRight } from 'lucide-react';

export default function TemplateRenewalsWidget({ templates = [], formatLKR }) {
  const trackedTemplates = useMemo(() => {
    return (templates || []).filter(tpl => tpl.trackCycle && tpl.cycleDays);
  }, [templates]);

  if (trackedTemplates.length === 0) {
    return null;
  }

  const templatesWithStats = useMemo(() => {
    return trackedTemplates.map(tpl => {
      const cycle = Number(tpl.cycleDays) || 30;
      let daysPassed = 0;
      let daysLeft = cycle;
      let progressPct = 0;
      let dueDateStr = null;

      if (tpl.lastPaidDate) {
        const lastPaid = new Date(tpl.lastPaidDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        lastPaid.setHours(0, 0, 0, 0);
        const diffTime = today.getTime() - lastPaid.getTime();
        daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
        daysLeft = cycle - daysPassed;
        progressPct = Math.min(100, Math.max(0, Math.round((daysPassed / cycle) * 100)));

        const nextDueDate = new Date(lastPaid);
        nextDueDate.setDate(nextDueDate.getDate() + cycle);
        dueDateStr = nextDueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }

      const isDueSoon = daysLeft <= 7 && daysLeft >= 0;
      const isDueToday = daysLeft === 0;
      const isOverdue = daysLeft < 0;

      return {
        ...tpl,
        cycle,
        daysPassed,
        daysLeft,
        progressPct,
        dueDateStr,
        isDueSoon,
        isDueToday,
        isOverdue
      };
    });
  }, [trackedTemplates]);

  // Sort by closest due date (soonest renewal first)
  const sortedTemplates = useMemo(() => {
    return [...templatesWithStats].sort((a, b) => a.daysLeft - b.daysLeft);
  }, [templatesWithStats]);

  const dueSoonCount = sortedTemplates.filter(t => t.daysLeft <= 7).length;
  const totalUpcomingAmount = sortedTemplates.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, amount: 0.1 }} 
      transition={{ duration: 0.5 }} 
      className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] p-5 sm:p-7 rounded-[2rem] border border-gray-800/80 shadow-2xl relative overflow-hidden flex flex-col justify-start group"
    >
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
            <RotateCw className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">
                Renewal Cycles & Recurring Bills
              </h3>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30">
                Billing Forecast
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
              Live renewal schedules, countdowns, and upcoming bill cycles
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {dueSoonCount > 0 && (
            <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
              <Bell className="w-3 h-3 text-amber-400 animate-pulse" /> {dueSoonCount} Due Soon
            </span>
          )}
          <span className="text-[10px] font-black text-white bg-gray-900 border border-gray-800 px-3 py-1 rounded-xl font-mono">
            Est. Rs. {formatLKR ? formatLKR(totalUpcomingAmount) : totalUpcomingAmount}
          </span>
        </div>
      </div>

      {/* Grid of Renewal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 relative z-10">
        {sortedTemplates.map(item => {
          let badgeColor = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
          let statusText = `${item.daysLeft}d left`;

          if (item.daysLeft <= 0) {
            badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30 animate-pulse font-black';
            statusText = item.daysLeft === 0 ? 'Due Today!' : `${Math.abs(item.daysLeft)}d Overdue`;
          } else if (item.daysLeft <= 3) {
            badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold';
            statusText = `Due in ${item.daysLeft}d`;
          }

          return (
            <div 
              key={item.id} 
              className="bg-gradient-to-br from-gray-900/70 via-gray-900/50 to-gray-950/70 border border-gray-800/80 hover:border-blue-500/30 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between shadow-lg group/card"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-xl bg-gray-800/80 border border-gray-700/60 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-black text-white truncate group-hover/card:text-blue-300 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-gray-400 font-medium truncate mt-0.5">
                        {item.category}{item.subcategory ? ` • ${item.subcategory}` : ''}
                      </p>
                    </div>
                  </div>

                  {item.amount && (
                    <span className="text-xs font-black text-white font-mono bg-gray-950/80 px-2 py-0.5 rounded-lg border border-gray-800 shrink-0">
                      Rs. {formatLKR ? formatLKR(item.amount) : item.amount}
                    </span>
                  )}
                </div>

                {/* Due Date & Status Pill */}
                <div className="flex items-center justify-between gap-2 mt-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[9px] border shrink-0 ${badgeColor}`}>
                    {statusText}
                  </span>
                  {item.dueDateStr && (
                    <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-500" /> {item.dueDateStr}
                    </span>
                  )}
                </div>

                {/* Progress Bar */}
                <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden mt-3 mb-1.5 border border-gray-800/60">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      item.daysLeft <= 0 
                        ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' 
                        : item.daysLeft <= 3 
                        ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]' 
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${item.progressPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px]">
                <span className="text-gray-400 text-[9px]">
                  Cycle: <span className="text-gray-200 font-bold">{item.cycle} days</span>
                </span>
                <span className="text-gray-400 text-[9px]">
                  Elapsed: <span className="text-blue-300 font-bold">{item.daysPassed}d</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
