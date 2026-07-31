import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DateTimePicker = ({ date, setDate, time, setTime, hideTime = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // Use current date as fallback if invalid
  const initialDate = date ? new Date(date) : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const wrapperRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowCalendar(false);
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

  const handleDateSelect = (day) => {
    // Construct local date correctly
    const newDate = new Date(year, month, day);
    // Adjust for timezone offset to get local YYYY-MM-DD
    const tzOffset = newDate.getTimezoneOffset() * 60000;
    const localISODate = (new Date(newDate - tzOffset)).toISOString().split('T')[0];
    setDate(localISODate);
  };

  const handleQuickSelect = (daysOffset) => {
    const d = new Date();
    d.setDate(d.getDate() + daysOffset);
    const tzOffset = d.getTimezoneOffset() * 60000;
    const localISODate = (new Date(d - tzOffset)).toISOString().split('T')[0];
    setDate(localISODate);
    setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    setIsOpen(false);
    setShowCalendar(false);
  };

  const selectedDateObj = date ? new Date(date) : new Date();
  
  const isSelected = (day) => {
    return selectedDateObj.getDate() === day && 
           selectedDateObj.getMonth() === month && 
           selectedDateObj.getFullYear() === year;
  };

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-gray-900/80 rounded-2xl border border-gray-700/80 hover:border-pink-500 hover:ring-1 hover:ring-pink-500 transition-all overflow-hidden shadow-inner cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-3 sm:gap-0"
      >
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-pink-500 shrink-0" />
          <span className="text-sm font-medium text-gray-100 whitespace-nowrap">
            {selectedDateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        {!hideTime && (
          <div className="flex items-center gap-2 sm:border-l sm:border-gray-700 sm:pl-4">
            <Clock className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-sm font-medium text-gray-100">{time || "12:00"}</span>
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
            className="absolute z-50 top-full mt-2 w-[320px] max-w-[90vw] left-0 sm:left-auto sm:right-0 bg-gray-900/95 backdrop-blur-3xl border border-gray-700 rounded-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)] p-4 overflow-hidden"
          >
            {/* Quick Actions (Moved to Top) */}
            <div className="flex items-center gap-2 mb-4">
              <button 
                type="button" 
                onClick={() => handleQuickSelect(0)}
                className="flex-1 py-2 bg-gray-800 hover:bg-pink-500/20 text-gray-300 hover:text-pink-400 rounded-xl text-xs font-bold transition-colors"
              >
                Today
              </button>
              <button 
                type="button" 
                onClick={() => handleQuickSelect(-1)}
                className="flex-1 py-2 bg-gray-800 hover:bg-pink-500/20 text-gray-300 hover:text-pink-400 rounded-xl text-xs font-bold transition-colors"
              >
                Yesterday
              </button>
            </div>

            {/* Time Picker */}
            {!hideTime && (
              <div className="flex items-center justify-between px-2 mb-4">
                <div className="flex items-center gap-2 text-gray-400 text-sm font-semibold">
                  <Clock className="w-4 h-4" /> Time
                </div>
                <input 
                  type="time" 
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm font-medium text-gray-100 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 [color-scheme:dark]"
                />
              </div>
            )}

            {/* Calendar Toggle */}
            <button 
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="w-full py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-gray-200 bg-gray-800/50 rounded-xl transition-colors"
            >
              <CalendarIcon className="w-3 h-3" />
              {showCalendar ? 'Hide Calendar' : 'Custom Date'}
            </button>

            {/* Calendar Grid (Collapsible) */}
            <AnimatePresence>
              {showCalendar && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden mt-4 pt-4 border-t border-gray-800"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <button type="button" onClick={handlePrevMonth} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                      <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div className="font-bold text-gray-100 tracking-wider text-sm">
                      {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </div>
                    <button type="button" onClick={handleNextMonth} className="p-2 hover:bg-gray-800 rounded-xl transition-colors">
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <div key={d} className="text-xs font-bold text-gray-500 py-1">{d}</div>
                    ))}
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1">
                    {blanks.map(b => (
                      <div key={`blank-${b}`} className="p-1 sm:p-2"></div>
                    ))}
                    {days.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleDateSelect(day)}
                        className={`p-1 sm:p-2 w-full aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all ${
                          isSelected(day) 
                            ? 'bg-gradient-to-br from-pink-500 to-purple-600 text-white shadow-lg shadow-pink-500/20 scale-110 z-10' 
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-110'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DateTimePicker;
