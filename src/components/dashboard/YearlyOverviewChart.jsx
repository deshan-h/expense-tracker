import React from 'react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from 'recharts';
import { Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppContext } from '../../context/AppContext';

export default function YearlyOverviewChart({ formatCompact }) {
  const { transactions = [], lentMoney = [], savings = [] } = useAppContext();
  
  const today = new Date();
  const currentYear = today.getFullYear();

  const yearlyOverviewData = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(currentYear, i, 1);
    return {
      month: d.toLocaleDateString(undefined, { month: 'short' }),
      Income: 0,
      Expense: 0,
      Lent: 0,
      Savings: 0,
      Deposit: 0,
      Withdrawal: 0,
      'Net Savings': 0
    };
  });

  transactions.forEach(t => {
    const td = new Date(t.date);
    if (td.getFullYear() === currentYear) {
      const m = td.getMonth();
      if (t.type === 'Income' || t.type === 'POS Income') yearlyOverviewData[m].Income += t.amount;
      else if (t.type === 'Expense') yearlyOverviewData[m].Expense += t.amount;
    }
  });

  lentMoney.forEach(t => {
    const td = new Date(t.date);
    if (td.getFullYear() === currentYear) {
      yearlyOverviewData[td.getMonth()].Lent += t.amount;
    }
  });

  savings.forEach(t => {
    const td = t.date?.toDate ? t.date.toDate() : new Date(t.date);
    if (td.getFullYear() === currentYear) {
      if (t.type === 'Deposit' || t.type === 'Initial') {
         yearlyOverviewData[td.getMonth()].Savings += t.amount;
         yearlyOverviewData[td.getMonth()].Deposit += t.amount;
      } else if (t.type === 'Withdrawal') {
         yearlyOverviewData[td.getMonth()].Withdrawal += t.amount;
      }
    }
  });

  yearlyOverviewData.forEach(data => {
    data['Net Savings'] = data.Deposit - data.Withdrawal;
  });

  return (
    <div className="mt-6">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.1 }} transition={{ duration: 0.5, delay: 0.6 }} className="bg-[#0b1120] p-6 rounded-[1.5rem] border border-gray-800/80 shadow-xl flex flex-col h-80">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg"><Activity className="w-4 h-4 text-indigo-400"/></div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Yearly Overview ({currentYear})</span>
          </div>
        </div>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearlyOverviewData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
              <XAxis dataKey="month" stroke="#4b5563" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#4b5563" fontSize={10} tickFormatter={(val) => formatCompact(val)} tickLine={false} axisLine={false} width={40} />
              <Tooltip cursor={{fill: '#1f2937', opacity: 0.4}} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '0.75rem' }} itemStyle={{ fontWeight: 'bold' }} />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} iconType="circle" />
              <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Lent" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Savings" fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}
