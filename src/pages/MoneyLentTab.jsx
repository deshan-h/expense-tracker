import React, { useState } from 'react';
import { 
  Handshake, Users, Plus, Minus, History, Trash2, X, UserPlus, CreditCard, 
  Download, ChevronUp, ChevronDown, ArrowDownLeft, ArrowUpRight, Scale, 
  Wallet, AlertCircle, Building2, User
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DateTimePicker from '../components/ui/DateTimePicker';
import { motion, AnimatePresence } from 'framer-motion';

const MoneyLentTab = ({
  lentDebtType = 'lent',
  setLentDebtType,
  handleAddLentMoney,
  handleAddLentInline,
  lentType,
  setLentType,
  lentAmount,
  setLentAmount,
  lentName,
  setLentName,
  lentDescription,
  setLentDescription,
  lentDueDate,
  setLentDueDate,
  lentDate,
  setLentDate,
  lentMoney = [],
  handleReceiveLentPayment,
  formatLKR,
  handleDeleteLentHistoryEntry,
  handleClearSettledAccounts
}) => {
  // Tab segment view: 'lent' (Lent to others) | 'borrowed' (Borrowed from others) | 'all' (Overview)
  const [activeView, setActiveView] = useState('lent');
  const [showAddBorrower, setShowAddBorrower] = useState(false);
  const [formDebtType, setFormDebtType] = useState('lent'); // 'lent' | 'borrowed'
  
  // Transaction Inline State
  const [modalGroup, setModalGroup] = useState(null);
  const [modalType, setModalType] = useState('lend'); // 'lend' | 'receive' (for borrowed: 'lend' = borrow more, 'receive' = pay back)
  const [modalAmount, setModalAmount] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalDueDate, setModalDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-CA');
  });
  const [modalDate, setModalDate] = useState(new Date().toLocaleDateString('en-CA'));

  // History Modal State
  const [historyGroup, setHistoryGroup] = useState(null);

  const allGroups = lentMoney || [];

  // Totals
  const totalLentPending = allGroups
    .filter(g => (g.debtType || 'lent') === 'lent' && g.status !== 'settled')
    .reduce((acc, curr) => acc + ((curr.totalAmount || 0) - (curr.totalPaid || 0)), 0);

  const totalBorrowedPending = allGroups
    .filter(g => g.debtType === 'borrowed' && g.status !== 'settled')
    .reduce((acc, curr) => acc + ((curr.totalAmount || 0) - (curr.totalPaid || 0)), 0);

  const netDebtPosition = totalLentPending - totalBorrowedPending;

  // Filtered groups by active view
  const filteredGroups = allGroups.filter(group => {
    if (activeView === 'lent') return (group.debtType || 'lent') === 'lent';
    if (activeView === 'borrowed') return group.debtType === 'borrowed';
    return true;
  });

  const activeGroups = filteredGroups
    .filter(group => group.status !== 'settled')
    .sort((a, b) => {
      const owedA = (a.totalAmount || 0) - (a.totalPaid || 0);
      const owedB = (b.totalAmount || 0) - (b.totalPaid || 0);
      return owedB - owedA;
    });

  const settledGroups = filteredGroups.filter(group => group.status === 'settled');

  const toggleInlineAction = (group, type) => {
    if (modalGroup?.id === group.id && modalType === type) {
      setModalGroup(null);
      return;
    }
    setModalGroup(group);
    setModalType(type);
    setModalAmount('');
    setModalDescription('');
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setModalDueDate(d.toLocaleDateString('en-CA'));
    setModalDate(new Date().toLocaleDateString('en-CA'));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalAmount) return;
    const amount = parseFloat(modalAmount);
    if (isNaN(amount) || amount <= 0) return;

    const groupDebtType = modalGroup.debtType || 'lent';
    const isBorrowed = groupDebtType === 'borrowed';

    if (modalType === 'receive') {
      const fullDate = `${modalDate}T00:00:00.000Z`;
      await handleReceiveLentPayment(
        modalGroup.name, 
        modalAmount, 
        fullDate, 
        modalDescription || (isBorrowed ? `Repaid to ${modalGroup.name}` : `Payment from ${modalGroup.name}`),
        groupDebtType,
        modalGroup.id
      );
    } else if (modalType === 'lend' && handleAddLentInline) {
      const fullDate = `${modalDate}T00:00:00.000Z`;
      await handleAddLentInline({ 
        type: modalGroup.type, 
        name: modalGroup.name, 
        amount: amount, 
        description: modalDescription || (isBorrowed ? 'Additional borrowed amount' : 'Additional loan'), 
        date: fullDate,
        dueDate: modalDueDate,
        debtType: groupDebtType
      });
    }
    setModalGroup(null);
  };
  
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (setLentDebtType) setLentDebtType(formDebtType);
    await handleAddLentMoney(e, formDebtType);
    setShowAddBorrower(false);
  };

  const openAddFormWithMode = (type) => {
    setFormDebtType(type);
    if (setLentDebtType) setLentDebtType(type);
    setShowAddBorrower(true);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  const handleDownloadPDF = () => {
    if (!historyGroup) return;

    const isBorrowed = historyGroup.debtType === 'borrowed';
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(
      isBorrowed ? `${historyGroup.name}'s Debt & Repayment History` : `${historyGroup.name}'s Loan History`, 
      14, 
      22
    );
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Type: ${isBorrowed ? 'Money Borrowed (Debt)' : 'Money Lent (Receivable)'}`, 14, 30);
    doc.text(`Status: ${historyGroup.status === 'settled' ? 'Fully Settled' : 'Active'}`, 14, 36);
    doc.text(
      isBorrowed ? `Total Borrowed: Rs. ${formatLKR(historyGroup.totalAmount || 0)}` : `Total Lent: Rs. ${formatLKR(historyGroup.totalAmount || 0)}`, 
      14, 
      42
    );
    doc.text(
      isBorrowed ? `Total Repaid: Rs. ${formatLKR(historyGroup.totalPaid || 0)}` : `Total Received: Rs. ${formatLKR(historyGroup.totalPaid || 0)}`, 
      14, 
      48
    );
    const balance = (historyGroup.totalAmount || 0) - (historyGroup.totalPaid || 0);
    doc.text(
      isBorrowed ? `Remaining Debt: Rs. ${formatLKR(balance)}` : `Remaining Owed: Rs. ${formatLKR(balance)}`,
      14,
      54
    );

    const history = historyGroup.history ? [...historyGroup.history] : [];
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tableData = history.map(item => {
      const isBorrow = item.entryType === 'borrow';
      const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      let typeLabel = '';
      if (isBorrowed) {
        typeLabel = isBorrow ? 'Borrowed' : 'Repaid';
      } else {
        typeLabel = isBorrow ? 'Lent' : 'Payment Received';
      }
      const amount = `Rs. ${formatLKR(item.amount)}`;
      const desc = item.description || (isBorrow ? (isBorrowed ? 'Borrowed' : 'Lent') : (isBorrowed ? 'Repaid' : 'Payment Received'));
      return [date, typeLabel, desc, amount];
    });

    autoTable(doc, {
      startY: 62,
      head: [['Date', 'Type', 'Description', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: isBorrowed ? [225, 29, 72] : [15, 23, 42] }
    });

    doc.save(`${historyGroup.name}_${isBorrowed ? 'Debt' : 'Loan'}_History.pdf`);
  };

  const renderCard = (group, isSettled) => {
    const isBorrowed = group.debtType === 'borrowed';
    const totalAmount = group.totalAmount || 0;
    const totalPaid = group.totalPaid || 0;
    const totalRemaining = totalAmount - totalPaid;
    const progress = totalAmount > 0 ? Math.min((totalPaid / totalAmount) * 100, 100) : 0;
    const isFamily = ['Family', 'Mother', 'Father', 'Brother', 'Sister'].includes(group.type);

    let themeClasses;
    if (isBorrowed) {
      themeClasses = {
        border: 'border-rose-500/30',
        glow: 'bg-rose-500/10',
        avatarBg: 'bg-rose-500/20',
        avatarText: 'text-rose-400',
        typeText: 'text-rose-400/90',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
        progressBg: 'bg-rose-500',
        actionBorrowBg: 'bg-rose-500/20 text-rose-400',
        actionRepayBg: 'bg-emerald-500/20 text-emerald-400'
      };
    } else if (isFamily) {
      themeClasses = {
        border: 'border-amber-500/20',
        glow: 'bg-amber-500/10',
        avatarBg: 'bg-amber-500/20',
        avatarText: 'text-amber-400',
        typeText: 'text-amber-500/80',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        progressBg: 'bg-amber-500',
        actionBorrowBg: 'bg-amber-500/20 text-amber-400',
        actionRepayBg: 'bg-emerald-500/20 text-emerald-400'
      };
    } else {
      themeClasses = {
        border: 'border-blue-500/20',
        glow: 'bg-blue-500/10',
        avatarBg: 'bg-blue-500/20',
        avatarText: 'text-blue-400',
        typeText: 'text-blue-500/80',
        badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        progressBg: 'bg-blue-500',
        actionBorrowBg: 'bg-blue-500/20 text-blue-400',
        actionRepayBg: 'bg-emerald-500/20 text-emerald-400'
      };
    }

    const finalTheme = isSettled 
      ? { ...themeClasses, border: 'border-emerald-500/30', glow: 'bg-emerald-500/10', progressBg: 'bg-emerald-500' }
      : themeClasses;

    const isExpanded = modalGroup?.id === group.id && !isSettled;

    return (
      <div 
        key={group.id} 
        className={`flex flex-col bg-gray-900/60 backdrop-blur-md rounded-[2rem] border ${
          isExpanded 
            ? (modalType === 'lend' ? (isBorrowed ? 'border-rose-500/60' : 'border-amber-500/50') : 'border-emerald-500/50') 
            : finalTheme.border
        } shadow-lg ${isExpanded ? 'overflow-visible' : 'overflow-hidden'} relative group transition-colors duration-300`}
      >
        {/* Glow effect */}
        <div className={`absolute top-0 right-0 w-32 h-32 ${finalTheme.glow} rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none`}></div>
        
        <div className="p-5 flex-1 flex flex-col relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${finalTheme.avatarBg} ${finalTheme.avatarText} shadow-inner`}>
                {getInitials(group.name)}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-bold text-white text-lg leading-tight truncate max-w-[120px] sm:max-w-[150px]">{group.name}</h3>
                  <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full border ${finalTheme.badgeBg}`}>
                    {isBorrowed ? 'I OWE' : 'OWED TO ME'}
                  </span>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${finalTheme.typeText}`}>{group.type}</span>
              </div>
            </div>
            <button 
              onClick={() => setHistoryGroup(group)} 
              className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors" 
              title="View History"
            >
              <History className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between items-end mb-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                  {isBorrowed ? 'Remaining Debt (You Owe)' : 'Total Owed to You'}
                </span>
                <span className={`text-2xl font-black ${isSettled ? 'text-emerald-400' : (isBorrowed ? 'text-rose-400' : 'text-white')}`}>
                  Rs. {formatLKR(totalRemaining)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-800/80 rounded-full overflow-hidden mt-3 mb-1">
              <div className={`h-full ${finalTheme.progressBg} rounded-full transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-500">
              <span>{isBorrowed ? 'Repaid' : 'Received'}: Rs. {formatLKR(totalPaid)}</span>
              <span>{isBorrowed ? 'Borrowed' : 'Lent'}: Rs. {formatLKR(totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isSettled && (
          <div className="flex border-t border-gray-800/80 bg-gray-900/40 relative z-20">
            {isBorrowed ? (
              <>
                <button 
                  onClick={() => toggleInlineAction(group, 'lend')} 
                  className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold transition-colors uppercase tracking-widest border-r border-gray-800/80 ${
                    isExpanded && modalType === 'lend' 
                      ? 'bg-rose-500/20 text-rose-400' 
                      : 'text-rose-400/70 hover:text-rose-400 hover:bg-gray-800/60'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Borrow More
                </button>
                <button 
                  onClick={() => toggleInlineAction(group, 'receive')} 
                  className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold transition-colors uppercase tracking-widest ${
                    isExpanded && modalType === 'receive' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'text-emerald-500/60 hover:text-emerald-400 hover:bg-gray-800/60'
                  }`}
                >
                  <Minus className="w-4 h-4" /> Pay Back
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => toggleInlineAction(group, 'lend')} 
                  className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold transition-colors uppercase tracking-widest border-r border-gray-800/80 ${
                    isExpanded && modalType === 'lend' 
                      ? 'bg-amber-500/20 text-amber-400' 
                      : 'text-amber-500/60 hover:text-amber-400 hover:bg-gray-800/60'
                  }`}
                >
                  <Plus className="w-4 h-4" /> Lend
                </button>
                <button 
                  onClick={() => toggleInlineAction(group, 'receive')} 
                  className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold transition-colors uppercase tracking-widest ${
                    isExpanded && modalType === 'receive' 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'text-emerald-500/60 hover:text-emerald-400 hover:bg-gray-800/60'
                  }`}
                >
                  <Minus className="w-4 h-4" /> Receive
                </button>
              </>
            )}
          </div>
        )}

        {/* INLINE FORM EXPANSION */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }} 
              animate={{ height: 'auto', opacity: 1 }} 
              exit={{ height: 0, opacity: 0 }} 
              transition={{ duration: 0.2 }}
              className="border-t border-gray-800/80 bg-gray-950/80 relative z-30 rounded-b-[2rem] overflow-visible"
            >
              <form onSubmit={handleModalSubmit} className="p-4 space-y-3">
                <div className={`relative bg-gray-900 rounded-xl border border-gray-800 transition-colors focus-within:border-${modalType === 'lend' ? (isBorrowed ? 'rose' : 'amber') : 'emerald'}-500`}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    autoFocus 
                    value={modalAmount} 
                    onChange={(e) => setModalAmount(e.target.value)} 
                    className="w-full h-[45px] bg-transparent pl-9 pr-3 text-sm font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    placeholder="0.00" 
                  />
                </div>

                <div className="relative bg-gray-900 rounded-xl border border-gray-800 transition-colors">
                  <input 
                    type="text" 
                    value={modalDescription} 
                    onChange={(e) => setModalDescription(e.target.value)} 
                    className="w-full h-[40px] bg-transparent px-3 text-xs font-medium text-white focus:outline-none placeholder-gray-500" 
                    placeholder="Description (Optional)" 
                  />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="w-full relative z-40">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1 block">Date</span>
                    <DateTimePicker date={modalDate} setDate={setModalDate} hideTime={true} />
                  </div>
                  {modalType === 'lend' && (
                    <div className="w-full relative z-30">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1 block">Due Date (Optional)</span>
                      <DateTimePicker date={modalDueDate} setDate={setModalDueDate} hideTime={true} />
                    </div>
                  )}
                </div>

                <button 
                  type="submit" 
                  className={`w-full mt-1 h-[45px] text-xs font-black tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${
                    modalType === 'lend' 
                      ? (isBorrowed ? 'bg-rose-600 text-white hover:bg-rose-500 shadow-rose-900/30' : 'bg-amber-500 text-gray-900 hover:bg-amber-400') 
                      : 'bg-emerald-500 text-gray-900 hover:bg-emerald-400'
                  }`}
                >
                  {modalType === 'lend' 
                    ? (isBorrowed ? 'SAVE BORROWED AMOUNT' : 'SAVE LOAN') 
                    : (isBorrowed ? 'RECORD REPAYMENT' : 'RECORD PAYMENT')}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {isSettled && (
           <div className="py-3 bg-emerald-500/10 text-emerald-500 text-center font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border-t border-emerald-500/20 relative z-20">
             <CreditCard className="w-4 h-4" /> Fully Settled
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] pb-20 overflow-x-hidden">
      <div className="px-4 md:px-8 py-4 w-full max-w-[1600px] mx-auto space-y-6">
        
        {/* 1. TOP DUAL SUMMARY TILES (LENT VS BORROWED) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Tile 1: Lent to Others */}
          <div 
            onClick={() => setActiveView('lent')} 
            className={`cursor-pointer bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border ${
              activeView === 'lent' ? 'border-blue-500 ring-2 ring-blue-500/30' : 'border-gray-800/80 hover:border-gray-700'
            } shadow-xl relative overflow-hidden transition-all duration-300 group`}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" /> Lent to Others (Receivable)
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                {allGroups.filter(g => (g.debtType || 'lent') === 'lent' && g.status !== 'settled').length} Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              <span className="text-xs text-gray-500 font-semibold mr-1">Rs.</span>
              {formatLKR(totalLentPending)}
            </h2>
            <p className="text-[11px] text-gray-500 mt-1">Money people owe you</p>
          </div>

          {/* Tile 2: Borrowed by Me */}
          <div 
            onClick={() => setActiveView('borrowed')} 
            className={`cursor-pointer bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border ${
              activeView === 'borrowed' ? 'border-rose-500 ring-2 ring-rose-500/30' : 'border-gray-800/80 hover:border-gray-700'
            } shadow-xl relative overflow-hidden transition-all duration-300 group`}
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <ArrowDownLeft className="w-3.5 h-3.5 text-rose-400" /> Borrowed from Others (Payable)
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400">
                {allGroups.filter(g => g.debtType === 'borrowed' && g.status !== 'settled').length} Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-rose-400">
              <span className="text-xs text-gray-500 font-semibold mr-1">Rs.</span>
              {formatLKR(totalBorrowedPending)}
            </h2>
            <p className="text-[11px] text-gray-500 mt-1">Debts you have to pay back</p>
          </div>

          {/* Tile 3: Net Debt Position */}
          <div className="bg-gradient-to-br from-[#0f172a] to-[#020617] p-4 sm:p-5 rounded-[1.5rem] border border-gray-800/80 shadow-xl relative overflow-hidden transition-all">
            <div className={`absolute top-0 right-0 w-28 h-28 ${netDebtPosition >= 0 ? 'bg-emerald-500/10' : 'bg-orange-500/10'} rounded-full blur-2xl pointer-events-none`}></div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-purple-400" /> Net Debt Position
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${netDebtPosition >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'}`}>
                {netDebtPosition >= 0 ? 'Net Asset' : 'Net Debt'}
              </span>
            </div>
            <h2 className={`text-xl sm:text-2xl font-black ${netDebtPosition >= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
              <span className="text-xs text-gray-500 font-semibold mr-1">{netDebtPosition >= 0 ? '+' : '-'} Rs.</span>
              {formatLKR(Math.abs(netDebtPosition))}
            </h2>
            <p className="text-[11px] text-gray-500 mt-1">
              {netDebtPosition >= 0 ? 'You are owed more than you owe' : 'You owe more than you are owed'}
            </p>
          </div>
        </div>

        {/* 2. FILTER TABS & QUICK ADD BAR */}
        <div className="bg-gray-900/60 backdrop-blur-xl p-3 rounded-[1.25rem] border border-gray-800/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Segment Selector */}
          <div className="flex items-center bg-gray-950/80 p-1 rounded-xl border border-gray-800/80 w-full sm:w-auto">
            <button
              onClick={() => setActiveView('lent')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeView === 'lent'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5 text-blue-300" /> Lent to Others
            </button>
            <button
              onClick={() => setActiveView('borrowed')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeView === 'borrowed'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/30'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5 text-rose-300" /> Borrowed by Me
            </button>
            <button
              onClick={() => setActiveView('all')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                activeView === 'all'
                  ? 'bg-gray-800 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              All Records
            </button>
          </div>

          {/* Quick Add Button */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setFormDebtType(activeView === 'borrowed' ? 'borrowed' : 'lent');
                setShowAddBorrower(!showAddBorrower);
              }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 text-xs font-bold bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-gray-950 px-4 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>{showAddBorrower ? 'Close Form' : '+ Add Lent / Borrowed Record'}</span>
              {showAddBorrower ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
            </button>
          </div>
        </div>

        {/* 3. COLLAPSIBLE ADD FORM */}
        <AnimatePresence>
          {showAddBorrower && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="relative z-40 overflow-visible"
            >
              <div className="bg-gray-900/90 backdrop-blur-xl p-5 sm:p-6 rounded-[1.5rem] border border-gray-800/80 shadow-2xl relative z-40 overflow-visible">
                {/* Form Mode Selector: I Lent vs I Borrowed */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5 pb-4 border-b border-gray-800/60">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Choose Type:</span>
                    <div className="flex bg-gray-950 p-1 rounded-xl border border-gray-800">
                      <button
                        type="button"
                        onClick={() => openAddFormWithMode('lent')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          formDebtType === 'lent'
                            ? 'bg-amber-500 text-gray-950 shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" /> I Lent Money (මම දුන්නා)
                      </button>
                      <button
                        type="button"
                        onClick={() => openAddFormWithMode('borrowed')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          formDebtType === 'borrowed'
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <ArrowDownLeft className="w-3.5 h-3.5" /> I Borrowed Money (මම ගත්තා)
                      </button>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    formDebtType === 'borrowed' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {formDebtType === 'borrowed' ? 'Creating a Debt / Payable Entry' : 'Creating a Loan / Receivable Entry'}
                  </span>
                </div>

                <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                  {/* Name */}
                  <div className="sm:col-span-2 lg:col-span-2 space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">
                      {formDebtType === 'borrowed' ? 'Lender / Person Name' : 'Borrower / Recipient Name'}
                    </span>
                    <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner">
                      <input 
                        type="text" 
                        required 
                        value={lentName} 
                        onChange={(e) => setLentName(e.target.value)} 
                        className="w-full h-[42px] bg-transparent px-4 text-sm font-bold text-white focus:outline-none placeholder-gray-500" 
                        placeholder={formDebtType === 'borrowed' ? "e.g. Kasun (Friend) or BOC Bank" : "e.g. Nimal or Sahan"} 
                      />
                    </div>
                  </div>

                  {/* Relationship / Category */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Relationship</span>
                    <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner">
                      <select 
                        required 
                        value={lentType} 
                        onChange={(e) => setLentType(e.target.value)} 
                        className="w-full h-[42px] bg-transparent px-4 text-sm font-bold text-white focus:outline-none appearance-none"
                      >
                        <option value="" disabled className="bg-gray-900 text-gray-500">Relationship</option>
                        <option value="Friend" className="bg-gray-900">Friend</option>
                        <option value="Family" className="bg-gray-900">Family</option>
                        <option value="Mother" className="bg-gray-900">Mother</option>
                        <option value="Father" className="bg-gray-900">Father</option>
                        <option value="Brother" className="bg-gray-900">Brother</option>
                        <option value="Sister" className="bg-gray-900">Sister</option>
                        <option value="Bank" className="bg-gray-900">Bank / Institution</option>
                        <option value="Other" className="bg-gray-900">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Amount</span>
                    <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                      <input 
                        type="number" 
                        step="0.01" 
                        required 
                        value={lentAmount} 
                        onChange={(e) => setLentAmount(e.target.value)} 
                        className="w-full h-[42px] bg-transparent pl-10 pr-3 text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                        placeholder="0.00" 
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Description</span>
                    <div className="relative bg-gray-950/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner">
                      <input 
                        type="text" 
                        value={lentDescription} 
                        onChange={(e) => setLentDescription(e.target.value)} 
                        className="w-full h-[42px] bg-transparent px-4 text-sm font-medium text-white focus:outline-none placeholder-gray-500" 
                        placeholder="Optional description" 
                      />
                    </div>
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-1 relative z-50">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1">Date</span>
                    <DateTimePicker date={lentDate} setDate={setLentDate} hideTime={true} />
                  </div>

                  {/* Submit Button */}
                  <div className="sm:col-span-2 lg:col-span-6 flex justify-end gap-3 pt-2">
                    <button 
                      type="button" 
                      onClick={() => setShowAddBorrower(false)} 
                      className="px-4 py-2.5 rounded-xl border border-gray-700 text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className={`px-6 py-2.5 rounded-xl text-xs font-black tracking-wider uppercase transition-all flex items-center gap-2 shadow-lg ${
                        formDebtType === 'borrowed'
                          ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-rose-900/40 hover:bg-rose-500'
                          : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-gray-950 shadow-amber-500/20 hover:scale-[1.01]'
                      }`}
                    >
                      <UserPlus className="w-4 h-4" />
                      {formDebtType === 'borrowed' ? 'SAVE BORROWED DEBT' : 'SAVE LENT RECORD'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 4. ACTIVE LEDGERS GRID */}
        <div>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Handshake className="w-4 h-4 text-blue-400" />
              {activeView === 'lent' && 'Active Lent Records (Owed To You)'}
              {activeView === 'borrowed' && 'Active Borrowed Debts (You Owe)'}
              {activeView === 'all' && 'All Active Records'}
              <span className="ml-1 text-[11px] font-black text-white px-2 py-0.5 rounded-full bg-gray-800">
                {activeGroups.length}
              </span>
            </h3>
          </div>

          {activeGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 items-start">
              {activeGroups.map(group => renderCard(group, false))}
            </div>
          ) : (
            <div className="text-center bg-gray-950/30 py-16 rounded-[2rem] border border-gray-800 border-dashed mb-8 mx-2 sm:mx-0">
               <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
               <p className="text-gray-400 font-bold mb-1">
                 {activeView === 'borrowed' ? 'No active borrowed debts!' : 'No active borrowers!'}
               </p>
               <p className="text-gray-600 text-xs">
                 {activeView === 'borrowed' ? 'You have cleared all your personal borrowings.' : "You're all settled up with everyone!"}
               </p>
            </div>
          )}
        </div>

        {/* 5. SETTLED ACCOUNTS GRID */}
        {settledGroups.length > 0 && (
          <div className="pt-4 border-t border-gray-800/80">
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-500" /> SETTLED ACCOUNTS ({settledGroups.length})
              </h3>
              <button 
                onClick={() => handleClearSettledAccounts(activeView === 'all' ? null : activeView)}
                className="text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-widest"
              >
                Clear Settled
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-75 hover:opacity-100 transition-opacity items-start">
              {settledGroups.map(group => renderCard(group, true))}
            </div>
          </div>
        )}

      </div>

      {/* ---------------- MODALS ---------------- */}
      
      {/* HISTORY MODAL */}
      <AnimatePresence>
        {historyGroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 pb-0">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setHistoryGroup(null)}></div>
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="bg-gray-900 border-t sm:border border-gray-700/50 w-full max-w-lg rounded-t-[2rem] sm:rounded-[2rem] p-6 sm:p-8 shadow-2xl relative z-10 max-h-[90vh] flex flex-col"
            >
              <button onClick={() => setHistoryGroup(null)} className="absolute top-6 right-6 p-2 bg-gray-800/80 rounded-full text-gray-400 hover:text-white z-10">
                <X className="w-5 h-5"/>
              </button>
              
              <div className="flex items-center justify-between mb-6 pr-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center font-black text-lg ${
                    historyGroup.debtType === 'borrowed' ? 'bg-rose-500/20 text-rose-400' : 'bg-gray-800 text-white'
                  } shadow-inner`}>
                    {getInitials(historyGroup.name)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight truncate max-w-[150px] sm:max-w-[200px]">
                      {historyGroup.name}'s History
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                        historyGroup.debtType === 'borrowed' ? 'bg-rose-500/20 text-rose-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {historyGroup.debtType === 'borrowed' ? 'Borrowed Debt' : 'Money Lent'}
                      </span>
                      <span className={`text-xs font-bold uppercase tracking-wider ${historyGroup.status === 'settled' ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {historyGroup.status === 'settled' ? 'Settled' : 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleDownloadPDF} 
                  className="p-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition-colors shrink-0 shadow-inner"
                  title="Download as PDF"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 relative">
                <div className="absolute left-[15px] top-0 bottom-0 w-[2px] bg-gray-800/50"></div>
                {(() => {
                  const isBorrowed = historyGroup.debtType === 'borrowed';
                  const history = historyGroup.history ? [...historyGroup.history] : [];
                  history.sort((a, b) => new Date(b.date) - new Date(a.date));

                  if (history.length === 0) return <p className="text-gray-500 italic ml-8">No history found.</p>;

                  return history.map((item, i) => {
                    const dateObj = new Date(item.date);
                    const isBorrow = item.entryType === 'borrow';

                    return (
                      <div key={item.id || i} className="relative pl-10 py-1.5 group">
                        <div className={`absolute left-[10px] top-[50%] -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-900 z-10 ${
                          isBorrow ? (isBorrowed ? 'bg-rose-500' : 'bg-amber-500') : 'bg-emerald-500'
                        }`}></div>
                        <div className="bg-gray-800/40 rounded-xl px-4 py-2.5 border border-gray-800 hover:bg-gray-800/60 transition-colors flex flex-row items-center justify-between gap-3">
                          
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
                              {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-white truncate">
                              {isBorrow 
                                ? (item.description || (isBorrowed ? 'Borrowed' : 'Lent')) 
                                : (item.description || (isBorrowed ? 'Repaid' : 'Payment'))}
                            </span>
                            {isBorrow && item.dueDate && (
                              <span className="text-[10px] text-gray-600 hidden sm:inline whitespace-nowrap">
                                Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className={`text-sm font-black ${
                              isBorrow 
                                ? (isBorrowed ? 'text-rose-400' : 'text-amber-400') 
                                : 'text-emerald-400'
                            }`}>
                              {isBorrow ? '' : '+'}Rs. {formatLKR(item.amount)}
                            </span>
                            <button 
                              onClick={() => { handleDeleteLentHistoryEntry(historyGroup.id, item.id); }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default MoneyLentTab;
