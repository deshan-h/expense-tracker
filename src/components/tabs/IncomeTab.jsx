import React, { useState } from 'react';
import { PlusCircle, Link, CheckCircle2, TrendingUp } from 'lucide-react';

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
  setDate
}) => {
  const [incomeType, setIncomeType] = useState('Business'); // 'Business' or 'Other'
  const [showGuide, setShowGuide] = useState(false);

  const posTransactions = transactions.filter(t => t.type === 'Income' && t.category === 'Business').sort((a, b) => new Date(b.date) - new Date(a.date));

  // We are forcing the main transaction type to be 'Income'
  // and the category to be the selected incomeType.
  const onSubmit = (e) => {
    e.preventDefault();
    handleAddTransaction(e, 'Income', incomeType);
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
    <div className="bg-gray-800 p-6 md:p-10 rounded-3xl border border-gray-700 shadow-2xl max-w-full mx-auto overflow-hidden">
      <div className="flex p-1 bg-gray-900 rounded-2xl w-full max-w-md mx-auto mb-10">
        <button 
          type="button" 
          onClick={() => setIncomeType('Business')} 
          className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${incomeType === 'Business' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
        >
          Business (POS)
        </button>
        <button 
          type="button" 
          onClick={() => setIncomeType('Other')} 
          className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${incomeType === 'Other' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
        >
          Other Income
        </button>
      </div>

      {incomeType === 'Other' && (
        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8 flex flex-col justify-start">
            <div className="text-center bg-gray-900/30 p-8 rounded-3xl border border-gray-700/50 relative">
              <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-widest">
                {calcHistory ? <span className="text-emerald-400 font-bold tracking-normal">{calcHistory}</span> : 'Amount'}
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
              <div className="h-1 w-48 bg-gradient-to-r from-transparent via-emerald-500 to-transparent mx-auto mt-4 opacity-50 group-focus-within:opacity-100 transition-all duration-500 rounded-full"></div>
            </div>
          </div>

          <div className="flex flex-col justify-between bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50">
            <div>
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Details</p>
              <div className="relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all overflow-hidden mb-4">
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required className="w-full bg-transparent px-5 py-4 text-base text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Income Source (e.g., Salary, Gift)" />
              </div>
              
              <div className="relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 transition-all overflow-hidden">
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent px-5 py-4 text-base text-gray-100 placeholder-gray-500 focus:outline-none [color-scheme:dark]" />
              </div>
            </div>

            <button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-500/20 text-white font-bold py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xl mt-8">
              <PlusCircle className="w-7 h-7" /> Save Income
            </button>
          </div>
        </form>
      )}

      {incomeType === 'Business' && (
        <div className="bg-gray-900 p-8 rounded-3xl border border-gray-700/50">
          <div className="flex items-center gap-4 mb-10 border-b border-gray-800 pb-6">
            <div className="bg-blue-500/10 p-3 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                Business Sync Timeline
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </h3>
              <p className="text-gray-400 text-sm mt-1">Live sales synced from your POS system</p>
            </div>
          </div>
          
          {posTransactions.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-gray-700 rounded-3xl">
              <TrendingUp className="w-12 h-12 text-gray-600 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400 text-lg font-medium mb-1">Waiting for first sale...</p>
              <p className="text-gray-500 text-sm">When a sale is completed in the POS, it will appear here instantly.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {posTransactions.map((t) => (
                <div key={t.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-800/80 rounded-2xl border border-gray-700/50 hover:border-blue-500/40 hover:bg-gray-750 transition-all gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="bg-blue-500/10 p-2.5 rounded-xl shrink-0 hidden sm:block">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-100 text-base">{t.description || 'POS Sync'}</div>
                      <div className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">{new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 border-gray-700/50 pt-3 sm:pt-0">
                    <div className="font-bold text-emerald-400 text-lg">+ Rs. {parseFloat(t.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-blue-400 font-bold bg-blue-500/10 px-2 py-0.5 rounded uppercase mt-1 inline-block tracking-wider">
                      {t.subcategory || 'Business'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IncomeTab;
