import React from 'react';
import { FolderTree, Trash2, X } from 'lucide-react';
import { AVAILABLE_ICONS, getIconComponent, getIconColor } from '../../utils/icons';

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
  return (
    <div className="relative w-full overflow-hidden">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="bg-gray-900/40 backdrop-blur-2xl p-6 md:p-10 rounded-[2rem] border border-gray-700/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] max-w-full mx-auto relative group transition-all duration-700 hover:border-gray-600/60 z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="relative z-10">
      <div className="flex flex-col mb-8 gap-6">
        <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
          <FolderTree className="w-7 h-7 text-blue-400" /> Category Management
        </h3>
        
        <form onSubmit={handleAddCategory} className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">New Category Details</label>
            <div className="flex gap-2">
              <input type="text" required value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Category Name (e.g. Groceries)" className="w-full bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500" />
              <button type="submit" disabled={isAddingCategory || !newCategoryName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer whitespace-nowrap">Save</button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Select Icon</label>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-3 max-h-[160px] overflow-y-auto p-2 -ml-2 -mt-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
              {AVAILABLE_ICONS.map((iconObj) => {
                const IconComponent = getIconComponent(iconObj.name);
                const isSelected = newCategoryIcon === iconObj.name;
                return (
                  <button
                    key={iconObj.name}
                    type="button"
                    onClick={() => setNewCategoryIcon(iconObj.name)}
                    className={`p-3 rounded-xl flex items-center justify-center transition-all border-2 ${isSelected ? 'bg-gray-800 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)] scale-110 z-10' : 'bg-gray-800 border-gray-700 hover:border-gray-500'} ${!isSelected && iconObj.bg} ${!isSelected && iconObj.color}`}
                    title={iconObj.name}
                  >
                    <IconComponent className={`w-6 h-6 ${isSelected ? iconObj.color : ''}`} />
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </div>

      {categories.length === 0 ? (
        <div className="text-center py-20 bg-gray-900/50 border border-dashed border-gray-700 rounded-3xl">
          <p className="text-gray-400 text-lg mb-6">Your workspace is clean. Create some categories to start.</p>
          <button onClick={seedDefaultCategories} className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-8 py-4 rounded-xl transition-all shadow-lg shadow-gray-900/50 active:scale-95">Load Starter Categories</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const CatIcon = getIconComponent(cat.icon);
            const iconColors = getIconColor(cat.icon);
            return (
              <div key={cat.id} className="bg-gray-900/80 border border-gray-700 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-gray-600 group">
                <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${iconColors.bg}`}>
                      <CatIcon className={`w-5 h-5 ${iconColors.color}`} />
                    </div>
                    <span className="text-gray-100 font-bold text-xl">{cat.name}</span>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors cursor-pointer"><Trash2 className="w-5 h-5" /></button>
                </div>
                <div className="p-6">
                  {cat.subcategories && cat.subcategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5 mb-6">
                      {cat.subcategories.map(sub => (
                        <div key={sub} className="flex items-center gap-2 bg-gray-800 border border-gray-700/80 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 shadow-sm">
                          <span>{sub}</span>
                          <button onClick={() => handleDeleteSubcategory(cat.id, sub)} className="text-gray-500 hover:text-rose-400 transition-colors ml-1 p-0.5 rounded-md hover:bg-rose-400/10"><X className="w-4 h-4" /></button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-800/30 border border-gray-800 border-dashed rounded-xl p-4 text-center mb-6"><p className="text-gray-500 text-sm">No subcategories yet.</p></div>
                  )}
                  <div className="flex gap-2 bg-gray-800 p-2 rounded-xl border border-gray-700 focus-within:border-blue-500/50 transition-colors">
                    <input type="text" value={newSubcategoryNames[cat.id] || ''} onChange={(e) => handleSubcategoryChange(cat.id, e.target.value)} placeholder="Add subcategory..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(cat.id); } }} className="flex-1 bg-transparent px-3 text-sm text-gray-100 focus:outline-none placeholder-gray-500" />
                    <button onClick={() => handleAddSubcategory(cat.id)} disabled={!newSubcategoryNames[cat.id]?.trim()} className="bg-gray-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:hover:bg-gray-700">Add</button>
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
