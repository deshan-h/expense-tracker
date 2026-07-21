import React from 'react';
import { List, Trash2 } from 'lucide-react';

const HistoryTab = ({ transactions, formatLKR, handleDeleteTransaction }) => {
  return (
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
  );
};

export default HistoryTab;
