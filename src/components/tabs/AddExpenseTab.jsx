import React from 'react';
import { PlusCircle, TrendingUp, Plus } from 'lucide-react';
import { getIconComponent, getIconColor } from '../../utils/icons';

const AddExpenseTab = ({ 
  handleAddTransaction, 
  type, 
  setType, 
  amount, 
  setAmount, 
  calcHistory,
  setCalcHistory,
  description, 
  setDescription, 
  date,
  setDate,
  isTracked,
  setIsTracked,
  categories, 
  category, 
  setCategory, 
  subcategory, 
  setSubcategory, 
  selectedCatObj,
  handleAddSubcategory,
  newSubcategoryNames,
  handleSubcategoryChange
}) => {
  const handleAmountKeyDown = (e) => {
    const operators = ['+', '-', '*', '/'];
    
    if (operators.includes(e.key)) {
      e.preventDefault();
      if (amount) {
        setCalcHistory(prev => prev + amount + ' ' + e.key + ' ');
        setAmount('');
      } else if (calcHistory) {
        // Change last operator
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
      <form onSubmit={handleAddTransaction} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* COLUMN 1 */}
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
            <div className="h-1 w-48 bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-blue-500 group-focus-within:opacity-100 transition-all duration-500 rounded-full"></div>
            {calcHistory && (
              <p className="text-xs text-gray-500 mt-2 absolute bottom-2 w-full text-center left-0">Press = or Enter to calculate</p>
            )}
          </div>
          
          <div className="bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Select Category</p>
              {categories.length === 0 && <p className="text-xs text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20">Add categories first</p>}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-[300px] overflow-y-auto p-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {categories.map(c => {
                const CatIcon = getIconComponent(c.icon);
                const iconColors = getIconColor(c.icon);
                const isSelected = category === c.name;
                return (
                  <button 
                    key={c.id} 
                    type="button" 
                    onClick={() => setCategory(c.name)} 
                    className={`py-3 px-2 rounded-xl flex flex-col items-center gap-1.5 transition-all active:scale-95 text-center ${isSelected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-750'}`}
                  >
                    <div className={`p-1.5 rounded-lg transition-all ${isSelected ? 'bg-white/20' : iconColors.bg}`}>
                      <CatIcon className={`w-5 h-5 transition-all ${isSelected ? 'text-white drop-shadow-md scale-110' : iconColors.color}`} />
                    </div>
                    <span className={`text-[11px] leading-tight md:text-xs font-medium line-clamp-2 w-full ${isSelected ? 'text-white' : 'text-gray-300'}`}>{c.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 2 */}
        <div className="flex flex-col justify-between bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50">
          <div>
            <div className="space-y-4">
              {selectedCatObj && (
                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Subcategory (Optional)</p>
                  <div className="flex flex-wrap gap-3 p-2 -mx-2 items-center">
                    <button type="button" onClick={() => setSubcategory('')} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 ${subcategory === '' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}>General</button>
                    {selectedCatObj.subcategories?.map(sub => (
                      <button key={sub} type="button" onClick={() => setSubcategory(sub)} className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all active:scale-95 ${subcategory === sub ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}>{sub}</button>
                    ))}
                    <div className="flex items-center bg-gray-800 rounded-full border border-gray-700 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 transition-all overflow-hidden ml-1">
                      <input 
                        type="text" 
                        value={newSubcategoryNames[selectedCatObj.id] || ''} 
                        onChange={(e) => handleSubcategoryChange(selectedCatObj.id, e.target.value)} 
                        onKeyDown={(e) => { 
                          if (e.key === 'Enter') { 
                            e.preventDefault(); 
                            handleAddSubcategory(selectedCatObj.id); 
                          } 
                        }} 
                        placeholder="New sub..." 
                        className="bg-transparent px-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none w-28" 
                      />
                      <button 
                        type="button" 
                        onClick={() => handleAddSubcategory(selectedCatObj.id)} 
                        disabled={!newSubcategoryNames[selectedCatObj.id]?.trim()} 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-2.5 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Tracking Status</p>
                <div className="flex p-1 bg-gray-900 rounded-xl w-full max-w-[200px] border border-gray-700">
                  <button 
                    type="button" 
                    onClick={() => setIsTracked(true)} 
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isTracked ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
                  >
                    Tracked
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setIsTracked(false)} 
                    className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isTracked ? 'bg-gray-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
                  >
                    Untracked
                  </button>
                </div>
              </div>
              
              <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Details</p>
              <div className={`relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-${type === 'Expense' ? 'blue' : 'emerald'}-500 focus-within:ring-1 focus-within:ring-${type === 'Expense' ? 'blue' : 'emerald'}-500 transition-all overflow-hidden`}>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent px-5 py-4 text-base text-gray-100 placeholder-gray-500 focus:outline-none" placeholder={`What was this ${type.toLowerCase()} for?`} />
              </div>
              
              <div className={`relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-${type === 'Expense' ? 'blue' : 'emerald'}-500 focus-within:ring-1 focus-within:ring-${type === 'Expense' ? 'blue' : 'emerald'}-500 transition-all overflow-hidden`}>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-transparent px-5 py-4 text-base text-gray-100 placeholder-gray-500 focus:outline-none [color-scheme:dark]" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={categories.length === 0} className={`hidden lg:flex w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 text-white font-bold py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2 text-xl mt-8`}>
            <PlusCircle className="w-7 h-7" /> Save Expense
          </button>
        </div>

        {/* MOBILE SAVE BUTTON */}
        <button type="submit" disabled={categories.length === 0} className={`w-full lg:hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/20 text-white font-bold py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl mt-4`}>
          <PlusCircle className="w-7 h-7" /> Save Expense
        </button>
      </form>
    </div>
  );
};

export default AddExpenseTab;
