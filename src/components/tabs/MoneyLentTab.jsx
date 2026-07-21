import React from 'react';
import { Handshake, Users, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

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
  activeLentTab,
  setActiveLentTab,
  totalPendingLent,
  formatLKR,
  pendingLent,
  handleMarkPaidLentMoney,
  paidLent,
  showPaid,
  setShowPaid
}) => {
  return (
    <div className="bg-gray-800 p-6 md:p-10 rounded-3xl border border-gray-700 shadow-2xl max-w-full mx-auto overflow-hidden">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 xl:h-[750px]">
        
        {/* Left Column: Form */}
        <form onSubmit={handleAddLentMoney} className="space-y-8 flex flex-col justify-center">
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
            <button type="button" onClick={() => setLentType('Family')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${lentType === 'Family' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-200'}`}>Family</button>
            <button type="button" onClick={() => setLentType('Friends')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${lentType === 'Friends' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200'}`}>Friends</button>
          </div>

          <div className="text-center bg-gray-900/30 p-8 rounded-3xl border border-gray-700/50">
            <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-widest">Amount Lent</p>
            <div className="flex items-center justify-center text-6xl md:text-7xl font-bold text-white group">
              <span className="text-gray-500 mr-4 text-4xl">Rs.</span>
              <input type="number" step="0.01" required value={lentAmount} onChange={(e) => setLentAmount(e.target.value)} className="bg-transparent border-none outline-none text-left w-[220px] md:w-[300px] focus:ring-0 placeholder-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
            </div>
            <div className={`h-1 w-48 bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-${lentType === 'Family' ? 'amber' : 'blue'}-500 group-focus-within:opacity-100 transition-all duration-500 rounded-full`}></div>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all overflow-hidden">
                <input type="text" required value={lentName} onChange={(e) => setLentName(e.target.value)} className="w-full bg-transparent px-5 py-5 text-lg text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Who did you lend to?" />
              </div>
              <div className="relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all overflow-hidden">
                <input type="text" value={lentDescription} onChange={(e) => setLentDescription(e.target.value)} className="w-full bg-transparent px-5 py-5 text-lg text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Notes (Optional)" />
              </div>
            </div>
            
            {lentType === 'Family' && (
              <div className="flex flex-wrap gap-2 px-1">
                {['Mother', 'Father', 'Brother', 'Sister'].map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setLentName(name)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${lentName === name ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className={`w-full bg-gradient-to-r ${lentType === 'Family' ? 'from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-500/20' : 'from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-blue-500/20'} text-white font-bold py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xl mt-4`}>
            <Handshake className="w-7 h-7" /> Save Record
          </button>
        </form>

        {/* Right Column: Timeline UI */}
        <div className="bg-gray-900/50 p-6 md:p-8 rounded-3xl border border-gray-700/50 flex flex-col h-full max-h-[800px]">
          
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" /> Owed Tracker
            </h4>
          </div>

          {/* List View Tabs (Family / Friends) */}
          <div className="flex p-1 bg-gray-800 rounded-xl w-full mb-6 border border-gray-700">
            <button type="button" onClick={() => setActiveLentTab('Family')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeLentTab === 'Family' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>Family Timeline</button>
            <button type="button" onClick={() => setActiveLentTab('Friends')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeLentTab === 'Friends' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>Friends Timeline</button>
          </div>

          {/* Total Pending Dashboard Panel */}
          <div className={`p-5 rounded-2xl mb-8 flex justify-between items-center ${activeLentTab === 'Family' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
            <div>
              <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${activeLentTab === 'Family' ? 'text-amber-500' : 'text-blue-500'}`}>Total Owed To You ({activeLentTab})</p>
              <h2 className="text-3xl font-bold text-white">Rs. {formatLKR(totalPendingLent)}</h2>
            </div>
          </div>

          {/* Scrollable Timeline */}
          <div className="flex-1 overflow-y-auto pr-4 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
            
            {/* Active (Pending) Timeline List */}
            <div className="relative border-l-2 border-gray-700 ml-4 space-y-8 pb-4">
              {pendingLent.length === 0 ? (
                <p className="text-gray-500 pl-6 pt-2 text-sm italic">No active records for {activeLentTab}.</p>
              ) : (
                pendingLent.map(record => (
                  <div key={record.id} className="relative pl-6">
                    {/* Timeline Node */}
                    <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-gray-900 ${activeLentTab === 'Family' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                    
                    <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group shadow-md transition-all hover:border-gray-500">
                      <div>
                        <span className="font-bold text-gray-100 text-lg">{record.name}</span>
                        {record.description && <p className="text-sm text-gray-400 mt-1">{record.description}</p>}
                        <p className="text-xs text-gray-500 mt-2 font-medium">Lent on {new Date(record.date).toLocaleDateString()}</p>
                      </div>
                      <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
                        <span className="text-xl font-bold text-gray-100">Rs. {formatLKR(record.amount)}</span>
                        <button 
                          onClick={() => handleMarkPaidLentMoney(record.id)}
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-white bg-emerald-400/10 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-colors shadow-sm"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark Paid
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Paid History Accordion Section */}
            {paidLent.length > 0 && (
              <div className="pt-4 border-t border-gray-800/80">
                <button 
                  onClick={() => setShowPaid(!showPaid)} 
                  className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors py-3 px-2 rounded-xl hover:bg-gray-800"
                >
                  <span>View Paid History ({paidLent.length})</span>
                  {showPaid ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>

                {showPaid && (
                  <div className="relative border-l-2 border-emerald-900/30 ml-4 mt-6 space-y-6 pb-6">
                    {paidLent.map(record => (
                      <div key={record.id} className="relative pl-6 opacity-50 hover:opacity-100 transition-opacity">
                        {/* Disabled Timeline Node */}
                        <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-gray-900 bg-emerald-700" />
                        
                        <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800/80 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-gray-500 line-through decoration-gray-600">{record.name}</span>
                            <p className="text-[11px] text-emerald-500/80 mt-1 uppercase tracking-wider font-bold">Paid on {record.paidDate ? new Date(record.paidDate).toLocaleDateString() : 'Unknown'}</p>
                          </div>
                          <span className="text-md font-bold text-gray-600">Rs. {formatLKR(record.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
};

export default MoneyLentTab;
