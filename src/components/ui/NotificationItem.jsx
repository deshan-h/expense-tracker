import { useState } from 'react';
import toast from 'react-hot-toast';

export const NotificationItem = ({ schedule, skipSchedule, approveSchedule }) => {
  const [editableAmount, setEditableAmount] = useState(schedule.amount ? schedule.amount.toString() : '');

  const handleApprove = async () => {
    const finalAmount = parseFloat(editableAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    await approveSchedule({ ...schedule, amount: finalAmount });
  };

  return (
    <div className="bg-gray-800/60 p-4 rounded-2xl border border-gray-700/50 flex flex-col gap-3 relative overflow-hidden group hover:border-gray-600 transition-all">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 pointer-events-none"></div>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start z-10 gap-3">
        <div>
          <h4 className="font-bold text-gray-100">{schedule.description || schedule.category}</h4>
          <div className="text-xs text-gray-400 flex gap-2 mt-1">
            <span className="bg-gray-700/50 px-2 py-0.5 rounded-full">{schedule.category}</span>
            <span className="bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">{schedule.frequency}</span>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-900/80 px-3 py-1.5 rounded-xl border border-gray-700 focus-within:border-blue-500 transition-all shrink-0">
          <span className="text-gray-400 text-sm font-bold">LKR</span>
          <input 
            type="number"
            value={editableAmount}
            onChange={(e) => setEditableAmount(e.target.value)}
            className="w-20 bg-transparent text-right text-rose-400 font-black focus:outline-none"
          />
        </div>
      </div>

      <div className="flex gap-2 w-full mt-2 z-10">
        <button 
          onClick={async () => await skipSchedule(schedule)}
          className="flex-1 py-2 px-3 bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-xl font-bold transition-all border border-gray-600 active:scale-95 text-xs text-center"
        >
          Skip
        </button>
        <button 
          onClick={handleApprove}
          className="flex-[2] py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-xs text-center uppercase tracking-wide"
        >
          Verify & Add
        </button>
      </div>
    </div>
  );
};

export const TabFallback = () => (
  <div className="w-full flex items-center justify-center p-12">
    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

export default NotificationItem;
