import React, { useState, useEffect } from 'react';
import { PlusCircle, LayoutDashboard, List, FolderTree, Handshake } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

// Firebase imports
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove, query, orderBy, serverTimestamp } from 'firebase/firestore';

// Utils
import { formatLKR } from './utils/formatters';

// Tab Components
import DashboardTab from './components/tabs/DashboardTab';
import AddExpenseTab from './components/tabs/AddExpenseTab';
import HistoryTab from './components/tabs/HistoryTab';
import MoneyLentTab from './components/tabs/MoneyLentTab';
import CategoriesTab from './components/tabs/CategoriesTab';

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
            <DashboardTab 
              totalIncome={totalIncome}
              totalExpense={totalExpense}
              netBalance={netBalance}
              formatLKR={formatLKR}
              chartData={chartData}
              COLORS={COLORS}
            />
          </TabsContent>

          {/* TAB 2: ADD EXPENSE */}
          <TabsContent value="add">
            <AddExpenseTab 
              handleAddTransaction={handleAddTransaction}
              type={type}
              setType={setType}
              amount={amount}
              setAmount={setAmount}
              description={description}
              setDescription={setDescription}
              categories={categories}
              category={category}
              setCategory={setCategory}
              subcategory={subcategory}
              setSubcategory={setSubcategory}
              selectedCatObj={selectedCatObj}
            />
          </TabsContent>

          {/* TAB 3: MONEY LENT (TIMELINE UPGRADE) */}
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
              activeLentTab={activeLentTab}
              setActiveLentTab={setActiveLentTab}
              totalPendingLent={totalPendingLent}
              formatLKR={formatLKR}
              pendingLent={pendingLent}
              handleMarkPaidLentMoney={handleMarkPaidLentMoney}
              paidLent={paidLent}
              showPaid={showPaid}
              setShowPaid={setShowPaid}
            />
          </TabsContent>

          {/* TAB 4: HISTORY */}
          <TabsContent value="history">
            <HistoryTab 
              transactions={transactions}
              formatLKR={formatLKR}
              handleDeleteTransaction={handleDeleteTransaction}
            />
          </TabsContent>

          {/* TAB 5: CATEGORIES */}
          <TabsContent value="categories">
            <CategoriesTab 
              handleAddCategory={handleAddCategory}
              newCategoryName={newCategoryName}
              setNewCategoryName={setNewCategoryName}
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
