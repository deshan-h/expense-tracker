import React, { useState } from 'react';
import { List, Trash2, Users, CheckCircle2, ChevronDown, ChevronUp, History } from 'lucide-react';

const HistoryTab = ({ 
  transactions, 
  formatLKR, 
  handleDeleteTransaction,
  activeLentTab,
  setActiveLentTab,
  totalPendingLent,
  pendingLent,
  handleMarkPaidLentMoney,
  paidLent,
  showPaid,
  setShowPaid
}) => {
  const [historyView, setHistoryView] = useState('transactions'); // 'transactions' or 'lent'

  return (
    <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-lg">
      
      {/* Top Level History Toggle */}
      <div className="flex p-1 bg-gray-900 rounded-2xl w-full max-w-md mx-auto mb-8">
        <button 
          type="button" 
          onClick={() => setHistoryView('transactions')} 
          className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${historyView === 'transactions' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <History className="w-4 h-4" /> Transactions
        </button>
        <button 
          type="button" 
          onClick={() => setHistoryView('lent')} 
          className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${historyView === 'lent' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200'}`}
        >
          <Users className="w-4 h-4" /> Lent Money
        </button>
      </div>

      {historyView === 'transactions' && (
        <div>
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <List className="w-5 h-5 text-emerald-400" /> Recent Transactions
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="pb-4 font-medium">Description</th>
                  <th className="pb-4 font-medium hidden md:table-cell">Category</th>
                  <th className="pb-4 font-medium">Date</th>
                  <th className="pb-4 font-medium text-right">Amount</th>
                  <th className="pb-4 font-medium text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-gray-500">No transactions found.</td>
                  </tr>
                ) : (
                  transactions.map(t => (
                    <tr key={t.id} className="hover:bg-gray-750/50 transition-colors group">
                      <td className="py-4">
                        <div className="font-medium text-gray-200">{t.description}</div>
                        <div className="text-xs text-gray-500 md:hidden">{t.category} {t.subcategory && `(${t.subcategory})`}</div>
                      </td>
                      <td className="py-4 hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full border border-gray-600/50">
                          {t.category}{t.subcategory && <><span className="text-gray-500">/</span><span className="text-emerald-400/80">{t.subcategory}</span></>}
                        </span>
                      </td>
                      <td className="py-4 text-gray-400 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                      <td className={`py-4 text-right font-medium whitespace-nowrap ${t.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.type === 'Income' ? '+' : '-'}Rs. {formatLKR(t.amount)}
                      </td>
                      <td className="py-4 text-right">
                        <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {historyView === 'lent' && (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" /> Owed Tracker
            </h4>
          </div>

          {/* List View Tabs (Family / Friends) */}
          <div className="flex p-1 bg-gray-800 rounded-xl w-full mb-6 border border-gray-700 max-w-sm">
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

          {/* Timeline */}
          <div className="flex-1 space-y-6">
            
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
                          className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-white bg-emerald-400/10 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-colors shadow-sm cursor-pointer"
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
                  className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors py-3 px-2 rounded-xl hover:bg-gray-800 cursor-pointer"
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
      )}
    </div>
  );
};

export default HistoryTab;
