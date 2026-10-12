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
    lastPaidDate: ''
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
      lastPaidDate: tpl.lastPaidDate || ''
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
      lastPaidDate: editFormData.trackCycle ? (editFormData.lastPaidDate || new Date().toLocaleDateString('en-CA')) : null
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

      <div className="pr-4 md:pr-8 py-4 w-full max-w-full relative z-10 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-gray-800/80 pb-6 md:pb-0 pl-4 md:pl-8 pr-0 md:pr-6 md:sticky md:top-6 self-start">
          <h3 className="text-2xl font-bold flex items-center gap-3 text-white mb-4 px-2">
            <Settings className="w-7 h-7 text-blue-400" /> Settings
          </h3>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'categories' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.15)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'}`}
          >
            <FolderTree className="w-5 h-5" />
            Categories
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${activeTab === 'templates' ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200 border border-transparent'}`}
          >
            <Bookmark className="w-5 h-5" />
            Templates
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === 'categories' && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h4 className="text-xl font-semibold flex items-center gap-3 text-gray-200">
                <FolderTree className="w-6 h-6 text-emerald-400" /> Category Management
              </h4>
          
          <form onSubmit={handleAddCategory} className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700/80 shadow-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">New Category</label>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Type Toggle */}
                <div className="flex bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shrink-0">
                  <button type="button" onClick={() => setNewCategoryType('Expense')} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${newCategoryType === 'Expense' ? 'bg-rose-500 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Expense</button>
                  <button type="button" onClick={() => setNewCategoryType('Income')} className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${newCategoryType === 'Income' ? 'bg-emerald-500 text-white' : 'text-gray-400 hover:bg-gray-800'}`}>Income</button>
                </div>
                
                {/* Name Input */}
                <input type="text" required value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category Name (e.g. Groceries)" className="w-full sm:flex-1 bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500 shadow-inner" />

                {/* Icon Selector */}
                <button 
                  type="button" 
                  onClick={() => setIsIconSelectorOpen(!isIconSelectorOpen)}
                  className="flex items-center justify-between w-full sm:w-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 hover:border-gray-500 transition-colors shadow-inner shrink-0"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {iconToRender ? (
                      <div className={`p-1.5 rounded-lg ${selectedIconColors.bg} shrink-0`}>
                        {React.createElement(iconToRender, { className: `w-5 h-5 ${selectedIconColors.color}` })}
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-gray-800 border border-dashed border-gray-600 flex items-center justify-center text-gray-500 font-bold shrink-0">
                        ?
                      </div>
                    )}
                    <span className="font-medium text-sm truncate">{newCategoryIcon ? newCategoryIcon : "Select icon"}</span>
                  </div>
                  {isIconSelectorOpen ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0 ml-2" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0 ml-2" />}
                </button>
                
                {/* Save Button */}
                <button type="submit" disabled={isAddingCategory || !newCategoryName.trim()} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer whitespace-nowrap">Save</button>
              </div>
            </div>
            
            {/* Expanded Icon Grid */}
            <div className={`transition-all duration-300 overflow-hidden ${isIconSelectorOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="bg-gray-900/60 p-4 rounded-xl border border-gray-800/80 mt-2">
                <div className="grid grid-cols-8 sm:grid-cols-12 md:grid-cols-16 gap-1.5 sm:gap-2 max-h-[200px] overflow-y-auto p-1.5 pr-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
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
                        className={`p-1.5 sm:p-2 rounded-lg flex flex-col items-center justify-center transition-all border-2 ${isSelected ? 'bg-gray-800 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-110 z-10' : 'bg-gray-800 border-gray-700/50 hover:border-gray-500 hover:bg-gray-750'} ${!isSelected && iconObj.bg} ${!isSelected && iconObj.color}`}
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
          <div className="text-center py-20 bg-gray-900/50 border border-dashed border-gray-700 rounded-3xl mt-8">
            <p className="text-gray-400 text-lg mb-6">Your workspace is clean. Create some categories to start.</p>
            <button onClick={seedDefaultCategories} className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-8 py-4 rounded-xl transition-all shadow-lg shadow-gray-900/50 active:scale-95">Load Starter Categories</button>
          </div>
        ) : (
          <div className="bg-gray-900/40 rounded-2xl border border-gray-700/80 overflow-hidden shadow-lg mt-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-gray-800/80 border-b border-gray-700/80">
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-400 font-semibold w-[25%]">Category</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-400 font-semibold w-[25%]">Monthly Target</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-400 font-semibold w-[40%]">Subcategories</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-400 font-semibold text-right w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
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
                      <tr key={cat.id} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="px-6 py-4 align-top">
                          <div className="flex items-center gap-3 mt-1">
                            <div className={`p-2 rounded-lg ${iconColors.bg}`}>
                              <CatIcon className={`w-5 h-5 ${iconColors.color}`} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-100 font-bold">{cat.name}</span>
                              <span className={`text-[10px] uppercase font-bold tracking-widest mt-0.5 ${cat.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>{cat.type || 'Expense'}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top">
                          {cat.type === 'Income' ? (
                            <span className="text-gray-600 text-xs italic mt-2 block">N/A</span>
                          ) : (
                            <div className="flex flex-col gap-1 mt-1">
                              {editingTargetId === cat.id ? (
                                <div className="flex gap-2 bg-gray-900/50 p-1.5 rounded-lg border border-blue-500/50 focus-within:border-blue-400 transition-colors">
                                  <input 
                                    type="number" 
                                    value={editTargetValue} 
                                    onChange={(e) => setEditTargetValue(e.target.value)} 
                                    placeholder="Target amount..." 
                                    className="w-full bg-transparent px-2 text-sm text-gray-100 focus:outline-none placeholder-gray-500 min-w-0" 
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
                                  <button onClick={() => { updateCategoryTarget(cat.id, editTargetValue); setEditingTargetId(null); }} className="text-blue-400 hover:text-blue-300 px-2 shrink-0"><Check className="w-4 h-4" /></button>
                                  <button onClick={() => setEditingTargetId(null)} className="text-gray-500 hover:text-gray-400 px-2 shrink-0"><X className="w-4 h-4" /></button>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5 group/target cursor-pointer w-full p-2 -ml-2 rounded-lg hover:bg-gray-800/50 transition-colors" onClick={() => { setEditingTargetId(cat.id); setEditTargetValue(cat.target ? cat.target.toString() : ''); }}>
                                  {cat.target ? (
                                    <>
                                      <div className="flex items-center gap-2">
                                        <span className="text-gray-200 font-bold text-sm">Rs. {parseFloat(cat.target).toLocaleString('en-US')}</span>
                                        <Edit2 className="w-3 h-3 text-gray-500 opacity-0 group-hover/target:opacity-100 transition-opacity" />
                                      </div>
                                      <div className="flex flex-col gap-1 w-full max-w-[200px]">
                                        <div className="flex justify-between items-center text-[11px]">
                                          <span className={isOverBudget ? 'text-rose-400 font-medium' : 'text-gray-400'}>Spent: Rs. {spentThisMonth.toLocaleString('en-US')}</span>
                                          <span className="text-gray-500">{Math.round((spentThisMonth / cat.target) * 100)}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                          <div className={`h-full rounded-full ${isOverBudget ? 'bg-rose-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((spentThisMonth / cat.target) * 100, 100)}%` }}></div>
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
                                  <div key={sub} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-md text-xs font-medium text-gray-300">
                                    <span>{sub}</span>
                                    <button onClick={() => handleDeleteSubcategory(cat.id, sub)} className="text-gray-500 hover:text-rose-400 transition-colors ml-1 hover:bg-rose-400/10 rounded"><X className="w-3 h-3" /></button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-500 text-xs italic mt-2">No subcategories</span>
                            )}
                            <div className="flex gap-2 bg-gray-900/50 p-1.5 rounded-lg border border-gray-700/50 focus-within:border-blue-500/50 transition-colors max-w-sm">
                              <input type="text" value={newSubcategoryNames[cat.id] || ''} onChange={(e) => handleSubcategoryChange(cat.id, e.target.value)} placeholder="New subcategory..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(cat.id); } }} className="flex-1 bg-transparent px-2 text-sm text-gray-100 focus:outline-none placeholder-gray-500" />
                              <button onClick={() => handleAddSubcategory(cat.id)} disabled={!newSubcategoryNames[cat.id]?.trim()} className="bg-gray-700 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs font-medium transition-colors disabled:opacity-50">Add</button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 align-top text-right">
                          <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors cursor-pointer inline-flex mt-1" title="Delete Category"><Trash2 className="w-5 h-5" /></button>
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
              <h4 className="text-xl font-semibold flex items-center gap-3 text-gray-200">
                <Bookmark className="w-6 h-6 text-purple-400" /> Expense Templates
              </h4>
          
          {!templates || templates.length === 0 ? (
            <div className="bg-gray-900/30 border border-dashed border-gray-700 rounded-2xl p-8 text-center">
              <p className="text-gray-500">No templates saved yet. You can save templates when adding a new expense.</p>
            </div>
          ) : (
          <div className="bg-gray-900/40 rounded-2xl border border-gray-700/80 overflow-hidden shadow-lg mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-gray-800/80 border-b border-gray-700/80">
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-400 font-semibold w-[22%]">Template Name</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-400 font-semibold w-[18%]">Category</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-400 font-semibold w-[14%]">Amount</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-400 font-semibold w-[18%]">Cycle Tracking</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-400 font-semibold w-[18%]">Description</th>
                    <th className="px-6 py-4 text-xs uppercase tracking-wider text-gray-400 font-semibold text-right w-[10%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {templates.map(tpl => {
                    if (editingTemplateId === tpl.id) {
                      const selectedCat = categories.find(c => c.name === editFormData.category);
                      return (
                        <tr key={tpl.id} className="bg-gray-800/50">
                          <td colSpan="6" className="p-4">
                            <div className="bg-gray-900/80 border border-blue-500/50 rounded-xl p-5 shadow-inner">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1 block">Name</label>
                                  <input type="text" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1 block">Amount (Optional)</label>
                                  <input type="text" inputMode="decimal" value={editFormData.amount} onChange={e => setEditFormData({...editFormData, amount: e.target.value.replace(/[^0-9.]/g, '')})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" placeholder="0.00" />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1 block">Category</label>
                                  <select value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value, subcategory: ''})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 [&>option]:bg-gray-900">
                                    <option value="" disabled>Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                  </select>
                                </div>
                                {selectedCat && selectedCat.subcategories && selectedCat.subcategories.length > 0 ? (
                                  <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1 block">Subcategory</label>
                                    <select value={editFormData.subcategory} onChange={e => setEditFormData({...editFormData, subcategory: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500 [&>option]:bg-gray-900">
                                      <option value="">General</option>
                                      {selectedCat.subcategories.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </div>
                                ) : (
                                  <div>
                                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1 block">Description (Optional)</label>
                                    <input type="text" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" placeholder="e.g. Monthly Wifi Bill" />
                                  </div>
                                )}
                                {selectedCat && selectedCat.subcategories && selectedCat.subcategories.length > 0 && (
                                  <div className="md:col-span-2">
                                    <label className="text-[10px] uppercase tracking-widest text-gray-500 font-bold mb-1 block">Description (Optional)</label>
                                    <input type="text" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" placeholder="e.g. Monthly Wifi Bill" />
                                  </div>
                                )}

                                {/* Cycle Tracking Settings */}
                                <div className="md:col-span-2 bg-gray-800/40 p-3 rounded-xl border border-gray-700/60 mt-1">
                                  <div className="flex items-center justify-between cursor-pointer py-1" onClick={() => setEditFormData({...editFormData, trackCycle: !editFormData.trackCycle})}>
                                    <div className="flex items-center gap-2">
                                      <RotateCw className={`w-4 h-4 ${editFormData.trackCycle ? 'text-emerald-400' : 'text-gray-400'}`} />
                                      <div>
                                        <span className="text-xs font-bold text-gray-200">Track Renewal / Cycle</span>
                                        <p className="text-[10px] text-gray-500">Show progress bar in Add Expense templates</p>
                                      </div>
                                    </div>
                                    <div className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out shadow-inner ${editFormData.trackCycle ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                                      <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${editFormData.trackCycle ? 'translate-x-4' : 'translate-x-0'}`}></div>
                                    </div>
                                  </div>

                                  {editFormData.trackCycle && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 mt-2 border-t border-gray-700/50 animate-in fade-in duration-200">
                                      <div>
                                        <div className="flex items-center justify-between mb-1">
                                          <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Cycle Period (Days)</label>
                                          <div className="flex gap-1">
                                            {['7', '14', '30', '60'].map((d) => (
                                              <button
                                                key={d}
                                                type="button"
                                                onClick={() => setEditFormData({...editFormData, cycleDays: d})}
                                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition-all ${editFormData.cycleDays === d ? 'bg-emerald-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
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
                                          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-100 font-bold focus:outline-none focus:border-emerald-500" 
                                          placeholder="30" 
                                        />
                                      </div>
                                      <div>
                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Last Paid Date</label>
                                        <DateTimePicker 
                                          date={editFormData.lastPaidDate || new Date().toLocaleDateString('en-CA')} 
                                          setDate={(newDate) => setEditFormData({...editFormData, lastPaidDate: newDate})} 
                                          hideTime={true} 
                                        />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                                <button onClick={() => setEditingTemplateId(null)} className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">Cancel</button>
                                <button onClick={() => handleSaveEdit(tpl.id)} disabled={!editFormData.name.trim() || !editFormData.category} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">Save</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr key={tpl.id} className="hover:bg-gray-800/30 transition-colors group">
                        <td className="px-6 py-4 align-middle">
                          <span className="font-bold text-gray-200 text-base">{tpl.name}</span>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-md text-xs font-medium text-gray-300">{tpl.category}</span>
                            {tpl.subcategory && <span className="bg-gray-800 border border-gray-700 px-2.5 py-1 rounded-md text-xs font-medium text-gray-400">{tpl.subcategory}</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {tpl.amount ? (
                            <span className="text-gray-200 font-mono text-sm bg-gray-900/50 px-2 py-1 rounded border border-gray-800">{tpl.amount}</span>
                          ) : (
                            <span className="text-gray-600 text-xs italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {tpl.trackCycle ? (
                            <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-xs text-emerald-400 font-semibold">
                              <RotateCw className="w-3 h-3 shrink-0" />
                              <span>{tpl.cycleDays || 30} days</span>
                            </div>
                          ) : (
                            <span className="text-gray-500 text-xs">Off</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle">
                          {(tpl.description || tpl.desc) ? (
                            <span className="text-gray-400 text-sm">{tpl.description || tpl.desc}</span>
                          ) : (
                            <span className="text-gray-600 text-xs italic">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 align-middle text-right">
                          <div className="flex justify-end gap-1">
                            <button onClick={() => handleEditClick(tpl)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors cursor-pointer" title="Edit Template">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => deleteTemplate(tpl.id)} className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors cursor-pointer" title="Delete Template">
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
