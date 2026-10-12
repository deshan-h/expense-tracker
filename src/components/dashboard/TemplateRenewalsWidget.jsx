import React from 'react';
import { motion } from 'framer-motion';
import { Bookmark, RotateCw, AlertCircle, CheckCircle2, Calendar } from 'lucide-react';

export default function TemplateRenewalsWidget({ templates = [], formatLKR }) {
  const trackedTemplates = (templates || []).filter(tpl => tpl.trackCycle && tpl.cycleDays);

  if (trackedTemplates.length === 0) {
    return null; // Don't show widget if no renewal-tracked templates exist
  }

  const templatesWithStats = trackedTemplates.map(tpl => {
    const cycle = Number(tpl.cycleDays) || 30;
    let daysPassed = 0;
    let daysLeft = cycle;
    let progressPct = 0;
    let status = 'normal'; // 'normal', 'due-soon', 'due-today', 'overdue'

    if (tpl.lastPaidDate) {
      const lastPaid = new Date(tpl.lastPaidDate);
      const today = new Date();
      const diffTime = today.setHours(0, 0, 0, 0) - lastPaid.setHours(0, 0, 0, 0);
      daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      daysLeft = cycle - daysPassed;
      progressPct = Math.min(100, Math.max(0, Math.round((daysPassed / cycle) * 100)));

      if (daysLeft < 0) {
        status = 'overdue';
      } else if (daysLeft === 0) {
        status = 'due-today';
      } else if (daysLeft <= 3) {
        status = 'due-soon';
      }
    }

    return {
      ...tpl,
      cycle,
      daysPassed,
      daysLeft,
      progressPct,
      status
    };
  });

  // Sort: Overdue & due soon first
  templatesWithStats.sort((a, b) => a.daysLeft - b.daysLeft);

  const dueCount = templatesWithStats.filter(t => t.daysLeft <= 3).length;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, amount: 0.1 }} 
      transition={{ duration: 0.5 }} 
      className="bg-[#0b1120] p-5 sm:p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl relative overflow-hidden flex flex-col justify-start"
    >
      {/* Background ambient light */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Widget Header */}
      <div className="flex justify-between items-center w-full mb-5 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-inner">
            <RotateCw className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-200 uppercase tracking-widest flex items-center gap-2">
              RENEWAL CYCLES & BILLS
            </h3>
            <p className="text-[10px] text-gray-500 font-medium">Auto-tracked recurring templates</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dueCount > 0 && (
            <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> {dueCount} Due Soon
            </span>
          )}
          <span className="text-[10px] font-bold text-gray-400 bg-gray-800/80 px-2.5 py-1 rounded-lg border border-gray-700/50">
            {templatesWithStats.length} Total
          </span>
        </div>
      </div>

      {/* Grid of Renewal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 relative z-10">
        {templatesWithStats.map(item => {
          let badgeColor = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
          let barColor = 'bg-emerald-500';
          let statusText = `${item.daysLeft} days left`;

          if (item.status === 'overdue') {
            badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            barColor = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse';
            statusText = `Overdue by ${Math.abs(item.daysLeft)}d`;
          } else if (item.status === 'due-today') {
            badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
            barColor = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.6)] animate-pulse';
            statusText = 'Due Today';
          } else if (item.status === 'due-soon') {
            badgeColor = 'bg-amber-500/10 text-amber-300 border-amber-500/20';
            barColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
            statusText = `${item.daysLeft} days left`;
          }

          return (
            <div 
              key={item.id} 
              className="bg-gray-900/60 hover:bg-gray-900/90 border border-gray-800/80 hover:border-gray-700 rounded-2xl p-4 transition-all flex flex-col justify-between shadow-inner group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="p-1.5 rounded-lg bg-gray-800 border border-gray-700/60 text-purple-400 shrink-0">
                      <Bookmark className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-white transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-[9px] text-gray-500 font-medium truncate">
                        {item.category}{item.subcategory ? ` • ${item.subcategory}` : ''}
                      </p>
                    </div>
                  </div>

                  {item.amount && (
                    <div className="text-right shrink-0">
                      <span className="text-xs font-extrabold text-gray-100 font-mono">
                        Rs. {formatLKR ? formatLKR(item.amount) : item.amount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Progress and status */}
              <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-gray-500" /> {item.cycle}d cycle
                  </span>
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] border ${badgeColor}`}>
                    {statusText}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                    style={{ width: `${item.progressPct}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
