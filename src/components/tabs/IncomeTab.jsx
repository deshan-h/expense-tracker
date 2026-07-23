import React, { useState } from 'react';
import { PlusCircle, Link, CheckCircle2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { fetchNewSalesSum } from '../../utils/posSync';
import { db } from '../../firebase';
import { collection, addDoc } from 'firebase/firestore';

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
  const [showGuide, setShowGuide] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTimeStr, setLastSyncTimeStr] = useState(localStorage.getItem('lastPosSyncTimestamp'));

  const handleSyncPOS = async () => {
    setIsSyncing(true);
    try {
      const lastSync = localStorage.getItem('lastPosSyncTimestamp');
      toast.loading('Fetching new POS sales...', { id: 'sync' });
      
      const result = await fetchNewSalesSum(lastSync);
      
      if (result.success) {
        if (result.count === 0 || result.sum === 0) {
          toast.success('No new sales to sync!', { id: 'sync' });
        } else {
          await addDoc(collection(db, 'transactions'), {
            type: 'Income',
            category: 'Business',
            subcategory: 'POS Batch Sync',
            amount: parseFloat(result.sum),
            description: `Last sync at ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
            date: new Date().toISOString(),
            isTracked: true
          });
          
          if (result.latestTimestamp) {
            localStorage.setItem('lastPosSyncTimestamp', result.latestTimestamp);
            setLastSyncTimeStr(result.latestTimestamp);
          }
          
          toast.success(`Successfully synced ${result.count} orders for Rs. ${result.sum.toLocaleString()}!`, { id: 'sync' });
        }
      } else {
        toast.error('Failed to connect to POS database', { id: 'sync' });
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while syncing.', { id: 'sync' });
    } finally {
      setIsSyncing(false);
    }
  };

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
    <div className="bg-gray-800 p-6 md:p-10 rounded-3xl border border-gray-700 shadow-2xl max-w-full mx-auto overflow-hidden flex flex-col gap-10">
      
      {/* POS SYNC BLOCK */}
      <div className="bg-gray-900 p-8 rounded-3xl border border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-blue-500/10 p-3 rounded-2xl">
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
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
            className={`flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-bold text-white transition-all shadow-lg ${isSyncing ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 active:scale-95'}`}
          >
            {isSyncing ? (
              <>
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                Syncing...
              </>
            ) : (
              <>
                <TrendingUp className="w-5 h-5" />
                Sync New Sales
              </>
            )}
          </button>
        </div>
      </div>

      {/* MANUAL INCOME FORM */}
      <div>
        <h3 className="text-xl font-bold text-gray-200 mb-6 px-2">Manual Income Entry</h3>
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
      </div>
    </div>
  );
};

export default IncomeTab;
