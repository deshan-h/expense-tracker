import React, { useState, useMemo } from 'react';
import { 
  CalendarClock, Trash2, CheckCircle2, Clock, Folder, ChevronDown, 
  ChevronUp, Plus, X, Bookmark, TrendingUp, Sparkles, ArrowUpRight, 
  List, Check
} from 'lucide-react';
import { getIconComponent, getIconColor } from '../utils/icons';
import DateTimePicker from '../components/ui/DateTimePicker';
import { motion, AnimatePresence } from 'framer-motion';

export default function SchedulesTab({ 
  schedules = [], 
  addSchedule, 
  deleteSchedule, 
  formatLKR, 
  categories = [], 
  templates = [] 
}) {
  const [activeFilter, setActiveFilter] = useState('active'); // 'all' | 'active' | 'completed'
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [isFrequencyDropdownOpen, setIsFrequencyDropdownOpen] = useState(false);
  const [scheduleToDelete, setScheduleToDelete] = useState(null);
  
  const [date, setDate] = useState(() => new Date().toLocaleDateString('en-CA'));
  const [time, setTime] = useState(() => new Date().toTimeString().split(' ')[0].substring(0, 5));
  const [frequency, setFrequency] = useState('Daily');
  const [askBeforeAdding, setAskBeforeAdding] = useState(false);
  const [expiryDate, setExpiryDate] = useState('');

  const handleTemplateChange = (val) => {
    setSelectedTemplateId(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId || !templates) return;
    
    const template = templates.find(t => t.id === selectedTemplateId);
    if (!template) return;
    
    const fullDate = `${date}T00:00`;
    const success = await addSchedule({ 
      category: template.category, 
      subcategory: template.subcategory === 'Other' ? '' : template.subcategory || '', 
      amount: parseFloat(template.amount), 
      description: template.description || template.name, 
      nextDate: fullDate, 
      frequency, 
      askBefore: askBeforeAdding, 
      expiryDate: expiryDate || null 
    });
    
    if (success) {
      setSelectedTemplateId('');
      setShowAddForm(false);
    }
  };

  const activeSchedules = useMemo(() => {
    return (schedules || [])
      .filter(s => s.status === 'active')
      .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate));
  }, [schedules]);

  const completedSchedules = useMemo(() => {
    return (schedules || [])
      .filter(s => s.status !== 'active')
      .sort((a, b) => new Date(b.nextDate) - new Date(a.nextDate));
  }, [schedules]);

  const getExpectedAmount = (schedule, period) => {
    let count = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    let current = new Date(schedule.nextDate);
    const expiry = schedule.expiryDate ? new Date(schedule.expiryDate) : null;
    
    let end;
    if (period === 'week') {
      const day = now.getDay();
      const daysUntilSunday = day === 0 ? 0 : 7 - day;
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilSunday, 23, 59, 59);
    } else {
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    
    let tempCurrent = new Date(current);
    
    while (tempCurrent <= end && schedule.status === 'active') {
      if (expiry && tempCurrent > expiry) break;
      count++;
      
      if (schedule.frequency === 'Daily') {
        tempCurrent.setDate(tempCurrent.getDate() + 1);
      } else if (schedule.frequency === 'Weekly') {
        tempCurrent.setDate(tempCurrent.getDate() + 7);
      } else if (schedule.frequency === 'Monthly') {
        tempCurrent.setMonth(tempCurrent.getMonth() + 1);
      } else if (schedule.frequency === 'Yearly') {
        tempCurrent.setFullYear(tempCurrent.getFullYear() + 1);
      } else {
        break;
      }
    }
    
    return count * schedule.amount;
  };

  const totalExpectedThisMonth = useMemo(() => {
    return activeSchedules.reduce((acc, curr) => acc + getExpectedAmount(curr, 'month'), 0);
  }, [activeSchedules]);

  const totalExpectedThisWeek = useMemo(() => {
    return activeSchedules.reduce((acc, curr) => acc + getExpectedAmount(curr, 'week'), 0);
  }, [activeSchedules]);

  const displayedSchedules = useMemo(() => {
    if (activeFilter === 'active') return activeSchedules;
    if (activeFilter === 'completed') return completedSchedules;
    return [...activeSchedules, ...completedSchedules];
  }, [activeFilter, activeSchedules, completedSchedules]);

  const renderScheduleRow = (schedule) => {
    const categoryObj = categories?.find(c => c.name === schedule.category);
    const CatIcon = categoryObj ? getIconComponent(categoryObj.icon) : Folder;
    const iconColors = categoryObj ? getIconColor(categoryObj.icon) : getIconColor('Folder');
    const isActive = schedule.status === 'active';

    return (
      <tr key={schedule.id} className="hover:bg-gray-800/30 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${iconColors.bg} shrink-0`}>
              <CatIcon className={`w-5 h-5 ${iconColors.color}`} />
            </div>
            <div className="flex flex-col min-w-[150px] justify-center">
              <div className="flex flex-wrap items-center gap-1">
                <span className="text-gray-100 font-extrabold">{schedule.category}</span>
                {schedule.subcategory && schedule.subcategory !== 'none' && (
                  <span className="text-gray-400 font-medium">/ {schedule.subcategory}</span>
                )}
              </div>
              {schedule.description && (
                <span className="text-[11px] text-gray-500 truncate max-w-[200px]">{schedule.description}</span>
              )}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="font-black text-rose-400 whitespace-nowrap">Rs. {formatLKR(schedule.amount)}</span>
        </td>
        <td className="px-6 py-4">
          <span className="text-xs font-bold text-cyan-300 bg-cyan-500/10 px-2.5 py-1 rounded-md whitespace-nowrap">{schedule.frequency}</span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 text-gray-300 text-sm whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            {new Date(schedule.nextDate).toLocaleDateString()}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-amber-300">Rs. {formatLKR(getExpectedAmount(schedule, 'week'))}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-purple-300">Rs. {formatLKR(getExpectedAmount(schedule, 'month'))}</span>
          </div>
        </td>
        <td className="px-6 py-4 text-center">
          {schedule.askBefore ? (
            <div className="inline-flex items-center gap-1.5 text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2.5 py-1 rounded-md whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3" />
              Yes
            </div>
          ) : (
            <span className="text-gray-600 text-sm">-</span>
          )}
        </td>
        <td className="px-6 py-4 text-center">
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
            isActive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-gray-700/30 text-gray-500 border border-gray-700/50'
          }`}>
            {schedule.status}
          </span>
        </td>
        <td className="px-6 py-4 text-right">
          <button 
            onClick={() => setScheduleToDelete(schedule.id)}
            className="p-2 inline-flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-colors"
            title="Delete Schedule"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      </tr>
    );
  };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] pb-20 overflow-x-hidden">
      <div className="px-4 md:px-8 py-4 w-full max-w-[1600px] mx-auto space-y-6">
        
        {/* Full-tab Ambient Glows */}
        <div className="absolute top-[5%] left-[10%] w-[35vw] h-[35vw] bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-[20%] right-[10%] w-[35vw] h-[35vw] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        {/* 1. TOP 3 SUMMARY CARDS (MATCHING MONEY LENT & SAVINGS TABS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: Active Schedules */}
          <div 
            onClick={() => setActiveFilter('active')}
            className={`cursor-pointer bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border ${
              activeFilter === 'active' ? 'border-cyan-500 ring-2 ring-cyan-500/30' : 'border-gray-800/80 hover:border-gray-700'
            } shadow-xl relative overflow-hidden transition-all duration-300 group`}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <CalendarClock className="w-3.5 h-3.5 text-cyan-400" /> Active Schedules
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400">
                {activeSchedules.length} Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {activeSchedules.length} <span className="text-xs text-gray-500 font-semibold uppercase">Recurring Plans</span>
            </h2>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>Automated cycle payments</span>
              <span className="text-cyan-400 font-bold">{completedSchedules.length} Completed</span>
            </div>
          </div>

          {/* Card 2: Expected This Month */}
          <div 
            className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border border-gray-800/80 shadow-xl relative overflow-hidden transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-purple-400" /> Expected This Month
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                Monthly Projection
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-purple-400">
              <span className="text-xs text-gray-500 font-semibold mr-1">Rs.</span>
              {formatLKR(totalExpectedThisMonth)}
            </h2>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>Projected for current month</span>
              <span className="text-purple-400 font-medium">Auto recurring</span>
            </div>
          </div>

          {/* Card 3: Expected This Week */}
          <div 
            className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border border-gray-800/80 shadow-xl relative overflow-hidden transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Expected This Week
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                Next 7 Days
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-amber-400">
              <span className="text-xs text-gray-500 font-semibold mr-1">Rs.</span>
              {formatLKR(totalExpectedThisWeek)}
            </h2>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>Immediate cashflow impact</span>
              <span className="text-amber-400 font-medium">Due soon</span>
            </div>
          </div>

        </div>

        {/* 2. FILTER TABS & QUICK ADD BAR */}
        <div className="bg-gray-900/60 backdrop-blur-xl p-3 rounded-[1.25rem] border border-gray-800/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 relative z-20">
          
          {/* Segment Selector */}
          <div className="flex items-center bg-gray-950/80 p-1 rounded-xl border border-gray-800/80 w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('active')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeFilter === 'active'
                  ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Active ({activeSchedules.length})
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeFilter === 'completed'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              Completed ({completedSchedules.length})
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeFilter === 'all'
                  ? 'bg-gray-800 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              All ({(schedules || []).length})
            </button>
          </div>

          {/* Quick Actions & Add Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {completedSchedules.length > 0 && activeFilter === 'completed' && (
              <button
                onClick={() => setScheduleToDelete('ALL')}
                className="text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-2 rounded-xl transition-colors uppercase tracking-widest flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Clear Completed
              </button>
            )}
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Close Form' : '+ Add Scheduled Expense'}</span>
              {showAddForm ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
            </button>
          </div>
        </div>

        {/* 3. COLLAPSIBLE ADD SCHEDULE FORM */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative z-40 overflow-visible"
            >
              <div className="bg-gray-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-[1.5rem] border border-gray-800/80 shadow-2xl relative z-40 overflow-visible">
                
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/60">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Create New Recurring / Scheduled Plan
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    Template Based Scheduler
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                  
                  {/* Template Picker */}
                  <div className="sm:col-span-2 lg:col-span-2 space-y-1 relative z-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Choose Template</span>
                    {templates && templates.length > 0 ? (
                      <div className="relative">
                        <div 
                          onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                          className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 hover:border-cyan-500 transition-all h-[42px] flex items-center px-4 cursor-pointer"
                        >
                          <Bookmark className="w-4 h-4 text-cyan-400 mr-2 shrink-0" />
                          <span className={`w-full truncate text-sm font-bold ${selectedTemplateId ? 'text-cyan-100' : 'text-gray-400'}`}>
                            {selectedTemplateId 
                              ? (() => {
                                  const t = templates.find(temp => temp.id === selectedTemplateId);
                                  if(!t) return "Select Template...";
                                  return `${t.name} • Rs. ${formatLKR(t.amount)}`;
                                })()
                              : 'Select Template...'
                            }
                          </span>
                          <ChevronDown className={`w-4 h-4 text-cyan-400 shrink-0 ml-2 transition-transform duration-300 ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
                        </div>
                        
                        {isTemplateDropdownOpen && (
                          <div className="absolute z-50 top-full mt-2 w-full bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[260px] overflow-y-auto hide-scrollbar">
                            {templates.map(t => (
                              <div 
                                key={t.id}
                                onClick={() => {
                                  handleTemplateChange(t.id);
                                  setIsTemplateDropdownOpen(false);
                                }}
                                className={`p-3 hover:bg-gray-800/80 cursor-pointer border-b border-gray-800/50 last:border-b-0 transition-colors flex flex-col gap-0.5 ${selectedTemplateId === t.id ? 'bg-cyan-950/40 text-cyan-300' : ''}`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-gray-100 text-xs sm:text-sm">{t.name}</span>
                                  <span className="font-black text-cyan-400 text-xs sm:text-sm">Rs. {formatLKR(t.amount)}</span>
                                </div>
                                <div className="text-[11px] text-gray-500 font-medium">
                                  {t.category}{t.subcategory && t.subcategory !== 'Other' ? ` / ${t.subcategory}` : ''}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        {isTemplateDropdownOpen && (
                          <div className="fixed inset-0 z-40" onClick={() => setIsTemplateDropdownOpen(false)} />
                        )}
                      </div>
                    ) : (
                      <div className="p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200/80 text-xs flex items-center h-[42px]">
                        No templates found in Add Expense tab.
                      </div>
                    )}
                  </div>

                  {/* Frequency Picker */}
                  <div className="space-y-1 relative z-40">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Frequency</span>
                    <div className="relative">
                      <div 
                        onClick={() => setIsFrequencyDropdownOpen(!isFrequencyDropdownOpen)}
                        className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 hover:border-cyan-500 transition-all h-[42px] flex items-center px-4 cursor-pointer"
                      >
                        <Clock className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                        <span className="w-full text-xs sm:text-sm font-medium text-gray-100 truncate">{frequency}</span>
                        <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform duration-300 ${isFrequencyDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {isFrequencyDropdownOpen && (
                        <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden py-1 z-50">
                          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(opt => (
                            <div 
                              key={opt}
                              onClick={() => {
                                setFrequency(opt);
                                setIsFrequencyDropdownOpen(false);
                              }}
                              className={`px-4 py-2 hover:bg-gray-800 cursor-pointer transition-colors text-xs font-semibold ${frequency === opt ? 'text-cyan-400 bg-gray-800/50' : 'text-gray-200'}`}
                            >
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      {isFrequencyDropdownOpen && (
                        <div className="fixed inset-0 z-40" onClick={() => setIsFrequencyDropdownOpen(false)} />
                      )}
                    </div>
                  </div>

                  {/* Starts Date */}
                  <div className="space-y-1 relative z-30">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Starts</span>
                    <DateTimePicker date={date} setDate={setDate} hideTime={true} />
                  </div>

                  {/* Ends Date */}
                  <div className="space-y-1 relative z-20">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Ends (Optional)</span>
                    <DateTimePicker date={expiryDate} setDate={setExpiryDate} hideTime={true} optional={true} placeholder="Never" />
                  </div>

                  {/* Ask Before Adding Toggle & Submit */}
                  <div className="flex items-center gap-2 h-[42px]">
                    <div 
                      onClick={() => setAskBeforeAdding(!askBeforeAdding)}
                      className={`flex-1 h-full px-3 bg-gray-950/80 rounded-xl border border-gray-700/80 hover:border-cyan-500 cursor-pointer flex items-center justify-between transition-all select-none`}
                    >
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ask First</span>
                      <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${askBeforeAdding ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                        <div className={`bg-white w-3 h-3 rounded-full shadow transform transition-transform ${askBeforeAdding ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="h-full px-5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-cyan-500/25 active:scale-[0.98] flex items-center justify-center shrink-0 uppercase tracking-wider text-xs"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Save
                    </button>
                  </div>

                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. SCHEDULES TABLE LIST */}
        <div className="bg-gray-900/60 rounded-[1.5rem] border border-gray-800/80 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-800/80 flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-cyan-400" />
              {activeFilter === 'active' && 'Active Recurring Plans'}
              {activeFilter === 'completed' && 'Completed Recurring Plans'}
              {activeFilter === 'all' && 'All Recurring Plans'}
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                {displayedSchedules.length}
              </span>
            </h3>
          </div>

          <div className="overflow-x-auto hide-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800/80 bg-gray-900/40 text-gray-400 text-xs uppercase tracking-wider font-bold">
                  <th className="px-6 py-4 whitespace-nowrap">Title & Category</th>
                  <th className="px-6 py-4 whitespace-nowrap">Amount</th>
                  <th className="px-6 py-4 whitespace-nowrap">Frequency</th>
                  <th className="px-6 py-4 whitespace-nowrap">Next Date</th>
                  <th className="px-6 py-4 whitespace-nowrap">Exp. Week</th>
                  <th className="px-6 py-4 whitespace-nowrap">Exp. Month</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Ask First</th>
                  <th className="px-6 py-4 text-center whitespace-nowrap">Status</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {displayedSchedules.map(renderScheduleRow)}

                {displayedSchedules.length === 0 && (
                  <tr>
                    <td colSpan="9" className="px-6 py-16 text-center text-gray-500 bg-gray-900/30">
                      <CalendarClock className="w-14 h-14 mx-auto mb-3 opacity-20" />
                      <p className="text-base font-bold text-gray-400">No {activeFilter} schedules found</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {activeFilter === 'completed' 
                          ? 'No schedules have completed their cycle yet.' 
                          : 'You haven\'t added any recurring schedules yet. Create one above!'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* DELETE CONFIRMATION MODAL */}
      <AnimatePresence>
        {scheduleToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 p-6 md:p-8 rounded-[2rem] shadow-2xl max-w-sm w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-rose-600"></div>
              
              <button 
                onClick={() => setScheduleToDelete(null)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mb-4 border border-red-500/20 shadow-inner">
                  <Trash2 className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-xl font-black text-white tracking-wide mb-1">
                  {scheduleToDelete === 'ALL' ? 'Clear All Completed' : 'Delete Schedule'}
                </h3>
                <p className="text-sm text-gray-400">
                  {scheduleToDelete === 'ALL' 
                    ? 'Are you sure you want to delete all completed schedules? This action cannot be undone.'
                    : 'Are you sure you want to delete this schedule? This action cannot be undone.'}
                </p>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button 
                  onClick={() => setScheduleToDelete(null)}
                  className="flex-1 py-3.5 px-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={async () => {
                    if (scheduleToDelete === 'ALL') {
                      for (const s of completedSchedules) {
                        await deleteSchedule(s.id);
                      }
                    } else {
                      deleteSchedule(scheduleToDelete);
                    }
                    setScheduleToDelete(null);
                  }}
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-black rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(244,63,94,0.6)] active:scale-95 text-sm"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
