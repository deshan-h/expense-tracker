import React, { useState } from 'react';
import { Handshake, Users, PlusCircle, CreditCard, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import DateTimePicker from '../components/ui/DateTimePicker';

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
  setLentDate,
  lentTime,
  setLentTime,
  pendingLent,
  handleReceiveLentPayment,
  formatLKR,
  handleDeleteLentMoney,
  handleDeleteLentPayment
}) => {
  // State for tracking payment inputs for each person
  const [paymentInputs, setPaymentInputs] = useState({});
  const [activePayment, setActivePayment] = useState(null);
  const [expandedHistory, setExpandedHistory] = useState(null);

  const toggleHistory = (name) => {
    setExpandedHistory(prev => prev === name ? null : name);
  };

  // Group pending lent by name
  const groupedLent = pendingLent.reduce((acc, curr) => {
    if (!acc[curr.name]) {
      acc[curr.name] = { name: curr.name, type: curr.type, totalOwed: 0, totalPaid: 0, records: [] };
    }
    acc[curr.name].totalOwed += (curr.amount - (curr.paidAmount || 0));
    acc[curr.name].totalPaid += (curr.paidAmount || 0);
    acc[curr.name].records.push(curr);
    return acc;
  }, {});

  const groupedArray = Object.values(groupedLent).filter(group => group.totalOwed > 0);

  const handlePaymentChange = (name, val) => {
    setPaymentInputs(prev => ({ ...prev, [name]: val }));
  };

  const submitPayment = (name) => {
    const amount = paymentInputs[name];
    if (amount) {
      handleReceiveLentPayment(name, amount);
      setPaymentInputs(prev => ({ ...prev, [name]: '' }));
      setActivePayment(null);
    } else {
      setActivePayment(null);
    }
  };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
        {/* Full-tab Ambient Glows */}
        <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-amber-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

        <div className="w-full relative z-10 mt-2">
          <div className="flex flex-col">

            {/* TOP ROW: Add Record Form */}
            <div className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] border border-gray-800 shadow-xl relative z-20 mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                <h3 className="text-xs font-bold text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
                  <PlusCircle className="w-4 h-4 text-amber-500" /> Lend Money
                </h3>
                <div className="flex p-1 bg-gray-900/60 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-inner w-full sm:w-auto">
                  <button type="button" onClick={() => setLentType('Family')} className={`flex-1 sm:flex-none px-6 py-1.5 text-[10px] md:text-xs font-semibold rounded-lg transition-all ${lentType === 'Family' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>Family</button>
                  <button type="button" onClick={() => setLentType('Friends')} className={`flex-1 sm:flex-none px-6 py-1.5 text-[10px] md:text-xs font-semibold rounded-lg transition-all ${lentType === 'Friends' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>Friends</button>
                </div>
              </div>
              
              <form onSubmit={handleAddLentMoney} className="flex flex-col md:flex-row gap-3 items-end">
                {/* Amount */}
                <div className={`w-full md:w-40 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-${lentType === 'Family' ? 'amber' : 'blue'}-500 focus-within:ring-1 focus-within:ring-${lentType === 'Family' ? 'amber' : 'blue'}-500 transition-all shadow-inner`}>
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xs">Rs.</span>
                  <input type="number" step="0.01" required value={lentAmount} onChange={(e) => setLentAmount(e.target.value)} className="w-full bg-transparent pl-10 pr-3 py-2.5 text-sm font-bold text-white focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
                </div>
                
                {/* Recipient */}
                <div className={`w-full md:w-48 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-${lentType === 'Family' ? 'amber' : 'blue'}-500 transition-all shadow-inner`}>
                  <input type="text" required value={lentName} onChange={(e) => setLentName(e.target.value)} className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="Recipient Name" />
                </div>

                {/* Details */}
                <div className={`w-full md:flex-1 relative bg-gray-900/80 rounded-xl border border-gray-700/80 focus-within:border-${lentType === 'Family' ? 'amber' : 'blue'}-500 transition-all shadow-inner`}>
                  <input type="text" value={lentDescription} onChange={(e) => setLentDescription(e.target.value)} className="w-full h-[42px] bg-transparent px-3 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="Notes (Optional)" />
                </div>
                {/* Date */}
                <div className="w-full md:w-44 flex-shrink-0">
                  <DateTimePicker date={lentDate} setDate={setLentDate} time={lentTime} setTime={setLentTime} hideTime={true} />
                </div>
                {/* Submit */}
                <button type="submit" className={`w-full md:w-auto h-[42px] bg-gradient-to-r ${lentType === 'Family' ? 'from-amber-600 via-orange-500 to-amber-600 shadow-[0_0_15px_-3px_rgba(245,158,11,0.5)]' : 'from-blue-600 via-cyan-500 to-blue-600 shadow-[0_0_15px_-3px_rgba(59,130,246,0.5)]'} bg-[length:200%_auto] hover:bg-right text-white font-black tracking-widest uppercase px-6 rounded-xl transition-all active:scale-[0.98] shrink-0 flex items-center justify-center gap-2`}>
                  <Handshake className="w-4 h-4" /> SAVE
                </button>
              </form>

              {/* Family Suggestions (Only if Family is selected) */}
              {lentType === 'Family' && (
                <div className="flex flex-wrap gap-2 mt-3 pl-1">
                  {['Mother', 'Father', 'Brother', 'Sister'].map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setLentName(name)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${lentName === name ? 'bg-amber-600 text-white shadow-md' : 'bg-gray-800/80 text-gray-400 border border-gray-700/80 hover:bg-gray-700 hover:text-white'}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* BOTTOM SECTION: Manage & Receive Payments */}
            <div className="bg-gray-900/40 backdrop-blur-xl p-4 md:p-6 rounded-[1.5rem] border border-gray-800 shadow-xl flex flex-col relative z-10 space-y-6">
              <div className="flex items-center justify-between px-2 mb-2">
                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-[0.2em] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Manage Lent & Payments
                </h3>
                <div className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl flex flex-col items-end shadow-inner">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total Owed</span>
                  <span className="text-sm font-black text-blue-400 leading-tight">
                    Rs. {formatLKR(groupedArray.reduce((acc, curr) => acc + curr.totalOwed, 0))}
                  </span>
                </div>
              </div>
              
              {groupedArray.length === 0 ? (
                 <div className="text-center bg-gray-950/30 p-10 rounded-3xl border border-gray-800 border-dashed flex flex-col items-center justify-center h-full min-h-[300px]">
                   <Users className="w-12 h-12 text-gray-600 mb-4" />
                   <p className="text-gray-500 font-medium">No one currently owes you money.<br/>You're all settled up!</p>
                 </div>
              ) : (
                <div className="flex flex-col">
                  {/* Table Headers (Hidden on small screens) */}
                  <div className="hidden md:grid grid-cols-5 gap-4 px-4 pb-3 mb-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest border-b border-gray-800/50">
                    <div>Who</div>
                    <div>Family or Friend</div>
                    <div className="text-right">Paid Total</div>
                    <div className="text-right">Total Owed</div>
                    <div className="text-center">Action</div>
                  </div>

                  <div className="space-y-2">
                    {groupedArray.map(group => (
                      <div key={group.name} className={`rounded-xl border border-gray-800/50 hover:bg-gray-800/80 transition-colors shadow-inner flex flex-col ${group.type === 'Family' ? 'bg-amber-500/5' : 'bg-blue-500/5'}`}>
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
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${group.type === 'Family' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
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
                             <span className="font-black text-sm text-white tracking-tight">Rs. {formatLKR(group.totalOwed)}</span>
                          </div>

                          {/* Action */}
                          <div className="flex md:justify-center mt-2 md:mt-0" onClick={(e) => e.stopPropagation()}>
                             {activePayment === group.name ? (
                               <div className="flex items-center gap-1 w-full md:max-w-[140px]">
                                  <div className="relative flex-1 bg-gray-900 border border-emerald-500/50 rounded-lg overflow-hidden flex items-center px-2 py-1.5">
                                    <span className="text-gray-500 text-[10px] font-bold mr-1">Rs.</span>
                                    <input 
                                      type="number" 
                                      step="0.01"
                                      placeholder="0"
                                      value={paymentInputs[group.name] || ''}
                                      onChange={(e) => handlePaymentChange(group.name, e.target.value)}
                                      className="w-full bg-transparent text-xs font-bold text-gray-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                      autoFocus
                                    />
                                  </div>
                                  <button 
                                    onClick={() => submitPayment(group.name)}
                                    className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 px-2.5 py-1.5 rounded-lg font-bold text-[10px] uppercase transition-colors"
                                  >
                                    ✓
                                  </button>
                               </div>
                             ) : (
                               <button 
                                  onClick={() => setActivePayment(group.name)}
                                  className="w-full md:w-auto bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-6 py-1.5 rounded-lg transition-colors cursor-pointer text-[10px] uppercase tracking-widest border border-gray-700/50"
                               >
                                  Pay
                               </button>
                             )}
                          </div>
                        </div>

                      {/* Expanded History Timeline */}
                      {expandedHistory === group.name && (
                         <div className="px-6 pb-6 pt-2 border-t border-gray-800/50 mt-1">
                           <h5 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Lending History</h5>
                           <div className="relative border-l-2 border-gray-700/50 ml-[70px] sm:ml-[90px] space-y-6">
                              {(() => {
                                const unifiedHistory = [];
                                group.records.forEach(rec => {
                                  unifiedHistory.push({ ...rec, entryType: 'borrow' });
                                  if (rec.paymentHistory && rec.paymentHistory.length > 0) {
                                    rec.paymentHistory.forEach(payment => {
                                      unifiedHistory.push({ ...payment, entryType: 'payment', parentRec: rec });
                                    });
                                  }
                                });
                                unifiedHistory.sort((a, b) => new Date(b.date) - new Date(a.date));

                                return unifiedHistory.map((item, i) => {
                                  const dateObj = new Date(item.date);
                                  const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                                  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

                                  if (item.entryType === 'borrow') {
                                    return (
                                      <div key={`borrow-${item.id || i}`} className="relative pl-4 sm:pl-6 group">
                                         <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 text-right w-max">
                                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dateStr}</div>
                                           <div className="text-[9px] font-semibold text-gray-500">{timeStr}</div>
                                         </div>
                                         <div className={`absolute -left-[9px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-gray-900 ${item.status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                                         <div className="flex items-center justify-between gap-2 sm:gap-4 py-1.5 px-3 bg-gray-800/30 hover:bg-gray-800/70 rounded-xl transition-colors border border-gray-700/40 shadow-sm relative pr-10">
                                           <div className="flex items-center gap-3 overflow-hidden">
                                             <span className="text-xs font-bold text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                                               {item.description || 'Borrowed money'}
                                             </span>
                                           </div>
                                           <div className="flex items-center gap-3 shrink-0">
                                             <span className="text-xs font-black text-white">
                                               Rs. {formatLKR(item.amount)} 
                                             </span>
                                           </div>
                                           <button 
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); handleDeleteLentMoney(item.id); }}
                                              className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                         </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div key={`payment-${item.id || i}`} className="relative pl-4 sm:pl-6 group">
                                         <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 text-right w-max">
                                           <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{dateStr}</div>
                                           <div className="text-[9px] font-semibold text-gray-500">{timeStr}</div>
                                         </div>
                                         <div className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-gray-900 bg-emerald-500"></div>
                                         <div className="flex items-center justify-between gap-2 sm:gap-4 py-1.5 px-3 bg-gray-800/30 hover:bg-gray-800/70 rounded-xl transition-colors border border-gray-700/40 shadow-sm relative pr-10">
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
                                              onClick={(e) => { 
                                                e.stopPropagation(); 
                                                const pIdx = item.parentRec.paymentHistory.findIndex(p => p.amount === item.amount && p.date === item.date);
                                                if (pIdx !== -1) handleDeleteLentPayment(item.parentRec.id, pIdx);
                                              }}
                                              className="absolute right-2 opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all cursor-pointer"
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
                  ))}
                </div>
              </div>
            )}
          </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyLentTab;
