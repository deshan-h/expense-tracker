import React, { useState, useEffect } from 'react';
import { PlusCircle, TrendingUp, TrendingDown, Plus, Bookmark, Clock, ChevronLeft, Trash2, ChevronDown } from 'lucide-react';
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
  transactions = [],
  addSchedule,
  formatLKR
}) => {
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDesc, setTemplateDesc] = useState('');
  const [isTemplatesExpanded, setIsTemplatesExpanded] = useState(true);
  const [frequency, setFrequency] = useState('Once');

  useEffect(() => {
    setCategory('');
    setSubcategory('');
    setAmount('');
    setDescription('');
    setCalcHistory('');
    setIsTemplatesExpanded(true);
  }, [setCategory, setSubcategory, setAmount, setDescription, setCalcHistory]);

  const onSubmitForm = async (e) => {
    e.preventDefault();
    if (isSavingTemplate && templateName.trim()) {
      await addTemplate({
        name: templateName,
        amount: amount || '',
        category: type === 'Expense' ? category : 'Income',
        subcategory: type === 'Expense' ? subcategory : 'Other',
        description: templateDesc || description || ''
      });
      setIsSavingTemplate(false);
      setTemplateName('');
      setTemplateDesc('');
    }
    
    if (type === 'Income') {
      if (handleAddIncome) {
        await handleAddIncome(e, category || 'Other');
      }
    } else {
      if (frequency !== 'Once' && addSchedule) {
        const fullDate = `${date}T${time}`;
        await addSchedule({ category, subcategory, amount: parseFloat(amount), description, nextDate: fullDate, frequency });
        setAmount('');
        setCalcHistory('');
        setDescription('');
        setFrequency('Once');
      } else {
        handleAddTransaction(e);
      }
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

  const recentTransactions = transactions.filter(t => t.type === 'Expense' || t.type === 'Income').slice(0, 10);

  const isIncome = type === 'Income';

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="w-full relative z-10 mt-2">
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

              {/* Templates Section */}
              {!isIncome && templates && templates.length > 0 && (
                <div className={`bg-gray-900/60 backdrop-blur-md p-5 rounded-3xl border border-gray-700/50 shadow-inner flex flex-col transition-all duration-300 ${isTemplatesExpanded ? 'flex-1' : ''}`}>
                  <div 
                    className="flex items-center justify-between cursor-pointer group"
                    onClick={() => setIsTemplatesExpanded(!isTemplatesExpanded)}
                  >
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] ml-1 flex items-center gap-2 group-hover:text-gray-200 transition-colors">
                      <Bookmark className="w-3.5 h-3.5 text-purple-400" /> Templates
                    </p>
                    <ChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-transform duration-300 ${isTemplatesExpanded ? 'rotate-180' : ''}`} />
                  </div>
                  
                  {isTemplatesExpanded && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 flex-1 overflow-y-auto content-start pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700/50 [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in slide-in-from-top-2 duration-300">
                      {templates.map(tpl => (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => {
                            if (tpl.amount) setAmount(tpl.amount);
                            if (tpl.category) setCategory(tpl.category);
                            if (tpl.subcategory) setSubcategory(tpl.subcategory);
                            if (tpl.description) setDescription(tpl.description);
                            setIsTemplatesExpanded(false);
                          }}
                          className="bg-gray-800/60 hover:bg-gray-700 border border-gray-700/50 hover:border-gray-600 rounded-xl py-2 px-3 flex items-center justify-start gap-3 transition-all text-left group/btn shadow-inner"
                        >
                          <Bookmark className="w-4 h-4 text-purple-400/50 group-hover/btn:text-purple-400 transition-colors shrink-0" />
                          <span className="text-[10px] font-bold text-gray-300 line-clamp-1 w-full leading-tight">{tpl.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Category Grid */}
              {(() => {
                const isCatExpanded = isIncome || !isTemplatesExpanded || !templates || templates.length === 0;
                return (
                  <div className={`bg-gray-900/60 backdrop-blur-md p-5 rounded-3xl border border-gray-700/50 shadow-inner flex flex-col transition-all duration-300 ${isCatExpanded ? 'flex-1' : ''}`}>
                    {(() => {
                      const currentCategories = categories.filter(c => isIncome ? c.type === 'Income' : (!c.type || c.type === 'Expense'));
                      
                      if (!category || isIncome) {
                        return (
                          <>
                        <div 
                          className={`flex items-center justify-between ${isCatExpanded ? 'mb-4' : ''} cursor-pointer group`}
                          onClick={() => {
                            if (!isIncome && templates && templates.length > 0) {
                              setIsTemplatesExpanded(!isTemplatesExpanded);
                            }
                          }}
                        >
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 group-hover:text-gray-200 transition-colors">Select Category</p>
                          <div className="flex items-center gap-2">
                            {currentCategories.length === 0 && <p className="text-[9px] font-bold text-rose-400 bg-rose-400/10 px-2 py-1 rounded-full border border-rose-400/20 uppercase tracking-wider">Empty</p>}
                            {!isIncome && templates && templates.length > 0 && (
                              <ChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-transform duration-300 ${isCatExpanded ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </div>
                        
                        {isCatExpanded && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 flex-1 overflow-y-auto content-start [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700/50 [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in duration-300">
                            {currentCategories.map((c, i) => {
                              const CatIcon = getIconComponent(c.icon);
                              const iconColors = getIconColor(c.icon);
                              const isSelected = category === c.name;
                              return (
                                    <button 
                                      key={c.id} 
                                      type="button" 
                                      onClick={() => { setCategory(c.name); setSubcategory(''); }} 
                                      className={`py-3 px-1 md:py-4 md:px-2 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all text-center border border-gray-700/50 hover:bg-gray-700/50 shadow-inner group/btn overflow-hidden ${isSelected ? (isIncome ? 'bg-emerald-500/20 border-emerald-500/50 shadow-[inset_0_0_15px_rgba(16,185,129,0.2)]' : 'bg-gray-700/50') : 'bg-gray-800/40'}`}
                                    >
                                      <div className={`p-2 transition-all rounded-xl ${iconColors.bg}`}>
                                        <CatIcon className={`w-5 h-5 md:w-6 md:h-6 transition-all ${iconColors.color}`} />
                                      </div>
                                      <span className={`text-[9px] leading-tight md:text-[10px] font-bold w-full break-words whitespace-normal ${isSelected ? 'text-gray-100' : 'text-gray-300 group-hover/btn:text-gray-200'}`}>{c.name}</span>
                                    </button>
                              );
                            })}
                          </div>
                        )}
                      </>
                    );
                  } else {
                    return (
                      <div className={`animate-in slide-in-from-right-4 duration-300 flex flex-col transition-all duration-300 ${isCatExpanded ? 'flex-1' : ''}`}>
                        {/* Selected Category Header */}
                        <div 
                          className={`flex items-center justify-between ${isCatExpanded ? 'mb-5 border-b border-gray-700/50 pb-4' : ''} cursor-pointer group`}
                          onClick={() => {
                            if (!isIncome && templates && templates.length > 0) {
                              setIsTemplatesExpanded(!isTemplatesExpanded);
                            }
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
                                  <div className={`p-2 rounded-xl ${iconColors.bg} shadow-inner`}>
                                    <CatIcon className={`w-4 h-4 md:w-5 md:h-5 ${iconColors.color}`} />
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest leading-none mb-0.5">Category</p>
                                    <p className="text-sm font-black text-gray-100 leading-tight">{c.name}</p>
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
                                if (!isIncome && templates && templates.length > 0) {
                                  setIsTemplatesExpanded(true); // Open templates when clearing category
                                }
                              }} 
                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white bg-gray-800 px-3 py-1.5 rounded-full border border-gray-700 transition-all z-10 hover:shadow-md"
                            >
                              <ChevronLeft className="w-3 h-3" /> Back
                            </button>
                            {!isIncome && templates && templates.length > 0 && (
                              <ChevronDown className={`w-4 h-4 text-gray-500 group-hover:text-gray-300 transition-transform duration-300 ${isCatExpanded ? 'rotate-180' : ''}`} />
                            )}
                          </div>
                        </div>

                        {/* Subcategories List (Expense Only) */}
                        {isCatExpanded && !isIncome && selectedCatObj && (() => {
                          const CatIcon = getIconComponent(selectedCatObj.icon);
                          const iconColors = getIconColor(selectedCatObj.icon);
                          return (
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Select Subcategory</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3 max-h-[250px] overflow-y-auto content-start pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-gray-700/50 [&::-webkit-scrollbar-thumb]:rounded-full animate-in fade-in duration-300">
                              <button type="button" onClick={() => setSubcategory('')} className={`rounded-xl py-2 px-3 flex items-center justify-start gap-2 transition-all text-left shadow-inner border group/subbtn ${subcategory === '' ? 'bg-blue-600/80 text-white border-blue-500 shadow-inner' : 'bg-gray-800/60 hover:bg-gray-700 border-gray-700/50 text-gray-300 hover:text-gray-200 hover:border-gray-600'}`}>
                                <CatIcon className={`w-3.5 h-3.5 shrink-0 transition-colors ${subcategory === '' ? 'text-white/80' : 'text-gray-500 group-hover/subbtn:text-gray-400'}`} />
                                <span className="text-[10px] font-bold line-clamp-1 w-full leading-tight">General</span>
                              </button>
                              {selectedCatObj.subcategories?.map(sub => (
                                <button key={sub} type="button" onClick={() => setSubcategory(sub)} className={`rounded-xl py-2 px-3 flex items-center justify-start gap-2 transition-all text-left shadow-inner border group/subbtn ${subcategory === sub ? 'bg-emerald-500/80 text-white border-emerald-400 shadow-inner' : 'bg-gray-800/60 hover:bg-gray-700 border-gray-700/50 text-gray-300 hover:text-gray-200 hover:border-gray-600'}`}>
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
            })()}
          </div>
        );
      })()}
    </div>
    {/* COLUMN 2 */}
            <div className="flex flex-col justify-start bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-gray-700/50 shadow-inner h-full">
              <div className="flex flex-col h-full space-y-6">
                
                {/* Amount Field (Smaller & Colored) */}
                <div className={`bg-gray-900/80 backdrop-blur-md p-5 rounded-3xl border shadow-inner transition-all ${isIncome ? 'border-emerald-500/30' : 'border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.1)]'}`}>
                  <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-[0.2em] ml-1">
                    {calcHistory ? <span className="text-blue-400 font-black tracking-widest drop-shadow-md">{calcHistory}</span> : 'Amount'}
                  </p>
                  <div className={`flex items-center text-4xl md:text-5xl font-black ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
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

                {/* Details */}
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Details</p>
                  <div className={`relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden shadow-inner`}>
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent px-5 py-4 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder={`What was this ${type.toLowerCase()} for?`} />
                  </div>
                </div>
                
                {/* Date & Time */}
                <div className="flex flex-col gap-3">
                  <DateTimePicker 
                    date={date} 
                    setDate={setDate} 
                    time={time} 
                    setTime={setTime} 
                  />
                  
                  {!isIncome && (
                    <div className="relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden shadow-inner flex items-center px-4 py-2.5">
                      <select required value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full bg-transparent text-sm font-medium text-gray-100 focus:outline-none appearance-none cursor-pointer">
                        <option value="Once" className="bg-gray-800">One-Time (No Repeat)</option>
                        <option value="Daily" className="bg-gray-800">Daily</option>
                        <option value="Weekly" className="bg-gray-800">Weekly</option>
                        <option value="Monthly" className="bg-gray-800">Monthly</option>
                        <option value="Yearly" className="bg-gray-800">Yearly</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none shrink-0 ml-2" />
                    </div>
                  )}
                </div>

                {/* SAVE AS TEMPLATE */}
                <div className="bg-gray-900/40 p-5 rounded-2xl border border-gray-700/50 transition-all">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => {
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
                  {isSavingTemplate && (
                    <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                      <input 
                        type="text" 
                        value={templateName} 
                        onChange={(e) => setTemplateName(e.target.value)} 
                        required={isSavingTemplate} 
                        placeholder="Template Name (e.g. Daily Coffee)" 
                        className="w-full bg-gray-800/80 px-4 py-3 text-sm text-gray-100 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                      />
                      <input 
                        type="text" 
                        value={templateDesc} 
                        onChange={(e) => setTemplateDesc(e.target.value)} 
                        placeholder="Template Description (Optional)" 
                        className="w-full bg-gray-800/80 px-4 py-3 text-sm text-gray-100 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all" 
                      />
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-auto flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => { setAmount(''); setCategory(''); setSubcategory(''); setDescription(''); setCalcHistory(''); setTemplateDesc(''); }} 
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

          {/* COLUMN 3: Recent Activity */}
          <div className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] border border-gray-800 hover:border-gray-700/80 shadow-xl flex flex-col h-full relative overflow-hidden group transition-all duration-500">
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] group-hover:bg-purple-500/20 transition-all duration-700"></div>

            <div className="flex items-center justify-between mb-6 flex-shrink-0 relative z-10">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase flex items-center gap-2 text-gray-300">
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                </div>
                Recent Transactions
              </h3>
            </div>

            <div className="relative overflow-y-auto hide-scrollbar flex-1 pr-1 z-10 pt-1">
              <div className="absolute left-[56px] top-3 bottom-3 w-px bg-gray-700/50"></div>
              
              <div className="space-y-4">
                {recentTransactions.length === 0 ? (
                  <p className="text-gray-500 italic text-[11px] pl-[72px]">No recent transactions.</p>
                ) : (
                  recentTransactions.map((t, i) => {
                    const isTxIncome = t.type === 'Income';
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
                          <div className={`w-2 h-2 rounded-full border border-gray-900 z-10 relative ${isTxIncome ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]'}`}></div>
                        </div>
                        
                        {/* Activity Content */}
                        <div className="flex-1 ml-3 flex items-start justify-between pb-2 group cursor-default">
                          <div className="flex items-start gap-2.5">
                            <div className={`mt-0.5 ${isTxIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isTxIncome ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
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
                          <div className="flex items-center gap-2 pt-0.5">
                            <div className={`font-black whitespace-nowrap text-[11px] md:text-xs ${isTxIncome ? 'text-emerald-400' : 'text-gray-300'}`}>
                              {isTxIncome ? '+' : '-'}Rs. {formatLKR(t.amount)}
                            </div>
                            {handleDeleteTransaction && (
                              <button 
                                type="button" 
                                onClick={() => handleDeleteTransaction(t.id)} 
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-gray-500 hover:text-rose-500 bg-gray-800 rounded-md shadow-sm"
                                title="Delete Transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
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
