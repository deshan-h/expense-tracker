import React, { useState } from 'react';
import { Handshake, Users, Plus, Minus, History, Trash2, X, UserPlus, CreditCard, Download, ChevronUp, ChevronDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import DateTimePicker from '../components/ui/DateTimePicker';
import { motion, AnimatePresence } from 'framer-motion';

const MoneyLentTab = ({
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
  lentMoney,
  handleReceiveLentPayment,
  formatLKR,
  handleDeleteLentHistoryEntry,
  handleClearSettledAccounts
}) => {
  const [showAddBorrower, setShowAddBorrower] = useState(false);
  
  // Transaction Inline State
  const [modalGroup, setModalGroup] = useState(null);
  const [modalType, setModalType] = useState('lend'); // 'lend' | 'receive'
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
  const activeGroups = allGroups
    .filter(group => group.status !== 'settled')
    .sort((a, b) => {
      const owedA = (a.totalAmount || 0) - (a.totalPaid || 0);
      const owedB = (b.totalAmount || 0) - (b.totalPaid || 0);
      return owedB - owedA;
    });
  const settledGroups = allGroups.filter(group => group.status === 'settled');
  
  const totalOwedGlobally = activeGroups.reduce((acc, curr) => acc + ((curr.totalAmount || 0) - (curr.totalPaid || 0)), 0);

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

    if (modalType === 'receive') {
      const fullDate = `${modalDate}T00:00:00.000Z`;
      await handleReceiveLentPayment(modalGroup.name, modalAmount, fullDate, modalDescription);
    } else if (modalType === 'lend' && handleAddLentInline) {
      const fullDate = `${modalDate}T00:00:00.000Z`;
      await handleAddLentInline({ 
        type: modalGroup.type, 
        name: modalGroup.name, 
        amount: amount, 
        description: modalDescription || 'Additional loan', 
        date: fullDate,
        dueDate: modalDueDate
      });
    }
    setModalGroup(null);
  };
  
  const handleAddSubmit = async (e) => {
    await handleAddLentMoney(e);
    setShowAddBorrower(false);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.substring(0, 2).toUpperCase();
  };

  const handleDownloadPDF = () => {
    if (!historyGroup) return;

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.text(`${historyGroup.name}'s Loan History`, 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Status: ${historyGroup.status === 'settled' ? 'Settled' : 'Active'}`, 14, 30);
    doc.text(`Total Lent: Rs. ${formatLKR(historyGroup.totalAmount || 0)}`, 14, 36);
    doc.text(`Total Paid: Rs. ${formatLKR(historyGroup.totalPaid || 0)}`, 14, 42);

    const history = historyGroup.history ? [...historyGroup.history] : [];
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    const tableData = history.map(item => {
      const isBorrow = item.entryType === 'borrow';
      const date = new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const type = isBorrow ? 'Lent' : 'Payment';
      const amount = `Rs. ${formatLKR(item.amount)}`;
      const desc = isBorrow ? (item.description || 'Borrowed') : (item.description || 'Payment Received');
      return [date, type, desc, amount];
    });

    autoTable(doc, {
      startY: 50,
      head: [['Date', 'Type', 'Description', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] }
    });

    doc.save(`${historyGroup.name}_Loan_History.pdf`);
  };

  const renderCard = (group, isSettled) => {
    const totalLent = group.totalAmount || 0;
    const totalPaid = group.totalPaid || 0;
    const totalOwed = totalLent - totalPaid;
    const progress = totalLent > 0 ? Math.min((totalPaid / totalLent) * 100, 100) : 0;
    const isFamily = ['Family', 'Mother', 'Father', 'Brother', 'Sister'].includes(group.type);
    const themeColor = isFamily ? 'amber' : 'blue';

    const themeClasses = isFamily 
      ? {
          border: 'border-amber-500/20',
          glow: 'bg-amber-500/10',
          avatarBg: 'bg-amber-500/20',
          avatarText: 'text-amber-400',
          typeText: 'text-amber-500/80',
          progressBg: 'bg-amber-500'
        }
      : {
          border: 'border-blue-500/20',
          glow: 'bg-blue-500/10',
          avatarBg: 'bg-blue-500/20',
          avatarText: 'text-blue-400',
          typeText: 'text-blue-500/80',
          progressBg: 'bg-blue-500'
        };

    const finalTheme = isSettled 
      ? { ...themeClasses, border: 'border-emerald-500/30', glow: 'bg-emerald-500/10', progressBg: 'bg-emerald-500' }
      : themeClasses;

    const isExpanded = modalGroup?.id === group.id && !isSettled;

    return (
      <div key={group.id} className={`flex flex-col bg-gray-900/60 backdrop-blur-md rounded-[2rem] border ${isExpanded ? (modalType === 'lend' ? 'border-amber-500/50' : 'border-emerald-500/50') : finalTheme.border} shadow-lg ${isExpanded ? 'overflow-visible' : 'overflow-hidden'} relative group transition-colors duration-300`}>
        {/* Glow effect */}
        <div className={`absolute top-0 right-0 w-32 h-32 ${finalTheme.glow} rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none`}></div>
        
        <div className="p-5 flex-1 flex flex-col relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${finalTheme.avatarBg} ${finalTheme.avatarText} shadow-inner`}>
                {getInitials(group.name)}
              </div>
              <div>
                <h3 className="font-bold text-white text-lg leading-tight truncate max-w-[120px] sm:max-w-[150px]">{group.name}</h3>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${finalTheme.typeText}`}>{group.type}</span>
              </div>
            </div>
            <button onClick={() => setHistoryGroup(group)} className="p-2 bg-gray-800/80 hover:bg-gray-700 rounded-full text-gray-400 transition-colors" title="View History">
              <History className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-auto">
            <div className="flex justify-between items-end mb-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Owed</span>
                <span className={`text-2xl font-black ${isSettled ? 'text-emerald-400' : 'text-white'}`}>
                  Rs. {formatLKR(totalOwed)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-gray-800/80 rounded-full overflow-hidden mt-3 mb-1">
              <div className={`h-full ${finalTheme.progressBg} rounded-full transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-500">
              <span>Paid: Rs. {formatLKR(totalPaid)}</span>
              <span>Lent: Rs. {formatLKR(totalLent)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {!isSettled && (
          <div className="flex border-t border-gray-800/80 bg-gray-900/40 relative z-20">
            <button onClick={() => toggleInlineAction(group, 'lend')} className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold transition-colors uppercase tracking-widest border-r border-gray-800/80 ${isExpanded && modalType === 'lend' ? 'bg-amber-500/20 text-amber-400' : 'text-amber-500/60 hover:text-amber-400 hover:bg-gray-800/60'}`}>
              <Plus className="w-4 h-4" /> Lend
            </button>
            <button onClick={() => toggleInlineAction(group, 'receive')} className={`flex-1 py-4 flex items-center justify-center gap-2 text-xs font-bold transition-colors uppercase tracking-widest ${isExpanded && modalType === 'receive' ? 'bg-emerald-500/20 text-emerald-400' : 'text-emerald-500/60 hover:text-emerald-400 hover:bg-gray-800/60'}`}>
              <Minus className="w-4 h-4" /> Receive
            </button>
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
              className="border-t border-gray-800/80 bg-gray-950/80 relative z-30 rounded-b-[2rem]"
            >
              <form onSubmit={handleModalSubmit} className="p-4 space-y-3">
                <div className={`relative bg-gray-900 rounded-xl border border-gray-800 transition-colors focus-within:border-${modalType==='lend'?'amber':'emerald'}-500`}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                  <input type="number" step="0.01" required autoFocus value={modalAmount} onChange={(e) => setModalAmount(e.target.value)} className="w-full h-[45px] bg-transparent pl-9 pr-3 text-sm font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
                </div>

                <div className={`relative bg-gray-900 rounded-xl border border-gray-800 transition-colors focus-within:border-${modalType === 'lend' ? 'amber' : 'emerald'}-500`}>
                  <input type="text" value={modalDescription} onChange={(e) => setModalDescription(e.target.value)} className="w-full h-[40px] bg-transparent px-3 text-xs font-medium text-white focus:outline-none placeholder-gray-500" placeholder="Description (Optional)" />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="w-full">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1 block">Date</span>
                    <DateTimePicker date={modalDate} setDate={setModalDate} hideTime={true} />
                  </div>
                  {modalType === 'lend' && (
                    <div className="w-full">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1 block">Due Date (Optional)</span>
                      <DateTimePicker date={modalDueDate} setDate={setModalDueDate} hideTime={true} />
                    </div>
                  )}
                </div>

                <button type="submit" className={`w-full mt-1 h-[45px] text-xs font-black tracking-widest uppercase rounded-xl transition-all flex items-center justify-center gap-2 ${modalType === 'lend' ? 'bg-amber-500 text-gray-900 hover:bg-amber-400' : 'bg-emerald-500 text-gray-900 hover:bg-emerald-400'}`}>
                  {modalType === 'lend' ? 'SAVE LOAN' : 'RECORD PAYMENT'}
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
      <div className="px-4 md:px-8 py-4 w-full max-w-[1600px] mx-auto">
        
        {/* TOP WIDGETS & ADD RECORD */}
        <div className="bg-gray-900/60 backdrop-blur-xl p-2 sm:p-2.5 rounded-[1.25rem] border border-gray-800/80 shadow-2xl flex flex-col relative z-20 mb-6">
          {/* Header Row */}
          <div 
            className="flex items-center justify-between cursor-pointer group px-2 py-1"
            onClick={() => setShowAddBorrower(!showAddBorrower)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[0.8rem] bg-gradient-to-br from-blue-500/20 to-indigo-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div className="flex flex-col justify-center">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] leading-none mb-1">Total Owed To You</span>
                <span className="text-sm sm:text-base font-black text-white leading-none">Rs. {formatLKR(totalOwedGlobally)}</span>
              </div>
            </div>

            <div className="flex items-center">
              <div className="flex items-center gap-1.5 text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-[0.75rem] group-hover:bg-amber-500/20 transition-all shadow-inner">
                <UserPlus className="w-4 h-4" />
                {showAddBorrower ? <ChevronUp className="w-3.5 h-3.5 opacity-70" /> : <ChevronDown className="w-3.5 h-3.5 opacity-70" />}
              </div>
            </div>
          </div>
          
          {showAddBorrower && (
            <div className="mt-4 pt-4 border-t border-gray-800/50">
                <form onSubmit={handleAddSubmit} className="flex flex-col lg:flex-row gap-3 items-center">
                  {/* Name */}
                  <div className="relative w-full lg:flex-[1.5] bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all shadow-inner shrink-0">
                    <input type="text" required value={lentName} onChange={(e) => setLentName(e.target.value)} className="w-full h-[42px] bg-transparent px-4 text-sm font-bold text-white focus:outline-none placeholder-gray-500" placeholder="Recipient Name" />
                  </div>

                  {/* Relationship */}
                  <div className="relative w-full lg:flex-1 bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner shrink-0">
                    <select required value={lentType} onChange={(e) => setLentType(e.target.value)} className="w-full h-[42px] bg-transparent px-4 text-sm font-bold text-white focus:outline-none appearance-none">
                      <option value="" disabled className="bg-gray-900 text-gray-500">Relationship</option>
                      <option value="Mother" className="bg-gray-900">Mother</option>
                      <option value="Father" className="bg-gray-900">Father</option>
                      <option value="Brother" className="bg-gray-900">Brother</option>
                      <option value="Sister" className="bg-gray-900">Sister</option>
                      <option value="Friend" className="bg-gray-900">Friend</option>
                      <option value="Other" className="bg-gray-900">Other</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="relative w-full lg:flex-[1.2] bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all shadow-inner shrink-0">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                    <input type="number" step="0.01" required value={lentAmount} onChange={(e) => setLentAmount(e.target.value)} className="w-full h-[42px] bg-transparent pl-10 pr-3 text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
                  </div>

                  {/* Description */}
                  <div className="relative w-full lg:flex-[1.5] bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner shrink-0">
                    <input type="text" value={lentDescription} onChange={(e) => setLentDescription(e.target.value)} className="w-full h-[42px] bg-transparent px-4 text-sm font-medium text-white focus:outline-none placeholder-gray-500" placeholder="Description (Optional)" />
                  </div>

                  {/* Date */}
                  <div className="w-full lg:w-[140px] shrink-0">
                    <DateTimePicker date={lentDate} setDate={setLentDate} hideTime={true} />
                  </div>

                  {/* Submit */}
                  <button type="submit" className="w-full lg:w-[42px] h-[42px] shrink-0 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 flex items-center justify-center rounded-xl transition-all shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)] active:scale-[0.98]">
                    <UserPlus className="w-5 h-5 text-white" />
                  </button>
                </form>
              </div>
            )}
          </div>

        {/* ACTIVE BORROWERS GRID */}
        {activeGroups.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8 items-start">
            {activeGroups.map(group => renderCard(group, false))}
          </div>
        ) : (
          <div className="text-center bg-gray-950/30 py-16 rounded-[2rem] border border-gray-800 border-dashed mb-8 mx-2 sm:mx-0">
             <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
             <p className="text-gray-500 font-medium">No active borrowers.<br/>You're all settled up!</p>
          </div>
        )}

        {/* SETTLED BORROWERS GRID */}
        {settledGroups.length > 0 && (
          <>
            <div className="flex justify-between items-center mb-4 px-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Handshake className="w-4 h-4" /> SETTLED ACCOUNTS
              </h3>
              <button 
                onClick={handleClearSettledAccounts}
                className="text-[10px] font-bold bg-red-500/10 text-red-400 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors uppercase tracking-widest"
              >
                Clear All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 opacity-70 hover:opacity-100 transition-opacity items-start">
              {settledGroups.map(group => renderCard(group, true))}
            </div>
          </>
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
              <button onClick={() => setHistoryGroup(null)} className="absolute top-6 right-6 p-2 bg-gray-800/80 rounded-full text-gray-400 hover:text-white z-10"><X className="w-5 h-5"/></button>
              <div className="flex items-center justify-between mb-6 pr-8 gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex shrink-0 items-center justify-center font-black text-lg bg-gray-800 text-white shadow-inner`}>
                    {getInitials(historyGroup.name)}
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight truncate max-w-[150px] sm:max-w-[200px]">{historyGroup.name}'s History</h2>
                    <span className={`text-xs font-bold uppercase tracking-wider ${historyGroup.status === 'settled' ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {historyGroup.status === 'settled' ? 'Settled' : 'Active'}
                    </span>
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
                  const history = historyGroup.history ? [...historyGroup.history] : [];
                  history.sort((a, b) => new Date(b.date) - new Date(a.date));

                  if (history.length === 0) return <p className="text-gray-500 italic ml-8">No history found.</p>;

                  return history.map((item, i) => {
                    const dateObj = new Date(item.date);
                    const isBorrow = item.entryType === 'borrow';

                    return (
                      <div key={item.id || i} className="relative pl-10 py-1.5 group">
                        <div className={`absolute left-[10px] top-[50%] -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-900 z-10 ${isBorrow ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                        <div className="bg-gray-800/40 rounded-xl px-4 py-2.5 border border-gray-800 hover:bg-gray-800/60 transition-colors flex flex-row items-center justify-between gap-3">
                          
                          <div className="flex items-center gap-3 overflow-hidden">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest shrink-0">
                              {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-xs sm:text-sm font-medium text-white truncate">
                              {isBorrow ? (item.description || 'Borrowed') : (item.description || 'Payment')}
                            </span>
                            {isBorrow && item.dueDate && (
                              <span className="text-[10px] text-gray-600 hidden sm:inline whitespace-nowrap">
                                Due: {new Date(item.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            <span className={`text-sm font-black ${isBorrow ? 'text-amber-400' : 'text-emerald-400'}`}>
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
