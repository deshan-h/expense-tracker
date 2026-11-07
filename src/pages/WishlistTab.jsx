import React, { useState, useMemo } from 'react';
import { 
  Target, CheckCircle, PlusCircle, Trash2, X, DollarSign, ListTodo, 
  Activity, ArrowRight, Check, Plus, ChevronDown, ChevronUp, Sparkles, 
  TrendingUp, ArrowUpRight, Award, Compass
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WishlistTab({ 
  wishlistItems = [], 
  loading, 
  addWishlistItem, 
  completeWishlistItem, 
  deleteWishlistItem,
  addSubItemToWishlist,
  categories = [],
  formatLKR: propFormatLKR
}) {
  const [activeFilter, setActiveFilter] = useState('pending'); // 'all' | 'pending' | 'completed'
  const [newItemName, setNewItemName] = useState('');
  const [newEstimatedCost, setNewEstimatedCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);

  // Inline sub-item addition states
  const [activeSubItemInputId, setActiveSubItemInputId] = useState(null);
  const [inlineSubItemName, setInlineSubItemName] = useState('');
  const [inlineSubItemCost, setInlineSubItemCost] = useState('');

  // Complete Modal states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingItem, setCompletingItem] = useState(null);
  const [actualCost, setActualCost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const formatLKR = propFormatLKR || ((amount) => {
    return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
  });

  const pendingItems = useMemo(() => (wishlistItems || []).filter(item => item.status === 'pending'), [wishlistItems]);
  const completedItems = useMemo(() => (wishlistItems || []).filter(item => item.status === 'completed'), [wishlistItems]);
  
  const totalEstimatedPending = useMemo(() => {
    return pendingItems.reduce((acc, curr) => acc + (Number(curr.estimatedCost) || 0), 0);
  }, [pendingItems]);

  const totalActualCompleted = useMemo(() => {
    return completedItems.reduce((acc, curr) => acc + (Number(curr.actualCost) || Number(curr.estimatedCost) || 0), 0);
  }, [completedItems]);

  const totalItemsCount = (wishlistItems || []).length;
  const completionRate = totalItemsCount > 0 ? Math.round((completedItems.length / totalItemsCount) * 100) : 0;

  const displayedItems = useMemo(() => {
    if (activeFilter === 'pending') return pendingItems;
    if (activeFilter === 'completed') return completedItems;
    return wishlistItems || [];
  }, [activeFilter, pendingItems, completedItems, wishlistItems]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    
    setIsSubmitting(true);
    const success = await addWishlistItem({
      name: newItemName.trim(),
      estimatedCost: newEstimatedCost ? parseFloat(newEstimatedCost) : null,
      subItems: []
    });

    if (success) {
      setNewItemName('');
      setNewEstimatedCost('');
      setShowAddPlan(false);
    }
    setIsSubmitting(false);
  };

  const handleInlineAddSubItem = async (item) => {
    if (!inlineSubItemName.trim()) return;
    const success = await addSubItemToWishlist(item.id, item.subItems, inlineSubItemName.trim(), inlineSubItemCost);
    if (success) {
      setInlineSubItemName('');
      setInlineSubItemCost('');
      setActiveSubItemInputId(null);
    }
  };

  const handleOpenCompleteModal = (item) => {
    setCompletingItem(item);
    setActualCost(item.estimatedCost ? item.estimatedCost.toString() : '');
    setSelectedCategory(categories?.[0]?.name || '');
    setSelectedSubcategory('');
    setShowCompleteModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!completingItem || !actualCost) return;
    const success = await completeWishlistItem(
      completingItem.id, 
      completingItem, 
      parseFloat(actualCost), 
      selectedCategory, 
      selectedSubcategory
    );
    if (success) {
      setShowCompleteModal(false);
      setCompletingItem(null);
      setActualCost('');
    }
  };

  const activeCategoryObj = useMemo(() => categories.find(c => c.name === selectedCategory), [categories, selectedCategory]);

  if (loading) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4"></div>
        <p className="text-amber-400 text-sm animate-pulse">Loading Wishlist Goals...</p>
      </div>
    );
  }

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] pb-20 overflow-x-hidden">
      <div className="px-4 md:px-8 py-4 w-full max-w-[1600px] mx-auto space-y-6">
        
        {/* Full-tab Ambient Glows */}
        <div className="absolute top-[5%] left-[10%] w-[35vw] h-[35vw] bg-amber-600/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-[20%] right-[10%] w-[35vw] h-[35vw] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none"></div>

        {/* 1. TOP 3 SUMMARY CARDS (MATCHING LENT, SAVINGS & SCHEDULES TABS) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Card 1: Pending Goals */}
          <div 
            onClick={() => setActiveFilter('pending')}
            className={`cursor-pointer bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border ${
              activeFilter === 'pending' ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-gray-800/80 hover:border-gray-700'
            } shadow-xl relative overflow-hidden transition-all duration-300 group`}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-amber-400" /> Pending Goals & Plans
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                {pendingItems.length} In Progress
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              <span className="text-xs text-gray-500 font-semibold mr-1">Rs.</span>
              {formatLKR(totalEstimatedPending)}
            </h2>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>Total Estimated Cost</span>
              <span className="text-amber-400 font-medium">{pendingItems.length} Unfulfilled</span>
            </div>
          </div>

          {/* Card 2: Completed Goals */}
          <div 
            onClick={() => setActiveFilter('completed')}
            className={`cursor-pointer bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border ${
              activeFilter === 'completed' ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-gray-800/80 hover:border-gray-700'
            } shadow-xl relative overflow-hidden transition-all duration-300 group`}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Completed Goals
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                {completedItems.length} Achieved
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-emerald-400">
              <span className="text-xs text-gray-500 font-semibold mr-1">Rs.</span>
              {formatLKR(totalActualCompleted)}
            </h2>
            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
              <span>Actual funds invested</span>
              <span className="text-emerald-400 font-medium">{completedItems.length} Items bought</span>
            </div>
          </div>

          {/* Card 3: Completion Rate & Total Goals */}
          <div 
            onClick={() => setActiveFilter('all')}
            className={`cursor-pointer bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border ${
              activeFilter === 'all' ? 'border-purple-500 ring-2 ring-purple-500/30' : 'border-gray-800/80 hover:border-gray-700'
            } shadow-xl relative overflow-hidden transition-all duration-300 group`}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-purple-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-purple-400" /> Goal Success Rate
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">
                {totalItemsCount} Total
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-purple-400">
              {completionRate}% <span className="text-xs text-gray-500 font-semibold uppercase">Achieved</span>
            </h2>
            <div className="w-full h-1.5 bg-gray-800/80 rounded-full overflow-hidden mt-2 mb-1">
              <div className="h-full bg-purple-500 rounded-full transition-all duration-1000" style={{ width: `${completionRate}%` }}></div>
            </div>
            <div className="flex items-center justify-between text-[11px] text-gray-500">
              <span>{completedItems.length} of {totalItemsCount} goals completed</span>
              <span className="text-purple-400 font-medium">{pendingItems.length} Remaining</span>
            </div>
          </div>

        </div>

        {/* 2. FILTER TABS & QUICK ADD BAR */}
        <div className="bg-gray-900/60 backdrop-blur-xl p-3 rounded-[1.25rem] border border-gray-800/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 relative z-20">
          
          {/* Segment Selector */}
          <div className="flex items-center bg-gray-950/80 p-1 rounded-xl border border-gray-800/80 w-full sm:w-auto">
            <button
              onClick={() => setActiveFilter('pending')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeFilter === 'pending'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Target className="w-3.5 h-3.5 text-amber-300" /> In Progress ({pendingItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('completed')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeFilter === 'completed'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <Check className="w-3.5 h-3.5 text-emerald-300" /> Completed ({completedItems.length})
            </button>
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeFilter === 'all'
                  ? 'bg-gray-800 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              All Goals ({totalItemsCount})
            </button>
          </div>

          {/* Quick Add Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowAddPlan(!showAddPlan)}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-gray-950 px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showAddPlan ? 'Close Form' : '+ Add New Wishlist Goal'}</span>
              {showAddPlan ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
            </button>
          </div>
        </div>

        {/* 3. COLLAPSIBLE ADD PLAN FORM */}
        <AnimatePresence>
          {showAddPlan && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative z-40 overflow-visible"
            >
              <div className="bg-gray-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-[1.5rem] border border-gray-800/80 shadow-2xl relative z-40 overflow-visible">
                
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800/60">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Add Future Goal / Purchase Wishlist
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    Goal Setting
                  </span>
                </div>

                <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                  
                  {/* Name */}
                  <div className="sm:col-span-2 lg:col-span-3 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Goal or Item Name</span>
                    <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner">
                      <input 
                        type="text" 
                        required 
                        value={newItemName} 
                        onChange={(e) => setNewItemName(e.target.value)} 
                        className="w-full h-[42px] bg-transparent px-4 text-sm font-bold text-white focus:outline-none placeholder-gray-500" 
                        placeholder="e.g. New Laptop, Motorcycle, Japan Trip, Smartwatch" 
                      />
                    </div>
                  </div>

                  {/* Estimated Amount */}
                  <div className="sm:col-span-1 lg:col-span-2 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Estimated Cost (Optional)</span>
                    <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        value={newEstimatedCost} 
                        onChange={(e) => setNewEstimatedCost(e.target.value)} 
                        className="w-full h-[42px] bg-transparent pl-10 pr-3 text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-2">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full h-[42px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-gray-950 font-black rounded-xl transition-all shadow-lg hover:shadow-amber-500/25 active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                    >
                      {isSubmitting ? (
                        <div className="w-4 h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <Target className="w-4 h-4" /> Save Goal
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. WISHLIST ITEMS GRID / LIST */}
        <div className="bg-gray-900/60 rounded-[1.5rem] border border-gray-800/80 shadow-2xl backdrop-blur-xl p-4 md:p-6 relative z-10">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-gray-800/80">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-amber-400" />
              {activeFilter === 'pending' && 'In Progress Goals & Plans'}
              {activeFilter === 'completed' && 'Completed & Purchased Goals'}
              {activeFilter === 'all' && 'All Wishlist Goals'}
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                {displayedItems.length}
              </span>
            </h3>
          </div>

          {displayedItems.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-950/30 rounded-2xl border border-dashed border-gray-800/80 py-16">
              <Target className="w-14 h-14 text-gray-700 mb-3 opacity-40" />
              <p className="text-base font-bold text-gray-400">No {activeFilter} goals found.</p>
              <p className="text-xs text-gray-600 mt-1">Add a new goal above to track your future milestones and aspirations!</p>
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence>
                {displayedItems.map((item) => {
                  const isCompleted = item.status === 'completed';

                  return (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-lg ${
                        isCompleted 
                          ? 'bg-gray-950/30 border-gray-800/80 opacity-75 hover:opacity-100' 
                          : 'bg-gray-950/60 border-gray-800/80 hover:border-amber-500/30'
                      }`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className={`text-base font-black ${isCompleted ? 'text-gray-300 line-through decoration-gray-600' : 'text-white'}`}>
                            {item.name}
                          </h4>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className={`text-xs font-bold ${isCompleted ? 'text-gray-500' : 'text-emerald-400'}`}>
                            Est. {formatLKR(item.estimatedCost || 0)}
                          </span>
                          {isCompleted && item.actualCost && (
                            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                              <ArrowRight className="w-3.5 h-3.5 text-gray-500" />
                              <span>Actual: {formatLKR(item.actualCost)}</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Sub-items List (for pending items) */}
                        {!isCompleted && (
                          <div className="mt-4 flex flex-col gap-2">
                            {item.subItems?.length > 0 && (
                              <ul className="space-y-1.5 pl-3 border-l-2 border-gray-800 relative">
                                {item.subItems.map((sub, i) => (
                                  <li key={i} className="text-xs text-gray-300 flex items-center justify-between">
                                    <span className="flex items-center gap-2">
                                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                                      {sub.name}
                                    </span>
                                    {sub.estimatedCost ? (
                                      <span className="text-[10px] font-bold text-gray-400 bg-gray-900 px-2 py-0.5 rounded-md border border-gray-800">
                                        {formatLKR(sub.estimatedCost)}
                                      </span>
                                    ) : null}
                                  </li>
                                ))}
                              </ul>
                            )}
                            
                            <button
                              onClick={() => {
                                setActiveSubItemInputId(activeSubItemInputId === item.id ? null : item.id);
                                setInlineSubItemName('');
                                setInlineSubItemCost('');
                              }}
                              className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-500 hover:text-amber-400 transition-colors w-max"
                              title="Add Sub-item"
                            >
                              <div className="p-0.5 rounded border border-dashed border-gray-600">
                                <Plus className="w-3 h-3" />
                              </div>
                              Add Sub-item (Milestone)
                            </button>
                          </div>
                        )}

                        {activeSubItemInputId === item.id && !isCompleted && (
                          <div className="mt-2 flex items-center gap-2 max-w-[22rem]">
                            <input 
                              type="text"
                              value={inlineSubItemName}
                              onChange={e => setInlineSubItemName(e.target.value)}
                              onKeyPress={e => e.key === 'Enter' && handleInlineAddSubItem(item)}
                              placeholder="Milestone name"
                              className="flex-1 bg-gray-900 border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 transition-colors min-w-0"
                              autoFocus
                            />
                            <input 
                              type="number"
                              value={inlineSubItemCost}
                              onChange={e => setInlineSubItemCost(e.target.value)}
                              onKeyPress={e => e.key === 'Enter' && handleInlineAddSubItem(item)}
                              placeholder="Cost (Opt)"
                              className="w-24 bg-gray-900 border border-gray-700 text-gray-200 text-xs rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500 transition-colors"
                            />
                            <button
                              onClick={() => handleInlineAddSubItem(item)}
                              className="bg-amber-500 hover:bg-amber-400 text-gray-950 text-[10px] px-3 py-1.5 rounded-lg font-black transition-colors uppercase tracking-wider"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Action buttons */}
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <button 
                          onClick={() => deleteWishlistItem(item.id)}
                          className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
                          title="Delete Goal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        {!isCompleted && (
                          <button 
                            onClick={() => handleOpenCompleteModal(item)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl transition-colors font-bold text-xs shadow-inner group/btn"
                          >
                            <CheckCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

      </div>

      {/* COMPLETION MODAL */}
      <AnimatePresence>
        {showCompleteModal && completingItem && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-gray-900/95 backdrop-blur-2xl border border-gray-700/50 p-6 md:p-8 rounded-[2rem] shadow-2xl max-w-md w-full relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
              
              <button 
                onClick={() => setShowCompleteModal(false)}
                className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20 shadow-inner">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-black text-white tracking-wide mb-1">Complete Wishlist Goal</h3>
                <p className="text-sm text-gray-400">"{completingItem.name}" will be logged as an actual expense transaction.</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Actual Purchase Cost</label>
                  <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-emerald-500 transition-all shadow-inner">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">Rs.</span>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={actualCost}
                      onChange={e => setActualCost(e.target.value)}
                      className="w-full h-[46px] bg-transparent pl-12 pr-4 text-white font-bold text-base focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 pl-1 uppercase tracking-wider">
                    Original Estimate: {formatLKR(completingItem.estimatedCost || 0)}
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Expense Category</label>
                  <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-emerald-500 transition-all shadow-inner">
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        setSelectedSubcategory('');
                      }}
                      className="w-full h-[46px] bg-transparent text-gray-200 text-sm font-semibold px-4 focus:outline-none appearance-none"
                    >
                      <option value="" disabled className="bg-gray-900">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name} className="bg-gray-900">{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {activeCategoryObj && activeCategoryObj.subcategories?.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Subcategory (Optional)</label>
                    <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-emerald-500 transition-all shadow-inner">
                      <select
                        value={selectedSubcategory}
                        onChange={(e) => setSelectedSubcategory(e.target.value)}
                        className="w-full h-[46px] bg-transparent text-gray-200 text-sm font-semibold px-4 focus:outline-none appearance-none"
                      >
                        <option value="" className="bg-gray-900">Select Subcategory</option>
                        {activeCategoryObj.subcategories.map((sub, idx) => (
                          <option key={idx} value={typeof sub === 'string' ? sub : sub.name} className="bg-gray-900">
                            {typeof sub === 'string' ? sub : sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleConfirmComplete}
                  disabled={!actualCost || !selectedCategory}
                  className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-3.5 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.6)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-xs"
                >
                  Confirm & Log Expense
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
