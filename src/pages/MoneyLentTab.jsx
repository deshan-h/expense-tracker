import React, { useState } from 'react';
import { Handshake, Users, PlusCircle, CreditCard } from 'lucide-react';
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
  const [view, setView] = useState('add'); // 'add' or 'manage'
  
  // State for tracking payment inputs for each person
  const [paymentInputs, setPaymentInputs] = useState({});

  // Group pending lent by name
  const groupedLent = pendingLent.reduce((acc, curr) => {
    if (!acc[curr.name]) {
      acc[curr.name] = { name: curr.name, type: curr.type, totalOwed: 0, records: [] };
    }
    acc[curr.name].totalOwed += (curr.amount - (curr.paidAmount || 0));
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
    }
  };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="px-4 md:px-12 py-4 w-full max-w-full">
      {/* Full-tab Ambient Glows */}
      <div className="absolute top-[10%] left-[10%] w-[40vw] h-[40vw] bg-amber-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] bg-blue-600/10 rounded-full blur-[120px] mix-blend-screen opacity-50 pointer-events-none"></div>

      <div className="w-full relative z-10 mt-2">
        <div className="relative z-10">
      {/* Top Navigation */}
      <div className="flex p-1 bg-gray-900 rounded-2xl w-full max-w-md mx-auto mb-10">
        <button 
          type="button" 
          onClick={() => setView('add')} 
          className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'add' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
        >
          <PlusCircle className="w-4 h-4" /> Add Record
        </button>
        <button 
          type="button" 
          onClick={() => setView('manage')} 
          className={`flex-1 py-3 text-sm md:text-base font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${view === 'manage' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}
        >
          <Users className="w-4 h-4" /> Manage Lent
        </button>
      </div>

      {view === 'add' && (
        <form onSubmit={handleAddLentMoney} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          
          {/* COLUMN 1 */}
          <div className="space-y-8 flex flex-col justify-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-amber-500/10 rounded-full">
                <Handshake className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Lend Money</h3>
                <p className="text-sm text-gray-400">Keep track of money you lent to others</p>
              </div>
            </div>

            <div className="flex p-1 bg-gray-900 rounded-2xl w-full mx-auto">
              <button type="button" onClick={() => setLentType('Family')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${lentType === 'Family' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>Family</button>
              <button type="button" onClick={() => setLentType('Friends')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${lentType === 'Friends' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200 cursor-pointer'}`}>Friends</button>
            </div>

            <div className="text-center bg-gray-900/60 backdrop-blur-md p-8 rounded-3xl border border-gray-700/50 relative shadow-inner">
              <p className="text-xs font-bold text-gray-400 mb-4 uppercase tracking-[0.2em]">Amount Lent</p>
              <div className="flex items-center justify-center text-6xl md:text-7xl font-bold text-white group">
                <span className="text-gray-500 mr-4 text-4xl">Rs.</span>
                <input type="number" step="0.01" required value={lentAmount} onChange={(e) => setLentAmount(e.target.value)} className="bg-transparent border-none outline-none text-left w-[220px] md:w-[300px] focus:ring-0 placeholder-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
              </div>
              <div className={`h-1 w-48 bg-gradient-to-r from-transparent via-gray-700 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-${lentType === 'Family' ? 'amber' : 'blue'}-500 group-focus-within:opacity-100 transition-all duration-700 rounded-full`}></div>
            </div>

            <div className="space-y-4 bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-gray-700/50 shadow-inner">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Recipient</p>
              <div className={`relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-${lentType === 'Family' ? 'amber' : 'blue'}-500 focus-within:ring-1 focus-within:ring-${lentType === 'Family' ? 'amber' : 'blue'}-500 transition-all overflow-hidden shadow-inner`}>
                <input type="text" required value={lentName} onChange={(e) => setLentName(e.target.value)} className="w-full bg-transparent px-5 py-4 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="Who did you lend to?" />
              </div>
              
              {lentType === 'Family' && (
                <div className="flex flex-wrap gap-2 px-1">
                  {['Mother', 'Father', 'Brother', 'Sister'].map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setLentName(name)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${lentName === name ? 'bg-amber-600 text-white shadow-md shadow-amber-500/30' : 'bg-gray-800/80 text-gray-400 border border-gray-700/80 hover:bg-gray-700 hover:text-white'}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* COLUMN 2 */}
          <div className="flex flex-col justify-between bg-gray-900/60 backdrop-blur-md p-6 rounded-3xl border border-gray-700/50 shadow-inner">
            <div className="space-y-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Details</p>

              <div className={`relative bg-gray-900/80 rounded-2xl border border-gray-700/80 focus-within:border-${lentType === 'Family' ? 'amber' : 'blue'}-500 focus-within:ring-1 focus-within:ring-${lentType === 'Family' ? 'amber' : 'blue'}-500 transition-all overflow-hidden shadow-inner`}>
                <input type="text" value={lentDescription} onChange={(e) => setLentDescription(e.target.value)} className="w-full bg-transparent px-5 py-4 text-sm font-medium text-gray-100 placeholder-gray-600 focus:outline-none" placeholder="Notes (Optional)" />
              </div>

              <div className="mt-4">
                <DateTimePicker date={lentDate} setDate={setLentDate} time={lentTime} setTime={setLentTime} />
              </div>
            </div>

            <button type="submit" className={`hidden lg:flex w-full bg-gradient-to-r ${lentType === 'Family' ? 'from-amber-600 via-orange-500 to-amber-600 shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)]' : 'from-blue-600 via-cyan-500 to-blue-600 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]'} bg-[length:200%_auto] hover:bg-right text-white font-black tracking-widest uppercase py-5 rounded-2xl transition-all active:scale-[0.98] cursor-pointer items-center justify-center gap-3 text-lg mt-8`}>
              <Handshake className="w-6 h-6" /> SAVE RECORD
            </button>
          </div>

          {/* MOBILE SAVE BUTTON */}
          <button type="submit" className={`w-full lg:hidden bg-gradient-to-r ${lentType === 'Family' ? 'from-amber-600 via-orange-500 to-amber-600 shadow-[0_0_20px_-5px_rgba(245,158,11,0.5)]' : 'from-blue-600 via-cyan-500 to-blue-600 shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)]'} bg-[length:200%_auto] hover:bg-right text-white font-black tracking-widest uppercase py-5 rounded-2xl transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-3 text-lg mt-4`}>
            <Handshake className="w-6 h-6" /> SAVE RECORD
          </button>

        </form>
      )}

      {view === 'manage' && (
        <div className="space-y-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-500/10 rounded-full">
              <CreditCard className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white">Manage & Receive Payments</h3>
              <p className="text-sm text-gray-400">Apply partial or full payments to recipients</p>
            </div>
          </div>

          {groupedArray.length === 0 ? (
             <div className="text-center bg-gray-900/30 p-10 rounded-3xl border border-gray-700/50">
               <p className="text-gray-500">No one currently owes you money. You're all settled up!</p>
             </div>
          ) : (
            <div className="overflow-x-auto bg-gray-900/30 rounded-2xl border border-gray-700/50 shadow-inner p-6">
              <div className="min-w-[800px]">
                
                {/* Headers */}
                <div className="grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400 uppercase tracking-widest pb-4 border-b border-gray-700/50 mb-6 pl-4">
                  <div className="col-span-3">Recipient</div>
                  <div className="col-span-2">Category</div>
                  <div className="col-span-3 text-right pr-4">Total Owed</div>
                  <div className="col-span-4 text-center">Receive Payment</div>
                </div>

                {/* Table Rows */}
                <div className="space-y-3">
                  {groupedArray.map(group => (
                    <div key={group.name} className={`py-3 px-4 rounded-xl transition-colors grid grid-cols-12 gap-4 items-center border border-gray-800/50 hover:bg-gray-800/40 ${group.type === 'Family' ? 'bg-amber-500/5' : 'bg-blue-500/5'}`}>
                      
                      {/* Recipient */}
                      <div className="col-span-3">
                        <div className="font-bold text-gray-100 text-base">{group.name}</div>
                      </div>

                      {/* Category */}
                      <div className="col-span-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${group.type === 'Family' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {group.type}
                        </span>
                      </div>

                      {/* Total Owed */}
                      <div className="col-span-3 text-right pr-4 font-extrabold text-xl whitespace-nowrap text-white">
                        Rs. {formatLKR(group.totalOwed)}
                      </div>
                      
                      {/* Receive Payment Action */}
                      <div className="col-span-4 flex justify-end">
                        <div className="bg-gray-900 p-1.5 rounded-xl border border-gray-700 flex gap-2 w-full max-w-[280px]">
                          <div className="relative flex-1 bg-gray-800 rounded-lg border border-gray-700/50 focus-within:border-emerald-500 overflow-hidden px-3 py-1.5 flex items-center">
                             <span className="text-gray-500 text-sm font-bold mr-2">Rs.</span>
                             <input 
                               type="number" 
                               step="0.01"
                               placeholder="0.00"
                               value={paymentInputs[group.name] || ''}
                               onChange={(e) => handlePaymentChange(group.name, e.target.value)}
                               className="w-full bg-transparent text-sm text-gray-100 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                             />
                          </div>
                          <button 
                            onClick={() => submitPayment(group.name)}
                            className="bg-emerald-500 hover:bg-emerald-400 text-gray-900 font-bold px-4 py-1.5 rounded-lg transition-colors flex items-center justify-center cursor-pointer text-sm"
                          >
                             Pay
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
      </div>
      </div>
    </div>
  );
};

export default MoneyLentTab;
