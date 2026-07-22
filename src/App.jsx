import React, { useState, useEffect } from 'react';
import { PlusCircle, LayoutDashboard, List, FolderTree, Handshake, TrendingUp } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

// Firebase imports
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, query, orderBy, serverTimestamp } from 'firebase/firestore';

// Utils
import { formatLKR } from './utils/formatters';
import { playSuccessSound, playErrorSound } from './utils/sounds';

// Tab Components
import DashboardTab from './components/tabs/DashboardTab';
import AddExpenseTab from './components/tabs/AddExpenseTab';
import IncomeTab from './components/tabs/IncomeTab';
import HistoryTab from './components/tabs/HistoryTab';
import MoneyLentTab from './components/tabs/MoneyLentTab';
import CategoriesTab from './components/tabs/CategoriesTab';
import toast, { Toaster } from 'react-hot-toast';

const DEFAULT_CATEGORIES = [
  { name: 'Food & Drinks', icon: 'Utensils' },
  { name: 'Shopping', icon: 'ShoppingCart' },
  { name: 'Housing', icon: 'Home' },
  { name: 'Transportation', icon: 'Bus' },
  { name: 'Vehicle', icon: 'Car' },
  { name: 'Life & Entertainment', icon: 'Smile' },
  { name: 'Communication, PC', icon: 'Monitor' },
  { name: 'Financial expenses', icon: 'CreditCard' }
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
  const [calcHistory, setCalcHistory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTracked, setIsTracked] = useState(true);

  // Category Form State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Folder');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newSubcategoryNames, setNewSubcategoryNames] = useState({});

  // Money Lent Form & UI State
  const [lentType, setLentType] = useState('Family');
  const [lentName, setLentName] = useState('');
  const [lentAmount, setLentAmount] = useState('');
  const [lentDescription, setLentDescription] = useState('');
  const [lentDate, setLentDate] = useState(new Date().toISOString().split('T')[0]);
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

    try {
      await addDoc(collection(db, 'transactions'), {
        type: 'Expense',
        category: category,
        subcategory: subcategory,
        amount: parseFloat(finalAmount),
        description,
        date: new Date(date).toISOString(),
        isTracked: isTracked
      });

      setAmount('');
      setCalcHistory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      setIsTracked(true);
      toast.success(`Expense recorded successfully!`);
      playSuccessSound();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error("Failed to record transaction.");
      playErrorSound();
    }
  };

  const handleAddIncome = async (e, incomeCategory) => {
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

    try {
      await addDoc(collection(db, 'transactions'), {
        type: 'Income',
        category: incomeCategory, // 'Business' or 'Other'
        subcategory: '',
        amount: parseFloat(finalAmount),
        description,
        date: new Date(date).toISOString(),
        isTracked: true
      });

      setAmount('');
      setCalcHistory('');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
      toast.success(`Income recorded successfully!`);
      playSuccessSound();
    } catch (error) {
      console.error("Error adding document: ", error);
      toast.error("Failed to record transaction.");
      playErrorSound();
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await deleteDoc(doc(db, 'transactions', id));
      toast.success("Transaction deleted.");
      playSuccessSound();
    } catch (error) {
      console.error("Error deleting document: ", error);
      toast.error("Failed to delete transaction.");
      playErrorSound();
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
        paidAmount: 0,
        description: lentDescription,
        date: new Date(lentDate).toISOString(),
        status: 'pending' // New field for timeline tracking
      });

      setLentAmount('');
      setLentName('');
      setLentDescription('');
      setLentDate(new Date().toISOString().split('T')[0]);
      
      // Auto switch view to the type just added
      setActiveLentTab(lentType);
      toast.success("Record added!");
      playSuccessSound();
    } catch (error) {
      console.error("Error adding lent money: ", error);
      toast.error("Failed to add record.");
      playErrorSound();
    }
  };

  const handleReceiveLentPayment = async (name, paymentAmount) => {
    try {
      let remainingPayment = parseFloat(paymentAmount);
      if (isNaN(remainingPayment) || remainingPayment <= 0) return;

      const personPendingRecords = lentMoney
        .filter(r => r.status !== 'paid' && r.name === name)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      for (const record of personPendingRecords) {
        if (remainingPayment <= 0) break;

        const currentPaid = record.paidAmount || 0;
        const currentOwed = record.amount - currentPaid;

        if (currentOwed > 0) {
          let amountToApply = 0;
          let newStatus = 'pending';
          let newPaidDate = null;

          if (remainingPayment >= currentOwed) {
             amountToApply = currentOwed;
             newStatus = 'paid';
             newPaidDate = new Date().toISOString();
          } else {
             amountToApply = remainingPayment;
          }

          remainingPayment -= amountToApply;

          await updateDoc(doc(db, 'moneyLent', record.id), {
            paidAmount: currentPaid + amountToApply,
            status: newStatus,
            ...(newPaidDate && { paidDate: newPaidDate })
          });
        }
      }

      toast.success(`Payment of Rs. ${paymentAmount} received from ${name}!`);
      playSuccessSound();
    } catch (error) {
      console.error("Error applying payment: ", error);
      toast.error("Failed to apply payment.");
      playErrorSound();
    }
  };

  const handleDeleteLentMoney = async (id) => {
    try {
      await deleteDoc(doc(db, 'moneyLent', id));
      toast.success("Record deleted.");
      playSuccessSound();
    } catch (error) {
      console.error("Error deleting lent money: ", error);
      toast.error("Failed to delete record.");
      playErrorSound();
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    
    setIsAddingCategory(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        subcategories: [],
        createdAt: serverTimestamp()
      });
      setNewCategoryName('');
      setNewCategoryIcon('Folder');
      toast.success("Category added!");
      playSuccessSound();
    } catch (error) {
      console.error("Error adding category: ", error);
      toast.error("Failed to add category.");
      playErrorSound();
    }
    setIsAddingCategory(false);
  };

  const handleDeleteCategory = async (id) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast.success("Category deleted.");
      playSuccessSound();
    } catch (error) {
      console.error("Error deleting category: ", error);
      toast.error("Failed to delete category.");
      playErrorSound();
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
      toast.success(`Subcategory "${subName}" added!`);
      playSuccessSound();
    } catch (error) {
      console.error("Error adding subcategory: ", error);
      toast.error("Failed to add subcategory.");
      playErrorSound();
    }
  };

  const handleDeleteSubcategory = async (catId, subName) => {
    try {
      await updateDoc(doc(db, 'categories', catId), {
        subcategories: arrayRemove(subName)
      });
      toast.success("Subcategory deleted.");
      playSuccessSound();
    } catch (error) {
      console.error("Error deleting subcategory: ", error);
      toast.error("Failed to delete subcategory.");
      playErrorSound();
    }
  };

  const seedDefaultCategories = async () => {
    try {
      for (const cat of DEFAULT_CATEGORIES) {
        await addDoc(collection(db, 'categories'), {
          name: cat.name,
          icon: cat.icon,
          subcategories: [],
          createdAt: serverTimestamp()
        });
      }
      toast.success("Default categories seeded!");
      playSuccessSound();
    } catch (error) {
      console.error("Error seeding categories: ", error);
      toast.error("Failed to seed categories.");
      playErrorSound();
    }
  };

  const totalIncome = transactions
    .filter(t => t.type === 'Income')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'Expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpense;

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
  const pendingLent = lentMoney.filter(record => record.status !== 'paid');
  const paidLent = lentMoney.filter(record => record.status === 'paid');
  const totalPendingLent = pendingLent.reduce((acc, curr) => acc + (curr.amount - (curr.paidAmount || 0)), 0);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans">
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          style: { 
            background: '#1f2937', 
            color: '#fff', 
            borderRadius: '16px',
            border: '1px solid #374151'
          } 
        }} 
      />
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="text-center md:text-left flex flex-col md:flex-row items-center gap-4">
          <img src="pwa-192x192.png" alt="Expense Ledger Logo" className="w-16 h-16 rounded-2xl shadow-lg shadow-blue-500/20" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              Expense Tracker
            </h1>
            <p className="text-gray-400 mt-1">Manage your finances with ease</p>
          </div>
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-6 max-w-4xl mx-auto md:mx-0 mb-10 min-h-[72px] bg-gray-900/60 backdrop-blur-xl p-2 rounded-[2rem] border border-gray-700/50 shadow-2xl overflow-x-auto hide-scrollbar">
            <TabsTrigger value="dashboard" className="gap-1.5 sm:gap-2">
              <LayoutDashboard className="w-5 h-5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline text-sm">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="add" className="gap-1.5 sm:gap-2">
              <PlusCircle className="w-5 h-5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline text-sm">Expense</span>
            </TabsTrigger>
            <TabsTrigger value="income" className="gap-1.5 sm:gap-2">
              <TrendingUp className="w-5 h-5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline text-sm">Income</span>
            </TabsTrigger>
            <TabsTrigger value="lent" className="gap-1.5 sm:gap-2">
              <Handshake className="w-5 h-5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline text-sm">Lent</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1.5 sm:gap-2">
              <List className="w-5 h-5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline text-sm">History</span>
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-1.5 sm:gap-2">
              <FolderTree className="w-5 h-5 sm:w-4 sm:h-4" /> <span className="hidden sm:inline text-sm">Categories</span>
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardTab 
              transactions={transactions}
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              netBalance={netBalance}
              totalPendingLent={totalPendingLent}
              formatLKR={formatLKR}
              chartData={chartData}
              COLORS={COLORS}
            />
          </TabsContent>

          {/* TAB 2: ADD EXPENSE */}
          <TabsContent value="add">
            <AddExpenseTab 
              handleAddTransaction={(e) => handleAddTransaction(e)}
              type="Expense"
              setType={() => {}}
              amount={amount}
              setAmount={setAmount}
              calcHistory={calcHistory}
              setCalcHistory={setCalcHistory}
              description={description}
              setDescription={setDescription}
              date={date}
              setDate={setDate}
              isTracked={isTracked}
              setIsTracked={setIsTracked}
              categories={categories}
              category={category}
              setCategory={setCategory}
              subcategory={subcategory}
              setSubcategory={setSubcategory}
              selectedCatObj={selectedCatObj}
              handleAddSubcategory={handleAddSubcategory}
              newSubcategoryNames={newSubcategoryNames}
              handleSubcategoryChange={handleSubcategoryChange}
            />
          </TabsContent>

          {/* TAB 3: INCOME */}
          <TabsContent value="income">
            <IncomeTab 
              transactions={transactions}
              handleAddTransaction={handleAddIncome}
              amount={amount}
              setAmount={setAmount}
              calcHistory={calcHistory}
              setCalcHistory={setCalcHistory}
              description={description}
              setDescription={setDescription}
              date={date}
              setDate={setDate}
            />
          </TabsContent>

          {/* TAB 3: MONEY LENT */}
          <TabsContent value="lent">
            <MoneyLentTab 
              handleAddLentMoney={handleAddLentMoney}
              lentType={lentType}
              setLentType={setLentType}
              lentAmount={lentAmount}
              setLentAmount={setLentAmount}
              lentName={lentName}
              setLentName={setLentName}
              lentDescription={lentDescription}
              setLentDescription={setLentDescription}
              lentDate={lentDate}
              setLentDate={setLentDate}
              pendingLent={pendingLent}
              handleReceiveLentPayment={handleReceiveLentPayment}
              formatLKR={formatLKR}
            />
          </TabsContent>

          {/* TAB 4: HISTORY */}
          <TabsContent value="history">
            <HistoryTab 
              transactions={transactions}
              formatLKR={formatLKR}
              handleDeleteTransaction={handleDeleteTransaction}
              activeLentTab={activeLentTab}
              setActiveLentTab={setActiveLentTab}
              totalPendingLent={totalPendingLent}
              pendingLent={pendingLent}
              paidLent={paidLent}
              handleDeleteLentMoney={handleDeleteLentMoney}
              showPaid={showPaid}
              setShowPaid={setShowPaid}
            />
          </TabsContent>

          {/* TAB 5: CATEGORIES */}
          <TabsContent value="categories">
            <CategoriesTab 
              handleAddCategory={handleAddCategory}
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
              newCategoryIcon={newCategoryIcon}
              setNewCategoryIcon={setNewCategoryIcon}
              isAddingCategory={isAddingCategory}
              seedDefaultCategories={seedDefaultCategories}
              categories={categories}
              handleDeleteCategory={handleDeleteCategory}
              handleDeleteSubcategory={handleDeleteSubcategory}
              newSubcategoryNames={newSubcategoryNames}
              handleSubcategoryChange={handleSubcategoryChange}
              handleAddSubcategory={handleAddSubcategory}
            />
          </TabsContent>
          
        </Tabs>
      </div>
    </div>
  );
}

export default App;
