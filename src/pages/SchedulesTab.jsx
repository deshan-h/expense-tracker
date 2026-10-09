import React, { useState, useEffect } from 'react';
import { CalendarClock, Trash2, CheckCircle2, Clock, Folder, ChevronDown, ChevronUp, Plus, X, Bookmark } from 'lucide-react';
import { getIconComponent, getIconColor } from '../utils/icons';
import DateTimePicker from '../components/ui/DateTimePicker';
import { motion, AnimatePresence } from 'framer-motion';

export default function SchedulesTab({ schedules, addSchedule, deleteSchedule, formatLKR, categories, templates }) {
  const [showCompleted, setShowCompleted] = useState(false);
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

  const formatCompact = (value) => {
    if (!value) return "0";
    return Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(value);
  };
  
  const activeSchedules = (schedules || []).filter(s => s.status === 'active').sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate));
  const completedSchedules = (schedules || []).filter(s => s.status !== 'active').sort((a, b) => new Date(b.nextDate) - new Date(a.nextDate));

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

  const renderScheduleRow = (schedule) => {
    const categoryObj = categories?.find(c => c.name === schedule.category);
    const CatIcon = categoryObj ? getIconComponent(categoryObj.icon) : Folder;
    const iconColors = categoryObj ? getIconColor(categoryObj.icon) : getIconColor('Folder');

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
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="font-black text-rose-400 whitespace-nowrap">Rs. {formatLKR(schedule.amount)}</span>
        </td>
        <td className="px-6 py-4">
          <span className="text-xs font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-md whitespace-nowrap">{schedule.frequency}</span>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center gap-2 text-gray-300 text-sm whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            {new Date(schedule.nextDate).toLocaleDateString()}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-300">Rs. {formatLKR(getExpectedAmount(schedule, 'week'))}</span>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-300">Rs. {formatLKR(getExpectedAmount(schedule, 'month'))}</span>
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
          <span className={`text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${schedule.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-gray-700/30 text-gray-500'}`}>
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
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-2 md:px-4 pt-0 pb-4 w-full max-w-[1600px] mx-auto">
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>

        <div className="w-full relative z-10 space-y-6">
          <div className="bg-gray-900/60 backdrop-blur-xl p-2 sm:p-2.5 rounded-[1.25rem] border border-gray-800/80 shadow-2xl flex flex-col relative z-20 mb-6">
            {/* Header Row */}
            <div 
              className="flex items-center justify-between cursor-pointer group px-2 py-1"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[0.8rem] bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 shadow-inner">
                  <CalendarClock className="w-5 h-5" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] leading-none mb-1">Scheduled Expenses</span>
                  <span className="text-sm sm:text-base font-black text-white leading-none">Recurring Payments</span>
                </div>
              </div>

              <div className="flex items-center">
                <div className="flex items-center gap-1.5 text-indigo-500 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-[0.75rem] group-hover:bg-indigo-500/20 transition-all shadow-inner">
                  <Plus className="w-4 h-4" />
                  {showAddForm ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
                </div>
              </div>
            </div>

            {showAddForm && (
              <div className="mt-4 pt-4 border-t border-gray-800/50">
                <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-3 lg:items-center animate-in fade-in slide-in-from-top-4 duration-300">
                  {templates && templates.length > 0 ? (
                    <div className="relative flex-1 min-w-[160px] max-w-[240px]">
                      <div 
                        onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                        className="relative bg-indigo-900/40 rounded-xl border border-indigo-500/30 hover:border-indigo-500 transition-all h-[48px] flex items-center px-4 cursor-pointer"
                      >
                        <Bookmark className="w-4 h-4 text-indigo-400 mr-2 shrink-0" />
                        <span className={`w-full truncate text-sm font-bold ${selectedTemplateId ? 'text-indigo-100' : 'text-indigo-300/70'}`}>
                          {selectedTemplateId 
                            ? (() => {
                                const t = templates.find(temp => temp.id === selectedTemplateId);
                                if(!t) return "Select Template...";
                                return `${t.name} • ${t.category}${t.subcategory && t.subcategory !== 'Other' ? ` / ${t.subcategory}` : ''} • Rs. ${formatLKR(t.amount)}`;
                              })()
                            : 'Select Template...'
                          }
                        </span>
                        <ChevronDown className={`w-4 h-4 text-indigo-400 shrink-0 ml-2 transition-transform duration-300 ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {isTemplateDropdownOpen && (
                        <div className="absolute z-50 top-full mt-2 w-full bg-gray-900 border border-indigo-500/30 rounded-2xl shadow-2xl overflow-hidden max-h-[300px] overflow-y-auto hide-scrollbar">
                          {templates.map(t => (
                            <div 
                              key={t.id}
                              onClick={() => {
                                handleTemplateChange(t.id);
                                setIsTemplateDropdownOpen(false);
                              }}
                              className={`p-3 md:p-4 hover:bg-indigo-900/40 cursor-pointer border-b border-gray-800/50 last:border-b-0 transition-colors flex flex-col gap-1 ${selectedTemplateId === t.id ? 'bg-indigo-900/30' : ''}`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-100 text-sm">{t.name}</span>
                                <span className="font-black text-indigo-400 text-sm">Rs. {formatLKR(t.amount)}</span>
                              </div>
                              <div className="text-xs text-gray-400 font-medium tracking-wide">
                                {t.category}{t.subcategory && t.subcategory !== 'Other' ? ` / ${t.subcategory}` : ''} 
                                {t.description && <span className="ml-2 text-gray-500 italic">({t.description})</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {isTemplateDropdownOpen && (
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setIsTemplateDropdownOpen(false)}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-200/80 text-sm flex items-center gap-2 h-[48px] max-w-[240px]">
                      No templates found.
                    </div>
                  )}

                  <div className="relative w-[130px] shrink-0">
                    <div 
                      onClick={() => setIsFrequencyDropdownOpen(!isFrequencyDropdownOpen)}
                      className="relative bg-gray-900/80 rounded-xl border border-gray-700/80 hover:border-indigo-500 transition-all h-[48px] flex items-center px-4 cursor-pointer"
                    >
                      <Clock className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                      <span className="w-full text-sm font-medium text-gray-100 truncate">{frequency}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 ml-2 transition-transform duration-300 ${isFrequencyDropdownOpen ? 'rotate-180' : ''}`} />
                    </div>
                    
                    {isFrequencyDropdownOpen && (
                      <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden py-2 z-50">
                        {['Daily', 'Weekly', 'Monthly', 'Yearly'].map(opt => (
                          <div 
                            key={opt}
                            onClick={() => {
                              setFrequency(opt);
                              setIsFrequencyDropdownOpen(false);
                            }}
                            className={`px-4 py-2 hover:bg-gray-800 cursor-pointer transition-colors text-sm font-medium ${frequency === opt ? 'text-indigo-400 bg-gray-800/50' : 'text-gray-200'}`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    )}
                    {isFrequencyDropdownOpen && (
                      <div 
                        className="fixed inset-0 z-40"
                        onClick={() => setIsFrequencyDropdownOpen(false)}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full lg:flex-1 h-[48px]">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden lg:block">Starts</span>
                    <div className="flex-1 w-full min-w-[130px]">
                      <DateTimePicker date={date} setDate={setDate} hideTime={true} />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full lg:flex-1 h-[48px]">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest hidden lg:block">Ends</span>
                    <div className="flex-1 w-full min-w-[130px]">
                      <DateTimePicker date={expiryDate} setDate={setExpiryDate} hideTime={true} optional={true} placeholder="Never" />
                    </div>
                  </div>

                  <div className="bg-gray-900/40 rounded-xl border border-gray-700/50 transition-all h-[48px] flex items-center px-3 shrink-0">
                    <div className="flex items-center justify-between cursor-pointer w-full gap-2" onClick={() => setAskBeforeAdding(!askBeforeAdding)}>
                      <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest truncate hidden xl:block">
                         Ask
                      </div>
                      <div className={`w-9 h-5 rounded-full p-1 transition-colors duration-200 ease-in-out shadow-inner shrink-0 ${askBeforeAdding ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                        <div className={`bg-white w-3 h-3 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${askBeforeAdding ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="w-full lg:w-[48px] h-[48px] bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98] flex items-center justify-center shrink-0">
                    <Plus className="w-5 h-5" />
                  </button>
                </form>
            </div>
          )}
          </div>

          <div className="bg-gray-900/60 rounded-3xl border border-gray-800/80 shadow-2xl backdrop-blur-xl overflow-hidden">
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
                  {activeSchedules.map(renderScheduleRow)}

                  {completedSchedules.length > 0 && (
                    <>
                      <tr>
                        <td colSpan="9" className="p-0 border-t border-gray-800/50 bg-gray-900/40">
                          <div className="w-full px-6 py-4 flex items-center justify-between group">
                            <button
                              onClick={() => setShowCompleted(!showCompleted)}
                              className="flex items-center text-gray-400 hover:text-white transition-colors flex-1 text-left"
                            >
                              <span className="text-sm font-bold tracking-wide uppercase">
                                Completed Schedules ({completedSchedules.length})
                              </span>
                            </button>
                            <div className="flex items-center gap-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setScheduleToDelete('ALL');
                                }}
                                className="text-[10px] font-bold text-gray-500 hover:text-red-400 transition-colors uppercase tracking-widest px-3 py-1.5 rounded-lg hover:bg-red-500/10 flex items-center gap-1.5"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Clear
                              </button>
                              <button onClick={() => setShowCompleted(!showCompleted)} className="text-gray-400 hover:text-white transition-colors p-1">
                                {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                      {showCompleted && completedSchedules.map(renderScheduleRow)}
                    </>
                  )}

                  {activeSchedules.length === 0 && completedSchedules.length === 0 && (
                    <tr>
                      <td colSpan="7" className="px-6 py-20 text-center text-gray-500 bg-gray-900/30">
                        <CalendarClock className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p className="text-lg font-bold">No Scheduled Expenses</p>
                        <p className="text-sm">You haven't added any recurring or scheduled expenses yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

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
