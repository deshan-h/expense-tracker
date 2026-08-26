import React, { useState } from 'react';
import { PiggyBank, PlusCircle, ArrowUpCircle, ArrowDownCircle, Trash2, List, ChevronDown, ChevronUp } from 'lucide-react';
import DateTimePicker from '../components/ui/DateTimePicker';

const SavingsTab = ({
  savings,
  addSaving,
  deleteSaving,
  formatLKR
}) => {
  const [type, setType] = useState('Deposit'); // 'Deposit' or 'Withdrawal'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [showAddRecord, setShowAddRecord] = useState(false);

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
    if (curr.type === 'Deposit' || curr.type === 'Initial') return acc + curr.amount;
    if (curr.type === 'Withdrawal') return acc - curr.amount;
    return acc;
  }, 0);

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
        {/* Full-tab Ambient Glows */}
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-pink-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

        <div className="w-full relative z-10 mt-2">
          <div className="flex flex-col">

            {/* TOP ROW: Add Record Form */}
            <div className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] border border-gray-800 shadow-xl relative z-20 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <div 
                  className="flex items-center gap-2 cursor-pointer group"
                  onClick={() => setShowAddRecord(!showAddRecord)}
                >
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2 group-hover:text-white transition-colors">
                    <PlusCircle className="w-4 h-4 text-pink-500" /> Add Record
                  </h3>
                  <button type="button" className="text-gray-500 group-hover:text-gray-300 transition-colors bg-gray-800/50 p-1.5 rounded-full ml-2">
                    {showAddRecord ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                {showAddRecord && (
                  <div className="flex p-1 bg-gray-900 rounded-xl w-full sm:w-auto">
                    {savings.length === 0 && (
                      <button type="button" onClick={() => setType('Initial')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] md:text-xs font-semibold rounded-lg transition-all ${type === 'Initial' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>
                        Initial
                      </button>
                    )}
                    <button type="button" onClick={() => setType('Deposit')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] md:text-xs font-semibold rounded-lg transition-all ${type === 'Deposit' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>
                      Deposit
                    </button>
                    <button type="button" onClick={() => setType('Withdrawal')} className={`flex-1 sm:flex-none px-4 py-1.5 text-[10px] md:text-xs font-semibold rounded-lg transition-all ${type === 'Withdrawal' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>
                      Withdrawal
                    </button>
                  </div>
                )}
              </div>

              {showAddRecord && (
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-3 items-end">
                  {/* Amount */}
                  <div className="w-full md:w-48 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-pink-500 focus-within:ring-1 focus-within:ring-pink-500 transition-all shadow-inner">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                    <input type="text" inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} className="w-full bg-transparent pl-10 pr-3 py-2.5 text-sm font-bold text-white focus:outline-none" placeholder="0.00" />
                  </div>
                  {/* Details */}
                  <div className="w-full md:flex-1 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-pink-500 transition-all shadow-inner">
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full h-[42px] bg-transparent px-3 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="E.g., Monthly Savings, Emergency Fund" />
                  </div>
                  {/* Date */}
                  <div className="w-full md:w-44 flex-shrink-0">
                    <DateTimePicker date={date} setDate={setDate} time={time} setTime={setTime} hideTime={true} />
                  </div>
                  {/* Submit */}
                  <button type="submit" className={`w-full md:w-auto h-[42px] bg-gradient-to-r ${type === 'Deposit' ? 'from-emerald-500 via-teal-500 to-emerald-600' : type === 'Withdrawal' ? 'from-rose-500 via-pink-500 to-rose-600' : 'from-indigo-500 via-purple-500 to-indigo-600'} hover:bg-right bg-[length:200%_auto] text-white font-black tracking-widest uppercase px-6 rounded-xl transition-all shadow-[0_0_15px_-3px_rgba(16,185,129,0.5)] active:scale-[0.98] shrink-0 flex items-center justify-center gap-2`}>
                    <PlusCircle className="w-4 h-4" /> SAVE
                  </button>
                </form>
              )}
            </div>

            {/* BOTTOM SECTION: Timeline View */}
            <div className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] border border-gray-800 shadow-xl flex flex-col relative z-10">
              <div className="flex items-center justify-between px-2 mb-6">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
                  <List className="w-4 h-4 text-purple-500" /> Savings History
                </h3>
                <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl flex flex-col items-end shadow-inner">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Balance</span>
                  <span className="text-sm font-black text-emerald-500 leading-tight">Rs. {formatLKR(totalSavings)}</span>
                </div>
              </div>
              
              <div className="relative overflow-y-auto hide-scrollbar flex-1 pr-1 pb-4">
                {savings.length === 0 ? (
                  <div className="text-center py-12 bg-gray-900/40 rounded-3xl border border-gray-800 border-dashed">
                    <PiggyBank className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-medium text-xs">No savings records found.</p>
                  </div>
                ) : (
                  <>
                    <div className="absolute left-[56px] top-3 bottom-3 w-px bg-gray-700/50"></div>
                    <div className="space-y-4 relative z-10">
                      {savings.map((record) => {
                        const d = new Date(record.date);
                        const isToday = d.toDateString() === new Date().toDateString();
                        const isDeposit = record.type === 'Deposit';
                        const isWithdrawal = record.type === 'Withdrawal';
                        const isInitial = record.type === 'Initial';
                        
                        return (
                          <div key={record.id} className="relative flex items-start group">
                            {/* Date and Time on Left */}
                            <div className="w-12 flex-shrink-0 text-right pt-0.5 pr-2">
                              <p className="text-[11px] font-black text-gray-300 leading-tight">{isToday ? 'Today' : d.getDate().toString()}</p>
                              <p className="text-[8px] font-bold text-gray-500 tracking-wider mt-0.5">{isToday ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).split(' ')[0] : d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}</p>
                            </div>

                            {/* Timeline Node */}
                            <div className="relative w-4 h-full flex flex-col items-center justify-start pt-1.5 flex-shrink-0 z-10">
                              <div className={`w-2.5 h-2.5 rounded-full border border-gray-900 transition-transform group-hover:scale-125 ${isDeposit ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : isWithdrawal ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]' : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]'}`}></div>
                            </div>
                            
                            {/* Row Content */}
                            <div className="flex-1 ml-3 flex items-center justify-between pb-2 group cursor-default">
                              <div className="flex items-start gap-2.5 min-w-0 pr-4">
                                <div className={`mt-0.5 ${isDeposit ? 'text-emerald-400' : isWithdrawal ? 'text-rose-400' : 'text-indigo-400'}`}>
                                  {isDeposit ? <ArrowUpCircle className="w-3.5 h-3.5" /> : isWithdrawal ? <ArrowDownCircle className="w-3.5 h-3.5" /> : <PlusCircle className="w-3.5 h-3.5" />}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-bold text-gray-200 text-[11px] md:text-xs group-hover:text-white transition-colors truncate">
                                    {record.description}
                                  </h4>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest bg-gray-800 text-gray-400 border border-gray-700">
                                  {record.type}
                                </span>
                                <div className={`font-black whitespace-nowrap text-[11px] md:text-xs ${isDeposit ? 'text-emerald-400' : isWithdrawal ? 'text-rose-400' : 'text-indigo-400'}`}>
                                  {isWithdrawal ? '-' : '+'}Rs. {formatLKR(record.amount)}
                                </div>
                                <button 
                                  onClick={() => deleteSaving(record.id)} 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-rose-500 bg-gray-800 rounded-md shadow-sm ml-1"
                                  title="Delete Record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsTab;
