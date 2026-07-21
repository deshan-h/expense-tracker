import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const DashboardTab = ({ totalIncome, totalExpense, netBalance, formatLKR, chartData, COLORS }) => {
  return (
    <div className="space-y-6">
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
    </div>
  );
};

export default DashboardTab;
