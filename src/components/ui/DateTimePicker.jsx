import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const quickActions = [
  { 
    label: 'Today', 
    getOffset: (d) => 0, 
    formatInfo: (targetDate) => targetDate.toLocaleDateString(undefined, { weekday: 'short' }) 
  },
  { 
    label: 'Tomorrow', 
    getOffset: (d) => 1, 
    formatInfo: (targetDate) => targetDate.toLocaleDateString(undefined, { weekday: 'short' }) 
  },
  { 
    label: 'This weekend', 
    getOffset: (d) => { const diff = 6 - d.getDay(); return diff >= 0 ? diff : diff + 7; }, 
    formatInfo: (targetDate) => targetDate.toLocaleDateString(undefined, { weekday: 'short' }) 
  },
  { 
    label: 'Next week', 
    getOffset: (d) => { const diff = 1 - d.getDay(); return (diff > 0 ? diff : diff + 7); }, 
    formatInfo: (targetDate) => targetDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) 
  },
  { 
    label: 'Next weekend', 
    getOffset: (d) => { const diff = 6 - d.getDay(); return (diff >= 0 ? diff : diff + 7) + 7; }, 
    formatInfo: (targetDate) => targetDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) 
  },
  { 
    label: '2 weeks', 
    getOffset: (d) => 14, 
    formatInfo: (targetDate) => targetDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) 
  },
  { 
    label: '4 weeks', 
    getOffset: (d) => 28, 
    formatInfo: (targetDate) => targetDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) 
  },
];

const DateTimePicker = ({ date, setDate, time, setTime, hideTime = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Use current date as fallback if invalid
  const initialDate = date ? new Date(date) : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const wrapperRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const handleGoToToday = () => {
    const today = new Date();
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  const setLocalDate = (d) => {
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISODate = (new Date(d - tzOffset)).toISOString().split('T')[0];
    setDate(localISODate);
  };

  const handleDateSelect = (day) => {
    const newDate = new Date(year, month, day);
    setLocalDate(newDate);
    setIsOpen(false);
  };

  const handleQuickSelect = (offsetFunc) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetFunc(d));
    setLocalDate(d);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setIsOpen(false);
  };

  const selectedDateObj = date ? new Date(date) : new Date();
  
  const isSelected = (day) => {
    return selectedDateObj.getDate() === day && 
           selectedDateObj.getMonth() === month && 
           selectedDateObj.getFullYear() === year;
  };

  const isTodayDate = (day) => {
    const today = new Date();
    return today.getDate() === day && 
           today.getMonth() === month && 
           today.getFullYear() === year;
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      {/* Input Field Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[42px] bg-gray-900/80 rounded-xl border border-gray-700/80 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all overflow-hidden shadow-inner cursor-pointer flex flex-row items-center justify-between px-3 sm:px-4 py-2.5 gap-2"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-gray-100 whitespace-nowrap overflow-hidden text-ellipsis">
            {selectedDateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        {!hideTime && (
          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-gray-700 pl-3 sm:pl-4 shrink-0">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-gray-100">{time || "12:00"}</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 top-full mt-2 w-[600px] max-w-[95vw] left-0 sm:left-auto sm:right-0 bg-[#1e1e1e] border border-gray-700/80 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row"
          >
            {/* Left Column: Quick Selects */}
            <div className="w-full md:w-[240px] border-b md:border-b-0 md:border-r border-gray-700/50 flex flex-col p-2">
              <div className="space-y-1">
                {quickActions.map((action, idx) => {
                  const now = new Date();
                  now.setDate(now.getDate() + action.getOffset(now));
                  const targetInfo = action.formatInfo(now);
                  
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickSelect(action.getOffset)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-gray-800/80 transition-colors group"
                    >
                      <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{action.label}</span>
                      <span className="text-[11px] font-medium text-gray-500">{targetInfo}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Calendar & Time */}
            <div className="flex-1 p-5 flex flex-col">
              
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="font-bold text-gray-100 text-sm tracking-wide">
                  {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={handleGoToToday} className="text-xs font-medium text-gray-400 hover:text-gray-200 transition-colors cursor-pointer">
                    Today
                  </button>
                  <div className="flex items-center gap-1 border border-gray-700/50 rounded-lg p-0.5">
                    <button type="button" onClick={handlePrevMonth} className="p-1 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-200">
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={handleNextMonth} className="p-1 hover:bg-gray-800 rounded-md transition-colors text-gray-400 hover:text-gray-200">
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Days of Week Header */}
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                  <div key={d} className="text-[11px] font-bold text-gray-500 py-1">{d}</div>
                ))}
              </div>
              
              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-1">
                {blanks.map(b => (
                  <div key={`blank-${b}`} className="p-1 sm:p-1.5 w-full aspect-square"></div>
                ))}
                {days.map(day => {
                  const selected = isSelected(day);
                  const isToday = isTodayDate(day);
                  
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={`p-1 sm:p-1.5 w-full aspect-square flex items-center justify-center rounded-xl text-[13px] font-bold transition-all relative
                        ${selected 
                          ? 'bg-[#3b82f6] text-white shadow-lg shadow-blue-500/20' 
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-110'}
                        ${!selected && isToday ? 'text-blue-400 font-black' : ''}
                      `}
                    >
                      {day}
                      {/* Optional little dot for today if not selected */}
                      {!selected && isToday && (
                        <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Time Picker */}
              {!hideTime && (
                <div className="mt-6 pt-4 border-t border-gray-700/50 flex items-center justify-between px-1">
                  <div className="flex items-center gap-2 text-gray-400 text-sm font-semibold tracking-wide">
                    <Clock className="w-4 h-4" /> Time
                  </div>
                  <input 
                    type="time" 
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-2 text-sm font-medium text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark] transition-all cursor-pointer"
                  />
                </div>
              )}
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateTimePicker;
