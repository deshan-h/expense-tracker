import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const quickActions = [
  {
    label: 'Yesterday',
    getOffset: () => -1,
    formatInfo: (targetDate) => targetDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  },
  { 
    label: 'Today', 
    getOffset: () => 0, 
    formatInfo: (targetDate) => targetDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) 
  },
  { 
    label: 'Tomorrow', 
    getOffset: () => 1, 
    formatInfo: (targetDate) => targetDate.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) 
  }
];

const DateTimePicker = ({ 
  date, 
  setDate, 
  time, 
  setTime, 
  hideTime = false, 
  className = '', 
  optional = false, 
  placeholder = "Select Date",
  forcePlacement = null
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [placement, setPlacement] = useState(forcePlacement || 'bottom');
  const [dropdownStyle, setDropdownStyle] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  
  // Use current date as fallback if invalid
  const initialDate = date ? new Date(date) : new Date();
  const [currentMonth, setCurrentMonth] = useState(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const wrapperRef = useRef(null);
  const popupRef = useRef(null);

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        wrapperRef.current && 
        !wrapperRef.current.contains(event.target) &&
        popupRef.current &&
        !popupRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [isOpen]);

  // Position calculation for Portal
  const updatePosition = () => {
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    
    // Popup height is ~420px when calendar is showing, ~190px when collapsed
    const estimatedHeight = showCalendar ? 420 : 190;
    
    let chosenPlacement = forcePlacement;
    if (!chosenPlacement) {
      if (spaceBelow >= estimatedHeight) {
        chosenPlacement = 'bottom';
      } else if (spaceAbove >= estimatedHeight) {
        chosenPlacement = 'top';
      } else {
        // Fall back to whichever side has more space
        chosenPlacement = spaceBelow >= spaceAbove ? 'bottom' : 'top';
      }
    } else if (chosenPlacement === 'bottom' && spaceBelow < 220 && spaceAbove > spaceBelow) {
      // If forced bottom but completely out of room below, intelligently flip to top
      chosenPlacement = 'top';
    } else if (chosenPlacement === 'top' && spaceAbove < 220 && spaceBelow > spaceAbove) {
      chosenPlacement = 'bottom';
    }
    setPlacement(chosenPlacement);

    const popupWidth = Math.min(360, Math.max(320, rect.width));
    let left = rect.right - popupWidth;
    if (left < 12) left = Math.max(12, rect.left);
    if (left + popupWidth > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - popupWidth - 12);
    }

    if (chosenPlacement === 'top') {
      const availableHeight = Math.max(220, rect.top - 16);
      setDropdownStyle({
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 8}px`,
        top: 'auto',
        left: `${left}px`,
        width: `${popupWidth}px`,
        maxHeight: `${Math.min(500, availableHeight)}px`
      });
    } else {
      const availableHeight = Math.max(220, window.innerHeight - rect.bottom - 16);
      setDropdownStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        bottom: 'auto',
        left: `${left}px`,
        width: `${popupWidth}px`,
        maxHeight: `${Math.min(500, availableHeight)}px`
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      updatePosition();
      const handleScroll = () => updatePosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', updatePosition);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', updatePosition);
      };
    } else {
      setShowCalendar(false);
    }
  }, [isOpen, forcePlacement, showCalendar]);

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
    
    if (localISODate !== date && setTime && !hideTime) {
      setTime('00:00');
    }
    
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

  const selectedDateObj = date ? new Date(date) : (optional ? null : new Date());
  
  const isSelected = (day) => {
    if (!selectedDateObj) return false;
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
  const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const blanks = Array.from({ length: adjustedFirstDay }, (_, i) => i);

  return (
    <div className={`relative w-full ${className || ''}`} ref={wrapperRef}>
      {/* Input Field Trigger */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-[48px] bg-gray-900/80 rounded-2xl border border-gray-700/80 hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all overflow-hidden shadow-inner cursor-pointer flex flex-row items-center justify-between px-4 gap-2"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 shrink-0" />
          <span className={`text-xs sm:text-sm font-medium whitespace-nowrap overflow-hidden text-ellipsis ${selectedDateObj ? 'text-gray-100' : 'text-gray-500'}`}>
            {selectedDateObj ? selectedDateObj.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : placeholder}
          </span>
        </div>
        {!hideTime && (
          <div className="flex items-center gap-1.5 sm:gap-2 border-l border-gray-700 pl-3 sm:pl-4 shrink-0">
            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-gray-100">{time || "12:00"}</span>
          </div>
        )}
      </div>

      {/* PORTAL DROPDOWN TO DOCUMENT BODY - COMPLETELY IMMUNE TO PARENT OVERFLOW CLIPPING */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Mobile / Dialog Backdrop */}
              {isMobile && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[99990] bg-black/60 backdrop-blur-sm sm:hidden"
                  onClick={() => setIsOpen(false)}
                />
              )}

              {/* Popover Card */}
              <motion.div 
                ref={popupRef}
                initial={{ opacity: 0, y: isMobile ? 15 : (placement === 'top' ? 8 : -8), scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: isMobile ? 15 : (placement === 'top' ? 8 : -8), scale: 0.96 }}
                transition={{ duration: 0.16, ease: "easeOut" }}
                style={!isMobile ? dropdownStyle : undefined}
                className={`z-[99999] ${
                  isMobile 
                    ? 'fixed inset-x-4 top-[10%] max-h-[85vh]' 
                    : 'w-max min-w-[320px]'
                } bg-[#131926] border border-gray-700/90 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)] overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col`}
              >
                {/* Top Row: Quick Selects */}
                <div className="w-full flex justify-between p-3 gap-2 bg-gray-900/80 border-b border-gray-800">
                  {quickActions.map((action, idx) => {
                    const now = new Date();
                    now.setDate(now.getDate() + action.getOffset(now));
                    const targetInfo = action.formatInfo(now);
                    
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuickSelect(action.getOffset)}
                        className="flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-gray-800/60 border border-gray-700/60 hover:bg-gray-700 hover:border-gray-500 transition-all group"
                      >
                        <span className="text-xs font-bold text-gray-200 group-hover:text-white transition-colors">{action.label}</span>
                        <span className="text-[10px] font-medium text-blue-400">{targetInfo}</span>
                      </button>
                    );
                  })}
                </div>

                {!showCalendar && (
                  <div className="p-4 bg-gray-950/40">
                    <button
                      type="button"
                      onClick={() => setShowCalendar(true)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 hover:text-blue-300 transition-colors border border-blue-500/20 text-xs font-bold uppercase tracking-wider"
                    >
                      <CalendarIcon className="w-4 h-4 text-blue-400" />
                      Select Custom Date
                    </button>
                  </div>
                )}

                {/* Bottom: Calendar & Time */}
                {showCalendar && (
                  <div className="p-4 flex flex-col w-full bg-gray-950/60">
                    
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="font-bold text-gray-100 text-sm tracking-wide">
                        {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-3">
                        {optional && (
                          <button type="button" onClick={() => { setDate(''); setIsOpen(false); }} className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer mr-2">
                            Clear
                          </button>
                        )}
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
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                        <div key={d} className="text-[10px] font-bold text-gray-500 py-1">{d}</div>
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
                            className={`p-1 sm:p-1.5 w-full aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition-all relative
                              ${selected 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                : 'text-gray-300 hover:bg-gray-800 hover:text-white hover:scale-105'}
                              ${!selected && isToday ? 'text-blue-400 font-black ring-1 ring-blue-500/40' : ''}
                            `}
                          >
                            {day}
                            {!selected && isToday && (
                              <div className="absolute bottom-1 w-1 h-1 bg-blue-500 rounded-full"></div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Time Picker */}
                    {!hideTime && (
                      <div className="mt-4 pt-3 border-t border-gray-800 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-gray-400 text-xs font-semibold tracking-wide">
                          <Clock className="w-3.5 h-3.5 text-purple-400" /> Time
                        </div>
                        <input 
                          type="time" 
                          value={time}
                          onChange={(e) => setTime(e.target.value)}
                          className="bg-gray-900 border border-gray-700 rounded-xl px-3 py-1.5 text-xs font-medium text-gray-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 [color-scheme:dark] transition-all cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

export default DateTimePicker;