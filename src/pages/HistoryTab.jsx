import React, { useState, useMemo } from 'react';
import { List, Trash2, Search, Filter, ChevronDown, ChevronUp, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Handshake, PiggyBank, CalendarClock, History } from 'lucide-react';

const HistoryTab = ({ 
  transactions, 
  lentMoney,
  savings,
  formatLKR, 
  handleDeleteTransaction,
  handleDeleteLentMoney,
  deleteSaving,
  categories
}) => {
  // Advanced Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('All'); 
  const [sortBy, setSortBy] = useState('Newest'); 
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Normalize Data
  const allHistory = useMemo(() => {
    let combined = [];

    // Transactions
    if (transactions) {
      combined = combined.concat(transactions.map(t => ({
        id: t.id,
        source: 'transaction',
        type: t.type, // 'Expense', 'Income', 'POS Income'
        amount: t.amount,
        title: t.description || t.category,
        subtitle: t.subcategory || t.category,
        date: t.date,
        originalRecord: t
      })));
    }

    // Savings
    if (savings) {
      combined = combined.concat(savings.map(s => ({
        id: s.id,
        source: 'saving',
        type: s.type, // 'Deposit', 'Withdrawal'
        amount: s.amount,
        title: s.description || s.type,
        subtitle: 'Savings',
        date: s.date,
        originalRecord: s
      })));
    }

    // Lent Money
    if (lentMoney) {
      combined = combined.concat(lentMoney.map(l => ({
        id: l.id,
        source: 'lent',
        type: l.status === 'paid' ? 'Lent (Paid)' : 'Lent (Pending)',
        amount: l.amount,
        title: l.description || l.name,
        subtitle: `Lent Money: ${l.type}`,
        date: l.date,
        originalRecord: l
      })));
      
      // Extract partial payments
      lentMoney.forEach(l => {
        if (l.paymentHistory && l.paymentHistory.length > 0) {
          l.paymentHistory.forEach(p => {
             combined.push({
               id: p.id || `payment-${Math.random()}`,
               source: 'lent_payment',
               type: 'Lent Payment Received',
               amount: p.amount,
               title: `Payment from ${l.name}`,
               subtitle: 'Lent Money Repayment',
               date: p.date,
               originalRecord: Object.assign({}, p, { parentLentId: l.id })
             });
          });
        }
      });
    }

    return combined;
  }, [transactions, savings, lentMoney]);

  // Apply Filters
  const filteredAndSortedHistory = useMemo(() => {
    return allHistory
      .filter(record => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          (record.title && record.title.toLowerCase().includes(searchLower)) || 
          (record.subtitle && record.subtitle.toLowerCase().includes(searchLower)) ||
          (record.type && record.type.toLowerCase().includes(searchLower));
        
        const matchesSource = filterSource === 'All' || record.source === filterSource;
        
        return matchesSearch && matchesSource;
      })
      .sort((a, b) => {
        if (sortBy === 'Newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'Oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'Highest') return b.amount - a.amount;
        if (sortBy === 'Lowest') return a.amount - b.amount;
        return 0;
      });
  }, [allHistory, searchQuery, filterSource, sortBy]);


  const getSourceIcon = (source, type) => {
    if (source === 'transaction') {
      if (type === 'Expense') return <ArrowDownCircle className="w-4 h-4 text-rose-500" />;
      if (type === 'Income' || type === 'POS Income') return <ArrowUpCircle className="w-4 h-4 text-emerald-500" />;
    }
    if (source === 'saving') {
      return <PiggyBank className="w-4 h-4 text-pink-500" />;
    }
    if (source === 'lent') {
      return <Handshake className="w-4 h-4 text-blue-500" />;
    }
    if (source === 'lent_payment') {
      return <ArrowUpCircle className="w-4 h-4 text-emerald-500" />;
    }
    return <History className="w-4 h-4 text-gray-500" />;
  };

  const getSourceColor = (source, type) => {
    if (source === 'transaction') {
      if (type === 'Expense') return 'text-rose-500';
      if (type === 'Income' || type === 'POS Income') return 'text-emerald-500';
    }
    if (source === 'saving') return 'text-pink-500';
    if (source === 'lent') return 'text-blue-500';
    if (source === 'lent_payment') return 'text-emerald-500';
    return 'text-gray-500';
  };
  
  const getAmountColor = (source, type) => {
    if (source === 'transaction') {
      if (type === 'Expense') return 'text-rose-400';
      if (type === 'Income' || type === 'POS Income') return 'text-emerald-400';
    }
    if (source === 'saving') {
      if (type === 'Deposit') return 'text-emerald-400';
      if (type === 'Withdrawal') return 'text-rose-400';
    }
    if (source === 'lent') return 'text-rose-400';
    if (source === 'lent_payment') return 'text-emerald-400';
    return 'text-gray-400';
  };

  const getAmountPrefix = (source, type) => {
    if (source === 'transaction') {
      if (type === 'Expense') return '-';
      if (type === 'Income' || type === 'POS Income') return '+';
    }
    if (source === 'saving') {
      if (type === 'Deposit') return '+';
      if (type === 'Withdrawal') return '-';
    }
    if (source === 'lent') return '-';
    if (source === 'lent_payment') return '+';
    return '';
  };

  const handleDelete = (record) => {
    if (record.source === 'transaction') {
      handleDeleteTransaction(record.id);
    } else if (record.source === 'lent') {
      handleDeleteLentMoney(record.id);
    } else if (record.source === 'saving') {
      deleteSaving(record.id);
    } else if (record.source === 'lent_payment') {
      alert("Deleting partial payments from history is not supported yet.");
    }
  };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
        {/* Full-tab Ambient Glows */}
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

        <div className="w-full max-w-5xl mx-auto relative z-10 mt-2">
          
          {/* HEADER & FILTERS */}
          <div className="mb-8 flex flex-col gap-4 bg-gray-900/60 backdrop-blur-md p-6 rounded-[2rem] border border-gray-700/50 shadow-inner">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
                <History className="w-4 h-4 text-blue-500" /> All History
              </h3>
              <button 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                <Filter className="w-3 h-3" /> Filters
                {isFiltersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* COLLAPSIBLE FILTER SECTION */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isFiltersOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700/50">
                {/* Search */}
                <div className="relative col-span-1 md:col-span-3">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search all records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800/50 rounded-2xl border border-gray-700/50 pl-12 pr-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Filter Source */}
                <div className="relative">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">Record Type</p>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-2.5 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="All">All Records</option>
                    <option value="transaction">Expenses & Income</option>
                    <option value="saving">Savings</option>
                    <option value="lent">Money Lent</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="relative">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">Sort By</p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-2.5 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="Newest">Newest First</option>
                    <option value="Oldest">Oldest First</option>
                    <option value="Highest">Highest Amount</option>
                    <option value="Lowest">Lowest Amount</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* UNIFIED TIMELINE */}
          <div className="overflow-x-auto lg:overflow-visible">
            <div className="min-w-[500px] lg:min-w-0 pr-4">
              {filteredAndSortedHistory.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/40 rounded-[2rem] border border-gray-800 border-dashed">
                  <History className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-400 font-medium">No records found matching your filters.</p>
                </div>
              ) : (
                <div className="relative border-l-2 border-gray-700/50 ml-40 md:ml-48 space-y-4 pb-12 mt-4">
                  {filteredAndSortedHistory.map((record) => (
                    <div key={record.id} className="relative pl-8 md:pl-10 group">
                      
                      {/* Date and Time on Left */}
                      <div className="absolute -left-[10rem] md:-left-[12rem] top-1/2 -translate-y-1/2 w-36 md:w-44 text-right pr-4">
                        <div className="text-[11px] md:text-xs font-semibold text-gray-400 whitespace-nowrap flex items-center justify-end gap-1.5">
                          <span>{new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span className="text-gray-600">•</span>
                          <span className="text-[10px] md:text-[11px] font-black text-gray-500 uppercase tracking-widest">{new Date(record.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      {/* Timeline Node */}
                      <div className="absolute -left-[17px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full border-[4px] border-slate-950 bg-gray-800 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-lg">
                        {getSourceIcon(record.source, record.type)}
                      </div>

                      {/* Row Content */}
                      <div className="py-2 px-3 hover:bg-gray-800/40 rounded-lg flex flex-row items-center justify-between border-b border-gray-800/50 transition-colors">
                        
                        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 pr-4">
                            <span className={`hidden sm:inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest shrink-0 ${record.source === 'transaction' && record.type === 'Expense' ? 'bg-rose-500/10 text-rose-500' : 
                               (record.source === 'transaction' && (record.type === 'Income' || record.type === 'POS Income') ? 'bg-emerald-500/10 text-emerald-500' :
                               (record.source === 'saving' ? 'bg-pink-500/10 text-pink-500' : 
                               (record.source === 'lent_payment' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500')))}`}>
                              {record.type}
                            </span>
                            {record.subtitle && (
                              <span className="hidden lg:inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-700 text-gray-300 border border-gray-600 shrink-0">
                                {record.subtitle}
                              </span>
                            )}
                          <div className="font-semibold text-gray-200 text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis flex-1">
                            {record.title}
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <p className={`font-black text-sm md:text-base tracking-tight ${getAmountColor(record.source, record.type)}`}>
                            {getAmountPrefix(record.source, record.type)}Rs. {formatLKR(record.amount)}
                          </p>
                          <button onClick={() => handleDelete(record)} className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors cursor-pointer" title="Delete Record">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryTab;
