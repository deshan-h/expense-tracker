import React, { useState } from 'react';
import { FolderTree, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';
import { AVAILABLE_ICONS, getIconComponent, getIconColor } from '../utils/icons';

const CategoriesTab = ({
  handleAddCategory,
  newCategoryName,
  setNewCategoryName,
  newCategoryIcon,
  setNewCategoryIcon,
  isAddingCategory,
  seedDefaultCategories,
  categories,
  handleDeleteCategory,
  handleDeleteSubcategory,
  newSubcategoryNames,
  handleSubcategoryChange,
  handleAddSubcategory
}) => {
  const [isIconSelectorOpen, setIsIconSelectorOpen] = useState(false);
  
  const SelectedIcon = newCategoryIcon ? getIconComponent(newCategoryIcon) : null;
  const selectedIconColors = newCategoryIcon ? getIconColor(newCategoryIcon) : { bg: 'bg-gray-800', color: 'text-gray-400' };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] overflow-hidden">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="px-4 md:px-8 py-4 w-full max-w-full relative z-10">
        <div className="flex flex-col mb-8 gap-6">
          <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
            <FolderTree className="w-7 h-7 text-blue-400" /> Category Management
          </h3>
          
          <form onSubmit={handleAddCategory} className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700/80 shadow-lg space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">New Category</label>
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Name Input */}
                <input type="text" required value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category Name (e.g. Groceries)" className="w-full sm:flex-1 bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500 shadow-inner" />

                {/* Icon Selector */}
                <button 
                  type="button" 
                  onClick={() => setIsIconSelectorOpen(!isIconSelectorOpen)}
                  className="flex items-center justify-between w-full sm:w-48 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-gray-100 hover:border-gray-500 transition-colors shadow-inner shrink-0"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    {SelectedIcon ? (
                      <div className={`p-1.5 rounded-lg ${selectedIconColors.bg} shrink-0`}>
                        <SelectedIcon className={`w-5 h-5 ${selectedIconColors.color}`} />
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
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 border border-dashed border-gray-700 rounded-3xl mt-8">
            <p className="text-gray-400 text-lg mb-6">Your workspace is clean. Create some categories to start.</p>
            <button onClick={seedDefaultCategories} className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-8 py-4 rounded-xl transition-all shadow-lg shadow-gray-900/50 active:scale-95">Load Starter Categories</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-8">
            {categories.map((cat) => {
              const CatIcon = getIconComponent(cat.icon);
              const iconColors = getIconColor(cat.icon);
              return (
                <div key={cat.id} className="bg-gray-900/60 backdrop-blur-sm border border-gray-700/80 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-gray-600 group">
                  <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-gray-800/80 to-gray-900 border-b border-gray-700/80">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${iconColors.bg}`}>
                        <CatIcon className={`w-5 h-5 ${iconColors.color}`} />
                      </div>
                      <span className="text-gray-100 font-bold text-xl">{cat.name}</span>
                    </div>
                    <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors cursor-pointer" title="Delete Category"><Trash2 className="w-5 h-5" /></button>
                  </div>
                  <div className="p-6">
                    {cat.subcategories && cat.subcategories.length > 0 ? (
                      <div className="flex flex-wrap gap-2 mb-6">
                        {cat.subcategories.map(sub => (
                          <div key={sub} className="flex items-center gap-2 bg-gray-800/80 border border-gray-700/50 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 shadow-sm">
                            <span>{sub}</span>
                            <button onClick={() => handleDeleteSubcategory(cat.id, sub)} className="text-gray-500 hover:text-rose-400 transition-colors ml-1 p-0.5 rounded-md hover:bg-rose-400/10"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-800/30 border border-gray-800 border-dashed rounded-xl p-4 text-center mb-6"><p className="text-gray-500 text-sm">No subcategories yet.</p></div>
                    )}
                    <div className="flex gap-2 bg-gray-800/80 p-2 rounded-xl border border-gray-700/50 focus-within:border-blue-500/50 transition-colors shadow-inner">
                      <input type="text" value={newSubcategoryNames[cat.id] || ''} onChange={(e) => handleSubcategoryChange(cat.id, e.target.value)} placeholder="Add subcategory..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(cat.id); } }} className="flex-1 bg-transparent px-3 text-sm text-gray-100 focus:outline-none placeholder-gray-500" />
                      <button onClick={() => handleAddSubcategory(cat.id)} disabled={!newSubcategoryNames[cat.id]?.trim()} className="bg-gray-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:hover:bg-gray-700 cursor-pointer">Add</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoriesTab;
