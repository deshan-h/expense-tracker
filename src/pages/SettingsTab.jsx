import React, { useState } from 'react';
import { FolderTree, Trash2, X, ChevronDown, ChevronUp, Settings, Bookmark, Edit2, Check, RotateCw } from 'lucide-react';
import { AVAILABLE_ICONS, getIconComponent, getIconColor } from '../utils/icons';
import DateTimePicker from '../components/ui/DateTimePicker';

const SettingsTab = ({
  handleAddCategory,
  newCategoryName,
  setNewCategoryName,
  newCategoryIcon,
  setNewCategoryIcon,
  newCategoryType,
  setNewCategoryType,
  isAddingCategory,
  seedDefaultCategories,
  categories,
  handleDeleteCategory,
  handleDeleteSubcategory,
  newSubcategoryNames,
  handleSubcategoryChange,
  handleAddSubcategory,
  updateCategoryTarget,
  transactions,
  templates,
  deleteTemplate,
  updateTemplate
}) => {
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  const [editingTargetId, setEditingTargetId] = useState(null);
  const [editTargetValue, setEditTargetValue] = useState('');
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editFormData, setEditFormData] = useState({ 
    name: '', 
    amount: '', 
    category: '', 
    subcategory: '', 
    description: '',
    trackCycle: false,
    cycleDays: '30',
    lastPaidDate: '',
    cycleBreakCount: '0'
  });
  const [activeTab, setActiveTab] = useState('categories');

  const handleEditClick = (tpl) => {
    setEditingTemplateId(tpl.id);
    setEditFormData({
      name: tpl.name || '',
      amount: tpl.amount || '',
      category: tpl.category || '',
      subcategory: tpl.subcategory || '',
      description: tpl.description || tpl.desc || '',
      trackCycle: Boolean(tpl.trackCycle),
      cycleDays: tpl.cycleDays ? String(tpl.cycleDays) : '30',
      lastPaidDate: tpl.lastPaidDate || '',
      cycleBreakCount: tpl.cycleBreakCount !== undefined ? String(tpl.cycleBreakCount) : '0'
    });
  };

  const handleSaveEdit = async (id) => {
    if (!editFormData.name.trim() || !editFormData.category) return;
    await updateTemplate(id, {
      name: editFormData.name,
      amount: editFormData.amount,
      category: editFormData.category,
      subcategory: editFormData.subcategory,
      description: editFormData.description,
      trackCycle: editFormData.trackCycle,
      cycleDays: editFormData.trackCycle ? (Number(editFormData.cycleDays) || 30) : null,
      lastPaidDate: editFormData.trackCycle ? (editFormData.lastPaidDate || new Date().toLocaleDateString('en-CA')) : null,
      cycleBreakCount: Number(editFormData.cycleBreakCount) || 0
    });
    setEditingTemplateId(null);
  };
  
  const iconToRender = newCategoryIcon ? getIconComponent(newCategoryIcon) : null;
  const selectedIconColors = newCategoryIcon ? getIconColor(newCategoryIcon) : { bg: 'bg-gray-800', color: 'text-gray-400' };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="px-4 md:px-8 py-4 w-full max-w-full relative z-10 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] p-5 rounded-[2rem] border border-gray-800/80 shadow-2xl relative overflow-hidden self-start">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center gap-2.5 mb-3 px-2">
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Preferences</span>
              <h3 className="text-base font-black text-white tracking-tight">Settings</h3>
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'categories' 
                ? 'bg-gradient-to-r from-blue-600/30 to-indigo-600/10 text-white border border-blue-500/40 shadow-lg shadow-blue-900/20 ring-1 ring-blue-500/30' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border border-transparent'
            }`}
          >
            <FolderTree className="w-4 h-4 text-emerald-400" />
            Categories
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'templates' 
                ? 'bg-gradient-to-r from-purple-600/30 to-pink-600/10 text-white border border-purple-500/40 shadow-lg shadow-purple-900/20 ring-1 ring-purple-500/30' 
                : 'text-gray-400 hover:bg-gray-800/50 hover:text-white border border-transparent'
            }`}
          >
            <Bookmark className="w-4 h-4 text-purple-400" />
            Templates
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'categories' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-inner">
                  <FolderTree className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">Taxonomy</span>
                  <h4 className="text-lg font-black text-white tracking-tight">Category Management</h4>
                </div>
              </div>
          
          <form onSubmit={handleAddCategory} className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] p-6 rounded-[2rem] border border-gray-800/80 shadow-2xl space-y-4 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none"></div>

            <div className="relative z-10">
              <label className="block text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Create New Category</label>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Type Toggle */}
                <div className="flex bg-gray-950 p-1 border border-gray-800 rounded-xl overflow-hidden shrink-0 shadow-inner">
                  <button type="button" onClick={() => setNewCategoryType('Expense')} className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${newCategoryType === 'Expense' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Expense</button>
                  <button type="button" onClick={() => setNewCategoryType('Income')} className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${newCategoryType === 'Income' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>Income</button>
                </div>
                
                {/* Name Input */}
                <input type="text" required value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category Name (e.g. Groceries)" className="w-full sm:flex-1 bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-500 font-medium shadow-inner" />

                {/* Icon Selector */}
                <button 
                  type="button" 
                  onClick={() => setIsIconSelectorOpen(!isIconSelectorOpen)}
                  className="flex items-center justify-between w-full sm:w-48 bg-gray-950/80 border border-gray-800 rounded-xl px-4 py-2.5 text-white hover:border-gray-700 transition-colors shadow-inner shrink-0 cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {iconToRender ? (
                      <div className={`p-1.5 rounded-lg ${selectedIconColors.bg} border border-gray-700/30 shrink-0`}>
                        {React.createElement(iconToRender, { className: `w-4 h-4 ${selectedIconColors.color}` })}
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-gray-900 border border-dashed border-gray-700 flex items-center justify-center text-gray-500 font-bold shrink-0 text-xs">
                        ?
                      </div>
                    )}
                    <span className="font-bold text-xs truncate">{newCategoryIcon ? newCategoryIcon : "Select icon"}</span>
                  </div>
                  {isIconSelectorOpen ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0 ml-2" />}
                </button>
                
                {/* Save Button */}
                <button type="submit" disabled={isAddingCategory || !newCategoryName.trim()} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-[0.98] disabled:opacity-50 cursor-pointer whitespace-nowrap">Save</button>
              </div>
            </div>
            
            {/* Expanded Icon Grid */}
            <div className={`transition-all duration-300 overflow-hidden relative z-10 ${isIconSelectorOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="bg-gray-950/90 p-4 rounded-2xl border border-gray-800/80 mt-2 shadow-inner">
                <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1.5 sm:gap-2 max-h-[200px] overflow-y-auto p-1.5 pr-2 custom-scrollbar">
                  {AVAILABLE_ICONS.map((iconObj) => {
                    const IconComponent = getIconComponent(iconObj.name);
                    const isSelected = newCategoryIcon === iconObj.name;
                    return (
                      <button
                        key={iconObj.name}
                        type="button"
                        onClick={() => {
                          setNewCategoryIcon(iconObj.name);
                          setIsIconSelectorOpen(false);
                        }}
                        className={`p-1.5 sm:p-2 rounded-xl flex flex-col items-center justify-center transition-all border ${isSelected ? 'bg-gray-800 border-blue-500 shadow-lg shadow-blue-500/30 scale-110 z-10 ring-2 ring-blue-500/40' : 'bg-gray-900/80 border-gray-800 hover:border-gray-600'} ${!isSelected && iconObj.bg} ${!isSelected && iconObj.color}`}
                        title={iconObj.name}
                      >
                        <IconComponent className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSelected ? iconObj.color : ''}`} />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </form>

        {categories.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] border border-dashed border-gray-800 rounded-3xl mt-8 shadow-2xl">
            <p className="text-gray-400 text-sm mb-6 font-medium">Your workspace is clean. Create some categories to start.</p>
            <button onClick={seedDefaultCategories} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-900/30 active:scale-95 cursor-pointer">Load Starter Categories</button>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] rounded-[2rem] border border-gray-800/80 overflow-hidden shadow-2xl mt-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-950/90 border-b border-gray-800/80">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-400 font-black w-[25%]">Category</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-400 font-black w-[25%]">Monthly Target</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-400 font-black w-[40%]">Subcategories</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-400 font-black text-right w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {categories.map((cat) => {
                    const CatIcon = getIconComponent(cat.icon);
                    const iconColors = getIconColor(cat.icon);
                    
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();
                    const spentThisMonth = transactions ? transactions
                      .filter(t => t.type === 'Expense' && t.category === cat.name)
                      .filter(t => {
                        const tDate = new Date(t.date);
                        return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
                      })
                      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0) : 0;
                    
                    const isOverBudget = cat.target && spentThisMonth > cat.target;

                    return (
                      <tr key={cat.id} className="hover:bg-blue-600/[0.04] transition-colors group">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-3 mt-1">
                            <div className={`p-2.5 rounded-xl ${iconColors.bg} border border-gray-700/30 shadow-inner`}>
                              <CatIcon className={`w-5 h-5 ${iconColors.color}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white font-black text-sm">{cat.name}</span>
                              <span className={`text-[9px] uppercase font-bold tracking-widest mt-1 w-fit px-2 py-0.5 rounded-md border ${
                                cat.type === 'Income' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              }`}>{cat.type || 'Expense'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          {cat.type === 'Income' ? (
                            <span className="text-gray-600 text-xs italic mt-2 block">N/A</span>
                          ) : (
                            <div className="flex flex-col gap-1 mt-1">
                              {editingTargetId === cat.id ? (
                                <div className="flex gap-2 bg-gray-950 p-1.5 rounded-xl border border-blue-500 shadow-inner">
                                  <input 
                                    type="number" 
                                    value={editTargetValue} 
                                    onChange={(e) => setEditTargetValue(e.target.value)} 
                                    placeholder="Target amount..." 
                                    className="w-full bg-transparent px-2 text-sm text-white focus:outline-none placeholder-gray-600 min-w-0 font-bold" 
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        updateCategoryTarget(cat.id, editTargetValue);
                                        setEditingTargetId(null);
                                      } else if (e.key === 'Escape') {
                                        setEditingTargetId(null);
                                      }
                                    }}
                                  />
                                  <button onClick={() => { updateCategoryTarget(cat.id, editTargetValue); setEditingTargetId(null); }} className="text-blue-400 hover:text-blue-300 px-2 shrink-0 cursor-pointer"><Check className="w-4 h-4" /></button>
                                  <button onClick={() => setEditingTargetId(null)} className="text-gray-500 hover:text-gray-400 px-2 shrink-0 cursor-pointer"><X className="w-4 h-4" /></button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5 group/target cursor-pointer w-full p-2 -ml-2 rounded-xl hover:bg-gray-800/40 transition-colors" onClick={() => { setEditingTargetId(cat.id); setEditTargetValue(cat.target ? cat.target.toString() : ''); }}>
                                  {cat.target ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="text-white font-mono font-black text-sm">Rs. {parseFloat(cat.target).toLocaleString('en-US')}</span>
                                        <Edit2 className="w-3 h-3 text-gray-500 opacity-0 group-hover/target:opacity-100 transition-opacity" />
                                      </div>
                                      <div className="flex flex-col gap-1 w-full max-w-[200px]">
                                        <div className="flex justify-between items-center text-[11px]">
                                          <span className={isOverBudget ? 'text-rose-400 font-bold' : 'text-gray-400'}>Spent: Rs. {spentThisMonth.toLocaleString('en-US')}</span>
                                          <span className={`font-mono font-bold ${isOverBudget ? 'text-rose-400' : 'text-gray-400'}`}>{Math.round((spentThisMonth / cat.target) * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-950 rounded-full overflow-hidden border border-gray-800/80">
                                          <div className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} style={{ width: `${Math.min((spentThisMonth / cat.target) * 100, 100)}%` }}></div>
                                        </div>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex flex-col gap-1 w-full max-w-[200px] mb-1">
                                        <div className="flex justify-between items-center text-[11px]">
                                          <span className="text-gray-400 font-medium">Spent: Rs. {spentThisMonth.toLocaleString('en-US')}</span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-500 text-xs italic">
                                        <span>Click to set target</span>
                                        <Edit2 className="w-3 h-3 opacity-0 group-hover/target:opacity-100 transition-opacity" />
                                      </div>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 align-top">
                          <div className="flex flex-col gap-3">
                            {cat.subcategories && cat.subcategories.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {cat.subcategories.map(sub => (
                                  <div key={sub} className="flex items-center gap-1.5 bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-xl text-xs font-semibold text-gray-300 shadow-sm">
                                    <span>{sub}</span>
                                    <button onClick={() => handleDeleteSubcategory(cat.id, sub)} className="text-gray-500 hover:text-rose-400 transition-colors ml-1 hover:bg-rose-400/10 rounded p-0.5 cursor-pointer"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs italic mt-2">No subcategories</span>
                            )}
                            <div className="flex gap-2 bg-gray-950/80 p-1.5 rounded-xl border border-gray-800 focus-within:border-blue-500 transition-colors max-w-sm shadow-inner">
                              <input type="text" value={newSubcategoryNames[cat.id] || ''} onChange={(e) => handleSubcategoryChange(cat.id, e.target.value)} placeholder="New subcategory..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(cat.id); } }} className="flex-1 bg-transparent px-2 text-xs text-white focus:outline-none placeholder-gray-600 font-medium" />
                              <button onClick={() => handleAddSubcategory(cat.id)} disabled={!newSubcategoryNames[cat.id]?.trim()} className="bg-gray-850 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-40 cursor-pointer">Add</button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-right">
                          <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors cursor-pointer inline-flex mt-1" title="Delete Category"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 rounded-xl border border-purple-500/20 shadow-inner">
                  <Bookmark className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">Recurrence & Quick Logs</span>
                  <h4 className="text-lg font-black text-white tracking-tight">Expense Templates</h4>
                </div>
              </div>
          
          {!templates || templates.length === 0 ? (
            <div className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] border border-dashed border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
              <p className="text-gray-400 text-sm font-medium">No templates saved yet. You can save templates when adding a new expense.</p>
            </div>
          ) : (
          <div className="bg-gradient-to-br from-[#0c1222] via-[#090d1a] to-[#030611] rounded-[2rem] border border-gray-800/80 overflow-hidden shadow-2xl mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-950/90 border-b border-gray-800/80">
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-400 font-black w-[22%]">Template Name</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-400 font-black w-[18%]">Category</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-400 font-black w-[14%]">Amount</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-400 font-black w-[18%]">Cycle Tracking</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-400 font-black w-[18%]">Description</th>
                    <th className="px-6 py-4 text-[10px] uppercase tracking-widest text-gray-400 font-black text-right w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60">
                  {templates.map(tpl => {
                    if (editingTemplateId === tpl.id) {
                      const selectedCat = categories.find(c => c.name === editFormData.category);
                      return (
                        <tr key={tpl.id} className="bg-gray-950/90">
                          <td colSpan="6" className="p-4 sm:p-6">
                            <div className="bg-[#090e1a] border border-purple-500/40 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                              <div className="flex items-center gap-2 mb-4 relative z-10">
                                <Bookmark className="w-4 h-4 text-purple-400" />
                                <span className="text-xs font-black uppercase tracking-wider text-purple-300">Edit Template: {tpl.name}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 relative z-10">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1.5 block">Template Name</label>
                                  <input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-bold" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1.5 block">Amount (Optional)</label>
                                  <input type="text" inputMode="decimal" value={editFormData.amount} onChange={e => setEditFormData({...editFormData, amount: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-purple-300 font-mono font-bold focus:outline-none focus:border-purple-500" placeholder="0.00" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1.5 block">Category</label>
                                  <select value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value, subcategory: ''})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-medium [&>option]:bg-gray-950">
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                  </select>
                                </div>
                                {selectedCat && selectedCat.subcategories && selectedCat.subcategories.length > 0 ? (
                                  <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1.5 block">Subcategory</label>
                                    <select value={editFormData.subcategory} onChange={e => setEditFormData({...editFormData, subcategory: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 font-medium [&>option]:bg-gray-950">
                                      <option value="">General</option>
                                      {selectedCat.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1.5 block">Description (Optional)</label>
                                    <input type="text" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" placeholder="e.g. Monthly Wifi Bill" />
                                  </div>
                                )}
                                {selectedCat && selectedCat.subcategories && selectedCat.subcategories.length > 0 && (
                                  <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1.5 block">Description (Optional)</label>
                                    <input type="text" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500" placeholder="e.g. Monthly Wifi Bill" />
                                  </div>
                                )}

                                {/* Cycle Tracking Settings */}
                                <div className="md:col-span-2 bg-gray-950/80 p-4 rounded-xl border border-gray-800 mt-1">
                                  <div className="flex items-center justify-between cursor-pointer py-1" onClick={() => setEditFormData({...editFormData, trackCycle: !editFormData.trackCycle})}>
                                    <div className="flex items-center gap-2.5">
                                      <RotateCw className={`w-4 h-4 ${editFormData.trackCycle ? 'text-emerald-400' : 'text-gray-400'}`} />
                                      <div>
                                        <span className="text-xs font-bold text-gray-200">Track Renewal / Cycle</span>
                                        <p className="text-[10px] text-gray-500">Show progress bar in Add Expense templates</p>
                                      </div>
                                    </div>
                                    <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out shadow-inner ${editFormData.trackCycle ? 'bg-emerald-500' : 'bg-gray-800'}`}>
                                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${editFormData.trackCycle ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                  </div>

                                  {editFormData.trackCycle && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 mt-3 border-t border-gray-800 animate-in fade-in duration-200">
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Cycle Period (Days)</label>
                                          <div className="flex gap-1">
                                            {['7', '14', '30', '60'].map((d) => (
                                              <button
                                                key={d}
                                                type="button"
                                                onClick={() => setEditFormData({...editFormData, cycleDays: d})}
                                                className={`text-[9px] font-bold px-2 py-0.5 rounded-md transition-all ${editFormData.cycleDays === d ? 'bg-emerald-500 text-white shadow-sm' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                                              >
                                                {d}d
                                              </button>
                                            ))}
                                          </div>
                                        </div>
                                        <input 
                                          type="number" 
                                          min="1" 
                                          max="365" 
                                          value={editFormData.cycleDays} 
                                          onChange={e => setEditFormData({...editFormData, cycleDays: e.target.value})} 
                                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-500" 
                                          placeholder="30" 
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1.5 block">Last Paid Date</label>
                                        <DateTimePicker 
                                          date={editFormData.lastPaidDate || new Date().toLocaleDateString('en-CA')} 
                                          setDate={(newDate) => setEditFormData({...editFormData, lastPaidDate: newDate})} 
                                          hideTime={true} 
                                        />
                                      </div>
                                      <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Cycle Breaks</label>
                                          {Number(editFormData.cycleBreakCount) > 0 && (
                                            <button
                                              type="button"
                                              onClick={() => setEditFormData({...editFormData, cycleBreakCount: '0'})}
                                              className="text-[9px] font-bold text-rose-400 hover:text-rose-300 underline cursor-pointer"
                                            >
                                              Reset to 0
                                            </button>
                                          )}
                                        </div>
                                        <input 
                                          type="number" 
                                          min="0" 
                                          value={editFormData.cycleBreakCount} 
                                          onChange={e => setEditFormData({...editFormData, cycleBreakCount: e.target.value})} 
                                          className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white font-bold focus:outline-none focus:border-emerald-500 font-mono" 
                                          placeholder="0" 
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800 relative z-10">
                                <button onClick={() => setEditingTemplateId(null)} className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-gray-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-gray-800 cursor-pointer">Cancel</button>
                                <button onClick={() => handleSaveEdit(tpl.id)} disabled={!editFormData.name.trim() || !editFormData.category} className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-purple-900/30 disabled:opacity-40 cursor-pointer">Save Changes</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={tpl.id} className="hover:bg-purple-600/[0.04] transition-colors group">
                        <td className="px-6 py-4 align-middle">
                          <span className="font-black text-white text-sm">{tpl.name}</span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-xl text-xs font-semibold text-gray-300">{tpl.category}</span>
                            {tpl.subcategory && <span className="bg-gray-900 border border-gray-800 px-2.5 py-1 rounded-xl text-xs font-medium text-gray-400">{tpl.subcategory}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {tpl.amount ? (
                            <span className="text-purple-300 font-mono font-black text-sm bg-purple-950/30 px-2.5 py-1 rounded-lg border border-purple-500/20">Rs. {tpl.amount}</span>
                          ) : (
                            <span className="text-gray-600 text-xs italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {tpl.trackCycle ? (
                            <div className="flex flex-col gap-1">
                              <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs text-emerald-400 font-bold w-fit">
                                <RotateCw className="w-3 h-3 shrink-0" />
                                <span>{tpl.cycleDays || 30} days</span>
                              </div>
                              {tpl.cycleBreakCount > 0 && (
                                <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                                  💔 {tpl.cycleBreakCount} break{tpl.cycleBreakCount > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-600 text-xs">Off</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {(tpl.description || tpl.desc) ? (
                            <span className="text-gray-400 text-xs font-medium">{tpl.description || tpl.desc}</span>
                          ) : (
                            <span className="text-gray-600 text-xs italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleEditClick(tpl)} className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-xl transition-all cursor-pointer" title="Edit Template">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteTemplate(tpl.id)} className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer" title="Delete Template">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
