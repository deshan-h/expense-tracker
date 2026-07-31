import React, { useState } from 'react';
import { PlusCircle, Link, CheckCircle2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import DateTimePicker from '../components/ui/DateTimePicker';

const IncomeTab = ({ 
  transactions = [],
  handleAddTransaction,
  amount, 
  setAmount, 
  calcHistory,
  setCalcHistory,
  description, 
  setDescription, 
  date,
  setDate,
  time,
  setTime,
  handleSyncPOS,
  isSyncing,
  lastSyncTimeStr
}) => {
  const [showGuide, setShowGuide] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();
    handleAddTransaction(e, 'Income', 'Other'); // Manual entries are always 'Other'
  };

  const handleAmountKeyDown = (e) => {
    const operators = ['+', '-', '*', '/'];
    if (operators.includes(e.key)) {
      e.preventDefault();
      if (amount) {
        setCalcHistory(prev => prev + amount + ' ' + e.key + ' ');
        setAmount('');
      } else if (calcHistory) {
        setCalcHistory(prev => prev.trim().slice(0, -1) + ' ' + e.key + ' ');
      }
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      if (!calcHistory) return;
      try {
        const expression = (calcHistory + amount).replace(/[^0-9+\-*/.]/g, '');
        if (expression) {
          const result = Function('"use strict";return (' + expression + ')')();
          setAmount(String(result));
          setCalcHistory('');
        }
      } catch (err) {
        console.error("Invalid expression");
      }
    } else if (e.key === 'Backspace' && amount === '' && calcHistory !== '') {
      e.preventDefault();
      const parts = calcHistory.trim().split(' ');
      const lastOp = parts.pop();
      const lastNum = parts.pop();
      setCalcHistory(parts.length > 0 ? parts.join(' ') + ' ' : '');
      setAmount(lastNum || '');
    }
  };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] flex flex-col gap-10">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-teal-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      {/* POS SYNC BLOCK */}
      <div className="w-full relative z-10 mt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 shadow-inner">
              <TrendingUp className="w-8 h-8 text-blue-400 drop-shadow-md" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2 tracking-wide uppercase">
                Business POS Sync
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                {lastSyncTimeStr 
                  ? <span className="text-emerald-400 font-medium">Last sync: {new Date(lastSyncTimeStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  : 'Manually pull latest POS sales into the tracker'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleSyncPOS}
            disabled={isSyncing}
            className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black tracking-widest uppercase text-white transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.4)] ${isSyncing ? 'bg-gray-800/80 cursor-not-allowed text-gray-500 border border-gray-700' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right hover:shadow-[0_0_30px_-5px_rgba(37,99,235,0.6)] active:scale-95'}`}
          >
            {isSyncing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                SYNCING...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                SYNC NEW SALES
              </>
            )}
          </button>
        </div>
      </div>

      {/* MANUAL INCOME FORM */}
      <div className="w-full relative z-10">
        <h3 className="text-sm font-bold text-gray-300 mb-8 px-2 uppercase tracking-[0.2em] relative z-10">Manual Income Entry</h3>
        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
          <div className="space-y-8 flex flex-col justify-start">
            <div className="text-center bg-gray-900/60 backdrop-blur-md p-8 rounded-3xl border border-gray-700/50 relative shadow-inner">
              <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">
                {calcHistory ? <span className="text-emerald-400 font-black tracking-widest drop-shadow-md">{calcHistory}</span> : 'Amount'}
              </p>
              <div className="flex items-center justify-center text-6xl md:text-7xl font-bold text-white group">
                <span className="text-gray-500 mr-4 text-4xl">Rs.</span>
                <input 
                  type="text" 
                  inputMode="decimal"
                  required={!calcHistory} 
                  value={amount} 
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
                  onKeyDown={handleAmountKeyDown}
                  className="bg-transparent border-none outline-none text-left w-[220px] md:w-[300px] focus:ring-0 placeholder-gray-700" 
                  placeholder="0.00" 
                />
              </div>
              <div className="h-1 w-48 bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-emerald-500 group-focus-within:opacity-100 transition-all duration-700 rounded-full"></div>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-gray-700/50 shadow-inner">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Details</p>
              <div className="relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all overflow-hidden mb-4 shadow-inner">
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-transparent px-5 py-4 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="Income Source (e.g., Salary, Gift)" />
              </div>
              
              <div className="mt-4">
                <DateTimePicker date={date} setDate={setDate} time={time} setTime={setTime} />
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:bg-right bg-[length:200%_auto] text-white font-black tracking-widest uppercase py-5 rounded-2xl transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.5)] active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 text-lg mt-8">
              <PlusCircle className="w-6 h-6" /> SAVE INCOME
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncomeTab;
