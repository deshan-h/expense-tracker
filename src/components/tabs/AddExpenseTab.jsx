import React from 'react';
import { PlusCircle, TrendingUp } from 'lucide-react';

const AddExpenseTab = ({ 
  handleAddTransaction, 
  type, 
  setType, 
  amount, 
  setAmount, 
  description, 
  setDescription, 
  categories, 
  category, 
  setCategory, 
  subcategory, 
  setSubcategory, 
  selectedCatObj 
}) => {
  return (
    <div className="bg-gray-800 p-6 md:p-10 rounded-3xl border border-gray-700 shadow-2xl max-w-full mx-auto overflow-hidden">
      <form onSubmit={handleAddTransaction} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="space-y-8 flex flex-col justify-center">
          <div className="flex p-1 bg-gray-900 rounded-2xl w-full mx-auto">
            <button type="button" onClick={() => setType('Expense')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${type === 'Expense' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-400 hover:text-gray-200'}`}>Expense</button>
            <button type="button" onClick={() => setType('Income')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${type === 'Income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-200'}`}>Income</button>
          </div>

          <div className="text-center bg-gray-900/30 p-8 rounded-3xl border border-gray-700/50">
            <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-widest">Amount</p>
            <div className="flex items-center justify-center text-6xl md:text-7xl font-bold text-white group">
              <span className="text-gray-500 mr-4 text-4xl">Rs.</span>
              <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-transparent border-none outline-none text-left w-[220px] md:w-[300px] focus:ring-0 placeholder-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
            </div>
            <div className="h-1 w-48 bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-blue-500 group-focus-within:opacity-100 transition-all duration-500 rounded-full"></div>
          </div>
          
          <div className="relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden">
            <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent px-5 py-5 text-lg text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="What was this for? (e.g. Bought groceries)" />
          </div>

          <button type="submit" disabled={type === 'Expense' && categories.length === 0} className="w-full lg:hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl">
            <PlusCircle className="w-7 h-7" /> Save {type}
          </button>
        </div>

        {type === 'Expense' ? (
          <div className="space-y-6 bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Select Category</p>
                {categories.length === 0 && <p className="text-xs text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20">Add categories first</p>}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                {categories.map(c => (
                  <button key={c.id} type="button" onClick={() => setCategory(c.name)} className={`py-4 px-3 rounded-2xl text-sm md:text-base font-medium transition-all active:scale-95 text-center truncate ${category === c.name ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}>{c.name}</button>
                ))}
              </div>

              {selectedCatObj?.subcategories?.length > 0 && (
                <div className="mt-8">
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Subcategory (Optional)</p>
                  <div className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    <button type="button" onClick={() => setSubcategory('')} className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-medium transition-all active:scale-95 ${subcategory === '' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}>General</button>
                    {selectedCatObj.subcategories.map(sub => (
                      <button key={sub} type="button" onClick={() => setSubcategory(sub)} className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-medium transition-all active:scale-95 ${subcategory === sub ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}>{sub}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <button type="submit" disabled={type === 'Expense' && categories.length === 0} className="hidden lg:flex w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2 text-xl mt-8">
              <PlusCircle className="w-7 h-7" /> Save {type}
            </button>
          </div>
        ) : (
          <div className="hidden lg:flex flex-col items-center justify-center bg-gray-900/50 rounded-3xl border border-gray-700/50 border-dashed">
            <TrendingUp className="w-24 h-24 text-emerald-500/20 mb-4" />
            <p className="text-gray-500 font-medium">Ready to record Income.</p>
             <button type="submit" className="w-2/3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xl mt-8">
              <PlusCircle className="w-7 h-7" /> Save Income
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddExpenseTab;
