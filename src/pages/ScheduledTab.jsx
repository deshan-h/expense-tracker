import React, { useState } from 'react';
import { CalendarClock, PlusCircle, Trash2, CalendarDays, Repeat } from 'lucide-react';
import DateTimePicker from '../components/ui/DateTimePicker';

const ScheduledTab = ({
  schedules,
  addSchedule,
  deleteSchedule,
  categories,
  formatLKR
}) => {
  const [view, setView] = useState('add'); // 'add' or 'list'
  
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [frequency, setFrequency] = useState('Monthly'); // 'Once', 'Daily', 'Weekly', 'Monthly', 'Yearly'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || !category) return;

    const success = await addSchedule({
      amount: parseFloat(amount),
      description,
      category,
      nextDate: `${date}T${time}`,
      frequency
    });

    if (success) {
      setAmount('');
      setDescription('');
      setCategory('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
      setFrequency('Monthly');
    }
  };

  const activeSchedules = schedules.filter(s => s.status === 'active');
  const completedSchedules = schedules.filter(s => s.status === 'completed');

  // Calculate estimated total for this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  let thisMonthEstimated = 0;
  activeSchedules.forEach(schedule => {
    let d = new Date(schedule.nextDate);
    let safetyCounter = 0; 
    while (d <= endOfMonth && safetyCounter < 100) {
      safetyCounter++;
      if (d >= startOfMonth) {
        thisMonthEstimated += schedule.amount;
      }
      if (schedule.frequency === 'Once') break;
      else if (schedule.frequency === 'Daily') d.setDate(d.getDate() + 1);
      else if (schedule.frequency === 'Weekly') d.setDate(d.getDate() + 7);
      else if (schedule.frequency === 'Monthly') d.setMonth(d.getMonth() + 1);
      else if (schedule.frequency === 'Yearly') d.setFullYear(d.getFullYear() + 1);
      else break;
    }
  });

  return (
    <div className="relative w-full">
      {/* Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-amber-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-orange-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="bg-gray-900/40 backdrop-blur-2xl p-6 md:p-10 rounded-[2rem] border border-gray-700/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] max-w-full mx-auto relative group transition-all duration-700 hover:border-gray-600/60 z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="relative z-10">
          {/* Summary Widget */}
          <div className="flex flex-col items-center justify-center bg-gray-900/60 backdrop-blur-md rounded-3xl border border-gray-700/50 shadow-inner p-6 mb-8 max-w-md mx-auto">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Planned This Month</span>
            <div className="text-3xl md:text-4xl font-black text-amber-500 tracking-tight">
              Rs. {formatLKR(thisMonthEstimated)}
            </div>
          </div>

          {/* Top Navigation */}
          <div className="flex p-1 bg-gray-900 rounded-2xl w-full max-w-md mx-auto mb-10">
            <button 
              type="button" 
              onClick={() => setView('add')} 
              className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'add' ? 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
            >
              <PlusCircle className="w-4 h-4" /> Add Plan
            </button>
            <button 
              type="button" 
              onClick={() => setView('list')} 
              className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'list' ? 'bg-amber-500 text-gray-900 shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
            >
              <CalendarDays className="w-4 h-4" /> Planned Expenses
            </button>
          </div>

          {view === 'add' && (
            <form onSubmit={handleSubmit} className="relative z-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mt-10">
                {/* COLUMN 1 */}
                <div className="flex flex-col justify-center items-center bg-gray-900/60 backdrop-blur-md p-8 rounded-3xl border border-gray-700/50 shadow-inner min-h-[300px]">
                  <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mb-8 border border-amber-500/20 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <CalendarClock className="w-10 h-10 text-amber-500" />
                  </div>
                  
                  <div className="text-center w-full">
                    <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">Amount</p>
                    <div className="flex items-center justify-center text-6xl md:text-7xl font-bold text-white group">
                      <span className="text-gray-500 mr-4 text-4xl">Rs.</span>
                      <input 
                        type="text" 
                        inputMode="decimal"
                        required 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
                        className="bg-transparent border-none outline-none text-left w-[220px] md:w-[300px] focus:ring-0 placeholder-gray-700" 
                        placeholder="0.00" 
                      />
                    </div>
                    <div className="h-1 w-48 bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-amber-500 group-focus-within:opacity-100 transition-all duration-700 rounded-full"></div>
                  </div>
                </div>

                {/* COLUMN 2 */}
                <div className="flex flex-col justify-between bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-gray-700/50 shadow-inner">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Details</p>
                    
                    <div className="relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all overflow-hidden mb-4 shadow-inner">
                      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-transparent px-5 py-4 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="E.g., Electricity Bill, Rent" />
                    </div>

                    <div className="relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all overflow-hidden mb-4 shadow-inner">
                      <select required value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-transparent px-5 py-4 text-sm font-medium text-gray-100 focus:outline-none appearance-none cursor-pointer">
                        <option value="" className="bg-gray-800 text-gray-400">Select Category...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.name} className="bg-gray-800 text-gray-100">{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all overflow-hidden mb-4 shadow-inner">
                      <select required value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full bg-transparent px-5 py-4 text-sm font-medium text-gray-100 focus:outline-none appearance-none cursor-pointer">
                        <option value="Once" className="bg-gray-800">One-Time Only</option>
                        <option value="Daily" className="bg-gray-800">Daily</option>
                        <option value="Weekly" className="bg-gray-800">Weekly</option>
                        <option value="Monthly" className="bg-gray-800">Monthly</option>
                        <option value="Yearly" className="bg-gray-800">Yearly</option>
                      </select>
                    </div>
                    
                    <div className="mt-4 z-20 relative">
                      <DateTimePicker date={date} setDate={setDate} time={time} setTime={setTime} />
                    </div>
                  </div>

                  <button type="submit" className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)] hover:bg-right bg-[length:200%_auto] text-white font-black tracking-widest uppercase py-5 rounded-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 text-lg mt-8">
                    <CalendarClock className="w-6 h-6" /> SAVE PLAN
                  </button>
                </div>
              </div>
            </form>
          )}

          {view === 'list' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-6">Planned Expenses</h3>
              
              <div className="overflow-x-auto bg-gray-900/10 rounded-2xl border border-gray-800 shadow-inner p-6">
                <div className="min-w-[700px]">
                  <div className="relative border-l-2 border-gray-700/50 ml-20 md:ml-24 space-y-2 pb-4 mt-4">
                    {activeSchedules.length === 0 ? (
                      <p className="text-gray-500 pl-6 pt-2 text-sm italic">No active scheduled bills found.</p>
                    ) : (
                      activeSchedules.map((record) => (
                        <div key={record.id} className="relative pl-6 group">
                          {/* Date and Time on Left */}
                          <div className="absolute -left-[5.5rem] md:-left-[6.5rem] top-1/2 -translate-y-1/2 w-20 md:w-24 text-right pr-4">
                            <div className="text-xs font-semibold text-gray-400">
                              {new Date(record.nextDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </div>
                            <div className="text-[10px] font-bold text-gray-500 mt-0.5">
                              {new Date(record.nextDate).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                            </div>
                          </div>

                          {/* Timeline Node */}
                          <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-gray-900 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] flex items-center justify-center transition-transform group-hover:scale-125">
                            <Repeat className="w-3 h-3 text-gray-900" />
                          </div>
                          
                          {/* Row Content - Single Line */}
                          <div className="py-2 px-3 hover:bg-gray-800/40 rounded-lg flex flex-row items-center justify-between border-b border-gray-800/50 transition-colors">
                            <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-4">
                              <span className="hidden sm:inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500 shrink-0">
                                {record.category}
                              </span>
                              <div className="font-bold text-gray-100 text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                                {record.description || record.category}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 md:gap-6 shrink-0">
                              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border bg-gray-700 text-gray-300 border-gray-600">
                                {record.frequency}
                              </span>
                              <span className="font-extrabold text-sm md:text-base tracking-tight text-amber-400">
                                Rs. {formatLKR(record.amount)}
                              </span>
                              <button 
                                onClick={() => deleteSchedule(record.id)} 
                                className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors cursor-pointer"
                                title="Delete Schedule"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ScheduledTab;
