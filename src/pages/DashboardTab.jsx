import React, { useState, useEffect } from 'react';
import SummaryCards from '../components/dashboard/SummaryCards';
import CashFlowChart from '../components/dashboard/CashFlowChart';
import CategoryTracker from '../components/dashboard/CategoryTracker';
import LentAndSavingsCharts from '../components/dashboard/LentAndSavingsCharts';
import ExpenseBreakdownComparison from '../components/dashboard/ExpenseBreakdownComparison';
import YearlyOverviewChart from '../components/dashboard/YearlyOverviewChart';
import ScheduledExpensesChart from '../components/dashboard/ScheduledExpensesChart';
import TemplateRenewalsWidget from '../components/dashboard/TemplateRenewalsWidget';

const DashboardTab = ({ 
  transactions, 
  totalIncome, 
  totalExpense, 
  netBalance, 
  totalPendingLent, 
  totalSavings, 
  thisMonthWithdrawals, 
  thisMonthPlanned, 
  schedules, 
  lentMoney, 
  savings, 
  wishlistItems, 
  formatLKR, 
  chartData,
  templates = []
}) => {

  const [now, setNow] = useState(Date.now());
  
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000); // refresh every minute
    return () => clearInterval(timer);
  }, []);

  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Never';
    const seconds = Math.floor((now - new Date(dateStr).getTime()) / 1000);
    
    if (seconds < 60) return "Just now";
    let interval = seconds / 31536000;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " yr ago" : " yrs ago");
    interval = seconds / 2592000;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " mo ago" : " mos ago");
    interval = seconds / 86400;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " day ago" : " days ago");
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + (Math.floor(interval) === 1 ? " hr ago" : " hrs ago");
    interval = seconds / 60;
    return Math.floor(interval) + (Math.floor(interval) === 1 ? " min ago" : " mins ago");
  };

  const formatCompact = (value) => {
    if (!value) return "0.00";
    if (Math.abs(value) >= 1000000) {
      return new Intl.NumberFormat('en-US', { notation: "compact", maximumFractionDigits: 1 }).format(value);
    }
    return formatLKR(value);
  };

  return (
    <div className="w-[100vw] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-gray-950/50 border-b border-gray-800/80 shadow-2xl backdrop-blur-sm" style={{ fontFamily: "'Roboto', sans-serif" }}>
      <div className="px-4 md:px-8 pb-8 pt-4 space-y-6 w-full max-w-[1600px] mx-auto">
        
        {/* 1. TOP TILES */}
        <SummaryCards formatCompact={formatCompact} timeAgo={timeAgo} />

        {/* 2. VISUALIZATIONS GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <CashFlowChart formatCompact={formatCompact} formatLKR={formatLKR} />
          <CategoryTracker formatLKR={formatLKR} />
        </div>

        {/* 2.5 RENEWAL CYCLES & RECURRING BILLS WIDGET */}
        <TemplateRenewalsWidget templates={templates} formatLKR={formatLKR} />

        {/* 3. LENT & SAVINGS CHARTS */}
        <LentAndSavingsCharts formatCompact={formatCompact} formatLKR={formatLKR} />

        {/* 4. SCHEDULED PROJECTIONS */}
        <ScheduledExpensesChart schedules={schedules} formatLKR={formatLKR} formatCompact={formatCompact} />

        {/* 5. EXPENSE BREAKDOWN COMPARISON */}
        <ExpenseBreakdownComparison formatCompact={formatCompact} formatLKR={formatLKR} />

        {/* 6. YEARLY OVERVIEW BAR CHART */}
        <YearlyOverviewChart formatCompact={formatCompact} />

      </div>
    </div>
  );
};

export default DashboardTab;
