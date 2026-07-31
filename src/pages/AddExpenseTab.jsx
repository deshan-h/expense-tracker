import React from 'react';
import { PlusCircle, TrendingUp, Plus } from 'lucide-react';
import { getIconComponent, getIconColor } from '../utils/icons';
import DateTimePicker from '../components/ui/DateTimePicker';

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
  time,
  setTime,
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
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="w-full relative z-10 mt-2">
        
        <form onSubmit={handleAddTransaction} className="grid grid-cols-1 lg:grid-cols-2 gap-10 relative z-10">
          
          {/* COLUMN 1 */}
          <div className="space-y-8 flex flex-col justify-start">

            <div className="text-center bg-gray-900/60 backdrop-blur-md p-8 rounded-3xl border border-gray-700/50 relative shadow-inner">
              <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">
                {calcHistory ? <span className="text-blue-400 font-black tracking-widest drop-shadow-md">{calcHistory}</span> : 'Amount'}
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
            <div className="h-1 w-48 bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-blue-500 group-focus-within:opacity-100 transition-all duration-700 rounded-full"></div>
            {calcHistory && (
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-2 absolute bottom-3 w-full text-center left-0 font-bold">Press = or Enter to calculate</p>
            )}
          </div>
          
          <div className="bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-gray-700/50 shadow-inner">
            <div className="flex items-center justify-between mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Select Category</p>
              {categories.length === 0 && <p className="text-[10px] font-bold text-rose-400 bg-rose-400/10 px-3 py-1.5 rounded-full border border-rose-400/20 uppercase tracking-wider shadow-inner">Add categories first</p>}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[300px] overflow-y-auto p-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
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
        <div className="flex flex-col justify-between bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-gray-700/50 shadow-inner">
          <div>
            <div className="space-y-6">
              {selectedCatObj && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ml-1">Subcategory (Optional)</p>
                  <div className="flex flex-wrap gap-3 p-2 -mx-2 items-center">
                    <button type="button" onClick={() => setSubcategory('')} className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${subcategory === '' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800/80 text-gray-400 border border-gray-700/80 hover:bg-gray-700 hover:text-white'}`}>General</button>
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


              
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Details</p>
              <div className={`relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden shadow-inner`}>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent px-5 py-4 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder={`What was this ${type.toLowerCase()} for?`} />
              </div>
              
              <div className="mt-4">
                <DateTimePicker date={date} setDate={setDate} time={time} setTime={setTime} />
              </div>
            </div>
          </div>

          <button type="submit" disabled={categories.length === 0} className={`hidden lg:flex w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:bg-right bg-[length:200%_auto] text-white font-black tracking-widest uppercase py-5 rounded-2xl transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-3 text-lg mt-8`}>
            <PlusCircle className="w-6 h-6" /> SAVE EXPENSE
          </button>
        </div>

        {/* MOBILE SAVE BUTTON */}
        <button type="submit" disabled={categories.length === 0} className={`w-full lg:hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:bg-right bg-[length:200%_auto] text-white font-black tracking-widest uppercase py-5 rounded-2xl transition-all shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg mt-4`}>
          <PlusCircle className="w-6 h-6" /> SAVE EXPENSE
        </button>
      </form>
    </div>
      </div>
    </div>
  );
};

export default AddExpenseTab;
