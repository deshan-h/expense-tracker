import React, { useState } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, Plus, Bookmark, Clock } from 'lucide-react';
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
  handleSubcategoryChange,
  templates,
  addTemplate,
  transactions = [],
  formatLKR
}) => {
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const onSubmitForm = async (e) => {
    e.preventDefault();
    if (isSavingTemplate && templateName.trim()) {
      await addTemplate({
        name: templateName,
        amount: amount || '',
        category: category,
        subcategory: subcategory
      });
      setIsSavingTemplate(false);
      setTemplateName('');
    }
    handleAddTransaction(e);
  };
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

  const recentTransactions = transactions.filter(t => t.type === 'Expense').slice(0, 10);

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="w-full relative z-10 mt-2">
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-3 xl:gap-4 relative z-10">
          <form onSubmit={onSubmitForm} className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:col-span-3">
          
          {/* COLUMN 1 */}
          <div className="space-y-6 flex flex-col justify-start">

            {templates && templates.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3 ml-1 flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-purple-400" /> Quick Add
                </p>
                <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                  {templates.map(tpl => (
                    <button 
                      key={tpl.id} 
                      type="button" 
                      onClick={() => {
                        if (tpl.amount) setAmount(tpl.amount);
                        if (tpl.category) setCategory(tpl.category);
                        if (tpl.subcategory) setSubcategory(tpl.subcategory);
                      }}
                      className="whitespace-nowrap px-4 py-2 bg-gray-800/80 border border-gray-700 hover:border-purple-500/50 hover:bg-gray-750 text-gray-200 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-2"
                    >
                      {tpl.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-5 gap-2 sm:gap-3 max-h-[300px] overflow-y-auto p-1 sm:p-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
              {categories.map(c => {
                const CatIcon = getIconComponent(c.icon);
                const iconColors = getIconColor(c.icon);
                const isSelected = category === c.name;
                return (
                    <button 
                      key={c.id} 
                      type="button" 
                      onClick={() => setCategory(c.name)} 
                      className={`py-2 px-1 md:py-3 md:px-2 rounded-xl flex flex-col items-center gap-1 md:gap-1.5 transition-all text-center ${isSelected ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800 text-gray-400 border border-gray-700 md:hover:bg-gray-750'}`}
                    >
                      <div className={`p-1 md:p-1.5 rounded-lg transition-all ${isSelected ? 'bg-white/20' : iconColors.bg}`}>
                        <CatIcon className={`w-4 h-4 md:w-5 md:h-5 transition-all ${isSelected ? 'text-white drop-shadow-md scale-110' : iconColors.color}`} />
                      </div>
                      <span className={`text-[9px] leading-tight md:text-[11px] font-medium line-clamp-2 w-full ${isSelected ? 'text-white' : 'text-gray-300'}`}>{c.name}</span>
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
                  <div className="flex flex-wrap gap-2 md:gap-3 p-2 -mx-2 items-center">
                    <button type="button" onClick={() => setSubcategory('')} className={`px-4 py-1.5 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all ${subcategory === '' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800/80 text-gray-400 border border-gray-700/80 md:hover:bg-gray-700 md:hover:text-white'}`}>General</button>
                    {selectedCatObj.subcategories?.map(sub => (
                      <button key={sub} type="button" onClick={() => setSubcategory(sub)} className={`px-4 py-1.5 md:px-6 md:py-2.5 rounded-full text-xs md:text-sm font-medium transition-all ${subcategory === sub ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700 md:hover:bg-gray-700 md:hover:text-white'}`}>{sub}</button>
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
                        className="bg-transparent px-3 py-1.5 md:px-4 md:py-2.5 text-xs md:text-sm text-gray-100 placeholder-gray-500 focus:outline-none w-20 md:w-28" 
                      />
                      <button 
                        type="button" 
                        onClick={() => handleAddSubcategory(selectedCatObj.id)} 
                        disabled={!newSubcategoryNames[selectedCatObj.id]?.trim()} 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white p-1.5 md:p-2.5 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
                      >
                        <Plus className="w-3 h-3 md:w-4 md:h-4" />
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

              {/* SAVE AS TEMPLATE */}
              <div className="mt-6 bg-gray-900/40 p-5 rounded-2xl border border-gray-700/50 transition-all">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isSavingTemplate} 
                    onChange={(e) => setIsSavingTemplate(e.target.checked)} 
                    className="w-5 h-5 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50 focus:ring-offset-gray-900 cursor-pointer" 
                  />
                  <span className="text-sm font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                    <Bookmark className="w-4 h-4 text-purple-400" /> Save as Template
                  </span>
                </label>
                {isSavingTemplate && (
                  <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <input 
                      type="text" 
                      value={templateName} 
                      onChange={(e) => setTemplateName(e.target.value)} 
                      required={isSavingTemplate} 
                      placeholder="Template Name (e.g. Daily Coffee)" 
                      className="w-full bg-gray-800/80 px-4 py-3 text-sm text-gray-100 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                    />
                  </div>
                )}
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

      {/* COLUMN 3: Recent Activity */}
      <div className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-5 rounded-[1rem] border border-gray-800 hover:border-gray-700/80 shadow-xl flex flex-col h-full relative overflow-hidden group transition-all duration-500">
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] group-hover:bg-purple-500/20 transition-all duration-700"></div>

        <div className="flex items-center justify-between mb-4 flex-shrink-0 relative z-10">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2 text-gray-300">
            <div className="p-1.5 bg-purple-500/10 rounded-lg">
              <Clock className="w-3.5 h-3.5 text-purple-400" />
            </div>
            Recent Added
          </h3>
        </div>

        <div className="relative overflow-y-auto hide-scrollbar flex-1 pr-1 z-10 pt-1">
          <div className="absolute left-[56px] top-3 bottom-3 w-px bg-gray-700/50"></div>
          
          <div className="space-y-3">
            {recentTransactions.length === 0 ? (
              <p className="text-gray-500 italic text-[11px] pl-[72px]">No recent transactions.</p>
            ) : (
              recentTransactions.map((t, i) => {
                const isIncome = t.type === 'Income';
                const d = new Date(t.date);
                const isToday = d.toDateString() === new Date().toDateString();
                
                let mainText, subText;
                if (isToday) {
                  if (t.time) {
                    const [hours, minutes] = t.time.split(':');
                    const h = parseInt(hours, 10);
                    mainText = `${h % 12 || 12}:${minutes}`;
                    subText = h >= 12 ? 'PM' : 'AM';
                  } else {
                    const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                    const parts = timeStr.split(' ');
                    mainText = parts[0];
                    subText = parts[1] || '';
                  }
                } else {
                  mainText = d.getDate().toString();
                  subText = d.toLocaleDateString(undefined, { month: 'short' }).toUpperCase();
                }
                
                return (
                  <div key={t.id} className="relative flex items-start">
                    {/* Left side: Date / Time */}
                    <div className="w-12 flex-shrink-0 text-right pt-0.5 pr-2">
                      <p className="text-[11px] font-black text-gray-300 leading-tight">{mainText}</p>
                      <p className="text-[8px] font-bold text-gray-500 tracking-wider mt-0.5">{subText}</p>
                    </div>

                    {/* Timeline Dot */}
                    <div className="relative w-4 h-full flex flex-col items-center justify-start pt-1.5 flex-shrink-0">
                      <div className={`w-2 h-2 rounded-full border border-gray-900 z-10 relative ${isIncome ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]'}`}></div>
                    </div>
                    
                    {/* Activity Content (No Box) */}
                    <div className="flex-1 ml-3 flex items-start justify-between pb-1 group cursor-default">
                      <div className="flex items-start gap-2.5">
                        <div className={`mt-0.5 ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {isIncome ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-200 text-[11px] md:text-xs flex items-center gap-2 group-hover:text-white transition-colors">
                            <span className="line-clamp-1 max-w-[130px]">{t.subcategory || t.category}</span>
                            {isToday && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/30 text-blue-400 text-[7px] font-black tracking-widest uppercase shadow-sm">Today</span>
                            )}
                          </h4>
                          <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{t.category}</p>
                        </div>
                      </div>
                      <div className={`font-black whitespace-nowrap text-[11px] md:text-xs pt-0.5 ${isIncome ? 'text-emerald-400' : 'text-gray-300'}`}>
                        {isIncome ? '+' : '-'}Rs. {formatLKR(t.amount)}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

    </div>
        </div>
      </div>
    </div>
  );
};

export default AddExpenseTab;
