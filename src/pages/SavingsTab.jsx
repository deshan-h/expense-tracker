import React, { useState, useMemo } from 'react';
import { 
  PiggyBank, PlusCircle, ArrowUpCircle, ArrowDownCircle, Trash2, 
  List, ChevronDown, ChevronUp, ArrowUpRight, ArrowDownLeft, Wallet, 
  TrendingUp, TrendingDown, Sparkles 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DateTimePicker from '../components/ui/DateTimePicker';

const SavingsTab = ({
  savings = [],
  addSaving,
  deleteSaving,
  formatLKR
}) => {
  const [type, setType] = useState('Deposit'); // 'Deposit' or 'Withdrawal' or 'Initial'
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All'); // 'All' | 'Deposit' | 'Withdrawal'

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount) return;

    const success = await addSaving({
      type,
      amount: parseFloat(amount),
      description: description.trim() || (type === 'Deposit' ? 'Deposit' : 'Withdrawal'),
      date: `${date}T${time}`
    });

    if (success) {
      setAmount('');
      setDescription('');
      setDate(new Date().toLocaleDateString('en-CA'));
      setTime(new Date().toTimeString().slice(0, 5));
      setShowAddRecord(false);
    }
  };

  // Calculations
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalSavings = useMemo(() => {
    return savings.reduce((acc, curr) => {
      if (curr.type === 'Deposit' || curr.type === 'Initial') return acc + curr.amount;
      if (curr.type === 'Withdrawal') return acc - curr.amount;
      return acc;
    }, 0);
  }, [savings]);

  const totalDeposits = useMemo(() => {
    return savings
      .filter(s => s.type === 'Deposit' || s.type === 'Initial')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [savings]);

  const totalWithdrawals = useMemo(() => {
    return savings
      .filter(s => s.type === 'Withdrawal')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [savings]);

  const depositCount = useMemo(() => {
    return savings.filter(s => s.type === 'Deposit' || s.type === 'Initial').length;
  }, [savings]);

  const withdrawalCount = useMemo(() => {
    return savings.filter(s => s.type === 'Withdrawal').length;
  }, [savings]);

  const thisMonthSavings = useMemo(() => {
    return savings.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [savings, currentMonth, currentYear]);

  const thisMonthDeposits = useMemo(() => {
    return thisMonthSavings
      .filter(s => s.type === 'Deposit' || s.type === 'Initial')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [thisMonthSavings]);

  const thisMonthWithdrawals = useMemo(() => {
    return thisMonthSavings
      .filter(s => s.type === 'Withdrawal')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [thisMonthSavings]);

  const thisMonthNet = thisMonthDeposits - thisMonthWithdrawals;

  // Filtered records
  const filteredSavings = useMemo(() => {
    if (activeFilter === 'Deposit') {
      return savings.filter(s => s.type === 'Deposit' || s.type === 'Initial');
    }
    if (activeFilter === 'Withdrawal') {
      return savings.filter(s => s.type === 'Withdrawal');
    }
    return savings;
  }, [savings, activeFilter]);

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] pb-20 overflow-x-hidden">
      <div className="px-4 md:px-8 py-4 w-full max-w-[1600px] mx-auto space-y-6">
        
        {/* Full-tab Ambient Glows */}
        <div className="absolute top-[5%] left-[10%] w-[35vw] h-[35vw] bg-pink-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-[20%] right-[10%] w-[35vw] h-[35vw] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        {/* 1. TOP 3 SUMMARY CARDS (MATCHING MONEY LENT TAB) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: Total Net Savings */}
          <div 
            onClick={() => setActiveFilter('All')}
            className={`cursor-pointer bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border ${
              activeFilter === 'All' ? 'border-pink-500 ring-2 ring-pink-500/30' : 'border-gray-800/80 hover:border-gray-700'
            } shadow-xl relative overflow-hidden transition-all duration-300 group`}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-pink-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <PiggyBank className="w-3.5 h-3.5 text-pink-400" /> Total Savings Balance
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400">
                {savings.length} Records
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              <span className="text-xs text-gray-500 font-semibold mr-1">Rs.</span>
              {formatLKR(totalSavings)}
            </h2>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>Net Available Funds</span>
              <span className={thisMonthNet >= 0 ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                {thisMonthNet >= 0 ? `+Rs. ${formatLKR(thisMonthNet)} this mo` : `-Rs. ${formatLKR(Math.abs(thisMonthNet))} this mo`}
              </span>
            </div>
          </div>

          {/* Card 2: Total Deposited */}
          <div 
            onClick={() => setActiveFilter('Deposit')}
            className={`cursor-pointer bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border ${
              activeFilter === 'Deposit' ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-gray-800/80 hover:border-gray-700'
            } shadow-xl relative overflow-hidden transition-all duration-300 group`}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> Total Deposited (Inflow)
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                {depositCount} Deposits
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-400">
              <span className="text-xs text-gray-500 font-semibold mr-1">Rs.</span>
              {formatLKR(totalDeposits)}
            </h2>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>All-time additions</span>
              <span className="text-emerald-400 font-medium">+Rs. {formatLKR(thisMonthDeposits)} this mo</span>
            </div>
          </div>

          {/* Card 3: Total Withdrawn */}
          <div 
            onClick={() => setActiveFilter('Withdrawal')}
            className={`cursor-pointer bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border ${
              activeFilter === 'Withdrawal' ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-gray-800/80 hover:border-gray-700'
            } shadow-xl relative overflow-hidden transition-all duration-300 group`}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" /> Total Withdrawn (Outflow)
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                {withdrawalCount} Withdrawals
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-rose-400">
              <span className="text-xs text-gray-500 font-semibold mr-1">Rs.</span>
              {formatLKR(totalWithdrawals)}
            </h2>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>All-time withdrawals</span>
              <span className="text-rose-400 font-medium">-Rs. {formatLKR(thisMonthWithdrawals)} this mo</span>
            </div>
          </div>

        </div>

        {/* 2. FILTER TABS & QUICK ADD BAR */}
        <div className="bg-gray-900/60 backdrop-blur-xl p-3 rounded-[1.25rem] border border-gray-800/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 relative z-20">
          
          {/* Segment Selector */}
          <div className="flex items-center bg-gray-950/80 p-1 rounded-xl border border-gray-800/80 w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('All')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeFilter === 'All'
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              All Records ({savings.length})
            </button>
            <button
              onClick={() => setActiveFilter('Deposit')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeFilter === 'Deposit'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-300" /> Deposits ({depositCount})
            </button>
            <button
              onClick={() => setActiveFilter('Withdrawal')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeFilter === 'Withdrawal'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-300" /> Withdrawals ({withdrawalCount})
            </button>
          </div>

          {/* Quick Add Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAddRecord(!showAddRecord)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showAddRecord ? 'Close Form' : '+ Add Savings Record'}</span>
              {showAddRecord ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
            </button>
          </div>
        </div>

        {/* 3. COLLAPSIBLE ADD RECORD FORM */}
        <AnimatePresence>
          {showAddRecord && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative z-40 overflow-visible"
            >
              <div className="bg-gray-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-[1.5rem] border border-gray-800/80 shadow-2xl relative z-40 overflow-visible">
                
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Transaction Type:</span>
                    <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
                      {savings.length === 0 && (
                        <button 
                          type="button" 
                          onClick={() => setType('Initial')} 
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            type === 'Initial' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          Initial Balance
                        </button>
                      )}
                      <button 
                        type="button" 
                        onClick={() => setType('Deposit')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          type === 'Deposit' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> Deposit (තැන්පතු)
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setType('Withdrawal')} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          type === 'Withdrawal' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" /> Withdrawal (ආපසු ගැනීම)
                      </button>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    type === 'Deposit' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {type === 'Deposit' ? '+ Adding to Savings' : '- Deducting from Savings'}
                  </span>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                  
                  {/* Amount */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Amount</span>
                    <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-pink-500 transition-all shadow-inner">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                      <input 
                        type="text" 
                        inputMode="decimal" 
                        required 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
                        className="w-full h-[42px] bg-transparent pl-10 pr-3 text-sm font-bold text-white focus:outline-none" 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2 lg:col-span-2 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Description</span>
                    <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-pink-500 transition-all shadow-inner">
                      <input 
                        type="text" 
                        value={description} 
                        onChange={(e) => setDescription(e.target.value)} 
                        required 
                        className="w-full h-[42px] bg-transparent px-4 text-sm font-medium text-white focus:outline-none placeholder-gray-500" 
                        placeholder="e.g. Monthly salary savings, emergency fund, gold fund" 
                      />
                    </div>
                  </div>

                  {/* Date */}
                  <div className="space-y-1 relative z-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Date</span>
                    <DateTimePicker 
                      date={date} 
                      setDate={setDate} 
                      time={time} 
                      setTime={setTime} 
                      hideTime={true} 
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-2">
                    <button 
                      type="submit" 
                      className={`w-full h-[42px] rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-lg ${
                        type === 'Deposit'
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-900/40 hover:bg-emerald-400'
                          : type === 'Withdrawal'
                          ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-rose-900/40 hover:bg-rose-400'
                          : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-indigo-900/40'
                      }`}
                    >
                      <PlusCircle className="w-4 h-4" />
                      {type === 'Deposit' ? 'RECORD DEPOSIT' : type === 'Withdrawal' ? 'RECORD WITHDRAWAL' : 'SET INITIAL'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. SAVINGS TRANSACTION HISTORY TABLE */}
        <div className="bg-gray-900/60 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] border border-gray-800/80 shadow-2xl flex flex-col relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <List className="w-4 h-4 text-pink-400" />
              {activeFilter === 'All' && 'All Savings History'}
              {activeFilter === 'Deposit' && 'Deposits History'}
              {activeFilter === 'Withdrawal' && 'Withdrawals History'}
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                {filteredSavings.length}
              </span>
            </h3>
          </div>

          <div className="relative overflow-y-auto hide-scrollbar flex-1 pr-1 pb-4">
            {filteredSavings.length === 0 ? (
              <div className="text-center py-14 bg-gray-950/40 rounded-3xl border border-gray-800/80 border-dashed">
                <PiggyBank className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-bold text-sm">No savings records found.</p>
                <p className="text-gray-600 text-xs mt-1">Start by adding your first deposit or balance above!</p>
              </div>
            ) : (
              <>
                <div className="absolute left-[56px] top-3 bottom-3 w-px bg-gray-700/50"></div>
                <div className="space-y-3 relative z-10">
                  {filteredSavings.map((record) => {
                    const d = new Date(record.date);
                    const isToday = d.toDateString() === new Date().toDateString();
                    const isDeposit = record.type === 'Deposit';
                    const isWithdrawal = record.type === 'Withdrawal';
                    const isInitial = record.type === 'Initial';
                    
                    return (
                      <div key={record.id} className="relative flex items-center group">
                        
                        {/* Date and Time on Left */}
                        <div className="w-12 flex-shrink-0 text-right pr-2">
                          <p className="text-[11px] font-black text-gray-300 leading-tight">
                            {isToday ? 'Today' : d.getDate().toString()}
                          </p>
                          <p className="text-[8px] font-bold text-gray-500 tracking-wider mt-0.5">
                            {isToday 
                              ? d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }).split(' ')[0] 
                              : d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase()}
                          </p>
                        </div>

                        {/* Timeline Node */}
                        <div className="relative w-4 flex flex-col items-center justify-center flex-shrink-0 z-10">
                          <div className={`w-3 h-3 rounded-full border-2 border-gray-900 transition-transform group-hover:scale-125 ${
                            isDeposit 
                              ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]' 
                              : isWithdrawal 
                              ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]' 
                              : 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)]'
                          }`}></div>
                        </div>
                        
                        {/* Row Content Card */}
                        <div className="flex-1 ml-3 bg-gray-950/40 hover:bg-gray-800/40 border border-gray-800/80 rounded-xl px-4 py-3 flex items-center justify-between transition-colors">
                          <div className="flex items-center gap-3 min-w-0 pr-4">
                            <div className={`p-1.5 rounded-lg ${
                              isDeposit ? 'bg-emerald-500/10 text-emerald-400' : isWithdrawal ? 'bg-rose-500/10 text-rose-400' : 'bg-indigo-500/10 text-indigo-400'
                            }`}>
                              {isDeposit ? <ArrowUpCircle className="w-4 h-4" /> : isWithdrawal ? <ArrowDownCircle className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-gray-200 text-xs sm:text-sm group-hover:text-white transition-colors truncate">
                                {record.description}
                              </h4>
                              <span className="text-[10px] text-gray-500 font-medium">
                                {d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                              isDeposit ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : isWithdrawal ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            }`}>
                              {record.type}
                            </span>
                            <div className={`font-black whitespace-nowrap text-xs sm:text-sm ${
                              isDeposit ? 'text-emerald-400' : isWithdrawal ? 'text-rose-400' : 'text-indigo-400'
                            }`}>
                              {isWithdrawal ? '-' : '+'}Rs. {formatLKR(record.amount)}
                            </div>
                            <button 
                              onClick={() => deleteSaving(record.id)} 
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg ml-1"
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
  );
};

export default SavingsTab;
