import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import { PlusCircle, LayoutDashboard, List, FolderTree, Handshake, TrendingUp, MoreVertical, LogOut, PiggyBank, CalendarClock, Settings, Target, Bell } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';

// Auth Component
import Login from './components/Login';

// Utils
import { formatLKR } from './utils/formatters';
import toast, { Toaster } from 'react-hot-toast';

// Custom Hooks
import { useAuth } from './hooks/useAuth';
import { useTransactions } from './hooks/useTransactions';
import { useCategories } from './hooks/useCategories';
import { useLentMoney } from './hooks/useLentMoney';
import { usePOSSync } from './hooks/usePOSSync';
import { useSavings } from './hooks/useSavings';
import { useScheduled } from './hooks/useScheduled';
import { useTemplates } from './hooks/useTemplates';
import { useWishlist } from './hooks/useWishlist';

// Context
import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// Lazy Loaded Pages (Performance Optimization)
const DashboardTab = lazy(() => import('./pages/DashboardTab'));
const AddExpenseTab = lazy(() => import('./pages/AddExpenseTab'));
const IncomeTab = lazy(() => import('./pages/IncomeTab'));
const HistoryTab = lazy(() => import('./pages/HistoryTab'));
const MoneyLentTab = lazy(() => import('./pages/MoneyLentTab'));
const SettingsTab = lazy(() => import('./pages/SettingsTab'));
const SavingsTab = lazy(() => import('./pages/SavingsTab'));
const WishlistTab = lazy(() => import('./pages/WishlistTab'));
const SchedulesTab = lazy(() => import('./pages/SchedulesTab'));

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const TabFallback = () => (
  <div className="w-full flex items-center justify-center p-12">
    <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
  </div>
);

const NotificationItem = ({ schedule, skipSchedule, approveSchedule }) => {
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

function App() {
  const { user, authLoading } = useAuth();
  const { templates, addTemplate, deleteTemplate, updateTemplate } = useTemplates(user);
  
  // Transaction Form State
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [amount, setAmount] = useState('');
  const [calcHistory, setCalcHistory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [isTracked, setIsTracked] = useState(true);

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');
  const [newCategoryType, setNewCategoryType] = useState('Expense');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newSubcategoryNames, setNewSubcategoryNames] = useState({});

  // Money Lent Form & UI State
  const [lentType, setLentType] = useState('Family');
  const [lentName, setLentName] = useState('');
  const [lentAmount, setLentAmount] = useState('');
  const [lentDescription, setLentDescription] = useState('');
  const [lentDate, setLentDate] = useState(new Date().toLocaleDateString('en-CA'));
  const [lentDueDate, setLentDueDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d.toLocaleDateString('en-CA');
  });
  const [activeLentTab, setActiveLentTab] = useState('Family');
  const [showPaid, setShowPaid] = useState(false);

  // Modal States
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Custom Hooks mapped
  const { transactions, loading: txLoading, addExpense, addIncome, deleteTransaction, updateTransaction } = useTransactions(user);
  const { categories, addCategory: addCat, deleteCategory: delCat, addSubcategory: addSub, deleteSubcategory: delSub, seedDefaultCategories, DEFAULT_CATEGORIES, updateCategoryTarget } = useCategories(user, setCategory);
  const { lentMoney, addLentMoney: addLent, receiveLentPayment: recLent, deleteLentHistoryEntry, clearSettledAccounts } = useLentMoney(user);
  const { syncMetadata, isSyncing, handleSyncPOS } = usePOSSync(user);
  const { savings, addSaving, deleteSaving, updateSaving } = useSavings(user);
  const { schedules, pendingAskSchedules, addSchedule, deleteSchedule, approveSchedule, skipSchedule } = useScheduled(user, addExpense);
  const { wishlistItems, loading: wishlistLoading, addWishlistItem, completeWishlistItem, deleteWishlistItem, addSubItemToWishlist } = useWishlist(user, addExpense);

  const handleAddTransaction = useCallback(async (e, overrideDesc = null) => {
    e.preventDefault();
    let finalAmount = amount;
    if (calcHistory) {
      try {
        const expression = (calcHistory + amount).replace(/[^0-9+\-*/.]/g, '');
        if (expression) {
          finalAmount = String(Function('"use strict";return (' + expression + ')')());
          setAmount(finalAmount);
        }
      } catch (err) {
        console.error("Invalid expression");
      }
    }
    if (!finalAmount || isNaN(parseFloat(finalAmount))) return;
    
    const fullDate = `${date}T${time}`;
    const finalDesc = overrideDesc !== null ? overrideDesc : description;
    const success = await addExpense({ category, subcategory, amount: parseFloat(finalAmount), description: finalDesc, date: fullDate, isTracked });
    
    if (success) {
      setAmount('');
      setCalcHistory('');
      setDescription('');
      setDate(new Date().toLocaleDateString('en-CA'));
      setTime(new Date().toTimeString().slice(0, 5));
      setIsTracked(true);
    }
  }, [amount, calcHistory, category, subcategory, description, date, time, isTracked, addExpense]);

  const handleAddIncomeLocal = useCallback(async (e, incomeCategory, overrideDesc = null) => {
    e.preventDefault();
    let finalAmount = amount;
    if (calcHistory) {
      try {
        const expression = (calcHistory + amount).replace(/[^0-9+\-*/.]/g, '');
        if (expression) {
          finalAmount = String(Function('"use strict";return (' + expression + ')')());
          setAmount(finalAmount);
        }
      } catch (err) {
        console.error("Invalid expression");
      }
    }
    if (!finalAmount || isNaN(parseFloat(finalAmount))) return;
    
    const fullDate = `${date}T${time}`;
    const finalDesc = overrideDesc !== null ? overrideDesc : description;
    const success = await addIncome({ category: incomeCategory, amount: parseFloat(finalAmount), description: finalDesc, date: fullDate });
    
    if (success) {
      setAmount('');
      setCalcHistory('');
      setDescription('');
      setDate(new Date().toLocaleDateString('en-CA'));
      setTime(new Date().toTimeString().slice(0, 5));
    }
  }, [amount, calcHistory, description, date, time, addIncome]);

  const handleAddLentMoneyLocal = useCallback(async (e) => {
    e.preventDefault();
    if (!lentAmount || !lentName) return;
    const fullDate = `${lentDate}T00:00:00.000Z`; // Force time to be midnight for lent money
    const success = await addLent({ type: lentType, name: lentName, amount: parseFloat(lentAmount), description: lentDescription, date: fullDate, dueDate: lentDueDate });
    if (success) {
      setLentAmount('');
      setLentName('');
      setLentDescription('');
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      setLentDueDate(d.toLocaleDateString('en-CA'));
      setLentDate(new Date().toLocaleDateString('en-CA'));
      setActiveLentTab(lentType);
    }
  }, [lentAmount, lentName, lentType, lentDescription, lentDate, lentDueDate, addLent]);

  const handleAddCategoryLocal = useCallback(async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsAddingCategory(true);
    const success = await addCat(newCategoryName.trim(), newCategoryIcon, newCategoryType);
    if (success) {
      setNewCategoryName('');
      setNewCategoryIcon('Folder');
      setNewCategoryType('Expense');
    }
    setIsAddingCategory(false);
  }, [newCategoryName, newCategoryIcon, newCategoryType, addCat]);

  const handleSubcategoryChange = useCallback((catId, value) => {
    setNewSubcategoryNames(prev => ({ ...prev, [catId]: value }));
  }, []);

  const handleAddSubcategoryLocal = useCallback(async (catId) => {
    const subName = newSubcategoryNames[catId]?.trim();
    if (!subName) return;
    const success = await addSub(catId, subName);
    if (success) {
      setNewSubcategoryNames(prev => ({ ...prev, [catId]: '' }));
    }
  }, [newSubcategoryNames, addSub]);

  // Memoized calculations to optimize rendering
  const totalIncome = useMemo(() => transactions.filter(t => t.type === 'Income').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === 'Expense').reduce((acc, curr) => acc + curr.amount, 0), [transactions]);
  const netBalance = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const expensesByCategory = useMemo(() => transactions.filter(t => t.type === 'Expense').reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
    return acc;
  }, {}), [transactions]);

  const chartData = useMemo(() => Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  })), [expensesByCategory]);

  const selectedCatObj = useMemo(() => categories.find(c => c.name === category), [categories, category]);

  const totalPendingLent = useMemo(() => lentMoney.reduce((acc, curr) => acc + ((curr.totalAmount || 0) - (curr.totalPaid || 0)), 0), [lentMoney]);

  const totalSavings = useMemo(() => savings.reduce((acc, curr) => {
    if (curr.type === 'Deposit' || curr.type === 'Initial') return acc + curr.amount;
    if (curr.type === 'Withdrawal') return acc - curr.amount;
    return acc;
  }, 0), [savings]);

  const thisMonthPlanned = useMemo(() => {
    const activeSchedules = schedules.filter(s => s.status === 'active');
    let estimated = 0;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    activeSchedules.forEach(schedule => {
      let d = new Date(schedule.nextDate);
      let safetyCounter = 0; 
      while (d <= endOfMonth && safetyCounter < 100) {
        safetyCounter++;
        if (d >= startOfMonth) {
          estimated += schedule.amount;
        }
        if (schedule.frequency === 'Once') break;
        else if (schedule.frequency === 'Daily') d.setDate(d.getDate() + 1);
        else if (schedule.frequency === 'Weekly') d.setDate(d.getDate() + 7);
        else if (schedule.frequency === 'Monthly') d.setMonth(d.getMonth() + 1);
        else if (schedule.frequency === 'Yearly') d.setFullYear(d.getFullYear() + 1);
        else break;
      }
    });
    return estimated;
  }, [schedules]);

  const thisMonthWithdrawals = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return savings.reduce((acc, curr) => {
      const d = curr.date?.toDate ? curr.date.toDate() : new Date(curr.date);
      if (curr.type === 'Withdrawal' && d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        return acc + curr.amount;
      }
      return acc;
    }, 0);
  }, [savings]);

  const lastSyncTimeStr = useMemo(() => syncMetadata?.lastRunTime || null, [syncMetadata]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
        <p className="text-blue-400/70 text-sm font-medium animate-pulse">Verifying Access...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Toaster position="top-center" toastOptions={{ style: { background: '#1f2937', color: '#fff', borderRadius: '16px', border: '1px solid #374151' } }} />
        <Login />
      </>
    );
  }

  if (txLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col items-center justify-center font-sans">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
        <p className="text-emerald-400/80 text-sm animate-pulse">Loading Firebase data...</p>
      </div>
    );
  }

  const contextValue = {
    transactions, txLoading, addExpense, addIncome, deleteTransaction, updateTransaction,
    categories, addCat, delCat, addSub, delSub, seedDefaultCategories, DEFAULT_CATEGORIES,
    lentMoney, addLent, recLent, deleteLentHistoryEntry,
    syncMetadata, isSyncing, handleSyncPOS,
    savings, addSaving, deleteSaving, updateSaving,
    schedules, addSchedule, deleteSchedule,
    wishlistItems, wishlistLoading, addWishlistItem, completeWishlistItem, deleteWishlistItem, addSubItemToWishlist,
    templates, addTemplate, deleteTemplate, updateTemplate,
    formatLKR, COLORS,
    totalIncome, totalExpense, netBalance,
    expensesByCategory, chartData,
    totalPendingLent, totalSavings,
    thisMonthPlanned, thisMonthWithdrawals
  };

  return (
    <AuthProvider>
    <AppProvider value={contextValue}>
    <div className="min-h-screen bg-gray-900 text-gray-100 pb-8 font-sans overflow-x-hidden">
      <Toaster position="top-center" toastOptions={{ style: { background: '#1f2937', color: '#fff', borderRadius: '16px', border: '1px solid #374151' } }} />
      <div className="w-full mx-auto space-y-2 pt-2 relative z-50">
        
        <Tabs defaultValue="add" className="w-full relative z-10">
          <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-900/90 backdrop-blur-xl mb-0 shadow-xl z-50">
            <div className="w-full max-w-[1600px] mx-auto flex flex-row items-center justify-between gap-3 sm:gap-6 px-2 md:px-4 py-2">
              <div className="relative flex-1 w-full overflow-x-auto hide-scrollbar">
                
                <TabsList className="relative flex w-max md:w-full items-center h-auto bg-transparent p-0 gap-1 sm:gap-2 pr-4 md:pr-0">
                  <TabsTrigger value="dashboard" className="gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 rounded-md">
                    <LayoutDashboard className="w-5 h-5 sm:w-4 sm:h-4 text-blue-400" /> <span className="hidden sm:inline text-sm">Dashboard</span>
                  </TabsTrigger>
                  <TabsTrigger value="add" className="gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 rounded-md">
                    <PlusCircle className="w-5 h-5 sm:w-4 sm:h-4 text-emerald-400" /> <span className="hidden sm:inline text-sm">Add New</span>
                  </TabsTrigger>
                  <TabsTrigger value="lent" className="gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 rounded-md">
                    <Handshake className="w-5 h-5 sm:w-4 sm:h-4 text-orange-400" /> <span className="hidden sm:inline text-sm">Lent</span>
                  </TabsTrigger>
                  <TabsTrigger value="savings" className="gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 rounded-md">
                    <PiggyBank className="w-5 h-5 sm:w-4 sm:h-4 text-pink-400" /> <span className="hidden sm:inline text-sm">Savings</span>
                  </TabsTrigger>
                  <TabsTrigger value="wishlist" className="gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 rounded-md">
                    <Target className="w-5 h-5 sm:w-4 sm:h-4 text-amber-400" /> <span className="hidden sm:inline text-sm">Wishlist</span>
                  </TabsTrigger>
                  <TabsTrigger value="schedules" className="gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 rounded-md">
                    <CalendarClock className="w-5 h-5 sm:w-4 sm:h-4 text-cyan-400" /> <span className="hidden sm:inline text-sm">Schedules</span>
                  </TabsTrigger>
                  <TabsTrigger value="history" className="gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 rounded-md">
                    <List className="w-5 h-5 sm:w-4 sm:h-4 text-indigo-400" /> <span className="hidden sm:inline text-sm">History</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="gap-1.5 sm:gap-2 py-2 px-3 sm:px-4 rounded-md">
                    <Settings className="w-5 h-5 sm:w-4 sm:h-4 text-gray-400" /> <span className="hidden sm:inline text-sm">Settings</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <div className="relative">
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    title="Notifications"
                    className="relative p-2 sm:px-4 sm:py-2 bg-gray-800/80 hover:bg-gray-700/80 text-gray-400 hover:text-white border border-gray-700/50 rounded-md transition-all duration-300 shadow-md flex items-center justify-center gap-2 group"
                  >
                    <Bell className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] transition-all" />
                    {pendingAskSchedules && pendingAskSchedules.length > 0 && (
                      <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-lg">
                        {pendingAskSchedules.length}
                      </span>
                    )}
                  </button>

                  {/* NOTIFICATIONS DROPDOWN */}
                  {showNotifications && (
                    <div className="absolute right-0 top-full mt-3 z-[100] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl w-[90vw] max-w-[450px] sm:w-[450px] flex flex-col gap-4 p-4 md:p-6 animate-in slide-in-from-top-2 fade-in duration-200" style={{ transformOrigin: 'top right' }}>
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/80 via-indigo-500/80 to-blue-500/80"></div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                            <Bell className="w-5 h-5 text-blue-400 drop-shadow-md" />
                          </div>
                          <div>
                            <h3 className="text-lg font-black text-white tracking-wide">Notifications</h3>
                            <p className="text-[10px] text-gray-400 mt-0.5">Pending Scheduled Expenses</p>
                          </div>
                        </div>
                        <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-white transition-colors bg-gray-800/50 p-2 rounded-full">
                          <MoreVertical className="w-4 h-4 opacity-0 pointer-events-none absolute" />
                          <span className="font-black px-2 text-xs">X</span>
                        </button>
                      </div>

                      <div className="overflow-y-auto hide-scrollbar space-y-4 max-h-[60vh]">
                        {pendingAskSchedules && pendingAskSchedules.length > 0 ? (
                          pendingAskSchedules.map((schedule) => (
                            <NotificationItem 
                              key={schedule.id}
                              schedule={schedule}
                              skipSchedule={skipSchedule}
                              approveSchedule={approveSchedule}
                            />
                          ))
                        ) : (
                          <div className="text-center py-8 text-gray-500 bg-gray-800/30 rounded-2xl border border-gray-800/50">
                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            <p className="font-medium text-xs">No new notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setShowSignOutModal(true)}
                  title="Sign Out"
                  className="p-2 sm:px-4 sm:py-2 bg-gray-800/80 hover:bg-red-500/10 text-red-500 hover:text-red-400 border border-gray-700/50 hover:border-red-500/30 rounded-md transition-all duration-300 text-sm font-bold shadow-md flex items-center justify-center gap-2 group"
                >
                  <LogOut className="w-5 h-5 group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </div>

        {/* TAB 1: DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6">
            <Suspense fallback={<TabFallback />}>
              <DashboardTab 
                transactions={transactions}
                totalIncome={totalIncome}
                totalExpense={totalExpense}
                netBalance={netBalance}
                totalPendingLent={totalPendingLent}
                totalSavings={totalSavings}
                thisMonthWithdrawals={thisMonthWithdrawals}
                thisMonthPlanned={thisMonthPlanned}
                schedules={schedules}
                lentMoney={lentMoney}
                savings={savings}
                wishlistItems={wishlistItems}
                formatLKR={formatLKR}
                chartData={chartData}
                COLORS={COLORS}
                handleSyncPOS={handleSyncPOS}
                isSyncing={isSyncing}
                lastSyncTimeStr={lastSyncTimeStr}
                categories={categories}
              />
            </Suspense>
          </TabsContent>

        {/* TAB 2: ADD TRANSACTION (EXPENSE & INCOME) */}
          <TabsContent value="add">
            <Suspense fallback={<TabFallback />}>
              <AddExpenseTab 
                type={type}
                setType={setType}
                category={category}
                setCategory={setCategory}
                subcategory={subcategory}
                setSubcategory={setSubcategory}
                amount={amount}
                setAmount={setAmount}
                calcHistory={calcHistory}
                setCalcHistory={setCalcHistory}
                description={description}
                setDescription={setDescription}
                date={date}
                setDate={setDate}
                time={time}
                setTime={setTime}
                isTracked={isTracked}
                setIsTracked={setIsTracked}
                handleAddTransaction={handleAddTransaction}
                handleAddIncome={handleAddIncomeLocal}
                handleSyncPOS={handleSyncPOS}
                isSyncing={isSyncing}
                lastSyncTimeStr={lastSyncTimeStr}
                categories={categories}
                selectedCatObj={selectedCatObj}
                newSubcategoryNames={newSubcategoryNames}
                handleSubcategoryChange={handleSubcategoryChange}
                handleAddSubcategory={handleAddSubcategoryLocal}
                templates={templates}
                addTemplate={addTemplate}
                transactions={transactions}
                formatLKR={formatLKR}
                handleDeleteTransaction={deleteTransaction}
                addSchedule={addSchedule}
              />
            </Suspense>
          </TabsContent>

        {/* TAB 4: HISTORY */}
          <TabsContent value="history">
            <Suspense fallback={<TabFallback />}>
              <HistoryTab 
                transactions={transactions}
                lentMoney={lentMoney}
                savings={savings}
                formatLKR={formatLKR}
                handleDeleteTransaction={deleteTransaction}
                handleDeleteLentHistoryEntry={deleteLentHistoryEntry}
                deleteSaving={deleteSaving}
                updateTransaction={updateTransaction}
                updateSaving={updateSaving}
                categories={categories}
                schedules={schedules}
                deleteSchedule={deleteSchedule}
              />
            </Suspense>
          </TabsContent>

        {/* TAB 5: LENT MONEY */}
          <TabsContent value="lent">
            <Suspense fallback={<TabFallback />}>
              <MoneyLentTab 
                lentType={lentType}
                setLentType={setLentType}
                lentName={lentName}
                setLentName={setLentName}
                lentAmount={lentAmount}
                setLentAmount={setLentAmount}
                lentDescription={lentDescription}
                setLentDescription={setLentDescription}
                lentDate={lentDate}
                setLentDate={setLentDate}
                handleAddLentMoney={handleAddLentMoneyLocal}
                handleAddLentInline={addLent}
                handleReceiveLentPayment={recLent}
                formatLKR={formatLKR}
                handleDeleteTransaction={deleteTransaction}
                activeLentTab={activeLentTab}
                setActiveLentTab={setActiveLentTab}
                lentMoney={lentMoney}
                handleDeleteLentHistoryEntry={deleteLentHistoryEntry}
                handleClearSettledAccounts={clearSettledAccounts}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="schedules">
            <Suspense fallback={<TabFallback />}>
              <SchedulesTab 
                schedules={schedules}
                addSchedule={addSchedule}
                deleteSchedule={deleteSchedule}
                formatLKR={formatLKR}
                categories={categories}
                templates={templates}
              />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Suspense fallback={<TabFallback />}>
              <SettingsTab
                categories={categories}
                handleAddCategory={handleAddCategoryLocal}
                newCategoryName={newCategoryName}
                setNewCategoryName={setNewCategoryName}
                newCategoryIcon={newCategoryIcon}
                setNewCategoryIcon={setNewCategoryIcon}
                newCategoryType={newCategoryType}
                setNewCategoryType={setNewCategoryType}
                isAddingCategory={isAddingCategory}
                seedDefaultCategories={seedDefaultCategories}
                handleDeleteCategory={delCat}
                handleDeleteSubcategory={delSub}
                newSubcategoryNames={newSubcategoryNames}
                handleSubcategoryChange={handleSubcategoryChange}
                handleAddSubcategory={handleAddSubcategoryLocal}
                updateCategoryTarget={updateCategoryTarget}
                transactions={transactions}
                templates={templates}
                deleteTemplate={deleteTemplate}
                updateTemplate={updateTemplate}
              />
            </Suspense>
          </TabsContent>

          {/* TAB 7: SAVINGS */}
          <TabsContent value="savings" className="space-y-6">
            <Suspense fallback={<TabFallback />}>
              <SavingsTab 
                savings={savings}
                addSaving={addSaving}
                deleteSaving={deleteSaving}
                formatLKR={formatLKR}
              />
            </Suspense>
          </TabsContent>

          {/* TAB 9: WISHLIST */}
          <TabsContent value="wishlist" className="space-y-6">
            <Suspense fallback={<TabFallback />}>
              <WishlistTab
                wishlistItems={wishlistItems}
                loading={wishlistLoading}
                addWishlistItem={addWishlistItem}
                completeWishlistItem={completeWishlistItem}
                deleteWishlistItem={deleteWishlistItem}
                addSubItemToWishlist={addSubItemToWishlist}
                categories={categories}
              />
            </Suspense>
          </TabsContent>

        </Tabs>
      </div>

      {/* Footer */}
      <footer className="w-full relative z-0 flex items-center justify-center gap-3 py-10 mt-8 border-t border-gray-800/30 text-gray-400 text-sm font-medium bg-gray-950/20 backdrop-blur-sm">
        <span className="tracking-wide">Developed By</span>
        <div className="flex items-center gap-2 bg-gray-900/50 px-3 py-1.5 rounded-full border border-gray-800 shadow-inner">
          <img src={`${import.meta.env.BASE_URL}desh-logo.png`} alt="DEH Logo" className="h-6 w-auto object-contain drop-shadow-md" />
          <span className="text-gray-200 font-black tracking-widest uppercase">Desh</span>
        </div>
      </footer>

      {/* SIGN OUT MODAL */}
      {showSignOutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700/50 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden flex flex-col gap-6">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500/80 via-rose-500/80 to-red-500/80"></div>
            
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto border border-red-500/20 shadow-inner">
              <LogOut className="w-8 h-8 text-red-400 drop-shadow-md" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white tracking-wide mb-2">Sign Out</h3>
              <p className="text-gray-400 text-sm">Are you sure you want to sign out of your account?</p>
            </div>

            <div className="flex gap-4 w-full mt-2">
              <button 
                onClick={() => setShowSignOutModal(false)}
                className="flex-1 py-3 px-4 bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 rounded-xl font-bold transition-all border border-gray-700 active:scale-95 text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  setShowSignOutModal(false);
                  signOut(auth);
                }}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_-3px_rgba(225,29,72,0.5)] active:scale-95 text-sm uppercase tracking-wider"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
    </AppProvider>
    </AuthProvider>
  );
}

export default App;
