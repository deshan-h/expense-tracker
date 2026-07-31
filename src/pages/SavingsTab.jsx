import React, { useState } from 'react';
import { PiggyBank, PlusCircle, ArrowUpCircle, ArrowDownCircle, Trash2, List } from 'lucide-react';
import DateTimePicker from '../components/ui/DateTimePicker';

const SavingsTab = ({
  savings,
  addSaving,
  deleteSaving,
  formatLKR
}) => {
  const [view, setView] = useState('add'); // 'add' or 'history'
  const [type, setType] = useState('Deposit'); // 'Deposit' or 'Withdrawal'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

    const success = await addSaving({
      type,
      amount: parseFloat(amount),
      description,
      date: `${date}T${time}`
    });

    if (success) {
      setAmount('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime(new Date().toTimeString().slice(0, 5));
    }
  };

  const totalSavings = savings.reduce((acc, curr) => {
    if (curr.type === 'Deposit') return acc + curr.amount;
    if (curr.type === 'Withdrawal') return acc - curr.amount;
    return acc;
  }, 0);

  return (
    <div className="relative w-full">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-pink-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="bg-gray-900/40 backdrop-blur-2xl p-6 md:p-10 rounded-[2rem] border border-gray-700/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] max-w-full mx-auto relative group transition-all duration-700 hover:border-gray-600/60 z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="relative z-10">
          {/* Top Navigation */}
          <div className="flex p-1 bg-gray-900 rounded-2xl w-full max-w-md mx-auto mb-10">
            <button 
              type="button" 
              onClick={() => setView('add')} 
              className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'add' ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
            >
              <PlusCircle className="w-4 h-4" /> Add Record
            </button>
            <button 
              type="button" 
              onClick={() => setView('history')} 
              className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'history' ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
            >
              <List className="w-4 h-4" /> Savings History
            </button>
          </div>

          {/* Current Savings Display */}
          <div className="mb-10 text-center">
            <p className="text-gray-400 text-sm font-semibold uppercase tracking-widest mb-2">Total Savings Balance</p>
            <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Rs. {formatLKR(totalSavings)}
            </h2>
          </div>

          {view === 'add' && (
            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* COLUMN 1 */}
              <div className="space-y-8 flex flex-col justify-start">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-pink-500/10 rounded-full">
                    <PiggyBank className="w-6 h-6 text-pink-500" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Record Savings</h3>
                    <p className="text-sm text-gray-400">Add or withdraw from your savings</p>
                  </div>
                </div>

                <div className="flex p-1 bg-gray-900 rounded-2xl w-full mx-auto">
                  <button type="button" onClick={() => setType('Deposit')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${type === 'Deposit' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>
                    <ArrowUpCircle className="w-4 h-4 inline mr-2" /> Deposit
                  </button>
                  <button type="button" onClick={() => setType('Withdrawal')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${type === 'Withdrawal' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>
                    <ArrowDownCircle className="w-4 h-4 inline mr-2" /> Withdrawal
                  </button>
                </div>

                <div className="text-center bg-gray-900/60 backdrop-blur-md p-8 rounded-3xl border border-gray-700/50 relative shadow-inner">
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
                  <div className="h-1 w-48 bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-pink-500 group-focus-within:opacity-100 transition-all duration-700 rounded-full"></div>
                </div>
              </div>

              {/* COLUMN 2 */}
              <div className="flex flex-col justify-between bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-gray-700/50 shadow-inner">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Details</p>
                  
                  <div className="relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500 transition-all overflow-hidden mb-4 shadow-inner">
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-transparent px-5 py-4 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="E.g., Monthly Savings, Emergency Fund" />
                  </div>
                  
                  <div className="mt-4 z-20 relative">
                    <DateTimePicker date={date} setDate={setDate} time={time} setTime={setTime} />
                  </div>
                </div>

                <button type="submit" className={`w-full bg-gradient-to-r ${type === 'Deposit' ? 'from-emerald-500 via-teal-500 to-emerald-600 shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)]' : 'from-rose-500 via-pink-500 to-rose-600 shadow-[0_0_20px_-5px_rgba(244,63,94,0.5)]'} hover:bg-right bg-[length:200%_auto] text-white font-black tracking-widest uppercase py-5 rounded-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 text-lg mt-8`}>
                  <PlusCircle className="w-6 h-6" /> SAVE RECORD
                </button>
              </div>
            </form>
          )}

          {view === 'history' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white mb-6">Savings History</h3>
              {savings.length === 0 ? (
                <div className="text-center py-12 bg-gray-900/40 rounded-3xl border border-gray-800 border-dashed">
                  <PiggyBank className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">No savings records found.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-gray-700/50 ml-20 md:ml-24 space-y-2 pb-4 mt-8">
                  {savings.map((record) => (
                    <div key={record.id} className="relative pl-6 group">
                      {/* Date and Time on Left */}
                      <div className="absolute -left-[5.5rem] md:-left-[6.5rem] top-1/2 -translate-y-1/2 w-20 md:w-24 text-right pr-4">
                        <div className="text-xs font-semibold text-gray-400">
                          {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-[10px] font-bold text-gray-500 mt-0.5">
                          {new Date(record.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>

                      {/* Timeline Node */}
                      <div className={`absolute -left-[13px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-gray-900 flex items-center justify-center transition-transform group-hover:scale-125 ${record.type === 'Deposit' ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}>
                        {record.type === 'Deposit' ? <ArrowUpCircle className="w-3 h-3 text-gray-900" /> : <ArrowDownCircle className="w-3 h-3 text-gray-900" />}
                      </div>

                      {/* Row Content - Single Line */}
                      <div className="py-2 px-3 hover:bg-gray-800/40 rounded-lg flex flex-row items-center justify-between border-b border-gray-800/50 transition-colors">
                        <div className="font-bold text-gray-100 text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1 pr-4">
                          {record.description}
                        </div>
                        <div className="flex items-center gap-3 md:gap-6 shrink-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hidden sm:block">{record.type}</p>
                          <p className={`font-black text-sm md:text-base tracking-tight ${record.type === 'Deposit' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {record.type === 'Deposit' ? '+' : '-'}Rs. {formatLKR(record.amount)}
                          </p>
                          <button onClick={() => deleteSaving(record.id)} className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors cursor-pointer" title="Delete Record">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SavingsTab;
