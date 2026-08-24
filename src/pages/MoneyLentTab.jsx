import React, { useState } from 'react';
import { Handshake, Users, PlusCircle, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
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
  formatLKR
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

            {/* RIGHT COLUMN: Manage & Receive Payments */}
            <div className="flex flex-col gap-8">
              <h3 className="text-sm font-bold text-gray-300 px-2 uppercase tracking-[0.2em] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" /> Manage Lent & Payments
              </h3>
              
              {groupedArray.length === 0 ? (
                 <div className="text-center bg-gray-900/30 p-10 rounded-3xl border border-gray-700/50 flex flex-col items-center justify-center h-full min-h-[300px]">
                   <Users className="w-12 h-12 text-gray-600 mb-4" />
                   <p className="text-gray-500 font-medium">No one currently owes you money.<br/>You're all settled up!</p>
                 </div>
              ) : (
                <div className="space-y-4">
                  {groupedArray.map(group => (
                    <div key={group.name} className={`rounded-2xl border border-gray-800/50 hover:bg-gray-800/80 transition-colors shadow-inner flex flex-col ${group.type === 'Family' ? 'bg-amber-500/5' : 'bg-blue-500/5'}`}>
                      <div 
                        className="p-3 md:p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-3 cursor-pointer"
                        onClick={() => toggleHistory(group.name)}
                      >
                        <div className="flex items-center justify-between w-full xl:w-auto xl:flex-1 xl:pr-4">
                           <div>
                              <h4 className="font-bold text-gray-100 text-base flex items-center gap-2">
                                {group.name}
                                {expandedHistory === group.name ? (
                                  <ChevronUp className="w-4 h-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="w-4 h-4 text-gray-500" />
                                )}
                              </h4>
                              <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${group.type === 'Family' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                {group.type}
                              </span>
                           </div>
                           <div className="text-right xl:hidden flex flex-col items-end gap-1">
                              {group.totalPaid > 0 && (
                                <span className="text-emerald-400 font-semibold text-[9px] tracking-wide bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  PAID: Rs. {formatLKR(group.totalPaid)}
                                </span>
                              )}
                              <div>
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">Owed</p>
                                <p className="font-black text-lg text-white">Rs. {formatLKR(group.totalOwed)}</p>
                              </div>
                           </div>
                        </div>
                        
                        <div 
                          className="flex items-center gap-3 w-full xl:w-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="hidden xl:flex items-center text-right pr-4 border-r border-gray-700/50 whitespace-nowrap gap-4">
                              {group.totalPaid > 0 && (
                                <div className="text-right border-r border-gray-700/50 pr-4 flex items-center h-full">
                                   <span className="inline-block text-emerald-400 font-semibold text-[10px] tracking-wide bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20">
                                     PAID: Rs. {formatLKR(group.totalPaid)}
                                   </span>
                                </div>
                              )}
                              <div>
                                 <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-0.5">Total Owed</p>
                                 <p className="font-black text-lg text-white tracking-tight">Rs. {formatLKR(group.totalOwed)}</p>
                              </div>
                          </div>
                          
                          {/* Payment Input */}
                          {activePayment === group.name ? (
                            <div className="bg-gray-900/80 p-1.5 rounded-xl border border-gray-700/80 flex gap-1.5 w-full xl:w-[220px]">
                               <div className="relative flex-1 bg-gray-800 rounded-lg border border-gray-700/50 focus-within:border-emerald-500 overflow-hidden px-3 py-1.5 flex items-center transition-all">
                                  <span className="text-gray-500 text-xs font-bold mr-1">Rs.</span>
                                  <input 
                                    type="number" 
                                    step="0.01"
                                    placeholder="0.00"
                                    value={paymentInputs[group.name] || ''}
                                    onChange={(e) => handlePaymentChange(group.name, e.target.value)}
                                    className="w-full bg-transparent text-sm font-medium text-gray-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder-gray-600"
                                    autoFocus
                                  />
                               </div>
                               <button 
                                 onClick={() => submitPayment(group.name)}
                                 className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold px-4 py-1.5 rounded-lg transition-colors cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center active:scale-95 shadow-md"
                               >
                                  ✓
                               </button>
                            </div>
                          ) : (
                            <button 
                              onClick={() => setActivePayment(group.name)}
                              className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold px-6 py-2 rounded-xl transition-colors cursor-pointer text-xs uppercase tracking-widest flex items-center justify-center active:scale-95 border border-gray-700/50"
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
                                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 py-2.5 px-3 bg-gray-800/30 hover:bg-gray-800/70 rounded-xl transition-colors border border-gray-700/40 shadow-sm">
                                           <div className="flex items-center gap-3 flex-1 overflow-hidden w-full sm:w-auto">
                                             <span className="text-sm font-bold text-gray-200 whitespace-nowrap overflow-hidden text-ellipsis">
                                               {item.description || 'Borrowed money'}
                                             </span>
                                           </div>
                                           <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                                             <span className="text-sm font-black text-white">
                                               Rs. {formatLKR(item.amount)} 
                                             </span>
                                           </div>
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
                                         <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 py-2.5 px-3 bg-gray-800/30 hover:bg-gray-800/70 rounded-xl transition-colors border border-gray-700/40 shadow-sm">
                                           <div className="flex items-center gap-3 flex-1 overflow-hidden w-full sm:w-auto">
                                             <span className="text-sm font-bold text-emerald-400 whitespace-nowrap overflow-hidden text-ellipsis flex items-center gap-2">
                                               <CreditCard className="w-3 h-3" /> Payment Received
                                             </span>
                                           </div>
                                           <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                                             <span className="text-sm font-black text-emerald-400">
                                               + Rs. {formatLKR(item.amount)} 
                                             </span>
                                           </div>
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
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default MoneyLentTab;
