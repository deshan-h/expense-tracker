import React, { useState } from 'react';
import { Handshake, Users, PlusCircle, CreditCard, ChevronDown, ChevronUp, Trash2, Plus, Minus } from 'lucide-react';
import DateTimePicker from '../components/ui/DateTimePicker';

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
  lentTime,
  setLentTime,
  lentMoney,
  handleReceiveLentPayment,
  formatLKR,
  handleDeleteLentHistoryEntry
}) => {
  const [expandedHistory, setExpandedHistory] = useState(null);
  const [showSettled, setShowSettled] = useState(false);
  const [showAddBorrower, setShowAddBorrower] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalGroup, setModalGroup] = useState(null);
  const [modalType, setModalType] = useState('lend'); // 'lend' | 'receive'
  const [modalAmount, setModalAmount] = useState('');
  const [modalDescription, setModalDescription] = useState('');
  const [modalDueDate, setModalDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toISOString().split('T')[0];
  });
  const [modalDate, setModalDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalTime, setModalTime] = useState(new Date().toTimeString().slice(0, 5));

  const toggleHistory = (name) => {
    setExpandedHistory(prev => prev === name ? null : name);
  };

  // With the new schema, lentMoney is already grouped by person (one document per person)
  // We just need to separate them into active and settled
  const allGroups = lentMoney || [];
  const activeGroups = allGroups.filter(group => group.status !== 'settled');
  const settledGroups = allGroups.filter(group => group.status === 'settled');

  const openModal = (group) => {
    setModalGroup(group);
    setModalType('lend');
    setModalAmount('');
    setModalDescription('');
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    setModalDueDate(d.toISOString().split('T')[0]);
    setModalDate(new Date().toISOString().split('T')[0]);
    setModalTime(new Date().toTimeString().slice(0, 5));
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!modalAmount) return;
    const amount = parseFloat(modalAmount);
    if (isNaN(amount) || amount <= 0) return;

    if (modalType === 'receive') {
      const fullDate = `${modalDate}T${modalTime}`;
      await handleReceiveLentPayment(modalGroup.name, modalAmount, fullDate);
    } else if (modalType === 'lend' && handleAddLentInline) {
      const fullDate = `${modalDate}T${modalTime}`;
      await handleAddLentInline({ 
        type: modalGroup.type, 
        name: modalGroup.name, 
        amount: amount, 
        description: modalDescription || 'Additional loan', 
        date: fullDate,
        dueDate: modalDueDate
      });
    }
    setIsModalOpen(false);
    setModalGroup(null);
  };

  const renderGroup = (group, isSettled = false) => {
    const totalOwed = (group.totalAmount || 0) - (group.totalPaid || 0);

    return (
      <div key={group.id} className={`rounded-xl border border-gray-800/50 hover:bg-gray-800/80 transition-colors shadow-inner flex flex-col ${group.type === 'Family' ? 'bg-amber-500/5' : 'bg-blue-500/5'}`}>
        <div 
          className="px-4 py-3 grid grid-cols-1 md:grid-cols-5 gap-4 items-center cursor-pointer"
          onClick={() => toggleHistory(group.name)}
        >
          {/* Who */}
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-100 text-sm">{group.name}</h4>
            {expandedHistory === group.name ? (
              <ChevronUp className="w-3 h-3 text-gray-500" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-500" />
            )}
          </div>

          {/* Type */}
          <div className="flex md:block">
            <span className="md:hidden text-xs text-gray-500 font-bold mr-2">Type:</span>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${group.type === 'Family' || group.type === 'Mother' || group.type === 'Father' || group.type === 'Brother' || group.type === 'Sister' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
              {group.type}
            </span>
          </div>

          {/* Paid Total */}
          <div className="flex md:block justify-between md:text-right">
            <span className="md:hidden text-xs text-gray-500 font-bold">Paid Total:</span>
            {group.totalPaid > 0 ? (
               <span className="text-emerald-400 font-bold text-xs tracking-wide">
                 Rs. {formatLKR(group.totalPaid)}
               </span>
            ) : <span className="text-gray-600 text-xs">-</span>}
          </div>

          {/* Total Owed */}
          <div className="flex md:block justify-between md:text-right">
             <span className="md:hidden text-xs text-gray-500 font-bold">Total Owed:</span>
             <span className="font-black text-sm text-white tracking-tight">Rs. {formatLKR(totalOwed)}</span>
          </div>

          {/* Action */}
          <div className="flex md:justify-center md:justify-end mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
             {isSettled ? (
               <div className="w-full md:w-auto bg-emerald-500/10 text-emerald-500 font-bold px-6 py-1.5 rounded-lg text-[10px] uppercase tracking-widest border border-emerald-500/20 text-center flex items-center justify-center gap-1">
                 <CreditCard className="w-3 h-3" /> SETTLED
               </div>
             ) : (
               <div className="flex gap-2 w-full md:w-auto justify-end">
                 <button 
                    onClick={() => openModal(group)}
                    className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px] uppercase tracking-widest shadow-md flex items-center justify-center gap-1"
                 >
                    <Plus className="w-3 h-3" /> Add
                 </button>
               </div>
             )}
          </div>
        </div>

        {/* Expanded History Timeline */}
        {expandedHistory === group.name && (
           <div className="px-6 pb-6 pt-2 border-t border-gray-800/50 mt-1">
             <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Lending History</h5>
             <div className="relative border-l-2 border-gray-700/50 ml-[70px] sm:ml-[90px] space-y-0">
                {(() => {
                  const history = group.history ? [...group.history] : [];
                  // Sort newest at the top, oldest at the bottom
                  history.sort((a, b) => new Date(b.date) - new Date(a.date));

                  return history.map((item, i) => {
                    const dateObj = new Date(item.date);
                    const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                    if (item.entryType === 'borrow') {
                      return (
                        <div key={item.id || `borrow-${i}`} className="relative pl-4 sm:pl-6 group/item">
                           <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 text-right w-max">
                             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dateStr}</div>
                             <div className="text-[9px] font-semibold text-gray-500">{timeStr}</div>
                           </div>
                           <div className="absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-gray-900 bg-amber-500"></div>
                           <div className="flex items-center justify-between gap-2 sm:gap-4 py-2.5 px-2 hover:bg-gray-800/20 transition-colors border-b border-gray-800/50 relative pr-10">
                             <div className="flex flex-col overflow-hidden justify-center gap-0.5">
                               <span className="text-xs font-bold text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                                 {item.description || 'Borrowed money'}
                               </span>
                               {item.dueDate && (() => {
                                 const today = new Date();
                                 today.setHours(0, 0, 0, 0);
                                 const dueDate = new Date(item.dueDate);
                                 dueDate.setHours(0, 0, 0, 0);
                                 const isOverdue = dueDate < today;
                                 return (
                                   <span className={`text-[9px] font-bold uppercase tracking-widest ${isOverdue ? 'text-red-500' : 'text-amber-500/80'}`}>
                                     Due: {new Date(item.dueDate).toLocaleDateString()}
                                   </span>
                                 );
                               })()}
                             </div>
                             <div className="flex items-center gap-3 shrink-0">
                               <span className="text-xs font-black text-white">
                                 Rs. {formatLKR(item.amount)} 
                               </span>
                             </div>
                             <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteLentHistoryEntry(group.id, item.id); }}
                                className="absolute right-2 opacity-0 group-hover/item:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                           </div>
                        </div>
                      );
                    } else {
                      return (
                        <div key={item.id || `payment-${i}`} className="relative pl-4 sm:pl-6 group/item">
                           <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 text-right w-max">
                             <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dateStr}</div>
                             <div className="text-[9px] font-semibold text-gray-500">{timeStr}</div>
                           </div>
                           <div className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-900 bg-emerald-500"></div>
                           <div className="flex items-center justify-between gap-2 sm:gap-4 py-2.5 px-2 hover:bg-gray-800/20 transition-colors border-b border-gray-800/50 relative pr-10">
                             <div className="flex items-center gap-3 overflow-hidden">
                               <span className="text-xs font-bold text-emerald-400 whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
                                 <CreditCard className="w-3 h-3" /> Payment Received
                               </span>
                             </div>
                             <div className="flex items-center gap-3 shrink-0">
                               <span className="text-xs font-black text-emerald-400">
                                 + Rs. {formatLKR(item.amount)} 
                               </span>
                             </div>
                             <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteLentHistoryEntry(group.id, item.id); }}
                                className="absolute right-2 opacity-0 group-hover/item:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                           </div>
                        </div>
                      );
                    }
                  });
                })()}
             </div>
           </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
        {/* Full-tab Ambient Glows */}
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-amber-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

        <div className="w-full relative z-10 mt-2">
          <div className="flex flex-col">

            {/* MAIN SECTION: Manage Lent & Add Borrower */}
            <div className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] border border-gray-800 shadow-xl flex flex-col relative z-20 space-y-6 mb-6">
              
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Manage Lent & Payments
                </h3>
                <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl flex flex-col items-end shadow-inner">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Owed</span>
                  <span className="text-sm font-black text-blue-400 leading-tight">
                    Rs. {formatLKR(activeGroups.reduce((acc, curr) => acc + ((curr.totalAmount || 0) - (curr.totalPaid || 0)), 0))}
                  </span>
                </div>
              </div>

              {/* Add New Borrower Bar */}
              <div 
                className="flex items-center justify-between cursor-pointer group bg-gray-950/30 p-3 rounded-xl border border-gray-800/50 hover:bg-gray-900/50 transition-colors"
                onClick={() => setShowAddBorrower(!showAddBorrower)}
              >
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2 group-hover:text-white transition-colors">
                  <PlusCircle className="w-4 h-4 text-orange-500" /> Add New Borrower
                </h3>
                <div className="text-gray-500 group-hover:text-gray-300 transition-colors bg-gray-800/50 p-1.5 rounded-full flex items-center justify-center">
                  {showAddBorrower ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>
              
              {showAddBorrower && (
                <form onSubmit={handleAddLentMoney} className="flex flex-col gap-3 mt-4">
                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    {/* Name */}
                    <div className="w-full md:flex-1 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner">
                      <input type="text" required value={lentName} onChange={(e) => setLentName(e.target.value)} className="w-full h-[42px] bg-transparent px-3 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="Recipient Name" />
                    </div>

                    {/* Who (Relationship) */}
                    <div className="w-full md:w-36 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner">
                      <select required value={lentType} onChange={(e) => setLentType(e.target.value)} className="w-full h-[42px] bg-transparent px-3 text-sm font-medium text-gray-100 focus:outline-none appearance-none cursor-pointer">
                        <option value="" disabled className="bg-gray-900 text-gray-500">Who?</option>
                        <option value="Mother" className="bg-gray-900">Mother</option>
                        <option value="Father" className="bg-gray-900">Father</option>
                        <option value="Brother" className="bg-gray-900">Brother</option>
                        <option value="Sister" className="bg-gray-900">Sister</option>
                        <option value="Friend" className="bg-gray-900">Friend</option>
                        <option value="Other" className="bg-gray-900">Other</option>
                      </select>
                      <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Amount */}
                    <div className="w-full md:w-40 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all shadow-inner">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                      <input type="number" step="0.01" required value={lentAmount} onChange={(e) => setLentAmount(e.target.value)} className="w-full h-[42px] bg-transparent pl-10 pr-3 text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
                    </div>
                    
                    {/* Date */}
                    <div className="w-full md:w-44 flex-shrink-0">
                      <DateTimePicker date={lentDate} setDate={setLentDate} time={lentTime} setTime={setLentTime} hideTime={true} />
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-3 items-end">
                    {/* Description */}
                    <div className="w-full md:flex-1 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-amber-500 transition-all shadow-inner">
                      <input type="text" value={lentDescription} onChange={(e) => setLentDescription(e.target.value)} className="w-full h-[42px] bg-transparent px-3 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="What is it for? (Optional)" />
                    </div>

                    {/* Due Date */}
                    <div className="w-full md:w-56 flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Due Date (Optional)</span>
                      <DateTimePicker date={lentDueDate} setDate={setLentDueDate} hideTime={true} />
                    </div>

                    {/* Submit */}
                    <button type="submit" className="w-full md:w-auto h-[42px] bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-[length:200%_auto] hover:bg-right text-white font-black tracking-widest uppercase px-6 rounded-xl transition-all shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)] active:scale-[0.98] shrink-0 flex items-center justify-center gap-2">
                      <Handshake className="w-4 h-4" /> SAVE
                    </button>
                  </div>
                </form>
              )}
              {/* Active Groups Table */}              {activeGroups.length === 0 ? (
                 <div className="text-center bg-gray-950/30 p-10 rounded-3xl border border-gray-800 border-dashed flex flex-col items-center justify-center h-full min-h-[300px]">
                   <Users className="w-12 h-12 text-gray-600 mb-4" />
                   <p className="text-gray-500 font-medium">No one currently owes you money.<br/>You're all settled up!</p>
                 </div>
              ) : (
                <div className="flex flex-col">
                  {/* Table Headers (Hidden on small screens) */}
                  <div className="hidden md:grid grid-cols-5 gap-4 px-4 pb-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800/50">
                    <div>Who</div>
                    <div>Relationship</div>
                    <div className="text-right">Paid Total</div>
                    <div className="text-right">Total Owed</div>
                    <div className="text-right">Action</div>
                  </div>

                  <div className="space-y-2">
                    {activeGroups.map(group => renderGroup(group, false))}
                  </div>
                </div>
              )}
            </div>

            {/* SETTLED ACCOUNTS SECTION */}
            {settledGroups.length > 0 && (
              <div className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] border border-gray-800 shadow-xl flex flex-col relative z-10 mt-6">
                <div 
                  className="flex items-center justify-between px-2 cursor-pointer"
                  onClick={() => setShowSettled(!showSettled)}
                >
                  <h3 className="text-sm font-bold text-gray-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-600" /> Settled Accounts
                  </h3>
                  <button className="text-gray-500 hover:text-gray-300 transition-colors bg-gray-800/50 p-2 rounded-full">
                    {showSettled ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
                
                {showSettled && (
                  <div className="flex flex-col mt-4">
                    <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr_120px] gap-4 px-4 pb-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800/50">
                      <div>Who</div>
                      <div>Relationship</div>
                      <div className="text-right">Paid Total</div>
                      <div className="text-right">Total Owed</div>
                      <div className="text-right">Action</div>
                    </div>
                    <div className="space-y-2">
                      {settledGroups.map(group => renderGroup(group, true))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ACTION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-gray-900 border border-gray-700/50 w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative z-10">
            <h2 className="text-xl font-black text-white text-center mb-6">Manage: {modalGroup?.name}</h2>
            
            {/* Pill Toggle */}
            <div className="flex bg-gray-800/80 rounded-xl p-1 mb-6 relative border border-gray-700/50 shadow-inner">
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg transition-transform duration-300 ease-in-out ${modalType === 'lend' ? 'translate-x-0 bg-amber-500' : 'translate-x-[calc(100%+4px)] bg-emerald-500'}`} />
              <button
                type="button"
                onClick={() => setModalType('lend')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold uppercase tracking-wider relative z-10 transition-colors ${modalType === 'lend' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Plus className="w-4 h-4" /> LEND
              </button>
              <button
                type="button"
                onClick={() => setModalType('receive')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold uppercase tracking-wider relative z-10 transition-colors ${modalType === 'receive' ? 'text-gray-900' : 'text-gray-400 hover:text-gray-200'}`}
              >
                <Minus className="w-4 h-4" /> PAY
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-4">
              {/* Amount */}
              <div className="relative bg-gray-800/50 rounded-xl border border-gray-700/50 focus-within:border-blue-500 transition-colors">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">Rs.</span>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  autoFocus
                  value={modalAmount} 
                  onChange={(e) => setModalAmount(e.target.value)} 
                  className="w-full h-[50px] bg-transparent pl-12 pr-4 text-lg font-black text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                  placeholder="0.00" 
                />
              </div>

              {/* Conditionally render fields based on type */}
              {modalType === 'lend' && (
                <div className="relative bg-gray-800/50 rounded-xl border border-gray-700/50 focus-within:border-amber-500 transition-colors">
                  <input 
                    type="text" 
                    value={modalDescription} 
                    onChange={(e) => setModalDescription(e.target.value)} 
                    className="w-full h-[45px] bg-transparent px-4 text-sm font-medium text-white focus:outline-none placeholder-gray-500" 
                    placeholder="What is it for? (Optional)" 
                  />
                </div>
              )}

              <div className="flex gap-3">
                <div className="flex-1 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Date</span>
                  <DateTimePicker date={modalDate} setDate={setModalDate} time={modalTime} setTime={setModalTime} hideTime={true} />
                </div>
                {modalType === 'lend' && (
                  <div className="flex-1 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-1">Due Date (Optional)</span>
                    <DateTimePicker date={modalDueDate} setDate={setModalDueDate} hideTime={true} />
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className={`w-full mt-2 h-[50px] font-black tracking-widest uppercase rounded-xl shadow-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2 ${modalType === 'lend' ? 'bg-amber-500 text-gray-900 hover:bg-amber-400' : 'bg-emerald-500 text-gray-900 hover:bg-emerald-400'}`}
              >
                {modalType === 'lend' ? 'SAVE LOAN' : 'PAYMENT RECEIVED'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoneyLentTab;
