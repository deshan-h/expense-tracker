import React, { useState } from 'react';
import { List, Trash2, Users, CheckCircle2, ChevronDown, ChevronUp, History, Search, Filter, ArrowDownUp, TrendingDown, TrendingUp, Tag, Handshake } from 'lucide-react';

const HistoryTab = ({ 
  transactions, 
  formatLKR, 
  handleDeleteTransaction,
  activeLentTab,
  setActiveLentTab,
  totalPendingLent,
  pendingLent,
  handleDeleteLentMoney,
  paidLent,
  showPaid,
  setShowPaid
}) => {
  const [historyView, setHistoryView] = useState('transactions'); // 'transactions' or 'lent'

  // ============================================
  // ADVANCED FILTERS STATE - EXPENSES
  // ============================================
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All'); 
  const [filterCategory, setFilterCategory] = useState('All'); 
  const [filterStatus, setFilterStatus] = useState('All'); 
  const [sortBy, setSortBy] = useState('Newest'); 

  // ============================================
  // ADVANCED FILTERS STATE - LENT MONEY
  // ============================================
  const [lentSearchQuery, setLentSearchQuery] = useState('');
  const [lentFilterType, setLentFilterType] = useState('All'); // 'All', 'Family', 'Friends'
  const [lentSortBy, setLentSortBy] = useState('Newest'); // 'Newest', 'Oldest', 'Highest', 'Lowest'

  // ============================================
  // DATA PROCESSING - EXPENSES
  // ============================================
  const uniqueCategories = [...new Set(transactions.map(t => t.category))].filter(Boolean);
  
  const filteredAndSortedTransactions = transactions
    .filter(t => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        (t.description && t.description.toLowerCase().includes(searchLower)) || 
        (t.category && t.category.toLowerCase().includes(searchLower)) ||
        (t.subcategory && t.subcategory.toLowerCase().includes(searchLower));
      
      const matchesType = filterType === 'All' || t.type === filterType;
      const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
      
      const isTracked = t.isTracked !== undefined ? t.isTracked : true;
      const matchesStatus = filterStatus === 'All' || 
                            (filterStatus === 'Tracked' && isTracked) || 
                            (filterStatus === 'Untracked' && !isTracked);

      return matchesSearch && matchesType && matchesCategory && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortBy === 'Oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (sortBy === 'Highest') return b.amount - a.amount;
      if (sortBy === 'Lowest') return a.amount - b.amount;
      return 0;
    });


  // ============================================
  // DATA PROCESSING - LENT MONEY
  // ============================================
  const totalPendingFamily = pendingLent.filter(r => r.type === 'Family').reduce((acc, curr) => acc + curr.amount, 0);
  const totalPendingFriends = pendingLent.filter(r => r.type === 'Friends').reduce((acc, curr) => acc + curr.amount, 0);

  const filterAndSortLent = (records) => {
    return records
      .filter(record => {
        const searchLower = lentSearchQuery.toLowerCase();
        const matchesSearch = 
          (record.name && record.name.toLowerCase().includes(searchLower)) ||
          (record.description && record.description.toLowerCase().includes(searchLower));
        
        const matchesType = lentFilterType === 'All' || record.type === lentFilterType;
        
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        // Always sort by the original lend date
        if (lentSortBy === 'Newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (lentSortBy === 'Oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (lentSortBy === 'Highest') return b.amount - a.amount;
        if (lentSortBy === 'Lowest') return a.amount - b.amount;
        return 0;
      });
  };

  const processedPendingLent = filterAndSortLent(pendingLent);
  const processedPaidLent = filterAndSortLent(paidLent);


  return (
    <div className="relative w-full overflow-hidden">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="bg-gray-900/40 backdrop-blur-2xl p-6 md:p-10 rounded-[2rem] border border-gray-700/50 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] max-w-full mx-auto relative group transition-all duration-700 hover:border-gray-600/60 z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        
        <div className="relative z-10">
      {/* Top Level History Toggle */}
      <div className="flex p-1 bg-gray-900 rounded-2xl w-full max-w-md mx-auto mb-8">
        <button 
          type="button" 
          onClick={() => setHistoryView('transactions')} 
          className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${historyView === 'transactions' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
        >
          <History className="w-4 h-4" /> Expenses History
        </button>
        <button 
          type="button" 
          onClick={() => setHistoryView('lent')} 
          className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${historyView === 'lent' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
        >
          <Users className="w-4 h-4" /> Lent Money
        </button>
      </div>

      {/* ---------------- TRANSACTIONS TIMELINE VIEW ---------------- */}
      {historyView === 'transactions' && (
        <div className="flex flex-col">
          
          <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-white">
            <List className="w-6 h-6 text-emerald-400" /> Expenses Timeline
          </h3>

          {/* Advanced Filters Section */}
          <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-700/50 mb-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Advanced Filters</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative col-span-1 md:col-span-2 lg:col-span-1 bg-gray-800 rounded-xl border border-gray-600 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-500 overflow-hidden flex items-center px-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search records..." className="w-full bg-transparent px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none" />
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-600 overflow-hidden flex items-center px-3">
                <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="w-full bg-transparent py-2 text-sm text-gray-300 focus:outline-none appearance-none cursor-pointer">
                  <option value="All">All Types</option>
                  <option value="Expense">Expense Only</option>
                  <option value="Income">Income Only</option>
                </select>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-600 overflow-hidden flex items-center px-3">
                <Tag className="w-4 h-4 text-gray-400 mr-2" />
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="w-full bg-transparent py-2 text-sm text-gray-300 focus:outline-none appearance-none cursor-pointer">
                  <option value="All">All Categories</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-600 overflow-hidden flex items-center px-3">
                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="w-full bg-transparent py-2 text-sm text-gray-300 focus:outline-none appearance-none cursor-pointer">
                  <option value="All">All Statuses</option>
                  <option value="Tracked">Tracked Only</option>
                  <option value="Untracked">Untracked Only</option>
                </select>
              </div>
              <div className="bg-gray-800 rounded-xl border border-gray-600 overflow-hidden flex items-center px-3">
                <ArrowDownUp className="w-4 h-4 text-gray-400 mr-2" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full bg-transparent py-2 text-sm text-gray-300 focus:outline-none appearance-none cursor-pointer">
                  <option value="Newest">Newest First</option>
                  <option value="Oldest">Oldest First</option>
                  <option value="Highest">Highest Amount</option>
                  <option value="Lowest">Lowest Amount</option>
                </select>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 text-right mt-2">
              Showing {filteredAndSortedTransactions.length} of {transactions.length} records
            </div>
          </div>

          {/* Premium Timeline with Headers */}
          <div className="overflow-x-auto bg-gray-900/30 rounded-2xl border border-gray-700/50 shadow-inner p-6">
            <div className="min-w-[900px]">
              
              {/* Headers */}
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-widest pb-4 border-b border-gray-700/50 mb-6 pl-14">
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Subcategory</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right pr-12">Amount</div>
              </div>

              {/* Timeline List */}
              <div className="relative border-l-2 border-gray-700/50 ml-4 space-y-4 pb-4">
                {filteredAndSortedTransactions.length === 0 ? (
                  <p className="text-gray-500 pl-6 pt-2 text-sm italic">No matching transactions found.</p>
                ) : (
                  filteredAndSortedTransactions.map(t => {
                    const isIncome = t.type === 'Income';
                    const isTracked = t.isTracked !== undefined ? t.isTracked : true;
                    
                    return (
                      <div key={t.id} className="relative pl-10 group">
                        {/* Timeline Node */}
                        <div className={`absolute -left-[13px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-gray-900 flex items-center justify-center transition-transform group-hover:scale-125 ${isIncome ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}>
                          {isIncome ? <TrendingUp className="w-3 h-3 text-gray-900" /> : <TrendingDown className="w-3 h-3 text-gray-900" />}
                        </div>
                        
                        {/* Row Content */}
                        <div className="py-3 px-2 rounded-xl hover:bg-gray-800/40 transition-colors grid grid-cols-12 gap-4 items-center border-b border-gray-800/50">
                          
                          {/* Category */}
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold ${isIncome ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                              {t.category}
                            </span>
                          </div>

                          {/* Subcategory */}
                          <div className="col-span-2">
                            {t.subcategory ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-gray-700 text-gray-300 border border-gray-600">
                                {t.subcategory}
                              </span>
                            ) : (
                              <span className="text-gray-600 italic text-sm">-</span>
                            )}
                          </div>

                          {/* Description */}
                          <div className="col-span-3">
                            <div className="font-bold text-gray-100 text-base line-clamp-1">{t.description || 'Untitled'}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">{t.type}</div>
                          </div>

                          {/* Date */}
                          <div className="col-span-2 text-gray-300 text-sm font-medium">
                            {new Date(t.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>

                          {/* Status */}
                          <div className="col-span-1">
                            {!isIncome ? (
                               <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isTracked ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-gray-600/20 text-gray-400 border-gray-600/30'}`}>
                                 {isTracked ? 'Tracked' : 'Untrack'}
                               </span>
                            ) : (
                               <span className="text-gray-600 italic text-sm">-</span>
                            )}
                          </div>

                          {/* Amount & Actions */}
                          <div className="col-span-2 flex items-center justify-end gap-3">
                            <span className={`font-extrabold text-lg whitespace-nowrap ${isIncome ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isIncome ? '+' : '-'}Rs. {formatLKR(t.amount)}
                            </span>
                            <button 
                              onClick={() => handleDeleteTransaction(t.id)} 
                              className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ---------------- LENT MONEY TIMELINE VIEW ---------------- */}
      {historyView === 'lent' && (
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
              <Users className="w-6 h-6 text-blue-400" /> Owed Tracker
            </h4>
          </div>

          {/* Advanced Filters Section */}
          <div className="bg-gray-900/50 p-5 rounded-2xl border border-gray-700/50 mb-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Filter className="w-4 h-4 text-blue-400" />
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">Advanced Filters</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative bg-gray-800 rounded-xl border border-gray-600 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 overflow-hidden flex items-center px-3">
                <Search className="w-4 h-4 text-gray-400" />
                <input type="text" value={lentSearchQuery} onChange={(e) => setLentSearchQuery(e.target.value)} placeholder="Search names or notes..." className="w-full bg-transparent px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none" />
              </div>
              
              {/* Type Filter */}
              <div className="bg-gray-800 rounded-xl border border-gray-600 overflow-hidden flex items-center px-3">
                <select value={lentFilterType} onChange={(e) => setLentFilterType(e.target.value)} className="w-full bg-transparent py-2 text-sm text-gray-300 focus:outline-none appearance-none cursor-pointer">
                  <option value="All">All Types</option>
                  <option value="Family">Family Only</option>
                  <option value="Friends">Friends Only</option>
                </select>
              </div>

              <div className="bg-gray-800 rounded-xl border border-gray-600 overflow-hidden flex items-center px-3">
                <ArrowDownUp className="w-4 h-4 text-gray-400 mr-2" />
                <select value={lentSortBy} onChange={(e) => setLentSortBy(e.target.value)} className="w-full bg-transparent py-2 text-sm text-gray-300 focus:outline-none appearance-none cursor-pointer">
                  <option value="Newest">Newest First</option>
                  <option value="Oldest">Oldest First</option>
                  <option value="Highest">Highest Amount</option>
                  <option value="Lowest">Lowest Amount</option>
                </select>
              </div>
            </div>
            
            <div className="text-xs text-gray-500 text-right mt-2">
              Showing {processedPendingLent.length + processedPaidLent.length} of {pendingLent.length + paidLent.length} records
            </div>
          </div>

          {/* PENDING TIMELINE WITH HEADERS */}
          <div className="overflow-x-auto bg-gray-900/30 rounded-2xl border border-gray-700/50 shadow-inner p-6 mb-8">
            <div className="min-w-[900px]">
              
              <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-widest pb-4 border-b border-gray-700/50 mb-6 pl-14">
                <div className="col-span-3">Recipient</div>
                <div className="col-span-3">Notes</div>
                <div className="col-span-2">Lent Date</div>
                <div className="col-span-1 text-center">Status</div>
                <div className="col-span-2 text-right pr-4">Amount</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              <div className="relative border-l-2 border-gray-700/50 ml-4 space-y-4 pb-4">
                {processedPendingLent.length === 0 ? (
                  <p className="text-gray-500 pl-6 pt-2 text-sm italic">No pending lent records found.</p>
                ) : (
                  processedPendingLent.map(record => {
                    const isFamily = record.type === 'Family';
                    return (
                      <div key={record.id} className="relative pl-10 group">
                        
                        <div className={`absolute -left-[13px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-gray-900 flex items-center justify-center transition-transform group-hover:scale-125 ${isFamily ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}>
                           <span className="w-2 h-2 rounded-full bg-gray-900" />
                        </div>
                        
                        <div className="py-3 px-2 rounded-xl hover:bg-gray-800/40 transition-colors grid grid-cols-12 gap-4 items-center border-b border-gray-800/50">
                          
                          <div className="col-span-3">
                            <div className="font-bold text-gray-100 text-base line-clamp-1">{record.name}</div>
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mt-0.5">{record.type}</div>
                          </div>
                          
                          <div className="col-span-3">
                            {record.description ? (
                              <span className="text-gray-400 text-sm line-clamp-1" title={record.description}>{record.description}</span>
                            ) : (
                              <span className="text-gray-600 italic text-sm">-</span>
                            )}
                          </div>

                          <div className="col-span-2 text-gray-300 text-sm font-medium">
                             {new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                          </div>

                          <div className="col-span-1 flex justify-center">
                               <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${isFamily ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                 Pending
                               </span>
                          </div>

                          <div className="col-span-2 text-right pr-4 font-extrabold text-lg whitespace-nowrap text-gray-100">
                            Rs. {formatLKR(record.amount - (record.paidAmount || 0))}
                          </div>
                          
                          <div className="col-span-1 flex justify-center">
                              <button 
                                onClick={() => handleDeleteLentMoney(record.id)}
                                className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                          </div>

                        </div>
                      </div>
                    );
                  })
                )}
              </div>

            </div>
          </div>

          {/* PAID HISTORY ACCORDION */}
          {processedPaidLent.length > 0 && (
            <div className="pt-4 border-t border-gray-800/80">
              <button 
                onClick={() => setShowPaid(!showPaid)} 
                className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors py-3 px-2 rounded-xl hover:bg-gray-800 cursor-pointer"
              >
                <span>View Paid History ({processedPaidLent.length})</span>
                {showPaid ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>

              {showPaid && (
                <div className="overflow-x-auto bg-gray-900/10 rounded-2xl border border-gray-800 shadow-inner p-6 mt-4">
                  <div className="min-w-[900px]">
                    <div className="relative border-l-2 border-emerald-900/30 ml-4 space-y-4 pb-4">
                      {processedPaidLent.map(record => (
                        <div key={record.id} className="relative pl-10 opacity-50 hover:opacity-100 transition-opacity">
                          
                          {/* Disabled Timeline Node */}
                          <div className="absolute -left-[13px] top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-4 border-gray-900 bg-emerald-700 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-gray-900" />
                          </div>
                          
                          <div className="py-3 px-2 rounded-xl transition-colors grid grid-cols-12 gap-4 items-center border-b border-gray-800/50 hover:bg-gray-800/20">
                            <div className="col-span-3">
                              <div className="font-bold text-gray-500 text-base line-clamp-1 line-through decoration-gray-600">{record.name}</div>
                              <div className="text-[10px] text-gray-600 uppercase tracking-wider font-bold mt-0.5">{record.type}</div>
                            </div>
                            
                            <div className="col-span-3 text-gray-600 italic text-sm line-clamp-1">
                              {record.description || '-'}
                            </div>

                            <div className="col-span-2 text-gray-500 text-sm font-medium">
                               {new Date(record.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                               {record.paidDate && (
                                <div className="text-[10px] text-emerald-500/80 uppercase mt-0.5">Paid: {new Date(record.paidDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</div>
                               )}
                            </div>

                            <div className="col-span-1 flex justify-center">
                               <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-emerald-500/10 text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                                 Paid
                               </span>
                            </div>

                            <div className="col-span-2 text-right pr-4 font-extrabold text-lg whitespace-nowrap text-gray-600">
                              Rs. {formatLKR(record.amount)}
                            </div>
                            
                            <div className="col-span-1 flex justify-center">
                              <button 
                                onClick={() => handleDeleteLentMoney(record.id)}
                                className="p-2 text-gray-600 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      )}
      </div>
    </div>
  );
};

export default HistoryTab;
