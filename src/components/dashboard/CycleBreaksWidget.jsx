import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HeartCrack, 
  ShieldCheck, 
  RotateCw, 
  Bookmark, 
  CheckCircle2,
  Award,
  Flame,
  TrendingUp,
  AlertTriangle,
  Zap,
  Target
} from 'lucide-react';

export default function CycleBreaksWidget({ templates = [], formatLKR }) {
  const [filter, setFilter] = useState('all'); // 'all' | 'streaks' | 'goals' | 'breaks'

  const trackedTemplates = useMemo(() => {
    return (templates || []).filter(tpl => tpl.trackCycle);
  }, [templates]);

  if (trackedTemplates.length === 0) {
    return null;
  }

  // Calculate stats & days unbroken for each template
  const templatesWithStreaks = useMemo(() => {
    return trackedTemplates.map(tpl => {
      const cycle = Number(tpl.cycleDays) || 30;
      const lastPaidStr = tpl.lastPaidDate || new Date().toLocaleDateString('en-CA');
      const lastPaid = new Date(lastPaidStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      lastPaid.setHours(0, 0, 0, 0);
      const diffTime = today.getTime() - lastPaid.getTime();
      const daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
      const daysLeft = cycle - daysPassed;
      const isGoalReached = daysPassed >= cycle;
      const progressPct = isGoalReached ? 100 : Math.min(100, Math.max(0, Math.round((daysPassed / cycle) * 100)));

      return {
        ...tpl,
        cycle,
        daysPassed,
        daysLeft,
        isGoalReached,
        progressPct,
        breakCount: tpl.cycleBreakCount || 0
      };
    });
  }, [trackedTemplates]);

  const totalTracked = templatesWithStreaks.length;
  const brokenTemplates = useMemo(() => templatesWithStreaks.filter(t => t.breakCount > 0), [templatesWithStreaks]);
  const cleanTemplates = useMemo(() => templatesWithStreaks.filter(t => t.breakCount === 0), [templatesWithStreaks]);
  const totalBreaks = useMemo(() => templatesWithStreaks.reduce((sum, t) => sum + t.breakCount, 0), [templatesWithStreaks]);
  const goalsMetCount = useMemo(() => templatesWithStreaks.filter(t => t.isGoalReached).length, [templatesWithStreaks]);
  const maxStreak = useMemo(() => {
    return templatesWithStreaks.length > 0 ? Math.max(...templatesWithStreaks.map(t => t.daysPassed)) : 0;
  }, [templatesWithStreaks]);
  
  // Discipline / Adherence Score (0-100%)
  const disciplineScore = totalTracked > 0 
    ? Math.round((cleanTemplates.length / totalTracked) * 100) 
    : 100;

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    let list = [...templatesWithStreaks];
    if (filter === 'streaks') {
      list = list.filter(t => t.daysPassed > 0 && !t.isGoalReached);
    } else if (filter === 'goals') {
      list = list.filter(t => t.isGoalReached);
    } else if (filter === 'breaks') {
      list = list.filter(t => t.breakCount > 0);
    }
    
    // Sort: items with breaks first if filter is all/breaks, otherwise longest streaks
    return list.sort((a, b) => {
      if (filter === 'breaks') return b.breakCount - a.breakCount;
      if (b.daysPassed !== a.daysPassed) return b.daysPassed - a.daysPassed;
      return a.daysLeft - b.daysLeft;
    });
  }, [templatesWithStreaks, filter]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      whileInView={{ opacity: 1, y: 0 }} 
      viewport={{ once: true, amount: 0.1 }} 
      transition={{ duration: 0.5 }} 
      className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] p-5 sm:p-7 rounded-[2rem] border border-gray-800/80 shadow-2xl relative overflow-hidden flex flex-col justify-start group"
    >
      {/* Background ambient lighting */}
      <div className={`absolute top-0 right-0 w-96 h-96 rounded-full blur-[120px] pointer-events-none transition-all duration-700 ${
        totalBreaks > 0 ? 'bg-rose-500/10' : 'bg-amber-500/10'
      }`}></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 shadow-inner transition-colors ${
            totalBreaks > 0 
              ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' 
              : 'bg-amber-500/15 border-amber-500/30 text-amber-400'
          }`}>
            {totalBreaks > 0 ? <HeartCrack className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">
                Expense Discipline & Streaks
              </h3>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Live Tracker
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">
              Preserve your financial health by extending days without breaking recurring budgets
            </p>
          </div>
        </div>

        {/* View Switcher Pills */}
        <div className="flex items-center bg-gray-950/80 p-1 rounded-xl border border-gray-800/80 self-start sm:self-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              filter === 'all' 
                ? 'bg-gray-800 text-white shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            All ({totalTracked})
          </button>
          <button
            onClick={() => setFilter('streaks')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
              filter === 'streaks' 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🔥 Active
          </button>
          <button
            onClick={() => setFilter('goals')}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
              filter === 'goals' 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            🏆 Goals ({goalsMetCount})
          </button>
          {totalBreaks > 0 && (
            <button
              onClick={() => setFilter('breaks')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                filter === 'breaks' 
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 shadow-md' 
                  : 'text-rose-400/70 hover:text-rose-300'
              }`}
            >
              💔 Breaks ({totalBreaks})
            </button>
          )}
        </div>
      </div>

      {/* Top 4 Premium KPI Metric Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6 relative z-10">
        
        {/* Metric 1: Best Streak */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 border border-gray-800/80 hover:border-amber-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all group/tile">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Best Streak
            </span>
            <span className="text-[9px] font-black text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded">
              Record
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight">
              {maxStreak}
            </span>
            <span className="text-xs text-amber-400/90 font-bold uppercase tracking-wider">Days Unbroken</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Longest held cycle discipline</p>
        </div>

        {/* Metric 2: Goals Achieved */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 border border-gray-800/80 hover:border-emerald-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all group/tile">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-emerald-400" /> Goals Hit
            </span>
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded">
              {goalsMetCount}/{totalTracked}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-tight">
              {goalsMetCount}
            </span>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Cycles Hit</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">Reached or exceeded target cycle</p>
        </div>

        {/* Metric 3: Early Breaks */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 border border-gray-800/80 hover:border-rose-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all group/tile">
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 flex items-center gap-1.5">
              <HeartCrack className="w-3.5 h-3.5 text-rose-400" /> Early Breaks
            </span>
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
              totalBreaks > 0 ? 'text-rose-400 bg-rose-500/15' : 'text-emerald-400 bg-emerald-500/15'
            }`}>
              {totalBreaks > 0 ? 'Interrupted' : 'Flawless'}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              totalBreaks > 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {totalBreaks}
            </span>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Premature Logs</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1">
            {totalBreaks > 0 ? 'Expenses logged before due date' : 'Zero premature expenses!'}
          </p>
        </div>

        {/* Metric 4: Adherence Score */}
        <div className="bg-gradient-to-br from-gray-900/90 to-gray-950/90 border border-gray-800/80 hover:border-purple-500/30 rounded-2xl p-4 flex flex-col justify-between shadow-xl relative overflow-hidden transition-all group/tile">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Adherence
            </span>
            <span className="text-[9px] font-black text-purple-400 bg-purple-500/15 px-1.5 py-0.5 rounded">
              Score
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mt-2">
            <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
              disciplineScore >= 80 ? 'text-emerald-400' : disciplineScore >= 50 ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {disciplineScore}%
            </span>
            <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Health Index</span>
          </div>
          <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden mt-1.5">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${
                disciplineScore >= 80 ? 'bg-emerald-500' : disciplineScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${disciplineScore}%` }}
            ></div>
          </div>
        </div>

      </div>

      {/* Grid of Recurring Cards */}
      <div className="relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {filteredTemplates.map(item => {
            const hasBroken = item.breakCount > 0;
            const isGoalMet = item.isGoalReached;

            let badgeStyles = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
            let streakLabel = item.daysPassed === 0 ? '🌱 Day 0' : `🔥 ${item.daysPassed}d Unbroken`;
            let barGradient = 'from-amber-500 to-orange-500';

            if (isGoalMet) {
              badgeStyles = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-black';
              streakLabel = `🏆 ${item.daysPassed}d Goal Hit!`;
              barGradient = 'from-emerald-500 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.4)]';
            } else if (item.daysPassed === 0) {
              badgeStyles = 'bg-gray-800 text-gray-400 border-gray-700/60';
              barGradient = 'from-gray-700 to-gray-600';
            }

            return (
              <div 
                key={item.id} 
                className={`border rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between shadow-lg relative group/card ${
                  hasBroken 
                    ? 'bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-950/80 border-rose-500/30 hover:border-rose-500/50 hover:shadow-rose-950/30' 
                    : isGoalMet
                    ? 'bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-950/80 border-emerald-500/30 hover:border-emerald-500/50 hover:shadow-emerald-950/30'
                    : 'bg-gradient-to-br from-gray-900/70 via-gray-900/50 to-gray-950/70 border-gray-800/80 hover:border-gray-700/80'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-inner ${
                        hasBroken 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
                          : isGoalMet
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : 'bg-gray-800/80 border-gray-700 text-purple-400'
                      }`}>
                        <Bookmark className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-black text-white truncate group-hover/card:text-amber-300 transition-colors">
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

                  {/* Discipline message & badges */}
                  <div className="flex items-center justify-between gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] border shrink-0 ${badgeStyles}`}>
                      {streakLabel}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">
                      Goal: <span className="text-white font-mono font-bold">{item.cycle}d</span>
                    </span>
                  </div>

                  {/* Sleek Progress Bar */}
                  <div className="w-full h-1.5 bg-gray-950 rounded-full overflow-hidden mt-3 mb-1.5 border border-gray-800/60">
                    <div 
                      className={`h-full bg-gradient-to-r ${barGradient} rounded-full transition-all duration-1000`}
                      style={{ width: `${item.progressPct}%` }}
                    ></div>
                  </div>
                </div>

                {/* Footer status & breaks */}
                <div className="mt-3 pt-2.5 border-t border-gray-800/60 flex items-center justify-between text-[10px]">
                  <span className="text-gray-400 flex items-center gap-1 text-[9px] font-medium">
                    {isGoalMet ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Goal Exceeded (+{item.daysPassed - item.cycle}d)
                      </span>
                    ) : (
                      <span>{item.daysLeft} days to {item.cycle}d goal</span>
                    )}
                  </span>

                  <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] flex items-center gap-1 border ${
                    hasBroken 
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                      : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    <span>{hasBroken ? '💔' : '🛡️'}</span>
                    <span>{hasBroken ? `${item.breakCount} break${item.breakCount > 1 ? 's' : ''}` : 'Intact'}</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="py-12 text-center bg-gray-950/30 rounded-2xl border border-dashed border-gray-800">
            <ShieldCheck className="w-12 h-12 text-gray-700 mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-400">No items match this filter</p>
            <p className="text-xs text-gray-600 mt-1">Switch to "All" to view all renewal-tracked templates.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
