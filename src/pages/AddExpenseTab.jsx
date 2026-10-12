import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, Plus, Bookmark, Clock, ChevronLeft, Trash2, ChevronDown, RotateCw, Calendar, AlertCircle } from 'lucide-react';
import { getIconComponent, getIconColor } from '../utils/icons';
import DateTimePicker from '../components/ui/DateTimePicker';

const AddExpenseTab = ({ 
  handleAddTransaction, 
  handleDeleteTransaction, 
  handleAddIncome,
  handleSyncPOS,
  isSyncing,
  lastSyncTimeStr,
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
  updateTemplate,
  transactions = [],
  formatLKR
}) => {
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [templateTrackCycle, setTemplateTrackCycle] = useState(false);
  const [templateCycleDays, setTemplateCycleDays] = useState('30');
  const [forceCatClosed, setForceCatClosed] = useState(false);
  const [isTemplateSelected, setIsTemplateSelected] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  useEffect(() => {
    setCategory('');
    setSubcategory('');
    setAmount('');
    setDescription('');
    setCalcHistory('');
    setForceCatClosed(false);
    setIsTemplateSelected(false);
    setSelectedTemplateId(null);
  }, [type, setCategory, setSubcategory, setAmount, setDescription, setCalcHistory]);

  const onSubmitForm = async (e) => {
    e.preventDefault();
    let overrideDesc = null;
    if (isSavingTemplate && templateName.trim()) {
      await addTemplate({
        name: templateName,
        amount: amount || '',
        category: type === 'Expense' ? category : 'Income',
        subcategory: type === 'Expense' ? subcategory : 'Other',
        description: templateDesc || description || '',
        trackCycle: templateTrackCycle,
        cycleDays: templateTrackCycle ? (Number(templateCycleDays) || 30) : null,
        lastPaidDate: templateTrackCycle ? (date || new Date().toLocaleDateString('en-CA')) : null
      });
      if (!description && templateDesc) {
        overrideDesc = templateDesc;
      }
      setIsSavingTemplate(false);
      setTemplateName('');
      setTemplateDesc('');
      setTemplateTrackCycle(false);
      setTemplateCycleDays('30');
    }
    
    // If expense was logged using a tracked template, update that template's lastPaidDate
    if (selectedTemplateId && updateTemplate) {
      const activeTpl = templates?.find(t => t.id === selectedTemplateId);
      if (activeTpl?.trackCycle) {
        await updateTemplate(selectedTemplateId, {
          lastPaidDate: date || new Date().toLocaleDateString('en-CA')
        });
      }
    }

    if (type === 'Income') {
      if (handleAddIncome) {
        await handleAddIncome(e, category || 'Other', overrideDesc);
      }
    } else {
      handleAddTransaction(e, overrideDesc);
    }
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

  // State to track collapsed past days (Yesterday & Day Before Yesterday collapsed by default)
  // State to track collapsed past days (Yesterday & Day Before Yesterday collapsed by default)
  const [collapsedDays, setCollapsedDays] = useState({
    yesterday: true,
    dayBefore: true
  });

  const toggleDayCollapse = (dayKey) => {
    setCollapsedDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }));
  };

  // Accurate day calculations using local midnight Dates
  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);

  const yesterdayObj = new Date(todayObj);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);

  const dayBeforeObj = new Date(todayObj);
  dayBeforeObj.setDate(dayBeforeObj.getDate() - 2);

  const todayStr = todayObj.toDateString();
  const yesterdayStr = yesterdayObj.toDateString();
  const dayBeforeStr = dayBeforeObj.toDateString();

  const parseTxDate = (dateVal) => {
    if (!dateVal) return null;
    // If it's a string like "YYYY-MM-DD" without time, append T00:00:00 to parse in local time
    if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
      const [y, m, d] = dateVal.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? null : d;
  };

  const todayTxs = transactions.filter(t => {
    if (t.type !== 'Expense' && t.type !== 'Income') return false;
    const d = parseTxDate(t.date);
    return d && d.toDateString() === todayStr;
  });

  const yesterdayTxs = transactions.filter(t => {
    if (t.type !== 'Expense' && t.type !== 'Income') return false;
    const d = parseTxDate(t.date);
    return d && d.toDateString() === yesterdayStr;
  });

  const dayBeforeTxs = transactions.filter(t => {
    if (t.type !== 'Expense' && t.type !== 'Income') return false;
    const d = parseTxDate(t.date);
    return d && d.toDateString() === dayBeforeStr;
  });

  const daysGroups = [
    {
      key: 'today',
      title: 'Today',
      dateObj: todayObj,
      txs: todayTxs,
      canCollapse: false,
      isCollapsed: false
    },
    {
      key: 'yesterday',
      title: 'Yesterday',
      dateObj: yesterdayObj,
      txs: yesterdayTxs,
      canCollapse: true,
      isCollapsed: collapsedDays.yesterday
    },
    {
      key: 'dayBefore',
      title: dayBeforeObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      subtitle: 'Day Before Yesterday',
      dateObj: dayBeforeObj,
      txs: dayBeforeTxs,
      canCollapse: true,
      isCollapsed: collapsedDays.dayBefore
    }
  ];

  const all3DaysTxs = [...todayTxs, ...yesterdayTxs, ...dayBeforeTxs];
  const isIncome = type === 'Income';

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="w-full relative z-10 mt-2">
        {/* Templates Section (Top full-width row) */}
        {!isIncome && templates && templates.length > 0 && (
          <div className="mb-6 bg-gray-900/60 backdrop-blur-md p-4 md:p-5 rounded-3xl border border-gray-700/50 shadow-inner relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-purple-500/10 rounded-xl border border-purple-500/20">
                  <Bookmark className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="text-xs font-bold text-gray-200 tracking-wider uppercase">Templates</h3>
                <span className="text-[10px] font-semibold text-gray-400 bg-gray-800/80 px-2 py-0.5 rounded-full border border-gray-700/50">
                  {templates.length}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5 max-h-[160px] overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
              {templates.map(tpl => {
                const isSelected = selectedTemplateId === tpl.id;
                
                // Calculate cycle stats if trackCycle is enabled
                let cycleInfo = null;
                if (tpl.trackCycle && tpl.cycleDays && tpl.lastPaidDate) {
                  const lastPaid = new Date(tpl.lastPaidDate);
                  const today = new Date();
                  const diffTime = today.setHours(0,0,0,0) - lastPaid.setHours(0,0,0,0);
                  const daysPassed = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
                  const cycle = Number(tpl.cycleDays);
                  const daysLeft = cycle - daysPassed;
                  const progressPct = Math.min(100, Math.max(0, Math.round((daysPassed / cycle) * 100)));

                  let statusColor = 'bg-emerald-500';
                  let textColor = 'text-emerald-400';
                  let statusText = `${daysLeft}d left`;

                  if (daysLeft < 0) {
                    statusColor = 'bg-rose-500 animate-pulse';
                    textColor = 'text-rose-400 font-extrabold';
                    statusText = `Overdue ${Math.abs(daysLeft)}d`;
                  } else if (daysLeft === 0) {
                    statusColor = 'bg-rose-500 animate-pulse';
                    textColor = 'text-rose-400 font-extrabold';
                    statusText = 'Due Today';
                  } else if (daysLeft <= 3) {
                    statusColor = 'bg-amber-500';
                    textColor = 'text-amber-400 font-bold';
                    statusText = `${daysLeft}d left`;
                  }

                  cycleInfo = {
                    daysPassed,
                    cycle,
                    daysLeft,
                    progressPct,
                    statusColor,
                    textColor,
                    statusText
                  };
                }

                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => {
                      if (tpl.amount) setAmount(tpl.amount);
                      if (tpl.category) setCategory(tpl.category);
                      if (tpl.subcategory) setSubcategory(tpl.subcategory);
                      if (tpl.description || tpl.desc) {
                        setDescription(tpl.description || tpl.desc);
                      }
                      setForceCatClosed(true);
                      setIsTemplateSelected(true);
                      setSelectedTemplateId(tpl.id);
                    }}
                    className={`bg-gray-800/60 hover:bg-gray-700/80 border rounded-2xl p-2.5 flex flex-col justify-between transition-all text-left group/btn shadow-inner active:scale-95 cursor-pointer relative overflow-hidden ${isSelected ? 'border-purple-500 bg-purple-500/10 shadow-purple-500/20' : 'border-gray-700/50 hover:border-gray-600'}`}
                  >
                    <div className="flex items-center gap-2.5 w-full">
                      <div className={`p-2 rounded-xl border shrink-0 transition-colors ${isSelected ? 'bg-purple-500 text-white border-purple-400' : 'bg-purple-500/10 border-purple-500/20 text-purple-400 group-hover/btn:bg-purple-500/20'}`}>
                        <Bookmark className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-200 truncate group-hover/btn:text-white transition-colors">{tpl.name}</p>
                        {tpl.amount && (
                          <p className="text-[10px] font-bold text-purple-300/90 mt-0.5">Rs. {formatLKR(tpl.amount)}</p>
                        )}
                      </div>
                    </div>

                    {/* Cycle Progress Bar */}
                    {cycleInfo && (
                      <div className="w-full mt-2 pt-1.5 border-t border-gray-700/40">
                        <div className="flex items-center justify-between text-[9px] mb-1">
                          <span className="text-gray-400 flex items-center gap-1">
                            <RotateCw className="w-2.5 h-2.5 text-gray-500" />
                            {cycleInfo.cycle}d cycle
                          </span>
                          <span className={`text-[9px] ${cycleInfo.textColor}`}>
                            {cycleInfo.statusText}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-700/60 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${cycleInfo.statusColor}`}
                            style={{ width: `${cycleInfo.progressPct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8 relative z-10">
          
          <form onSubmit={onSubmitForm} className="grid grid-cols-1 lg:grid-cols-2 gap-6 xl:col-span-2">
            
            {/* COLUMN 1 */}
            <div className="space-y-6 flex flex-col h-full justify-start">
              
              {/* Type Toggle */}
              <div className="flex bg-gray-900/60 backdrop-blur-md rounded-full p-1 border border-gray-700/50 shadow-inner w-full">
                <button type="button" onClick={() => setType('Expense')} className={`flex-1 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all ${!isIncome ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>Expense</button>
                <button type="button" onClick={() => setType('Income')} className={`flex-1 py-3 rounded-full text-xs font-black tracking-widest uppercase transition-all ${isIncome ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>Income</button>
              </div>

              {/* POS Sync (Only for Income) */}
              {isIncome && (
                <div className="bg-gray-900/60 backdrop-blur-md p-5 rounded-3xl border border-gray-700/50 shadow-inner flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-blue-500/10 p-3 rounded-2xl border border-blue-500/20 shadow-inner">
                      <TrendingUp className="w-6 h-6 text-blue-400 drop-shadow-md" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-100 flex items-center gap-2 tracking-wide uppercase">
                        Business POS Sync
                      </h3>
                      <p className="text-gray-400 text-[10px] mt-0.5">
                        {lastSyncTimeStr 
                          ? <span className="text-emerald-400 font-medium">Last: {new Date(lastSyncTimeStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          : 'Pull latest POS data'}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={handleSyncPOS}
                    disabled={isSyncing}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black tracking-widest text-xs uppercase text-white transition-all shadow-[0_0_15px_-5px_rgba(37,99,235,0.4)] ${isSyncing ? 'bg-gray-800/80 cursor-not-allowed text-gray-500 border border-gray-700' : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right active:scale-95'}`}
                  >
                    {isSyncing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                        SYNCING...
                      </>
                    ) : (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        SYNC POS DATA
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Standalone Categories Section */}
              {(() => {
                const currentCategories = categories.filter(c => isIncome ? c.type === 'Income' : (!c.type || c.type === 'Expense'));
                
                // If a category is selected (and not from a template), show subcategories view
                if (category && !forceCatClosed && !isTemplateSelected && !isIncome) {
                    return (
                      <div className="bg-gray-900/60 backdrop-blur-md p-5 rounded-3xl border border-gray-700/50 shadow-inner flex flex-col transition-all duration-300 flex-1 animate-in slide-in-from-right-4">
                        {/* Selected Category Header */}
                        <div 
                          className="flex items-center justify-between mb-5 border-b border-gray-700/50 pb-4 cursor-pointer group"
                          onClick={() => {
                            setCategory(''); 
                            setSubcategory(''); 
                            setForceCatClosed(false);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            {(() => {
                              const c = currentCategories.find(cat => cat.name === category);
                              if (!c) return null;
                              const CatIcon = getIconComponent(c.icon);
                              const iconColors = getIconColor(c.icon);
                              return (
                                <>
                                  <div className={`p-2 rounded-xl ${iconColors.bg} shrink-0`}>
                                    <CatIcon className={`w-4 h-4 md:w-5 md:h-5 ${iconColors.color}`} />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-sm font-extrabold text-gray-100">{c.name}</span>
                                    {subcategory && <span className="text-gray-400 font-medium">/ {subcategory}</span>}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <button 
                              type="button" 
                              onClick={(e) => { 
                                e.stopPropagation(); 
                                setCategory(''); 
                                setSubcategory(''); 
                                setForceCatClosed(false);
                              }} 
                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700 transition-all z-10 hover:shadow-md cursor-pointer"
                            >
                              <ChevronLeft className="w-3 h-3" /> Back
                            </button>
                          </div>
                        </div>

                        {/* Subcategories List */}
                        {selectedCatObj && (() => {
                          const CatIcon = getIconComponent(selectedCatObj.icon);
                          return (
                          <div className="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Select Subcategory</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 animate-in fade-in duration-300">
                              <button type="button" onClick={() => setSubcategory('')} className={`rounded-xl py-2 px-3 flex items-center justify-start gap-2 transition-all text-left shadow-inner border group/subbtn cursor-pointer ${subcategory === '' ? 'bg-blue-600/80 text-white border-blue-500 shadow-inner' : 'bg-gray-800/60 hover:bg-gray-700 border-gray-700/50 text-gray-300 hover:text-gray-200 hover:border-gray-600'}`}>
                                <CatIcon className={`w-3.5 h-3.5 shrink-0 transition-colors ${subcategory === '' ? 'text-white/80' : 'text-gray-500 group-hover/subbtn:text-gray-400'}`} />
                                <span className="text-[10px] font-bold line-clamp-1 w-full leading-tight">General</span>
                              </button>
                              {selectedCatObj.subcategories?.map(sub => (
                                <button key={sub} type="button" onClick={() => setSubcategory(sub)} className={`rounded-xl py-2 px-3 flex items-center justify-start gap-2 transition-all text-left shadow-inner border group/subbtn cursor-pointer ${subcategory === sub ? 'bg-emerald-500/80 text-white border-emerald-400 shadow-inner' : 'bg-gray-800/60 hover:bg-gray-700 border-gray-700/50 text-gray-300 hover:text-gray-200 hover:border-gray-600'}`}>
                                  <CatIcon className={`w-3.5 h-3.5 shrink-0 transition-colors ${subcategory === sub ? 'text-white/80' : 'text-gray-500 group-hover/subbtn:text-gray-400'}`} />
                                  <span className="text-[10px] font-bold line-clamp-1 w-full leading-tight">{sub}</span>
                                </button>
                              ))}
                              
                              {/* Add New Subcategory */}
                              <div className="flex items-center bg-gray-800/40 rounded-xl border border-gray-700/50 focus-within:bg-gray-700/50 focus-within:border-gray-500 transition-all overflow-hidden col-span-1 sm:col-span-1 shadow-inner">
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
                                  placeholder="Add new..." 
                                  className="bg-transparent px-3 py-2 text-[10px] text-gray-100 placeholder-gray-500 focus:outline-none flex-1 min-w-0" 
                                />
                                <button 
                                  type="button" 
                                  onClick={() => handleAddSubcategory(selectedCatObj.id)} 
                                  disabled={!newSubcategoryNames[selectedCatObj.id]?.trim()} 
                                  className="text-gray-400 hover:text-emerald-400 px-3 py-2 transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer bg-black/20 shrink-0 border-l border-gray-700/50"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                          );
                        })()}
                      </div>
                    );
                }

                // Standalone Categories Grid View
                return (
                  <div className="bg-gray-900/60 backdrop-blur-md p-5 rounded-3xl border border-gray-700/50 shadow-inner flex flex-col transition-all duration-300 flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1">
                        Categories
                      </p>
                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-800/80 px-2 py-0.5 rounded-full border border-gray-700/50">
                        {currentCategories.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto content-start pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700/50 [&::-webkit-scrollbar-thumb]:rounded-full">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 animate-in fade-in duration-300">
                        {currentCategories.length === 0 && <p className="text-[9px] font-bold text-rose-400 col-span-full">Empty</p>}
                        {currentCategories.map((c) => {
                          const CatIcon = getIconComponent(c.icon);
                          const iconColors = getIconColor(c.icon);
                          const isSelected = c.name === category;
                          return (
                            <button 
                              key={c.id} 
                              type="button" 
                              onClick={() => { setCategory(c.name); setSubcategory(''); setIsTemplateSelected(false); setForceCatClosed(false); }} 
                              className={`py-2 px-1 md:py-2.5 md:px-2 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all text-center border shadow-inner group/btn overflow-hidden cursor-pointer ${isSelected ? 'bg-blue-600/30 border-blue-500 shadow-blue-500/20' : 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-700/50'}`}
                            >
                              <div className={`p-1.5 transition-all rounded-lg ${iconColors.bg}`}>
                                <CatIcon className={`w-4 h-4 md:w-5 md:h-5 transition-all ${iconColors.color}`} />
                              </div>
                              <span className={`text-[9px] leading-tight md:text-[10px] font-bold w-full break-words whitespace-normal ${isSelected ? 'text-blue-300 font-extrabold' : 'text-gray-300 group-hover/btn:text-gray-200'}`}>{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                );
              })()}
            </div>
    {/* COLUMN 2 */}
            <div className="flex flex-col justify-start bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-gray-700/50 shadow-inner h-full">
              <div className="flex flex-col h-full gap-4">
                
                {/* Selected Category Box (above Amount) */}
                <div className="bg-gray-800/80 backdrop-blur-md rounded-2xl p-3 border border-gray-700 flex items-center justify-between shadow-inner min-h-[52px]">
                  <div className="flex items-center gap-3">
                    {(() => {
                      if (!category) {
                        return (
                          <>
                            <div className="p-2 rounded-xl bg-gray-700/50 shrink-0">
                              <div className="w-4 h-4 rounded-full border-2 border-gray-500/30 border-dashed" />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-extrabold text-gray-500 italic">No category selected</span>
                            </div>
                          </>
                        );
                      }

                      const c = categories.find(cat => cat.name === category);
                      if (!c) return null;
                      const CatIcon = getIconComponent(c.icon);
                      const iconColors = getIconColor(c.icon);
                      return (
                        <>
                          <div className={`p-2 rounded-xl ${iconColors.bg} shrink-0`}>
                            <CatIcon className={`w-4 h-4 ${iconColors.color}`} />
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-extrabold text-gray-100">{c.name}</span>
                            {subcategory && <span className="text-gray-400 font-medium">/ {subcategory}</span>}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                {/* Amount Field (Smaller & Colored) */}
                <div className={`bg-gray-900/80 backdrop-blur-md px-5 py-4 rounded-3xl border shadow-inner transition-all ${isIncome ? 'border-emerald-500/30' : 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]'}`}>
                  {calcHistory && (
                    <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.2em] ml-1">
                      <span className="text-blue-400 font-black tracking-widest drop-shadow-md">{calcHistory}</span>
                    </p>
                  )}
                  <div className={`flex items-center text-3xl md:text-4xl font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <span className="text-gray-500 mr-3 text-2xl font-bold">Rs.</span>
                    <input 
                      type="text" 
                      inputMode="decimal"
                      required={!calcHistory} 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ''))} 
                      onKeyDown={handleAmountKeyDown}
                      className="bg-transparent border-none outline-none text-left w-full focus:ring-0 placeholder-gray-700 font-black" 
                      placeholder="0.00" 
                    />
                  </div>
                  {calcHistory && (
                    <p className="text-[10px] uppercase tracking-widest text-gray-500 mt-2 font-bold">Press = or Enter to calculate</p>
                  )}
                </div>

                {/* Date & Time */}
                <DateTimePicker 
                  date={date} 
                  setDate={setDate} 
                  time={time} 
                  setTime={setTime} 
                />

                {/* Details */}
                <div className={`relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden shadow-inner h-[48px] flex items-center`}>
                  <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent px-4 py-2 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder={`What was this ${type.toLowerCase()} for?`} />
                </div>
                


                {/* SAVE AS TEMPLATE */}
                <div className="bg-gray-900/40 rounded-2xl border border-gray-700/50 transition-all h-[48px] flex items-center px-4">
                  <div className="flex items-center justify-between cursor-pointer w-full" onClick={() => {
                      setIsSavingTemplate(!isSavingTemplate);
                      if (!isSavingTemplate && !templateName.trim()) {
                        setTemplateName(subcategory || category || '');
                      }
                  }}>
                    <div className="text-xs font-bold text-gray-300 uppercase tracking-widest flex items-center gap-2">
                      <Bookmark className="w-4 h-4 text-purple-400" /> Save as Template
                    </div>
                    <div className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out shadow-inner ${isSavingTemplate ? 'bg-blue-600' : 'bg-gray-700'}`}>
                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${isSavingTemplate ? 'translate-x-5' : 'translate-x-0'}`}></div>
                    </div>
                  </div>
                </div>
                {isSavingTemplate && (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 bg-gray-900/40 p-3.5 rounded-2xl border border-gray-700/50">
                      <input 
                        type="text" 
                        value={templateName} 
                        onChange={(e) => setTemplateName(e.target.value)} 
                        required={isSavingTemplate} 
                        placeholder="Template Name (e.g. Wifi Router Bill)" 
                        className="w-full bg-gray-800/80 px-4 py-2.5 text-sm text-gray-100 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500" 
                      />
                      <input 
                        type="text" 
                        value={templateDesc} 
                        onChange={(e) => setTemplateDesc(e.target.value)} 
                        placeholder="Template Description (Optional)" 
                        className="w-full bg-gray-800/80 px-4 py-2.5 text-sm text-gray-100 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500" 
                      />

                      {/* Renewal / Cycle Tracking Toggle */}
                      <div className="pt-2 border-t border-gray-700/50 flex flex-col gap-2.5">
                        <div 
                          className="flex items-center justify-between cursor-pointer py-1"
                          onClick={() => setTemplateTrackCycle(!templateTrackCycle)}
                        >
                          <div className="flex items-center gap-2">
                            <RotateCw className={`w-3.5 h-3.5 ${templateTrackCycle ? 'text-emerald-400 animate-spin-slow' : 'text-gray-400'}`} />
                            <span className="text-xs font-bold text-gray-200">Track Renewal / Cycle</span>
                          </div>
                          <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shadow-inner ${templateTrackCycle ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                            <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${templateTrackCycle ? 'translate-x-4' : 'translate-x-0'}`}></div>
                          </div>
                        </div>

                        {templateTrackCycle && (
                          <div className="flex flex-col gap-2 bg-gray-800/60 p-2.5 rounded-xl border border-gray-700/60 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cycle Period (Days)</span>
                              <div className="flex gap-1.5">
                                {['7', '14', '30', '60'].map((d) => (
                                  <button
                                    key={d}
                                    type="button"
                                    onClick={() => setTemplateCycleDays(d)}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md transition-all ${templateCycleDays === d ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-700/60 text-gray-300 hover:bg-gray-700'}`}
                                  >
                                    {d}d
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number" 
                                min="1"
                                max="365"
                                value={templateCycleDays} 
                                onChange={(e) => setTemplateCycleDays(e.target.value)} 
                                placeholder="30" 
                                className="w-full bg-gray-900/90 px-3 py-1.5 text-xs text-gray-100 font-bold rounded-lg border border-gray-700 focus:outline-none focus:border-emerald-500" 
                              />
                              <span className="text-xs font-bold text-gray-400 shrink-0">Days</span>
                            </div>
                            <p className="text-[9px] text-gray-400 italic">
                              Progress bar will track renewal every {templateCycleDays || 30} days from the payment date.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Actions */}
                <div className="mt-auto flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { 
                      setAmount(''); 
                      setCategory(''); 
                      setSubcategory(''); 
                      setDescription(''); 
                      setCalcHistory(''); 
                      setTemplateDesc(''); 
                      setTemplateTrackCycle(false);
                      setTemplateCycleDays('30');
                      setDate(new Date().toLocaleDateString('en-CA'));
                      setTime(new Date().toTimeString().slice(0, 5));
                      setForceCatClosed(false);
                      setIsTemplateSelected(false);
                      setSelectedTemplateId(null);
                    }} 
                    className="bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-rose-400 border border-gray-700 font-black tracking-widest uppercase py-5 px-6 rounded-2xl transition-all shadow-md active:scale-[0.98] flex items-center justify-center shrink-0"
                    title="Clear Fields"
                  >
                    CLEAR
                  </button>
                  <button type="submit" disabled={!isIncome && categories.length === 0} className={`flex-1 bg-gradient-to-r ${isIncome ? 'from-emerald-500 via-teal-500 to-emerald-600' : 'from-blue-600 via-indigo-600 to-purple-600'} hover:bg-right bg-[length:200%_auto] text-white font-black tracking-widest uppercase py-5 rounded-2xl transition-all shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg`}>
                    <PlusCircle className="w-6 h-6" /> SAVE {type.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>

          </form>

          {/* COLUMN 3: Recent Activity (Past 3 Days) */}
          <div className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl flex flex-col h-full relative overflow-hidden group transition-all duration-500">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] group-hover:bg-purple-500/20 transition-all duration-700"></div>

            <div className="flex items-center justify-between mb-5 flex-shrink-0 relative z-10">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2 text-gray-300">
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                </div>
                Recent Activity
              </h3>
              <div className="flex items-center gap-2">
                {(() => {
                  const totalExpense = all3DaysTxs
                    .filter(t => t.type === 'Expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                  const totalIncome = all3DaysTxs
                    .filter(t => t.type === 'Income')
                    .reduce((sum, t) => sum + t.amount, 0);
                  
                  return (
                    <>
                      {totalExpense > 0 && (
                        <div className="text-[10px] md:text-xs font-black text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 shadow-inner flex items-center gap-1" title="Past 3 Days Expense">
                          <TrendingDown className="w-3 h-3" />
                          Rs. {totalExpense.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                      )}
                      {totalIncome > 0 && (
                        <div className="text-[10px] md:text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20 shadow-inner flex items-center gap-1" title="Past 3 Days Income">
                          <TrendingUp className="w-3 h-3" />
                          Rs. {totalIncome.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="relative overflow-y-auto hide-scrollbar flex-1 pr-1 z-10 pt-1 space-y-4">
              {daysGroups.map((group) => {
                const dayExpense = group.txs.filter(t => t.type === 'Expense').reduce((s, t) => s + t.amount, 0);
                const dayIncome = group.txs.filter(t => t.type === 'Income').reduce((s, t) => s + t.amount, 0);

                return (
                  <div key={group.key} className="bg-gray-900/60 rounded-2xl border border-gray-800/80 overflow-hidden shadow-inner transition-all">
                    {/* Header */}
                    <div 
                      onClick={() => group.canCollapse && toggleDayCollapse(group.key)}
                      className={`px-3.5 py-2.5 flex items-center justify-between transition-colors ${group.canCollapse ? 'cursor-pointer hover:bg-gray-800/50' : 'bg-gray-800/40 border-b border-gray-800/60'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-200">
                          {group.title}
                        </span>
                        {group.subtitle && (
                          <span className="text-[9px] text-gray-500 font-medium hidden sm:inline">
                            ({group.subtitle})
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-gray-500 bg-gray-800 px-1.5 py-0.2 rounded-md border border-gray-700/50">
                          {group.txs.length}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="text-[10px] font-bold text-gray-400 flex items-center gap-1.5">
                          {dayExpense > 0 && <span className="text-rose-400/90">-Rs. {formatLKR(dayExpense)}</span>}
                          {dayIncome > 0 && <span className="text-emerald-400/90">+Rs. {formatLKR(dayIncome)}</span>}
                        </div>
                        {group.canCollapse && (
                          <div className="text-gray-400 p-0.5">
                            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${group.isCollapsed ? '' : 'rotate-180'}`} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Transactions Body */}
                    {!group.isCollapsed && (
                      <div className="p-3 pt-2 relative">
                        {group.txs.length === 0 ? (
                          <p className="text-gray-500 italic text-[10px] py-1 pl-2">No transactions recorded.</p>
                        ) : (
                          <div className="space-y-3 relative">
                            <div className="absolute left-[44px] top-2 bottom-2 w-px bg-gray-800"></div>
                            {group.txs.map((t) => {
                              const isTxIncome = t.type === 'Income';
                              const d = new Date(t.date);
                              
                              let mainText = '', subText = '';
                              if (t.time) {
                                const [hours, minutes] = t.time.split(':');
                                const h = parseInt(hours, 10);
                                mainText = `${h % 12 || 12}:${minutes}`;
                                subText = h >= 12 ? 'PM' : 'AM';
                              } else {
                                const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
                                const parts = timeStr.split(' ');
                                mainText = parts[0] || '';
                                subText = parts[1] || '';
                              }

                              return (
                                <div key={t.id} className="relative flex items-start">
                                  {/* Time */}
                                  <div className="w-10 flex-shrink-0 text-right pt-0.5 pr-2">
                                    <p className="text-[10px] font-black text-gray-300 leading-tight">{mainText}</p>
                                    <p className="text-[8px] font-bold text-gray-500 tracking-wider mt-0.5">{subText}</p>
                                  </div>

                                  {/* Dot */}
                                  <div className="relative w-3 h-full flex flex-col items-center justify-start pt-1.5 flex-shrink-0">
                                    <div className={`w-2 h-2 rounded-full border border-gray-900 z-10 relative ${isTxIncome ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]'}`}></div>
                                  </div>

                                  {/* Item */}
                                  <div className="flex-1 ml-2.5 flex items-start justify-between group cursor-default">
                                    <div className="flex items-start gap-2">
                                      <div className={`mt-0.5 ${isTxIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {isTxIncome ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                      </div>
                                      <div>
                                        <h4 className="font-bold text-gray-200 text-[11px] flex items-center gap-1.5 group-hover:text-white transition-colors">
                                          <span className="line-clamp-1 max-w-[120px]">{t.subcategory || t.category}</span>
                                        </h4>
                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-wider mt-0.5">{t.category}</p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 pt-0.5">
                                      <div className={`font-black whitespace-nowrap text-[11px] ${isTxIncome ? 'text-emerald-400' : 'text-gray-300'}`}>
                                        {isTxIncome ? '+' : '-'}Rs. {formatLKR(t.amount)}
                                      </div>
                                      {handleDeleteTransaction && (
                                        <button 
                                          type="button" 
                                          onClick={() => handleDeleteTransaction(t.id)} 
                                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-rose-500 bg-gray-800 rounded-md shadow-sm"
                                          title="Delete Transaction"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
      </div>
    </div>
  );
};

export default AddExpenseTab;
