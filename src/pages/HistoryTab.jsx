import React, { useState, useMemo } from 'react';
import { List, Trash2, Search, Filter, ChevronDown, ChevronUp, ArrowUpCircle, ArrowDownCircle, ArrowRightLeft, Handshake, PiggyBank, CalendarClock, History, FileText, HelpCircle, Pencil, X } from 'lucide-react';

const HistoryTab = ({ 
  transactions, 
  lentMoney,
  savings,
  schedules,
  formatLKR, 
  handleDeleteTransaction,
  handleDeleteLentPayment,
  deleteSaving,
  deleteSchedule,
  updateTransaction,
  updateLentMoney,
  updateLentPayment,
  updateSaving,
  categories
}) => {
  // Advanced Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSource, setFilterSource] = useState('All'); 
  const [sortBy, setSortBy] = useState('Newest'); 
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSubcategory, setFilterSubcategory] = useState('All');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  
  // Edit State
  const [editingRecord, setEditingRecord] = useState(null);

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
        title: t.description || '-',
        category: t.category,
        subcategory: t.subcategory || '-',
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
        title: s.description || '-',
        category: 'Savings',
        subcategory: s.type,
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
        title: l.description || '-',
        category: 'Money Lent',
        subcategory: l.type,
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
               category: 'Lent Repayment',
               subcategory: l.type,
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
          (record.category && record.category.toLowerCase().includes(searchLower)) ||
          (record.subcategory && record.subcategory.toLowerCase().includes(searchLower)) ||
          (record.type && record.type.toLowerCase().includes(searchLower));
        
        const matchesSource = filterSource === 'All' || record.source === filterSource;
        
        const d = new Date(record.date);
        const matchesDate = (!dateRange.start || d >= new Date(dateRange.start)) &&
                            (!dateRange.end || d <= new Date(dateRange.end + 'T23:59:59'));
                            
        // Category filtering (only applies to transactions/schedules, other types match automatically or have different structure)
        const recordCat = record.originalRecord?.category;
        const matchesCategory = filterCategory === 'All' || recordCat === filterCategory || !recordCat;
        
        const recordSubcat = record.originalRecord?.subcategory;
        const matchesSubcategory = filterSubcategory === 'All' || recordSubcat === filterSubcategory || !recordSubcat;
        
        const matchesAmount = (!amountRange.min || record.amount >= Number(amountRange.min)) &&
                              (!amountRange.max || record.amount <= Number(amountRange.max));
        
        return matchesSearch && matchesSource && matchesDate && matchesCategory && matchesSubcategory && matchesAmount;
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
      if (handleDeleteLentPayment) {
        // Find the index of this specific payment in the parent record's paymentHistory
        const pIdx = lentMoney
          .find(l => l.id === record.originalRecord.parentLentId)
          ?.paymentHistory.findIndex(p => p.amount === record.amount && p.date === record.date);
        
        if (pIdx !== undefined && pIdx !== -1) {
          handleDeleteLentPayment(record.originalRecord.parentLentId, pIdx);
        }
      }
    }
  };

  const handleSaveEdit = async (record, updatedData) => {
    let success = false;
    if (record.source === 'transaction' && updateTransaction) {
      success = await updateTransaction(record.id, updatedData);
    } else if (record.source === 'saving' && updateSaving) {
      success = await updateSaving(record.id, updatedData);
    } else if (record.source === 'lent' && updateLentMoney) {
      success = await updateLentMoney(record.id, updatedData);
    } else if (record.source === 'lent_payment' && updateLentPayment) {
      const pIdx = lentMoney
        .find(l => l.id === record.originalRecord.parentLentId)
        ?.paymentHistory.findIndex(p => p.amount === record.amount && p.date === record.date);
      if (pIdx !== undefined && pIdx !== -1) {
        success = await updateLentPayment(record.originalRecord.parentLentId, pIdx, updatedData);
      }
    }

    if (success) {
      setEditingRecord(null);
    }
  };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-2 md:px-4 pt-0 pb-4 w-full max-w-[1600px] mx-auto">
        {/* Full-tab Ambient Glows */}
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-purple-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

        <div className="w-full relative z-10 mt-0">
          
          {/* ACTIVE SUBSCRIPTIONS REMOVED */}

          {/* COMBINED HEADER & TABLE CONTAINER */}
          <div className="bg-gray-900/40 backdrop-blur-md rounded-2xl border border-gray-700/50 shadow-inner overflow-hidden">
            
            {/* HEADER & FILTERS */}
            <div className="flex flex-col p-3 px-5 border-b border-gray-800 bg-gray-900/60">
              <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-[13px] font-black text-gray-100 uppercase tracking-wider flex items-center gap-2">
                  HISTORY REPORT
                  <HelpCircle className="w-3.5 h-3.5 text-gray-500 cursor-help" />
                </h3>
              </div>
              <button 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="p-1.5 bg-gray-800/80 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700/50 transition-colors cursor-pointer flex items-center justify-center"
                title="Filters"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* COLLAPSIBLE FILTER SECTION */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isFiltersOpen ? 'max-h-[800px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
              <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4 pt-4 border-t border-gray-700/50">
                {/* Search */}
                <div className="relative col-span-1 md:col-span-4 lg:col-span-6">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search descriptions, types..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800/50 rounded-2xl border border-gray-700/50 pl-12 pr-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Date Range Start */}
                <div className="relative col-span-1 lg:col-span-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">From Date</p>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Date Range End */}
                <div className="relative col-span-1 lg:col-span-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">To Date</p>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Filter Source (Type) */}
                <div className="relative col-span-1 lg:col-span-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">Type</p>
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="transaction">Expenses/Income</option>
                    <option value="saving">Savings</option>
                    <option value="lent">Money Lent</option>
                  </select>
                </div>

                {/* Category */}
                <div className="relative col-span-1 lg:col-span-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">Category</p>
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                       setFilterCategory(e.target.value);
                       setFilterSubcategory('All'); // reset subcat
                    }}
                    className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="All">All</option>
                    {categories?.map(cat => (
                       <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Subcategory */}
                <div className="relative col-span-1 lg:col-span-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">Subcategory</p>
                  <select
                    value={filterSubcategory}
                    onChange={(e) => setFilterSubcategory(e.target.value)}
                    className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                    disabled={filterCategory === 'All'}
                  >
                    <option value="All">All</option>
                    {categories?.find(c => c.name === filterCategory)?.subcategories?.map((sub, i) => (
                       <option key={i} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div className="relative col-span-1 lg:col-span-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">Sort By</p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500 appearance-none cursor-pointer"
                  >
                    <option value="Newest">Newest First</option>
                    <option value="Oldest">Oldest First</option>
                    <option value="Highest">Highest Amount</option>
                    <option value="Lowest">Lowest Amount</option>
                  </select>
                </div>
                
                {/* Amount Range Min */}
                <div className="relative col-span-1 lg:col-span-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">Min Amount</p>
                  <input
                    type="number"
                    placeholder="Min Amount"
                    value={amountRange.min}
                    onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                    className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                {/* Amount Range Max */}
                <div className="relative col-span-1 lg:col-span-2">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 px-2">Max Amount</p>
                  <input
                    type="number"
                    placeholder="Max Amount"
                    value={amountRange.max}
                    onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                    className="w-full bg-gray-800/50 rounded-xl border border-gray-700/50 px-4 py-2 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

            {/* UNIFIED HISTORY TABLE */}
            <div className="overflow-x-auto">
            {filteredAndSortedHistory.length === 0 ? (
              <div className="text-center py-20">
                <History className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                <p className="text-gray-400 font-medium">No records found matching your filters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-500 bg-gray-900/80">
                    <th className="px-4 py-3 font-bold">Date & Time</th>
                    <th className="px-4 py-3 font-bold">Type</th>
                    <th className="px-4 py-3 font-bold">Category</th>
                    <th className="px-4 py-3 font-bold">Subcategory</th>
                    <th className="px-4 py-3 font-bold">Description</th>
                    <th className="px-4 py-3 font-bold text-right">Amount</th>
                    <th className="px-4 py-3 font-bold text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/40">
                  {filteredAndSortedHistory.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-800/60 transition-colors group">
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-300">
                            {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">
                            {new Date(record.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                         <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${record.source === 'transaction' && record.type === 'Expense' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 
                             (record.source === 'transaction' && (record.type === 'Income' || record.type === 'POS Income') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                             (record.source === 'saving' ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20' : 
                             (record.source === 'lent_payment' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20')))}`}>
                            {getSourceIcon(record.source, record.type)}
                            {record.type}
                         </span>
                      </td>
                      <td className="px-4 py-2.5">
                        {record.category && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-800 text-gray-400 border border-gray-700">
                            {record.category}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {record.subcategory && record.subcategory !== '-' && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-800/50 text-gray-500 border border-gray-700/50">
                            {record.subcategory}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold text-gray-200 text-sm">
                          {record.title}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <p className={`font-black text-sm tracking-tight ${getAmountColor(record.source, record.type)}`}>
                          {getAmountPrefix(record.source, record.type)}Rs. {formatLKR(record.amount)}
                        </p>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex justify-center gap-1">
                          <button 
                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors cursor-pointer" 
                            title="Edit Record"
                            onClick={() => setEditingRecord(record)}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(record)} 
                            className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors cursor-pointer" 
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            </div>
          </div>
        </div>
      </div>
      
      {editingRecord && (
        <EditRecordModal 
          record={editingRecord} 
          onClose={() => setEditingRecord(null)} 
          onSave={handleSaveEdit}
          categories={categories}
        />
      )}
    </div>
  );
};

const EditRecordModal = ({ record, onClose, onSave, categories }) => {
  const [date, setDate] = useState(record?.date ? new Date(record.date).toISOString().split('T')[0] : '');
  const [amount, setAmount] = useState(record?.amount || '');
  const [description, setDescription] = useState(record?.originalRecord?.description || record?.originalRecord?.name || '');
  
  // For transactions
  const [category, setCategory] = useState(record?.originalRecord?.category || '');
  const [subcategory, setSubcategory] = useState(record?.originalRecord?.subcategory || '');
  const [type, setType] = useState(record?.originalRecord?.type || record?.type || '');
  
  // For Lent Money
  const [name, setName] = useState(record?.originalRecord?.name || '');

  if (!record) return null;

  const handleSave = (e) => {
    e.preventDefault();
    const updatedData = {
      date,
      amount: parseFloat(amount),
      description,
      type,
      category,
      subcategory,
      name
    };
    onSave(record, updatedData);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-100 mb-6">Edit Record</h2>
        <form onSubmit={handleSave} className="space-y-4">
           {/* Date & Amount */}
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Date</label>
               <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
             </div>
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Amount</label>
               <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
             </div>
           </div>
           
           {/* Transaction specific */}
           {record.source === 'transaction' && (
             <>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Type</label>
                   <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
                     <option value="Expense">Expense</option>
                     <option value="Income">Income</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Category</label>
                   <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
                     <option value="">Select...</option>
                     {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                   </select>
                 </div>
               </div>
               {category && (
                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Subcategory</label>
                   <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
                     <option value="">None</option>
                     {categories?.find(c => c.name === category)?.subcategories?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                   </select>
                 </div>
               )}
             </>
           )}

           {/* Savings specific */}
           {record.source === 'saving' && (
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Type</label>
               <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
                 <option value="Deposit">Deposit</option>
                 <option value="Withdrawal">Withdrawal</option>
               </select>
             </div>
           )}
           
           {/* Lent Money specific */}
           {record.source === 'lent' && (
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Type</label>
                 <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500">
                   <option value="Family">Family</option>
                   <option value="Friend">Friend</option>
                   <option value="Other">Other</option>
                 </select>
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Name</label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
               </div>
             </div>
           )}

           {/* Description for all except lent_payment */}
           {record.source !== 'lent_payment' && (
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
               <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500" />
             </div>
           )}

           <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-4">
             Save Changes
           </button>
        </form>
      </div>
    </div>
  );
};

export default HistoryTab;
