import React from 'react';
import { Handshake } from 'lucide-react';

const MoneyLentTab = ({
  handleAddLentMoney,
  lentType,
  setLentType,
  lentAmount,
  setLentAmount,
  lentName,
  setLentName,
  lentDescription,
  setLentDescription,
  lentDate,
  setLentDate
}) => {
  return (
    <div className="bg-gray-800 p-6 md:p-10 rounded-3xl border border-gray-700 shadow-2xl max-w-full mx-auto overflow-hidden">
      <form onSubmit={handleAddLentMoney} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* COLUMN 1 */}
        <div className="space-y-8 flex flex-col justify-start">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-amber-500/10 rounded-full">
              <Handshake className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Lend Money</h3>
              <p className="text-sm text-gray-400">Keep track of money you lent to others</p>
            </div>
          </div>

          <div className="flex p-1 bg-gray-900 rounded-2xl w-full mx-auto">
            <button type="button" onClick={() => setLentType('Family')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${lentType === 'Family' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>Family</button>
            <button type="button" onClick={() => setLentType('Friends')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${lentType === 'Friends' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>Friends</button>
          </div>

          <div className="text-center bg-gray-900/30 p-8 rounded-3xl border border-gray-700/50">
            <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-widest">Amount Lent</p>
            <div className="flex items-center justify-center text-6xl md:text-7xl font-bold text-white group">
              <span className="text-gray-500 mr-4 text-4xl">Rs.</span>
              <input type="number" step="0.01" required value={lentAmount} onChange={(e) => setLentAmount(e.target.value)} className="bg-transparent border-none outline-none text-left w-[220px] md:w-[300px] focus:ring-0 placeholder-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
            </div>
            <div className={`h-1 w-48 bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-${lentType === 'Family' ? 'amber' : 'blue'}-500 group-focus-within:opacity-100 transition-all duration-500 rounded-full`}></div>
          </div>

          <div className="space-y-4 bg-gray-900/30 p-6 rounded-3xl border border-gray-700/50">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Recipient</p>
            <div className={`relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-${lentType === 'Family' ? 'amber' : 'blue'}-500 focus-within:ring-1 focus-within:ring-${lentType === 'Family' ? 'amber' : 'blue'}-500 transition-all overflow-hidden`}>
              <input type="text" required value={lentName} onChange={(e) => setLentName(e.target.value)} className="w-full bg-transparent px-5 py-4 text-base text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Who did you lend to?" />
            </div>
            
            {lentType === 'Family' && (
              <div className="flex flex-wrap gap-2 px-1">
                {['Mother', 'Father', 'Brother', 'Sister'].map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setLentName(name)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 cursor-pointer ${lentName === name ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2 */}
        <div className="flex flex-col justify-between bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50">
          <div className="space-y-6">
            <p className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-2">Details</p>

            <div className={`relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-${lentType === 'Family' ? 'amber' : 'blue'}-500 focus-within:ring-1 focus-within:ring-${lentType === 'Family' ? 'amber' : 'blue'}-500 transition-all overflow-hidden`}>
              <input type="text" value={lentDescription} onChange={(e) => setLentDescription(e.target.value)} className="w-full bg-transparent px-5 py-4 text-base text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Notes (Optional)" />
            </div>

            <div className={`relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-${lentType === 'Family' ? 'amber' : 'blue'}-500 focus-within:ring-1 focus-within:ring-${lentType === 'Family' ? 'amber' : 'blue'}-500 transition-all overflow-hidden`}>
              <input type="date" required value={lentDate} onChange={(e) => setLentDate(e.target.value)} className="w-full bg-transparent px-5 py-4 text-base text-gray-100 placeholder-gray-500 focus:outline-none [color-scheme:dark]" />
            </div>
          </div>

          <button type="submit" className={`hidden lg:flex w-full bg-gradient-to-r ${lentType === 'Family' ? 'from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-500/20' : 'from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-blue-500/20'} text-white font-bold py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] cursor-pointer items-center justify-center gap-2 text-xl mt-8`}>
            <Handshake className="w-7 h-7" /> Save Record
          </button>
        </div>

        {/* MOBILE SAVE BUTTON */}
        <button type="submit" className={`w-full lg:hidden bg-gradient-to-r ${lentType === 'Family' ? 'from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-500/20' : 'from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-blue-500/20'} text-white font-bold py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xl mt-4`}>
          <Handshake className="w-7 h-7" /> Save Record
        </button>

      </form>
    </div>
  );
};

export default MoneyLentTab;
