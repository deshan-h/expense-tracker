import React, { useState, useMemo } from 'react';
import { Target, CheckCircle, PlusCircle, Trash2, X, DollarSign, ListTodo, Activity, ArrowRight, Check, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatLKR = (amount) => {
  return new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(amount);
};

export default function WishlistTab({ 
  wishlistItems, 
  loading, 
  addWishlistItem, 
  completeWishlistItem, 
  deleteWishlistItem,
  addSubItemToWishlist,
  categories 
}) {
  const [newItemName, setNewItemName] = useState('');
  const [newEstimatedCost, setNewEstimatedCost] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);

  // Inline sub-item addition states
  const [activeSubItemInputId, setActiveSubItemInputId] = useState(null);
  const [inlineSubItemName, setInlineSubItemName] = useState('');
  const [inlineSubItemCost, setInlineSubItemCost] = useState('');

  // Modal states
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completingItem, setCompletingItem] = useState(null);
  const [actualCost, setActualCost] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');

  const pendingItems = useMemo(() => wishlistItems.filter(item => item.status === 'pending'), [wishlistItems]);
  const completedItems = useMemo(() => wishlistItems.filter(item => item.status === 'completed'), [wishlistItems]);
  
  const totalEstimated = useMemo(() => pendingItems.reduce((acc, curr) => acc + (Number(curr.estimatedCost) || 0), 0), [pendingItems]);

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
    setActualCost(item.estimatedCost.toString());
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
        <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
        <p className="text-indigo-400 text-sm animate-pulse">Loading Plans...</p>
      </div>
    );
  }

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
        {/* Full-tab Ambient Glows */}
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

        <div className="w-full relative z-10 mt-2">
          <div className="flex flex-col">

            {/* MAIN SECTION: Pending Plans & Add Plan */}
            <div className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] border border-gray-800 shadow-xl flex flex-col relative z-20 space-y-8 mb-8">
              
              <div className="w-full">
                <div className="flex items-center justify-between px-2 mb-6">
                  <h3 className="text-sm font-bold text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-indigo-500" />
                    Pending Plans
                    <span className="bg-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-full ml-2">{pendingItems.length}</span>
                  </h3>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 px-3 py-1.5 rounded-xl flex flex-col items-end shadow-inner">
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Estimated</span>
                    <span className="text-sm font-black text-indigo-400 leading-tight">Rs. {formatLKR(totalEstimated)}</span>
                  </div>
                </div>

                {/* Add New Plan Bar */}
                <div 
                  className="flex items-center justify-between cursor-pointer group bg-gray-950/30 p-3 rounded-xl border border-gray-800/50 hover:bg-gray-900/50 transition-colors mb-6"
                  onClick={() => setShowAddPlan(!showAddPlan)}
                >
                  <h3 className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2 group-hover:text-white transition-colors">
                    <PlusCircle className="w-4 h-4 text-amber-500" /> Add New Plan
                  </h3>
                  <div className="text-gray-500 group-hover:text-gray-300 transition-colors bg-gray-800/50 p-1.5 rounded-full flex items-center justify-center">
                    {showAddPlan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

              {showAddPlan && (
                <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-3 items-end mt-4">
                  {/* Details */}
                  <div className="w-full md:flex-1 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-indigo-500 transition-all shadow-inner">
                    <input type="text" value={newItemName} onChange={e => setNewItemName(e.target.value)} required className="w-full h-[42px] bg-transparent px-3 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="Item or Work Name (e.g., New Laptop, Car Service)" />
                  </div>
                  {/* Amount */}
                  <div className="w-full md:w-48 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all shadow-inner">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                    <input type="number" step="0.01" value={newEstimatedCost} onChange={e => setNewEstimatedCost(e.target.value)} className="w-full bg-transparent pl-10 pr-3 py-2.5 text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="Estimated Cost (Optional)" />
                  </div>
                  {/* Submit */}
                  <button type="submit" disabled={isSubmitting} className="w-full md:w-auto h-[42px] bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 hover:bg-right bg-[length:200%_auto] text-white font-black tracking-widest uppercase px-6 rounded-xl transition-all shadow-[0_0_15px_-3px_rgba(99,102,241,0.5)] active:scale-[0.98] shrink-0 flex items-center justify-center gap-2">
                    {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><Target className="w-4 h-4" /> SAVE</>}
                  </button>
                </form>
              )}
              </div>
              <div className="w-full min-h-[400px] mt-8">
            {pendingItems.length === 0 ? (
              <div className="w-full flex flex-col items-center justify-center text-gray-500 text-sm bg-gray-950/30 rounded-2xl border border-dashed border-gray-700 py-16">
                <Target className="w-12 h-12 text-gray-700 mb-4 opacity-50" />
                <p>No pending plans.</p>
                <p className="text-xs mt-1 opacity-70">Add a new item to track your future goals.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {pendingItems.map((item) => (
                    <motion.div 
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-gray-950/40 border border-gray-700/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:border-indigo-500/30 transition-colors shadow-inner"
                    >
                      <div className="flex-1">
                        <h4 className="text-base font-black text-white">{item.name}</h4>
                        <p className="text-sm font-medium text-emerald-400/90 mt-1">Est. {formatLKR(item.estimatedCost)}</p>
                        
                        <div className="mt-4 flex flex-col gap-2">
                          {item.subItems?.length > 0 && (
                            <ul className="space-y-1.5 pl-3 border-l-2 border-gray-700/50 relative">
                              {item.subItems.map((sub, i) => (
                                <li key={i} className="text-sm text-gray-300 flex items-center justify-between">
                                  <span className="flex items-center gap-2">
                                    <span className="absolute left-[-5px] w-2 h-2 bg-gray-900 border-2 border-gray-700 rounded-full"></span>
                                    {sub.name}
                                  </span>
                                  {sub.estimatedCost ? (
                                    <span className="text-xs font-bold text-gray-500 tracking-wider bg-gray-950 px-2 py-0.5 rounded-md border border-gray-800">
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
                            className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-bold text-gray-500 hover:text-indigo-400 transition-colors w-max"
                            title="Add Sub-item"
                          >
                            <div className="p-0.5 rounded border border-dashed border-gray-600">
                              <Plus className="w-3 h-3" />
                            </div>
                            Add Sub-item
                          </button>
                        </div>

                        {activeSubItemInputId === item.id && (
                          <div className="mt-2 flex items-center gap-2 max-w-[20rem]">
                            <input 
                              type="text"
                              value={inlineSubItemName}
                              onChange={e => setInlineSubItemName(e.target.value)}
                              onKeyPress={e => e.key === 'Enter' && handleInlineAddSubItem(item)}
                              placeholder="Name"
                              className="flex-1 bg-gray-950 border border-gray-700 text-gray-300 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors min-w-0"
                              autoFocus
                            />
                            <input 
                              type="number"
                              value={inlineSubItemCost}
                              onChange={e => setInlineSubItemCost(e.target.value)}
                              onKeyPress={e => e.key === 'Enter' && handleInlineAddSubItem(item)}
                              placeholder="Cost (Opt)"
                              className="w-20 bg-gray-950 border border-gray-700 text-gray-300 text-xs rounded-md px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                            />
                            <button
                              onClick={() => handleInlineAddSubItem(item)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] px-3 py-1.5 rounded-md font-bold transition-colors uppercase tracking-wider"
                            >
                              Add
                            </button>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <button 
                          onClick={() => deleteWishlistItem(item.id)}
                          className="p-2.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                          title="Delete Plan"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleOpenCompleteModal(item)}
                          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/40 rounded-lg transition-colors font-bold text-sm shadow-inner group/btn"
                        >
                          <CheckCircle className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                          Complete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* COMPLETED ITEMS */}
          {completedItems.length > 0 && (
            <div className="w-full mt-8">
              <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-gray-500 mb-6 flex items-center gap-2">
                <Check className="w-4 h-4 text-gray-500" />
                Completed Plans
                <span className="bg-gray-800 text-gray-400 text-[10px] px-2 py-0.5 rounded-full ml-2">{completedItems.length}</span>
              </h3>
              
              <div className="space-y-3">
                  {completedItems.map((item) => (
                    <div key={item.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 bg-gray-950/50 rounded-xl border border-gray-800/80 gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-gray-300 line-through decoration-gray-600">{item.name}</h4>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] font-medium uppercase tracking-wider">
                          <span className="text-gray-500">Est. {formatLKR(item.estimatedCost)}</span>
                          <ArrowRight className="w-3 h-3 text-gray-600" />
                          <span className="text-emerald-500/70">Actual {formatLKR(item.actualCost)}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteWishlistItem(item.id)}
                        className="text-gray-600 hover:text-red-400 self-end sm:self-center transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
            </div>
          )}

        </div>
      </div>

      {/* COMPLETION MODAL */}
      {showCompleteModal && completingItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
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
              <h3 className="text-xl font-black text-white tracking-wide mb-1">Complete Plan</h3>
              <p className="text-sm text-gray-400">"{completingItem.name}" will be added as an expense.</p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Actual Cost</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rs</span>
                  <input 
                    type="number" 
                    value={actualCost}
                    onChange={e => setActualCost(e.target.value)}
                    className="w-full bg-gray-950/50 border border-gray-700 text-white font-bold text-lg rounded-xl pl-12 pr-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors shadow-inner"
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-gray-500 pl-1 uppercase tracking-wider">
                  Original Estimate: Rs {formatLKR(completingItem.estimatedCost)}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Expense Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setSelectedSubcategory('');
                  }}
                  className="w-full bg-gray-950/50 border border-gray-700 text-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {activeCategoryObj && activeCategoryObj.subcategories?.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">Subcategory</label>
                  <select
                    value={selectedSubcategory}
                    onChange={(e) => setSelectedSubcategory(e.target.value)}
                    className="w-full bg-gray-950/50 border border-gray-700 text-gray-200 rounded-xl px-4 py-3.5 focus:outline-none focus:border-emerald-500 transition-colors appearance-none"
                  >
                    <option value="">Select Subcategory (Optional)</option>
                    {activeCategoryObj.subcategories.map((sub, idx) => (
                      <option key={idx} value={sub.name}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                onClick={handleConfirmComplete}
                disabled={!actualCost || !selectedCategory}
                className="w-full mt-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black py-4 rounded-xl transition-all shadow-[0_0_20px_-5px_rgba(16,185,129,0.6)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-widest text-sm"
              >
                Confirm & Add Expense
              </button>
            </div>
          </motion.div>
        </div>
      )}

            </div>
          </div>
        </div>
  );
}
