import { useMemo, useEffect, useRef, useState } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import type { Category } from '../services/database/schemas/Category';
import type { Account } from '../services/database/schemas/Account';
import type { Transaction } from '../services/database/schemas/Transaction';
import { ExportService, type ReportData } from '../services/export/ExportService';
import { ShareCard } from '../components/ui/ShareCard';
import { useTranslation } from '../hooks/useTranslation';

declare global {
    interface Window {
        Chart: any;
    }
}

interface CategorySummaryItem {
    category: Category;
    total: number;
    count: number;
}

interface AccountSummaryItem {
    account: Account;
    total: number;
    count: number;
}

export default function Reports() {
    const { state } = useAppState();
    const { transactions, categories, accounts, selectedMonth, theme } = state;
    const { t } = useTranslation();
    const [showShareCard, setShowShareCard] = useState(false);

    const pieExpenseRef = useRef<HTMLCanvasElement>(null);
    const pieIncomeRef = useRef<HTMLCanvasElement>(null);
    const barAccountRef = useRef<HTMLCanvasElement>(null);
    const lineTrendRef = useRef<HTMLCanvasElement>(null);
    const pieExpenseInstance = useRef<any>(null);
    const pieIncomeInstance = useRef<any>(null);
    const barAccountInstance = useRef<any>(null);
    const lineTrendInstance = useRef<any>(null);

    const currentMonthTransactions = useMemo(() =>
        transactions.filter((t: Transaction) => t.date.startsWith(selectedMonth)),
        [transactions, selectedMonth]
    );

    const income = useMemo(() =>
        currentMonthTransactions
            .filter((t: Transaction) => t.type === 'income')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
        [currentMonthTransactions]
    );

    const expense = useMemo(() =>
        currentMonthTransactions
            .filter((t: Transaction) => t.type === 'expense')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
        [currentMonthTransactions]
    );

    const categorySummary = useMemo(() => {
        const summary: Record<number, CategorySummaryItem> = {};
        currentMonthTransactions.forEach((t: Transaction) => {
            if (!summary[t.categoryId]) {
                const category = categories.find((c: Category) => c.id === t.categoryId);
                
                summary[t.categoryId] = {
                    category,
                    total: 0,
                    count: 0,
                };
            }
            summary[t.categoryId].total += t.amount;
            summary[t.categoryId].count += 1;
        });
        return Object.values(summary).sort((a: CategorySummaryItem, b: CategorySummaryItem) => b.total - a.total);
    }, [currentMonthTransactions, categories]);

    const accountSummary = useMemo(() => {
        const summary: Record<number, AccountSummaryItem> = {};
        currentMonthTransactions.forEach((t: Transaction) => {
            if (!summary[t.accountId]) {
                const account = accounts.find((a: Account) => a.id === t.accountId);
                
                summary[t.accountId] = {
                    account,
                    total: 0,
                    count: 0,
                };
            }
            summary[t.accountId].total += t.amount;
            summary[t.accountId].count += 1;
        });
        return Object.values(summary).sort((a: AccountSummaryItem, b: AccountSummaryItem) => b.total - a.total);
    }, [currentMonthTransactions, accounts]);

    const expenseCategories = categorySummary.filter(c => c.category?.type === 'expense');
    const incomeCategories = categorySummary.filter(c => c.category?.type === 'income');

    const reportData: ReportData = useMemo(() => ({
      selectedMonth,
      income,
      expense,
      netSavings: income - expense,
      transactions: currentMonthTransactions,
      categories,
      accounts,
      budgets: [],
      categorySummary,
      accountSummary,
    }), [selectedMonth, income, expense, currentMonthTransactions, categories, accounts, categorySummary, accountSummary]);

    const monthlyTrend = useMemo(() => {
      const months: string[] = [];
      const incomeData: number[] = [];
      const expenseData: number[] = [];
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = d.toISOString().slice(0, 7);
        months.push(monthStr);
        const monthTransactions = transactions.filter((t: Transaction) => t.date.startsWith(monthStr));
        incomeData.push(monthTransactions.filter((t: Transaction) => t.type === 'income').reduce((sum: number, t: Transaction) => sum + t.amount, 0));
        expenseData.push(monthTransactions.filter((t: Transaction) => t.type === 'expense').reduce((sum: number, t: Transaction) => sum + t.amount, 0));
      }
      return { months, incomeData, expenseData };
    }, [transactions]);

    const handleExportCSV = () => {
      ExportService.exportToCSV(reportData, `financial-report-${selectedMonth}`);
    };

    const handleExportExcel = () => {
      ExportService.exportToExcel(reportData, `financial-report-${selectedMonth}`);
    };

    const handleExportPDF = () => {
      ExportService.exportToPDF(reportData, `financial-report-${selectedMonth}`);
    };

    useEffect(() => {
        if (!window.Chart) return;

        const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
        const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

        if (pieExpenseInstance.current) pieExpenseInstance.current.destroy();
        if (pieIncomeInstance.current) pieIncomeInstance.current.destroy();
        if (barAccountInstance.current) barAccountInstance.current.destroy();
        if (lineTrendInstance.current) lineTrendInstance.current.destroy();

        const pieColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#84cc16', '#f43f5e'];

        if (pieExpenseRef.current && expenseCategories.length > 0) {
            pieExpenseInstance.current = new window.Chart(pieExpenseRef.current, {
                type: 'doughnut',
                data: {
                    labels: expenseCategories.map(c => c.category?.name || 'Unknown'),
                    datasets: [{
                        data: expenseCategories.map(c => c.total),
                        backgroundColor: expenseCategories.map((_, i) => pieColors[i % pieColors.length]),
                        borderWidth: 0,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { color: textColor } },
                    },
                },
            });
        }

        if (pieIncomeRef.current && incomeCategories.length > 0) {
            pieIncomeInstance.current = new window.Chart(pieIncomeRef.current, {
                type: 'doughnut',
                data: {
                    labels: incomeCategories.map(c => c.category?.name || 'Unknown'),
                    datasets: [{
                        data: incomeCategories.map(c => c.total),
                        backgroundColor: incomeCategories.map((_, i) => pieColors[i % pieColors.length]),
                        borderWidth: 0,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { position: 'right', labels: { color: textColor } },
                    },
                },
            });
        }

        if (barAccountRef.current && accountSummary.length > 0) {
            barAccountInstance.current = new window.Chart(barAccountRef.current, {
                type: 'bar',
                data: {
                    labels: accountSummary.map(a => a.account.name),
                    datasets: [{
                        label: 'Transactions',
                        data: accountSummary.map(a => a.total),
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                    }],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: textColor } },
                    },
                    scales: {
                        x: {
                            ticks: { color: textColor },
                            grid: { color: gridColor },
                        },
                        y: {
                            ticks: { color: textColor },
                            grid: { color: gridColor },
                        },
                    },
                },
            });
        }

        if (lineTrendRef.current) {
            lineTrendInstance.current = new window.Chart(lineTrendRef.current, {
                type: 'line',
                data: {
                    labels: monthlyTrend.months.map(m => m.slice(5)),
                    datasets: [
                        {
                            label: 'Income',
                            data: monthlyTrend.incomeData,
                            borderColor: '#22c55e',
                            backgroundColor: 'rgba(34, 197, 94, 0.1)',
                            fill: true,
                            tension: 0.4,
                        },
                        {
                            label: 'Expense',
                            data: monthlyTrend.expenseData,
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            fill: true,
                            tension: 0.4,
                        },
                    ],
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { labels: { color: textColor } },
                    },
                    scales: {
                        x: {
                            ticks: { color: textColor },
                            grid: { color: gridColor },
                        },
                        y: {
                            ticks: { color: textColor },
                            grid: { color: gridColor },
                        },
                    },
                },
            });
        }

        return () => {
            if (pieExpenseInstance.current) pieExpenseInstance.current.destroy();
            if (pieIncomeInstance.current) pieIncomeInstance.current.destroy();
            if (barAccountInstance.current) barAccountInstance.current.destroy();
            if (lineTrendInstance.current) lineTrendInstance.current.destroy();
        };
    }, [expenseCategories, incomeCategories, accountSummary, monthlyTrend, theme]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{t('reports.title')} - {selectedMonth}</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowShareCard(true)}
                  className="px-4 py-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-medium transition-all duration-300 flex items-center gap-2 border border-purple-500/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </button>
                <button
                  onClick={handleExportCSV}
                  className="px-4 py-2 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-600 dark:text-green-400 font-medium transition-all duration-300 flex items-center gap-2 border border-green-500/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
                <button
                  onClick={handleExportExcel}
                  className="px-4 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-medium transition-all duration-300 flex items-center gap-2 border border-blue-500/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="px-4 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-medium transition-all duration-300 flex items-center gap-2 border border-red-500/20"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.totalIncome')}</div>
                    <div className="text-2xl font-bold text-green-500 group-hover:scale-105 transition-transform">¥{income.toLocaleString()}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.totalExpense')}</div>
                    <div className="text-2xl font-bold text-red-500 group-hover:scale-105 transition-transform">¥{expense.toLocaleString()}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('dashboard.balance')}</div>
                    <div className={`text-2xl font-bold group-hover:scale-105 transition-transform ${income - expense >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        ¥{(income - expense).toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('reports.incomeVsExpense')}</h3>
                <div className="h-64">
                    <canvas ref={lineTrendRef} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('reports.expenseByCategory')}</h3>
                    <div className="h-64">
                        <canvas ref={pieExpenseRef} />
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('reports.incomeByCategory')}</h3>
                    <div className="h-64">
                        <canvas ref={pieIncomeRef} />
                    </div>
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('reports.accountBalance')}</h3>
                <div className="h-64">
                    <canvas ref={barAccountRef} />
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('reports.trend')}</h3>
                {categorySummary.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No data this month</p>
                ) : (
                    <div className="space-y-4">
                        {categorySummary.map((item: CategorySummaryItem) => {
                            const percentage = (income + expense) > 0 ? (item.total / (income + expense)) * 100 : 0;
                            const isExpense = item.category?.type === 'expense';
                            return (
                                <div key={item.category?.id} className="group">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <span className="text-lg group-hover:scale-110 transition-transform">{item.category?.icon}</span>
                                            <span>{item.category?.name}</span>
                                        </span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">¥{item.total.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 group-hover:shadow-lg ${
                                                isExpense ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/50' : 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/50'
                                            }`}
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
)}
            </div>
        </div>

        <ShareCard
          isOpen={showShareCard}
          onClose={() => setShowShareCard(false)}
          data={reportData}
          selectedMonth={selectedMonth}
        />
    </div>
    );
}