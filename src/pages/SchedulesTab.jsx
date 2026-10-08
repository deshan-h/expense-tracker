import React, { useState, useEffect } from 'react';
import { CalendarClock, Trash2, CheckCircle2, Clock, Folder, ChevronDown, ChevronUp, Plus, X, Bookmark } from 'lucide-react';
import { getIconComponent, getIconColor } from '../utils/icons';
import DateTimePicker from '../components/ui/DateTimePicker';

export default function SchedulesTab({ schedules, addSchedule, deleteSchedule, formatLKR, categories, templates }) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isTemplateDropdownOpen, setIsTemplateDropdownOpen] = useState(false);
  const [isFrequencyDropdownOpen, setIsFrequencyDropdownOpen] = useState(false);
  
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
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
            <div className={`p-2.5 rounded-xl ${iconColors.bg} border ${iconColors.bg.replace('bg-', 'border-').replace('/10', '/20')} shadow-inner shrink-0`}>
              <CatIcon className={`w-5 h-5 ${iconColors.color}`} />
            </div>
            <div className="flex flex-col min-w-[150px]">
              <span className="text-[10px] font-black text-gray-500 tracking-wider uppercase mb-0.5">
                {schedule.description ? schedule.description : 'Selected Category'}
              </span>
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
            onClick={() => {
              if(window.confirm('Are you sure you want to delete this schedule?')) {
                deleteSchedule(schedule.id);
              }
            }}
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
          <div className="flex items-center gap-4 bg-gray-900/60 p-4 md:p-6 rounded-3xl border border-gray-800/80 shadow-2xl backdrop-blur-xl">
            <div className="p-3 bg-indigo-500/20 rounded-2xl shadow-inner border border-indigo-500/20">
              <CalendarClock className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-wide">Scheduled Expenses</h2>
              <p className="text-gray-400 text-sm">Manage your recurring payments and reminders</p>
            </div>
            <div className="ml-auto flex items-center">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className={`p-3 md:px-5 md:py-2.5 rounded-xl font-bold tracking-wide transition-all shadow-lg flex items-center gap-2 ${showAddForm ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
              >
                {showAddForm ? (
                  <><X className="w-5 h-5" /><span className="hidden md:inline">Cancel</span></>
                ) : (
                  <><Plus className="w-5 h-5" /><span className="hidden md:inline">New Schedule</span></>
                )}
              </button>
            </div>
          </div>

          {showAddForm && (
            <form onSubmit={handleSubmit} className="relative z-20 bg-gray-900/60 p-4 md:p-6 rounded-3xl border border-gray-800/80 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300 space-y-4">
              <h3 className="text-lg font-bold text-white mb-4">Create New Schedule</h3>
              
              {templates && templates.length > 0 ? (
                <div className="relative mb-4">
                  <div 
                    onClick={() => setIsTemplateDropdownOpen(!isTemplateDropdownOpen)}
                    className="relative bg-indigo-900/40 rounded-2xl border border-indigo-500/30 hover:border-indigo-500 transition-all h-[48px] flex items-center px-4 cursor-pointer"
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
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl mb-4 text-yellow-200/80 text-sm flex items-center gap-2">
                  No templates found. Please create a template in the Add Expense tab first.
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="relative">
                  <div 
                    onClick={() => setIsFrequencyDropdownOpen(!isFrequencyDropdownOpen)}
                    className="relative bg-gray-900/80 rounded-2xl border border-gray-700/80 hover:border-indigo-500 transition-all h-[48px] flex items-center px-4 cursor-pointer"
                  >
                    <Clock className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                    <span className="w-full text-sm font-medium text-gray-100">{frequency}</span>
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

                <div className="flex items-center gap-2 w-full h-[48px]">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0">Starts</span>
                  <div className="flex-1 min-w-0">
                    <DateTimePicker date={date} setDate={setDate} hideTime={true} />
                  </div>
                </div>
                
                <div className="flex items-center gap-2 w-full h-[48px]">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest shrink-0">Ends</span>
                  <div className="flex-1 min-w-0">
                    <DateTimePicker date={expiryDate} setDate={setExpiryDate} hideTime={true} optional={true} placeholder="Never" />
                  </div>
                </div>

                <div className="bg-gray-900/40 rounded-2xl border border-gray-700/50 transition-all h-[48px] flex items-center px-4">
                  <div className="flex items-center justify-between cursor-pointer w-full gap-2" onClick={() => setAskBeforeAdding(!askBeforeAdding)}>
                    <div className="text-[10px] xl:text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center truncate">
                       Ask Before Adding
                    </div>
                    <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out shadow-inner shrink-0 ${askBeforeAdding ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${askBeforeAdding ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-lg py-4 rounded-2xl transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-[0.98]">
                SAVE SCHEDULE
              </button>
            </form>
          )}

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
                        <td colSpan="7" className="p-0 border-t border-gray-800/50">
                          <button
                            onClick={() => setShowCompleted(!showCompleted)}
                            className="w-full px-6 py-4 flex items-center justify-between text-gray-400 hover:text-white hover:bg-gray-800/30 transition-colors"
                          >
                            <span className="text-sm font-bold tracking-wide uppercase">
                              Completed Schedules ({completedSchedules.length})
                            </span>
                            {showCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
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
    </div>
  );
}
