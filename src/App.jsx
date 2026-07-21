import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign, LayoutDashboard, List, Tag, FolderTree, X, Handshake, Users, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

// Firebase imports
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, query, orderBy, serverTimestamp } from 'firebase/firestore';

const DEFAULT_CATEGORIES = [
  'Hardware & Repairs',
  'Printing & Digital Services',
  'Bill Payments',
  'Shop Rent',
  'Fuel & Transport',
  'Education/NVQ Fees',
  'Personal',
  'Other'
];

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

function App() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [lentMoney, setLentMoney] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Transaction Form State
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newSubcategoryNames, setNewSubcategoryNames] = useState({});

  // Money Lent Form & UI State
  const [lentType, setLentType] = useState('Family');
  const [lentName, setLentName] = useState('');
  const [lentAmount, setLentAmount] = useState('');
  const [lentDescription, setLentDescription] = useState('');
  const [activeLentTab, setActiveLentTab] = useState('Family');
  const [showPaid, setShowPaid] = useState(false);

  // Reset subcategory when main category changes
  useEffect(() => {
    setSubcategory('');
  }, [category]);

  // Fetch transactions, categories, and lent money from Firebase
  useEffect(() => {
    // Transactions listener
    const qTx = query(collection(db, 'transactions'), orderBy('date', 'desc'));
    const unsubTx = onSnapshot(qTx, (snapshot) => {
      const txData = [];
      snapshot.forEach((doc) => {
        txData.push({ id: doc.id, ...doc.data() });
      });
      setTransactions(txData);
    });

    // Categories listener
    const qCat = query(collection(db, 'categories'), orderBy('createdAt', 'asc'));
    const unsubCat = onSnapshot(qCat, (snapshot) => {
      const catData = [];
      snapshot.forEach((doc) => {
        catData.push({ id: doc.id, ...doc.data() });
      });
      setCategories(catData);
      
      if (catData.length > 0) {
        setCategory(prev => prev === '' ? catData[0].name : prev);
      }
    });

    // Lent Money listener
    const qLent = query(collection(db, 'moneyLent'), orderBy('date', 'desc'));
    const unsubLent = onSnapshot(qLent, (snapshot) => {
      const lentData = [];
      snapshot.forEach((doc) => {
        lentData.push({ id: doc.id, ...doc.data() });
      });
      setLentMoney(lentData);
      setLoading(false);
    });

    return () => {
      unsubTx();
      unsubCat();
      unsubLent();
    };
  }, []);

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    try {
      await addDoc(collection(db, 'transactions'), {
        type,
        category: type === 'Expense' ? category : 'Income',
        subcategory: type === 'Expense' ? subcategory : '',
        amount: parseFloat(amount),
        description,
        date: new Date().toISOString()
      });

      setAmount('');
      setDescription('');
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
    } catch (error) {
      console.error("Error deleting document: ", error);
    }
  };

  const handleAddLentMoney = async (e) => {
    e.preventDefault();
    if (!lentAmount || !lentName) return;

    try {
      await addDoc(collection(db, 'moneyLent'), {
        type: lentType,
        name: lentName,
        amount: parseFloat(lentAmount),
        description: lentDescription,
        date: new Date().toISOString(),
        status: 'pending' // New field for timeline tracking
      });

      setLentAmount('');
      setLentName('');
      setLentDescription('');
      
      // Auto switch view to the type just added
      setActiveLentTab(lentType);
    } catch (error) {
      console.error("Error adding lent money: ", error);
    }
  };

  const handleMarkPaidLentMoney = async (id) => {
    try {
      await updateDoc(doc(db, 'moneyLent', id), {
        status: 'paid',
        paidDate: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error marking as paid: ", error);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setIsAddingCategory(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName.trim(),
        subcategories: [],
        createdAt: serverTimestamp()
      });
      setNewCategoryName('');
    } catch (error) {
      console.error("Error adding category: ", error);
    }
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
    } catch (error) {
      console.error("Error deleting category: ", error);
    }
  };

  const handleSubcategoryChange = (catId, value) => {
    setNewSubcategoryNames(prev => ({ ...prev, [catId]: value }));
  };

  const handleAddSubcategory = async (catId) => {
    const subName = newSubcategoryNames[catId]?.trim();
    if (!subName) return;

    try {
      await updateDoc(doc(db, 'categories', catId), {
        subcategories: arrayUnion(subName)
      });
      setNewSubcategoryNames(prev => ({ ...prev, [catId]: '' }));
    } catch (error) {
      console.error("Error adding subcategory: ", error);
    }
  };

  const handleDeleteSubcategory = async (catId, subName) => {
    try {
      await updateDoc(doc(db, 'categories', catId), {
        subcategories: arrayRemove(subName)
      });
    } catch (error) {
      console.error("Error deleting subcategory: ", error);
    }
  };

  const seedDefaultCategories = async () => {
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await addDoc(collection(db, 'categories'), {
          name: cat,
          subcategories: [],
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error seeding categories: ", error);
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;

  const formatLKR = (num) => {
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const expensesByCategory = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});

  const chartData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center font-sans">
        <p className="text-gray-400 text-lg animate-pulse">Loading Firebase data...</p>
      </div>
    );
  }

  const selectedCatObj = categories.find(c => c.name === category);

  // Money Lent Tracker Calculations
  const displayedLentMoney = lentMoney.filter(record => record.type === activeLentTab);
  const pendingLent = displayedLentMoney.filter(record => record.status !== 'paid');
  const paidLent = displayedLentMoney.filter(record => record.status === 'paid');
  const totalPendingLent = pendingLent.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Expense Tracker
          </h1>
          <p className="text-gray-400 mt-2">Manage your finances with ease</p>
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-5 max-w-3xl mx-auto md:mx-0 mb-8 h-14 bg-gray-800/80 p-1.5 rounded-2xl border border-gray-700 shadow-sm overflow-x-auto">
            <TabsTrigger value="dashboard" className="flex items-center justify-center gap-2 rounded-xl">
              <LayoutDashboard className="w-4 h-4 hidden sm:block" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center justify-center gap-2 rounded-xl">
              <PlusCircle className="w-4 h-4 hidden sm:block" /> Expense
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center justify-center gap-2 rounded-xl">
              <List className="w-4 h-4 hidden sm:block" /> History
            </TabsTrigger>
            <TabsTrigger value="lent" className="flex items-center justify-center gap-2 rounded-xl">
              <Handshake className="w-4 h-4 hidden sm:block" /> Lent
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center justify-center gap-2 rounded-xl">
              <FolderTree className="w-4 h-4 hidden sm:block" /> Categories
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Income</p>
                  <h2 className="text-3xl font-bold text-emerald-400 mt-2">Rs. {formatLKR(totalIncome)}</h2>
                </div>
                <div className="p-3 bg-emerald-400/10 rounded-full">
                  <TrendingUp className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Expenses</p>
                  <h2 className="text-3xl font-bold text-rose-400 mt-2">Rs. {formatLKR(totalExpense)}</h2>
                </div>
                <div className="p-3 bg-rose-400/10 rounded-full">
                  <TrendingDown className="w-8 h-8 text-rose-400" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Net Balance</p>
                  <h2 className={`text-3xl font-bold mt-2 ${netBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    Rs. {formatLKR(netBalance)}
                  </h2>
                </div>
                <div className="p-3 bg-blue-400/10 rounded-full">
                  <DollarSign className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
               <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
                <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-emerald-400" /> Expense Breakdown (Main Categories)
                </h3>
                {chartData.length > 0 ? (
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={chartData} cx="50%" cy="50%" innerRadius={80} outerRadius={130} paddingAngle={5} dataKey="value" stroke="none">
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `Rs. ${formatLKR(value)}`} contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem' }} itemStyle={{ color: '#f3f4f6' }} />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}/>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-gray-500 text-sm text-center bg-gray-900/50 rounded-xl border border-dashed border-gray-700">
                    <PieChart className="w-12 h-12 text-gray-700 mb-4" />
                    <p>No expenses to show.</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: ADD EXPENSE */}
          <TabsContent value="add">
            <div className="bg-gray-800 p-6 md:p-10 rounded-3xl border border-gray-700 shadow-2xl max-w-full mx-auto overflow-hidden">
              <form onSubmit={handleAddTransaction} className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-8 flex flex-col justify-center">
                  <div className="flex p-1 bg-gray-900 rounded-2xl w-full mx-auto">
                    <button type="button" onClick={() => setType('Expense')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${type === 'Expense' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 'text-gray-400 hover:text-gray-200'}`}>Expense</button>
                    <button type="button" onClick={() => setType('Income')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${type === 'Income' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'text-gray-400 hover:text-gray-200'}`}>Income</button>
                  </div>

                  <div className="text-center bg-gray-900/30 p-8 rounded-3xl border border-gray-700/50">
                    <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-widest">Amount</p>
                    <div className="flex items-center justify-center text-6xl md:text-7xl font-bold text-white group">
                      <span className="text-gray-500 mr-4 text-4xl">Rs.</span>
                      <input type="number" step="0.01" required value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-transparent border-none outline-none text-left w-[220px] md:w-[300px] focus:ring-0 placeholder-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
                    </div>
                    <div className="h-1 w-48 bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-blue-500 group-focus-within:opacity-100 transition-all duration-500 rounded-full"></div>
                  </div>
                  
                  <div className="relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all overflow-hidden">
                    <input type="text" required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-transparent px-5 py-5 text-lg text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="What was this for? (e.g. Bought groceries)" />
                  </div>

                  <button type="submit" disabled={type === 'Expense' && categories.length === 0} className="w-full lg:hidden bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-xl">
                    <PlusCircle className="w-7 h-7" /> Save {type}
                  </button>
                </div>

                {type === 'Expense' ? (
                  <div className="space-y-6 bg-gray-900/50 p-6 rounded-3xl border border-gray-700/50 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-sm font-medium text-gray-400 uppercase tracking-wider">Select Category</p>
                        {categories.length === 0 && <p className="text-xs text-rose-400 bg-rose-400/10 px-3 py-1 rounded-full border border-rose-400/20">Add categories first</p>}
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[300px] overflow-y-auto pr-2 pb-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                        {categories.map(c => (
                          <button key={c.id} type="button" onClick={() => setCategory(c.name)} className={`py-4 px-3 rounded-2xl text-sm md:text-base font-medium transition-all active:scale-95 text-center truncate ${category === c.name ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30' : 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}>{c.name}</button>
                        ))}
                      </div>

                      {selectedCatObj?.subcategories?.length > 0 && (
                        <div className="mt-8">
                          <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-4">Subcategory (Optional)</p>
                          <div className="flex overflow-x-auto gap-3 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                            <button type="button" onClick={() => setSubcategory('')} className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-medium transition-all active:scale-95 ${subcategory === '' ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}>General</button>
                            {selectedCatObj.subcategories.map(sub => (
                              <button key={sub} type="button" onClick={() => setSubcategory(sub)} className={`whitespace-nowrap px-6 py-3 rounded-full text-sm font-medium transition-all active:scale-95 ${subcategory === sub ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}>{sub}</button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button type="submit" disabled={type === 'Expense' && categories.length === 0} className="hidden lg:flex w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed items-center justify-center gap-2 text-xl mt-8">
                      <PlusCircle className="w-7 h-7" /> Save {type}
                    </button>
                  </div>
                ) : (
                  <div className="hidden lg:flex flex-col items-center justify-center bg-gray-900/50 rounded-3xl border border-gray-700/50 border-dashed">
                    <TrendingUp className="w-24 h-24 text-emerald-500/20 mb-4" />
                    <p className="text-gray-500 font-medium">Ready to record Income.</p>
                     <button type="submit" className="w-2/3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xl mt-8">
                      <PlusCircle className="w-7 h-7" /> Save Income
                    </button>
                  </div>
                )}
              </form>
            </div>
          </TabsContent>

          {/* TAB 3: MONEY LENT (TIMELINE UPGRADE) */}
          <TabsContent value="lent">
            <div className="bg-gray-800 p-6 md:p-10 rounded-3xl border border-gray-700 shadow-2xl max-w-full mx-auto overflow-hidden">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 xl:h-[750px]">
                
                {/* Left Column: Form */}
                <form onSubmit={handleAddLentMoney} className="space-y-8 flex flex-col justify-center">
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
                    <button type="button" onClick={() => setLentType('Family')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${lentType === 'Family' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-gray-400 hover:text-gray-200'}`}>Family</button>
                    <button type="button" onClick={() => setLentType('Friends')} className={`flex-1 py-4 text-sm md:text-base font-semibold rounded-xl transition-all ${lentType === 'Friends' ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-gray-200'}`}>Friends</button>
                  </div>

                  <div className="text-center bg-gray-900/30 p-8 rounded-3xl border border-gray-700/50">
                    <p className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-widest">Amount Lent</p>
                    <div className="flex items-center justify-center text-6xl md:text-7xl font-bold text-white group">
                      <span className="text-gray-500 mr-4 text-4xl">Rs.</span>
                      <input type="number" step="0.01" required value={lentAmount} onChange={(e) => setLentAmount(e.target.value)} className="bg-transparent border-none outline-none text-left w-[220px] md:w-[300px] focus:ring-0 placeholder-gray-700 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" placeholder="0.00" />
                    </div>
                    <div className={`h-1 w-48 bg-gradient-to-r from-transparent via-gray-600 to-transparent mx-auto mt-4 opacity-50 group-focus-within:via-${lentType === 'Family' ? 'amber' : 'blue'}-500 group-focus-within:opacity-100 transition-all duration-500 rounded-full`}></div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all overflow-hidden">
                        <input type="text" required value={lentName} onChange={(e) => setLentName(e.target.value)} className="w-full bg-transparent px-5 py-5 text-lg text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Who did you lend to?" />
                      </div>
                      <div className="relative bg-gray-900 rounded-2xl border border-gray-700 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 transition-all overflow-hidden">
                        <input type="text" value={lentDescription} onChange={(e) => setLentDescription(e.target.value)} className="w-full bg-transparent px-5 py-5 text-lg text-gray-100 placeholder-gray-500 focus:outline-none" placeholder="Notes (Optional)" />
                      </div>
                    </div>
                    
                    {lentType === 'Family' && (
                      <div className="flex flex-wrap gap-2 px-1">
                        {['Mother', 'Father', 'Brother', 'Sister'].map(name => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setLentName(name)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all active:scale-95 ${lentName === name ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-gray-700 hover:text-white'}`}
                          >
                            {name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button type="submit" className={`w-full bg-gradient-to-r ${lentType === 'Family' ? 'from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 shadow-amber-500/20' : 'from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 shadow-blue-500/20'} text-white font-bold py-5 rounded-2xl transition-all shadow-xl active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 text-xl mt-4`}>
                    <Handshake className="w-7 h-7" /> Save Record
                  </button>
                </form>

                {/* Right Column: Timeline UI */}
                <div className="bg-gray-900/50 p-6 md:p-8 rounded-3xl border border-gray-700/50 flex flex-col h-full max-h-[800px]">
                  
                  <div className="flex items-center justify-between mb-6">
                    <h4 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                      <Users className="w-6 h-6 text-blue-400" /> Owed Tracker
                    </h4>
                  </div>

                  {/* List View Tabs (Family / Friends) */}
                  <div className="flex p-1 bg-gray-800 rounded-xl w-full mb-6 border border-gray-700">
                    <button type="button" onClick={() => setActiveLentTab('Family')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeLentTab === 'Family' ? 'bg-amber-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>Family Timeline</button>
                    <button type="button" onClick={() => setActiveLentTab('Friends')} className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeLentTab === 'Friends' ? 'bg-blue-500 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'}`}>Friends Timeline</button>
                  </div>

                  {/* Total Pending Dashboard Panel */}
                  <div className={`p-5 rounded-2xl mb-8 flex justify-between items-center ${activeLentTab === 'Family' ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-blue-500/10 border border-blue-500/20'}`}>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${activeLentTab === 'Family' ? 'text-amber-500' : 'text-blue-500'}`}>Total Owed To You ({activeLentTab})</p>
                      <h2 className="text-3xl font-bold text-white">Rs. {formatLKR(totalPendingLent)}</h2>
                    </div>
                  </div>

                  {/* Scrollable Timeline */}
                  <div className="flex-1 overflow-y-auto pr-4 space-y-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full">
                    
                    {/* Active (Pending) Timeline List */}
                    <div className="relative border-l-2 border-gray-700 ml-4 space-y-8 pb-4">
                      {pendingLent.length === 0 ? (
                        <p className="text-gray-500 pl-6 pt-2 text-sm italic">No active records for {activeLentTab}.</p>
                      ) : (
                        pendingLent.map(record => (
                          <div key={record.id} className="relative pl-6">
                            {/* Timeline Node */}
                            <div className={`absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-gray-900 ${activeLentTab === 'Family' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                            
                            <div className="bg-gray-800 p-5 rounded-2xl border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 group shadow-md transition-all hover:border-gray-500">
                              <div>
                                <span className="font-bold text-gray-100 text-lg">{record.name}</span>
                                {record.description && <p className="text-sm text-gray-400 mt-1">{record.description}</p>}
                                <p className="text-xs text-gray-500 mt-2 font-medium">Lent on {new Date(record.date).toLocaleDateString()}</p>
                              </div>
                              <div className="flex flex-col items-start sm:items-end gap-3 w-full sm:w-auto">
                                <span className="text-xl font-bold text-gray-100">Rs. {formatLKR(record.amount)}</span>
                                <button 
                                  onClick={() => handleMarkPaidLentMoney(record.id)}
                                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-white bg-emerald-400/10 hover:bg-emerald-500 px-4 py-2 rounded-xl transition-colors shadow-sm"
                                >
                                  <CheckCircle2 className="w-4 h-4" /> Mark Paid
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Paid History Accordion Section */}
                    {paidLent.length > 0 && (
                      <div className="pt-4 border-t border-gray-800/80">
                        <button 
                          onClick={() => setShowPaid(!showPaid)} 
                          className="flex items-center justify-between w-full text-left text-sm font-semibold text-gray-400 hover:text-gray-200 transition-colors py-3 px-2 rounded-xl hover:bg-gray-800"
                        >
                          <span>View Paid History ({paidLent.length})</span>
                          {showPaid ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>

                        {showPaid && (
                          <div className="relative border-l-2 border-emerald-900/30 ml-4 mt-6 space-y-6 pb-6">
                            {paidLent.map(record => (
                              <div key={record.id} className="relative pl-6 opacity-50 hover:opacity-100 transition-opacity">
                                {/* Disabled Timeline Node */}
                                <div className="absolute -left-[11px] top-1.5 w-5 h-5 rounded-full border-4 border-gray-900 bg-emerald-700" />
                                
                                <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-800/80 flex justify-between items-center">
                                  <div>
                                    <span className="font-bold text-gray-500 line-through decoration-gray-600">{record.name}</span>
                                    <p className="text-[11px] text-emerald-500/80 mt-1 uppercase tracking-wider font-bold">Paid on {record.paidDate ? new Date(record.paidDate).toLocaleDateString() : 'Unknown'}</p>
                                  </div>
                                  <span className="text-md font-bold text-gray-600">Rs. {formatLKR(record.amount)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                </div>

              </div>
            </div>
          </TabsContent>

          {/* TAB 4: HISTORY */}
          <TabsContent value="history">
            <div className="bg-gray-800 p-6 rounded-3xl border border-gray-700 shadow-lg">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <List className="w-5 h-5 text-emerald-400" /> Recent Transactions
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400 text-sm uppercase tracking-wider">
                      <th className="pb-4 font-medium">Description</th>
                      <th className="pb-4 font-medium hidden md:table-cell">Category</th>
                      <th className="pb-4 font-medium">Date</th>
                      <th className="pb-4 font-medium text-right">Amount</th>
                      <th className="pb-4 font-medium text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-gray-500">No transactions found.</td>
                      </tr>
                    ) : (
                      transactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-750/50 transition-colors group">
                          <td className="py-4">
                            <div className="font-medium text-gray-200">{t.description}</div>
                            <div className="text-xs text-gray-500 md:hidden">{t.category} {t.subcategory && `(${t.subcategory})`}</div>
                          </td>
                          <td className="py-4 hidden md:table-cell">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full border border-gray-600/50">
                              {t.category}{t.subcategory && <><span className="text-gray-500">/</span><span className="text-emerald-400/80">{t.subcategory}</span></>}
                            </span>
                          </td>
                          <td className="py-4 text-gray-400 text-sm">{new Date(t.date).toLocaleDateString()}</td>
                          <td className={`py-4 text-right font-medium whitespace-nowrap ${t.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.type === 'Income' ? '+' : '-'}Rs. {formatLKR(t.amount)}
                          </td>
                          <td className="py-4 text-right">
                            <button onClick={() => handleDeleteTransaction(t.id)} className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 5: CATEGORIES */}
          <TabsContent value="categories">
            <div className="bg-gray-800 p-6 md:p-10 rounded-3xl border border-gray-700 shadow-2xl max-w-full mx-auto">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <h3 className="text-2xl font-bold flex items-center gap-3 text-white">
                  <FolderTree className="w-7 h-7 text-blue-400" /> Category Management
                </h3>
                <form onSubmit={handleAddCategory} className="flex gap-2">
                  <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="New Main Category..." className="w-full md:w-64 bg-gray-900 border border-gray-700 rounded-xl px-5 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder-gray-500" />
                  <button type="submit" disabled={isAddingCategory || !newCategoryName.trim()} className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50 cursor-pointer whitespace-nowrap">Add</button>
                </form>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-20 bg-gray-900/50 border border-dashed border-gray-700 rounded-3xl">
                  <p className="text-gray-400 text-lg mb-6">Your workspace is clean. Create some categories to start.</p>
                  <button onClick={seedDefaultCategories} className="bg-gray-700 hover:bg-gray-600 text-white font-medium px-8 py-4 rounded-xl transition-all shadow-lg shadow-gray-900/50 active:scale-95">Load Starter Categories</button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {categories.map((cat) => (
                    <div key={cat.id} className="bg-gray-900/80 border border-gray-700 rounded-2xl overflow-hidden shadow-lg transition-all hover:border-gray-600 group">
                      <div className="flex items-center justify-between px-6 py-5 bg-gradient-to-r from-gray-800 to-gray-900 border-b border-gray-700">
                        <span className="text-gray-100 font-bold text-xl">{cat.name}</span>
                        <button onClick={() => handleDeleteCategory(cat.id)} className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors cursor-pointer"><Trash2 className="w-5 h-5" /></button>
                      </div>
                      <div className="p-6">
                        {cat.subcategories && cat.subcategories.length > 0 ? (
                          <div className="flex flex-wrap gap-2.5 mb-6">
                            {cat.subcategories.map(sub => (
                              <div key={sub} className="flex items-center gap-2 bg-gray-800 border border-gray-700/80 px-4 py-2 rounded-lg text-sm font-medium text-gray-300 shadow-sm">
                                <span>{sub}</span>
                                <button onClick={() => handleDeleteSubcategory(cat.id, sub)} className="text-gray-500 hover:text-rose-400 transition-colors ml-1 p-0.5 rounded-md hover:bg-rose-400/10"><X className="w-4 h-4" /></button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="bg-gray-800/30 border border-gray-800 border-dashed rounded-xl p-4 text-center mb-6"><p className="text-gray-500 text-sm">No subcategories yet.</p></div>
                        )}
                        <div className="flex gap-2 bg-gray-800 p-2 rounded-xl border border-gray-700 focus-within:border-blue-500/50 transition-colors">
                          <input type="text" value={newSubcategoryNames[cat.id] || ''} onChange={(e) => handleSubcategoryChange(cat.id, e.target.value)} placeholder="Add subcategory..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubcategory(cat.id); } }} className="flex-1 bg-transparent px-3 text-sm text-gray-100 focus:outline-none placeholder-gray-500" />
                          <button onClick={() => handleAddSubcategory(cat.id)} disabled={!newSubcategoryNames[cat.id]?.trim()} className="bg-gray-700 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:hover:bg-gray-700">Add</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
}

export default App;
