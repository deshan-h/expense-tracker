import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { PlusCircle, Trash2, TrendingUp, TrendingDown, DollarSign, LayoutDashboard, List, PieChart as PieChartIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';

const CATEGORIES = [
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
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [type, setType] = useState('Expense');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!amount || !description) return;

    const newTransaction = {
      id: crypto.randomUUID(),
      type,
      category: type === 'Expense' ? category : 'Income',
      amount: parseFloat(amount),
      description,
      date: new Date().toISOString()
    };

    setTransactions([newTransaction, ...transactions]);
    setAmount('');
    setDescription('');
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
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

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
            Expense Tracker
          </h1>
          <p className="text-gray-400 mt-2">Manage your finances with ease</p>
        </header>

        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto md:mx-0 mb-8 h-12">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 hidden sm:block" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="add" className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 hidden sm:block" />
              Add Expense
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <List className="w-4 h-4 hidden sm:block" />
              History
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 hidden sm:block" />
              Categories
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DASHBOARD */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Income</p>
                  <h2 className="text-3xl font-bold text-emerald-400 mt-2">${totalIncome.toFixed(2)}</h2>
                </div>
                <div className="p-3 bg-emerald-400/10 rounded-full">
                  <TrendingUp className="w-8 h-8 text-emerald-400" />
                </div>
              </div>
              
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Total Expenses</p>
                  <h2 className="text-3xl font-bold text-rose-400 mt-2">${totalExpense.toFixed(2)}</h2>
                </div>
                <div className="p-3 bg-rose-400/10 rounded-full">
                  <TrendingDown className="w-8 h-8 text-rose-400" />
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">Net Balance</p>
                  <h2 className={`text-3xl font-bold mt-2 ${netBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    ${netBalance.toFixed(2)}
                  </h2>
                </div>
                <div className="p-3 bg-blue-400/10 rounded-full">
                  <DollarSign className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg text-center py-12">
               <p className="text-gray-400">Welcome to your dashboard. Navigate to other tabs to manage expenses.</p>
            </div>
          </TabsContent>

          {/* TAB 2: ADD EXPENSE */}
          <TabsContent value="add">
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg max-w-xl mx-auto">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-emerald-400" />
                Add Transaction
              </h3>
              <form onSubmit={handleAddTransaction} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Type</label>
                  <select 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  >
                    <option value="Income">Income</option>
                    <option value="Expense">Expense</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Category</label>
                  <select 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={type === 'Income'}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="number" 
                      step="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-8 pr-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                  <input 
                    type="text" 
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                    placeholder="E.g., Bought groceries"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-xl transition-colors shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer mt-4"
                >
                  Save Transaction
                </button>
              </form>
            </div>
          </TabsContent>

          {/* TAB 3: HISTORY */}
          <TabsContent value="history">
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <List className="w-5 h-5 text-emerald-400" />
                Recent Transactions
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
                        <td colSpan="5" className="py-12 text-center text-gray-500">
                          No transactions found. Head over to the "Add Expense" tab to get started!
                        </td>
                      </tr>
                    ) : (
                      transactions.map(t => (
                        <tr key={t.id} className="hover:bg-gray-750/50 transition-colors group">
                          <td className="py-4">
                            <div className="font-medium text-gray-200">{t.description}</div>
                            <div className="text-xs text-gray-500 md:hidden">{t.category}</div>
                          </td>
                          <td className="py-4 hidden md:table-cell">
                            <span className="inline-block px-2.5 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full border border-gray-600/50">
                              {t.category}
                            </span>
                          </td>
                          <td className="py-4 text-gray-400 text-sm">
                            {new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </td>
                          <td className={`py-4 text-right font-medium ${t.type === 'Income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {t.type === 'Income' ? '+' : '-'}${t.amount.toFixed(2)}
                          </td>
                          <td className="py-4 text-right">
                            <button 
                              onClick={() => deleteTransaction(t.id)}
                              className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                              title="Delete transaction"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: CATEGORIES */}
          <TabsContent value="categories">
            <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 shadow-lg max-w-2xl mx-auto">
              <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-emerald-400" />
                Expense Breakdown
              </h3>
              {chartData.length > 0 ? (
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={120}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `$${value.toFixed(2)}`}
                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem' }}
                        itemStyle={{ color: '#f3f4f6' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 text-sm text-center bg-gray-900/50 rounded-xl">
                  <PieChartIcon className="w-12 h-12 text-gray-700 mb-4" />
                  <p>No expenses to show.</p>
                  <p>Add an expense to see the chart!</p>
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
