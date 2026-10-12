import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsUpDown,
  ArrowUpDown, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  ArrowRightLeft, 
  Handshake, 
  PiggyBank, 
  CalendarClock, 
  History, 
  FileText, 
  Pencil, 
  X, 
  Plus, 
  SlidersHorizontal, 
  Bookmark, 
  Wallet, 
  LayoutGrid, 
  Tag, 
  Info,
  Calendar,
  RotateCcw,
  Check
} from 'lucide-react';

const HistoryTab = ({ 
  transactions, 
  lentMoney,
  savings,
  schedules,
  formatLKR, 
  handleDeleteTransaction,
  handleDeleteLentHistoryEntry,
  deleteSaving,
  deleteSchedule,
  updateTransaction,
  updateSaving,
  addExpense,
  categories
}) => {
  // Month Navigator State
  const today = new Date();
  const [selectedYear, setSelectedYear] = useState(today.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(today.getMonth()); // 0-11
  const [isAllTime, setIsAllTime] = useState(false);
  const [showMonthDropdown, setShowMonthDropdown] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Newest'); 
  const [filterSource, setFilterSource] = useState('All'); // Accounts: All, transaction, saving, lent
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterSubcategory, setFilterSubcategory] = useState('All');
  const [recordType, setRecordType] = useState('All'); // All, Expense, Income, Deposit, Withdrawal, Lent (Borrow), Lent (Payment)
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });

  // Mobile sidebar collapse toggle
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // Presets state
  const [savedPresets, setSavedPresets] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('expense_tracker_record_filters') || '[]');
    } catch (e) {
      return [];
    }
  });
  const [selectedPreset, setSelectedPreset] = useState('');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Edit / Add Modal State
  const [editingRecord, setEditingRecord] = useState(null);

  // Reset pagination on filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterSource, recordType, sortBy, filterCategory, filterSubcategory, amountRange, selectedYear, selectedMonth, isAllTime]);

  // Handle Preset Save
  const handleSavePreset = () => {
    const name = window.prompt('Enter a name for this filter preset:');
    if (!name || !name.trim()) return;
    const cleanName = name.trim();
    const newPreset = {
      id: Date.now().toString(),
      name: cleanName,
      searchQuery,
      sortBy,
      filterSource,
      filterCategory,
      filterSubcategory,
      recordType,
      amountRange
    };
    const updated = [...savedPresets.filter(p => p.name !== cleanName), newPreset];
    setSavedPresets(updated);
    setSelectedPreset(cleanName);
    try {
      localStorage.setItem('expense_tracker_record_filters', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    setSaveSuccessMsg('Preset saved!');
    setTimeout(() => setSaveSuccessMsg(''), 2500);
  };

  const handleSelectPreset = (presetName) => {
    setSelectedPreset(presetName);
    if (!presetName) return;
    const p = savedPresets.find(item => item.name === presetName);
    if (p) {
      if (p.searchQuery !== undefined) setSearchQuery(p.searchQuery);
      if (p.sortBy !== undefined) setSortBy(p.sortBy);
      if (p.filterSource !== undefined) setFilterSource(p.filterSource);
      if (p.filterCategory !== undefined) setFilterCategory(p.filterCategory);
      if (p.filterSubcategory !== undefined) setFilterSubcategory(p.filterSubcategory);
      if (p.recordType !== undefined) setRecordType(p.recordType);
      if (p.amountRange !== undefined) setAmountRange(p.amountRange);
    }
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSortBy('Newest');
    setFilterSource('All');
    setFilterCategory('All');
    setFilterSubcategory('All');
    setRecordType('All');
    setAmountRange({ min: '', max: '' });
    setSelectedPreset('');
    setIsAllTime(false);
    setSelectedYear(today.getFullYear());
    setSelectedMonth(today.getMonth());
  };

  // Month navigation helpers
  const isCurrentMonth = !isAllTime && selectedYear === today.getFullYear() && selectedMonth === today.getMonth();

  const currentMonthLabel = useMemo(() => {
    if (isAllTime) return 'All time';
    if (isCurrentMonth) return 'This month';
    const d = new Date(selectedYear, selectedMonth, 1);
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }, [isAllTime, isCurrentMonth, selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    setIsAllTime(false);
    if (selectedMonth === 0) {
      setSelectedYear(prev => prev - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    setIsAllTime(false);
    if (selectedMonth === 11) {
      setSelectedYear(prev => prev + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

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
      lentMoney.forEach(person => {
        if (person.history && person.history.length > 0) {
          person.history.forEach(h => {
            if (h.entryType === 'borrow') {
              combined.push({
                id: h.id,
                source: 'lent',
                type: 'Lent (Borrow)',
                amount: h.amount,
                title: h.description || `Lent to ${person.name}`,
                category: 'Money Lent',
                subcategory: person.type,
                date: h.date,
                originalRecord: { ...h, parentLentId: person.id, personName: person.name }
              });
            } else if (h.entryType === 'payment') {
              combined.push({
                id: h.id,
                source: 'lent_payment',
                type: 'Lent (Payment)',
                amount: h.amount,
                title: `Payment from ${person.name}`,
                category: 'Lent Repayment',
                subcategory: person.type,
                date: h.date,
                originalRecord: { ...h, parentLentId: person.id, personName: person.name }
              });
            }
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
        // Month filter
        if (!isAllTime) {
          const recDate = new Date(record.date);
          if (recDate.getFullYear() !== selectedYear || recDate.getMonth() !== selectedMonth) {
            return false;
          }
        }

        // Search query
        const searchLower = searchQuery.toLowerCase();
        if (searchLower) {
          const matchesSearch = 
            (record.title && record.title.toLowerCase().includes(searchLower)) || 
            (record.category && record.category.toLowerCase().includes(searchLower)) ||
            (record.subcategory && record.subcategory.toLowerCase().includes(searchLower)) ||
            (record.type && record.type.toLowerCase().includes(searchLower)) ||
            (record.originalRecord?.personName && record.originalRecord.personName.toLowerCase().includes(searchLower));
          if (!matchesSearch) return false;
        }

        // Account (source) filter
        if (filterSource !== 'All' && record.source !== filterSource) {
          return false;
        }

        // Record type filter
        if (recordType !== 'All') {
          if (recordType === 'Expense' && (record.source !== 'transaction' || record.type !== 'Expense')) return false;
          if (recordType === 'Income' && (record.source !== 'transaction' || (record.type !== 'Income' && record.type !== 'POS Income'))) return false;
          if (recordType === 'Deposit' && (record.source !== 'saving' || record.type !== 'Deposit')) return false;
          if (recordType === 'Withdrawal' && (record.source !== 'saving' || record.type !== 'Withdrawal')) return false;
          if (recordType === 'Lent (Borrow)' && record.source !== 'lent') return false;
          if (recordType === 'Lent (Payment)' && record.source !== 'lent_payment') return false;
        }

        // Category filter
        const recordCat = record.category || record.originalRecord?.category;
        if (filterCategory !== 'All' && recordCat !== filterCategory) {
          return false;
        }

        // Subcategory / Labels filter
        const recordSubcat = record.subcategory || record.originalRecord?.subcategory;
        if (filterSubcategory !== 'All' && recordSubcat !== filterSubcategory) {
          return false;
        }

        // Amount range filter
        const minVal = parseFloat(amountRange.min);
        const maxVal = parseFloat(amountRange.max);
        if (!isNaN(minVal) && minVal > 0 && record.amount < minVal) {
          return false;
        }
        if (!isNaN(maxVal) && maxVal > 0 && record.amount > maxVal) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'Newest') return new Date(b.date).getTime() - new Date(a.date).getTime();
        if (sortBy === 'Oldest') return new Date(a.date).getTime() - new Date(b.date).getTime();
        if (sortBy === 'Highest') return b.amount - a.amount;
        if (sortBy === 'Lowest') return a.amount - b.amount;
        return 0;
      });
  }, [allHistory, isAllTime, selectedYear, selectedMonth, searchQuery, filterSource, recordType, filterCategory, filterSubcategory, amountRange, sortBy]);

  // Labels options based on selected category or all categories
  const availableLabels = useMemo(() => {
    if (filterCategory !== 'All') {
      const cat = categories?.find(c => c.name === filterCategory);
      return cat?.subcategories || [];
    }
    const allSubs = new Set();
    categories?.forEach(cat => {
      cat.subcategories?.forEach(sub => allSubs.add(sub));
    });
    return Array.from(allSubs);
  }, [categories, filterCategory]);

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
    } else if (record.source === 'saving') {
      deleteSaving(record.id);
    } else if (record.source === 'lent' || record.source === 'lent_payment') {
      if (handleDeleteLentHistoryEntry) {
        handleDeleteLentHistoryEntry(record.originalRecord.parentLentId, record.id);
      }
    }
  };

  const handleSaveEdit = async (record, updatedData) => {
    if (record.isNew) {
      if (addExpense) {
        await addExpense({
          category: updatedData.category || 'General',
          subcategory: updatedData.subcategory || '',
          amount: updatedData.amount,
          description: updatedData.description,
          date: updatedData.date ? `${updatedData.date}T${new Date().toTimeString().slice(0, 5)}` : new Date().toISOString()
        });
      }
      setEditingRecord(null);
      return;
    }

    let success = false;
    if (record.source === 'transaction' && updateTransaction) {
      success = await updateTransaction(record.id, updatedData);
    } else if (record.source === 'saving' && updateSaving) {
      success = await updateSaving(record.id, updatedData);
    } else if (record.source === 'lent' || record.source === 'lent_payment') {
      alert("Editing lent history directly is not supported yet.");
      success = false;
    }

    if (success) {
      setEditingRecord(null);
    }
  };

  const totalPages = Math.ceil(filteredAndSortedHistory.length / itemsPerPage);
  const safeCurrentPage = Math.min(currentPage, totalPages > 0 ? totalPages : 1);
  const currentRecords = filteredAndSortedHistory.slice(
    (safeCurrentPage - 1) * itemsPerPage,
    safeCurrentPage * itemsPerPage
  );

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] min-h-[calc(100vh-120px)]">
      <div className="px-2 md:px-6 pt-1 pb-10 w-full max-w-[1700px] mx-auto">
        
        {/* Full-tab Ambient Glows */}
        <div className="absolute top-[8%] left-[5%] w-[35vw] h-[35vw] bg-emerald-600/5 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[5%] w-[35vw] h-[35vw] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none"></div>

        {/* Mobile Filter Toggle Button */}
        <div className="md:hidden flex items-center justify-between p-3 mb-3 bg-gray-900/80 backdrop-blur-md rounded-2xl border border-gray-800">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-100">Records</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              {filteredAndSortedHistory.length}
            </span>
          </div>
          <button 
            onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold rounded-xl border border-gray-700 transition-colors"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
            {isMobileFilterOpen ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {/* 2-COLUMN LAYOUT: SIDEBAR (FILTERS) + MAIN (RECORDS) */}
        <div className="flex flex-col md:flex-row items-start gap-5 relative z-10">

          {/* ======================================================== */}
          {/* LEFT SIDEBAR: FILTERS PANEL                             */}
          {/* ======================================================== */}
          <aside className={`w-full md:w-[310px] lg:w-[330px] shrink-0 bg-gray-900/60 backdrop-blur-xl p-4 sm:p-5 rounded-3xl border border-gray-800/80 shadow-2xl transition-all duration-300 ${isMobileFilterOpen ? 'block' : 'hidden md:block'}`}>
            
            {/* Header: Records + Action Buttons */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-800/80">
              <h2 className="text-2xl font-black text-gray-100 tracking-tight">Records</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleResetFilters}
                  title="Reset to defaults"
                  className="p-2 bg-gray-800/60 hover:bg-gray-700/80 text-gray-400 hover:text-gray-200 rounded-xl border border-gray-700/50 transition-colors cursor-pointer shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setEditingRecord({
                    isNew: true,
                    source: 'transaction',
                    type: 'Expense',
                    amount: '',
                    description: '',
                    category: categories?.[0]?.name || '',
                    subcategory: '',
                    date: new Date().toISOString()
                  })}
                  title="Quick Add Record"
                  className="p-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* Filter Fields Form */}
            <div className="space-y-4 pt-4">

              {/* 1. My Filter Preset Selector */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
                    My filter
                    <span title="Save or load your favorite filter combinations" className="cursor-help text-gray-500 hover:text-gray-300">
                      <Info className="w-3.5 h-3.5" />
                    </span>
                  </label>
                  {saveSuccessMsg && (
                    <span className="text-[10px] text-emerald-400 font-bold animate-pulse">{saveSuccessMsg}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <select
                      value={selectedPreset}
                      onChange={(e) => handleSelectPreset(e.target.value)}
                      className="w-full bg-gray-800/60 rounded-xl border border-gray-700/60 pl-10 pr-8 py-2.5 text-xs font-medium text-gray-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-colors"
                    >
                      <option value="">Select filter</option>
                      {savedPresets.map((preset) => (
                        <option key={preset.id} value={preset.name}>{preset.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  </div>
                  <button
                    onClick={handleSavePreset}
                    title="Save current filters as preset"
                    className="p-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 text-emerald-400 border border-emerald-500/30 rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* 2. Search */}
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Search</label>
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-800/60 rounded-xl border border-gray-700/60 pl-10 pr-3.5 py-2.5 text-xs font-medium text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. Sort by */}
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Sort by</label>
                <div className="relative">
                  <ArrowUpDown className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-gray-800/60 rounded-xl border border-gray-700/60 pl-10 pr-8 py-2.5 text-xs font-medium text-gray-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-colors"
                  >
                    <option value="Newest">Time (newest first)</option>
                    <option value="Oldest">Time (oldest first)</option>
                    <option value="Highest">Amount (highest first)</option>
                    <option value="Lowest">Amount (lowest first)</option>
                  </select>
                  <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 4. Accounts (Source) */}
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Accounts</label>
                <div className="relative">
                  <Wallet className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    className="w-full bg-gray-800/60 rounded-xl border border-gray-700/60 pl-10 pr-8 py-2.5 text-xs font-medium text-gray-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-colors"
                  >
                    <option value="All">All accounts</option>
                    <option value="transaction">Regular Transactions</option>
                    <option value="saving">Savings</option>
                    <option value="lent">Money Lent</option>
                  </select>
                  <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 5. Categories */}
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Categories</label>
                <div className="relative">
                  <LayoutGrid className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={filterCategory}
                    onChange={(e) => {
                      setFilterCategory(e.target.value);
                      setFilterSubcategory('All');
                    }}
                    className="w-full bg-gray-800/60 rounded-xl border border-gray-700/60 pl-10 pr-8 py-2.5 text-xs font-medium text-gray-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-colors"
                  >
                    <option value="All">All categories</option>
                    {categories?.map((cat) => (
                      <option key={cat.id} value={cat.name}>{cat.name}</option>
                    ))}
                  </select>
                  <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 6. Labels */}
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Labels</label>
                <div className="relative">
                  <Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={filterSubcategory}
                    onChange={(e) => setFilterSubcategory(e.target.value)}
                    className="w-full bg-gray-800/60 rounded-xl border border-gray-700/60 pl-10 pr-8 py-2.5 text-xs font-medium text-gray-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-colors"
                  >
                    <option value="All">All</option>
                    {availableLabels.map((label, idx) => (
                      <option key={idx} value={label}>{label}</option>
                    ))}
                  </select>
                  <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 7. Record types */}
              <div>
                <label className="text-xs font-semibold text-gray-400 mb-1.5 block">Record types</label>
                <div className="relative">
                  <ArrowRightLeft className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <select
                    value={recordType}
                    onChange={(e) => setRecordType(e.target.value)}
                    className="w-full bg-gray-800/60 rounded-xl border border-gray-700/60 pl-10 pr-8 py-2.5 text-xs font-medium text-gray-200 focus:outline-none focus:border-emerald-500 appearance-none cursor-pointer transition-colors"
                  >
                    <option value="All">All Record types</option>
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                    <option value="Deposit">Deposit (Savings)</option>
                    <option value="Withdrawal">Withdrawal (Savings)</option>
                    <option value="Lent (Borrow)">Lent (Borrow)</option>
                    <option value="Lent (Payment)">Lent (Payment)</option>
                  </select>
                  <ChevronsUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* 8. Amount Range */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-gray-400 mb-0.5">
                  <span>Amount range</span>
                  <span className="text-[11px] text-gray-500">LKR</span>
                </div>
                <p className="text-[10px] text-gray-500 mb-2 leading-tight">
                  Absolute amount in referential currency
                </p>
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-400 mb-1 px-1">
                  <span>LKR {amountRange.min ? formatLKR(amountRange.min) : 0}</span>
                  <span>LKR {amountRange.max ? formatLKR(amountRange.max) : 0}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="0"
                    value={amountRange.min}
                    onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                    className="w-full bg-gray-800/60 rounded-xl border border-gray-700/60 px-3 py-2 text-xs font-medium text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors text-center"
                  />
                  <input
                    type="number"
                    placeholder="0"
                    value={amountRange.max}
                    onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                    className="w-full bg-gray-800/60 rounded-xl border border-gray-700/60 px-3 py-2 text-xs font-medium text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-colors text-center"
                  />
                </div>
              </div>

              {/* 9. Reset Filter Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/50 hover:border-emerald-400 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 active:scale-[0.98] text-xs font-bold transition-all duration-200 text-center cursor-pointer shadow-sm tracking-wider uppercase"
                >
                  Reset Filter
                </button>
              </div>

            </div>
          </aside>

          {/* ======================================================== */}
          {/* RIGHT MAIN AREA: TOP MONTH NAV + RECORDS LIST            */}
          {/* ======================================================== */}
          <main className="flex-1 min-w-0 w-full flex flex-col">

            {/* TOP BAR: Month Navigator (< This month >) */}
            <div className="flex items-center justify-center py-2 mb-4 w-full">
              <div className="inline-flex items-center gap-3 bg-gray-900/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-gray-800/80 shadow-md">
                
                {/* Previous Month */}
                <button 
                  onClick={handlePrevMonth}
                  title="Previous month"
                  className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Month Dropdown / Display */}
                <div className="relative">
                  <button
                    onClick={() => setShowMonthDropdown(!showMonthDropdown)}
                    className="flex items-center gap-2 px-3 py-1 bg-gray-800/70 hover:bg-gray-800 border border-gray-700/60 rounded-xl text-xs sm:text-sm font-semibold text-gray-200 transition-all cursor-pointer min-w-[130px] justify-between"
                  >
                    <span>{currentMonthLabel}</span>
                    <ChevronsUpDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showMonthDropdown && (
                    <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 backdrop-blur-xl border border-gray-700/70 rounded-2xl p-2 shadow-2xl w-48 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={() => {
                          setIsAllTime(false);
                          setSelectedYear(today.getFullYear());
                          setSelectedMonth(today.getMonth());
                          setShowMonthDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${isCurrentMonth ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-300 hover:bg-gray-800'}`}
                      >
                        <span>This month</span>
                        {isCurrentMonth && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => {
                          setIsAllTime(true);
                          setShowMonthDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex items-center justify-between ${isAllTime ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-300 hover:bg-gray-800'}`}
                      >
                        <span>All time</span>
                        {isAllTime && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>

                {/* Next Month */}
                <button 
                  onClick={handleNextMonth}
                  title="Next month"
                  className="p-1.5 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

              </div>
            </div>

            {/* CONTENT AREA: EMPTY STATE OR RECORDS LIST */}
            {filteredAndSortedHistory.length === 0 ? (
              /* EMPTY STATE (Matching screenshot exactly) */
              <div className="flex flex-col items-center justify-center min-h-[460px] text-center p-8 bg-gray-900/30 backdrop-blur-sm rounded-3xl border border-gray-800/40">
                <p className="text-gray-400/90 text-sm md:text-base font-normal tracking-wide max-w-md">
                  Sorry, no records were found for this combination of filters.
                </p>
              </div>
            ) : (
              /* RECORDS CONTAINER */
              <div className="bg-gray-900/50 backdrop-blur-xl rounded-3xl border border-gray-800/80 shadow-2xl overflow-hidden flex flex-col">
                
                {/* Header Stats Bar */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-800/80 bg-gray-900/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtered Records:</span>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      {filteredAndSortedHistory.length}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 font-medium">
                    Showing {(safeCurrentPage - 1) * itemsPerPage + 1} - {Math.min(safeCurrentPage * itemsPerPage, filteredAndSortedHistory.length)}
                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-gray-800 text-[10px] uppercase tracking-widest text-gray-500 bg-gray-900/80">
                        <th className="px-5 py-3 font-bold">Date & Time</th>
                        <th className="px-4 py-3 font-bold">Type</th>
                        <th className="px-4 py-3 font-bold">Category</th>
                        <th className="px-4 py-3 font-bold">Label</th>
                        <th className="px-4 py-3 font-bold">Description</th>
                        <th className="px-5 py-3 font-bold text-right">Amount</th>
                        <th className="px-4 py-3 font-bold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {currentRecords.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-800/50 transition-colors group">
                          
                          {/* Date & Time */}
                          <td className="px-5 py-3">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-gray-200">
                                {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                              </span>
                              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">
                                {new Date(record.date).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                              record.source === 'transaction' && record.type === 'Expense' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                              (record.source === 'transaction' && (record.type === 'Income' || record.type === 'POS Income') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                              (record.source === 'saving' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 
                              (record.source === 'lent_payment' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20')))
                            }`}>
                              {getSourceIcon(record.source, record.type)}
                              {record.type}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3">
                            {record.category ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-gray-800/90 text-gray-300 border border-gray-700/70">
                                {record.category}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs">-</span>
                            )}
                          </td>

                          {/* Label / Subcategory */}
                          <td className="px-4 py-3">
                            {record.subcategory && record.subcategory !== '-' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-gray-800/50 text-gray-400 border border-gray-700/40">
                                {record.subcategory}
                              </span>
                            ) : (
                              <span className="text-gray-600 text-xs">-</span>
                            )}
                          </td>

                          {/* Description */}
                          <td className="px-4 py-3 max-w-[280px] truncate">
                            <span className="font-medium text-gray-200 text-xs sm:text-sm">
                              {record.title}
                            </span>
                          </td>

                          {/* Amount */}
                          <td className="px-5 py-3 text-right">
                            <p className={`font-black text-sm tracking-tight ${getAmountColor(record.source, record.type)}`}>
                              {getAmountPrefix(record.source, record.type)}Rs. {formatLKR(record.amount)}
                            </p>
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button 
                                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors cursor-pointer" 
                                title="Edit Record"
                                onClick={() => setEditingRecord(record)}
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDelete(record)} 
                                className="p-1.5 text-gray-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors cursor-pointer" 
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-5 py-4 border-t border-gray-800 bg-gray-900/40">
                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">
                      Page {safeCurrentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                        disabled={safeCurrentPage === 1}
                        className="px-3 py-1.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold uppercase tracking-wider border border-gray-700 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Prev
                      </button>
                      <div className="flex items-center justify-center min-w-[32px] font-bold text-gray-300 text-xs">
                        {safeCurrentPage}
                      </div>
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                        disabled={safeCurrentPage === totalPages}
                        className="px-3 py-1.5 rounded-xl bg-gray-800 text-gray-300 text-xs font-bold uppercase tracking-wider border border-gray-700 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </main>

        </div>
      </div>
      
      {/* Edit or Quick Add Record Modal */}
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
  const isNew = record?.isNew;
  const [date, setDate] = useState(record?.date ? new Date(record.date).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA'));
  const [amount, setAmount] = useState(record?.amount || '');
  const [description, setDescription] = useState(record?.originalRecord?.description || record?.title || record?.originalRecord?.name || '');
  
  // For transactions
  const [category, setCategory] = useState(record?.originalRecord?.category || record?.category || (categories?.[0]?.name || ''));
  const [subcategory, setSubcategory] = useState(record?.originalRecord?.subcategory || record?.subcategory || '');
  const [type, setType] = useState(record?.originalRecord?.type || record?.type || 'Expense');
  
  // For Lent Money
  const [name, setName] = useState(record?.originalRecord?.name || record?.originalRecord?.personName || '');

  if (!record) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) return;
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700/80 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-100 mb-6 flex items-center gap-2">
          {isNew ? <Plus className="w-5 h-5 text-emerald-400" /> : <Pencil className="w-5 h-5 text-blue-400" />}
          {isNew ? 'Add New Record' : 'Edit Record'}
        </h2>
        <form onSubmit={handleSave} className="space-y-4">
           {/* Date & Amount */}
           <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Date</label>
               <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500" />
             </div>
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Amount (LKR)</label>
               <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500" />
             </div>
           </div>
           
           {/* Transaction specific */}
           {(isNew || record.source === 'transaction') && (
             <>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Type</label>
                   <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500">
                     <option value="Expense">Expense</option>
                     <option value="Income">Income</option>
                   </select>
                 </div>
                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Category</label>
                   <select value={category} onChange={e => { setCategory(e.target.value); setSubcategory(''); }} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500">
                     <option value="">Select...</option>
                     {categories?.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                   </select>
                 </div>
               </div>
               {category && (
                 <div>
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Subcategory / Label</label>
                   <select value={subcategory} onChange={e => setSubcategory(e.target.value)} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500">
                     <option value="">None</option>
                     {categories?.find(c => c.name === category)?.subcategories?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                   </select>
                 </div>
               )}
             </>
           )}

           {/* Savings specific */}
           {!isNew && record.source === 'saving' && (
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Type</label>
               <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500">
                 <option value="Deposit">Deposit</option>
                 <option value="Withdrawal">Withdrawal</option>
               </select>
             </div>
           )}
           
           {/* Lent Money specific */}
           {!isNew && record.source === 'lent' && (
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Type</label>
                 <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500">
                   <option value="Family">Family</option>
                   <option value="Friend">Friend</option>
                   <option value="Other">Other</option>
                 </select>
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Name</label>
                 <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500" />
               </div>
             </div>
           )}

           {/* Description for all except lent_payment */}
           {(isNew || record.source !== 'lent_payment') && (
             <div>
               <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
               <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Description or note" className="w-full bg-gray-800 rounded-xl border border-gray-700 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-emerald-500" />
             </div>
           )}

           <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl transition-colors mt-4 shadow-lg shadow-emerald-500/20 cursor-pointer">
             {isNew ? 'Create Record' : 'Save Changes'}
           </button>
        </form>
      </div>
    </div>
  );
};

export default HistoryTab;
