import { useMemo, useEffect, useRef } from 'react';
import { useAppState, useAppDispatch } from '../contexts/AppStateContext';

declare global {
    interface Window {
        Chart: any;
    }
}

export default function Dashboard() {
    const { state } = useAppState();
    const dispatch = useAppDispatch();
    const { categories, transactions, budgets, accounts, accountBalances, selectedMonth, theme } = state;

    const trendChartRef = useRef<HTMLCanvasElement>(null);
    const pieChartRef = useRef<HTMLCanvasElement>(null);
    const trendChartInstance = useRef<any>(null);
    const pieChartInstance = useRef<any>(null);

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        dispatch({ type: 'SET_SELECTED_MONTH', payload: e.target.value });
    };

    const availableMonths = useMemo(() => {
        const months = new Set<string>();
        transactions.forEach(t => {
            const month = t.date.substring(0, 7);
            months.add(month);
        });
        const current = new Date();
        const currentMonth = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
        months.add(currentMonth);
        return Array.from(months).sort().reverse();
    }, [transactions]);

    const currentMonthTransactions = useMemo(() =>
        transactions.filter(t => t.date.startsWith(selectedMonth)),
        [transactions, selectedMonth]
    );

    const income = useMemo(() =>
        currentMonthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0),
        [currentMonthTransactions]
    );

    const expense = useMemo(() =>
        currentMonthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0),
        [currentMonthTransactions]
    );

    const balance = income - expense;

    const budgetUsage = useMemo(() => {
        const currentMonthBudgets = budgets.filter(b => b.month === selectedMonth);
        return currentMonthBudgets.map(budget => {
            const spent = currentMonthTransactions
                .filter(t => t.budgetId === budget.id)
                .reduce((sum, t) => sum + t.amount, 0);
            return {
                ...budget,
                spent,
                percentage: budget.amount > 0 ? (spent / budget.amount) * 100 : 0,
            };
        });
    }, [budgets, currentMonthTransactions, selectedMonth]);

    const recentTransactions = transactions.slice(0, 6);

    const trendData = useMemo(() => {
        const daysInMonth = new Date(selectedMonth + '-01').getDate();
        const dailyData = Array.from({ length: daysInMonth }, (_, i) => {
            const day = String(i + 1).padStart(2, '0');
            const dayTransactions = currentMonthTransactions.filter(t => t.date.endsWith(`-${day}`));
            const dayIncome = dayTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
            const dayExpense = dayTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
            return { day: `${selectedMonth}-${day}`, income: dayIncome, expense: dayExpense };
        });
        return dailyData;
    }, [currentMonthTransactions, selectedMonth]);

    const categoryExpenseData = useMemo(() => {
        const categoryMap = new Map<number, number>();
        currentMonthTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const current = categoryMap.get(t.categoryId) || 0;
                categoryMap.set(t.categoryId, current + t.amount);
            });
        return Array.from(categoryMap.entries()).map(([catId, amount]) => {
            const category = categories.find(c => c.id === catId);
            return {
                name: category?.name || 'Unknown',
                icon: category?.icon || '📦',
                amount,
            };
        }).sort((a, b) => b.amount - a.amount);
    }, [currentMonthTransactions, categories]);

    useEffect(() => {
        if (!window.Chart || !trendChartRef.current || !pieChartRef.current) return;

        const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
        const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

        if (trendChartInstance.current) {
            trendChartInstance.current.destroy();
        }
        trendChartInstance.current = new window.Chart(trendChartRef.current, {
            type: 'line',
            data: {
                labels: trendData.map(d => d.day.split('-')[2]),
                datasets: [
                    {
                        label: 'Income',
                        data: trendData.map(d => d.income),
                        borderColor: '#22c55e',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        fill: true,
                        tension: 0.4,
                    },
                    {
                        label: 'Expense',
                        data: trendData.map(d => d.expense),
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
                    legend: {
                        labels: { color: textColor },
                    },
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

        if (pieChartInstance.current) {
            pieChartInstance.current.destroy();
        }
        const pieColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#84cc16', '#f43f5e'];
        pieChartInstance.current = new window.Chart(pieChartRef.current, {
            type: 'doughnut',
            data: {
                labels: categoryExpenseData.map(d => d.name),
                datasets: [{
                    data: categoryExpenseData.map(d => d.amount),
                    backgroundColor: categoryExpenseData.map((_, i) => pieColors[i % pieColors.length]),
                    borderWidth: 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: textColor },
                    },
                },
            },
        });

        return () => {
            if (trendChartInstance.current) trendChartInstance.current.destroy();
            if (pieChartInstance.current) pieChartInstance.current.destroy();
        };
    }, [trendData, categoryExpenseData, theme]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h2>
                <select
                    value={selectedMonth}
                    onChange={handleMonthChange}
                    className="px-4 py-2 rounded-xl border border-gray-300/50 dark:border-gray-600/50 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                >
                    {availableMonths.length === 0 ? (
                        <option value={selectedMonth}>{selectedMonth}</option>
                    ) : (
                        availableMonths.map(month => (
                            <option key={month} value={month}>{month}</option>
                        ))
                    )}
                </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Income</div>
                    <div className="text-2xl font-bold text-green-500 group-hover:scale-105 transition-transform">
                        ¥{income.toLocaleString()}
                    </div>
                    <div className="mt-2 h-1 bg-gradient-to-r from-green-500/50 to-green-500 rounded-full" />
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Expense</div>
                    <div className="text-2xl font-bold text-red-500 group-hover:scale-105 transition-transform">
                        ¥{expense.toLocaleString()}
                    </div>
                    <div className="mt-2 h-1 bg-gradient-to-r from-red-500/50 to-red-500 rounded-full" />
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Balance</div>
                    <div className={`text-2xl font-bold group-hover:scale-105 transition-transform ${balance >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        ¥{balance.toLocaleString()}
                    </div>
                    <div className={`mt-2 h-1 bg-gradient-to-r rounded-full ${balance >= 0 ? 'from-blue-500/50 to-blue-500' : 'from-red-500/50 to-red-500'}`} />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Income vs Expense Trend</h3>
                    <div className="h-64">
                        <canvas ref={trendChartRef} />
                    </div>
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Expense by Category</h3>
                    <div className="h-64">
                        <canvas ref={pieChartRef} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Budget Overview</h3>
                    {budgetUsage.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No budgets for this month</p>
                    ) : (
                        <div className="space-y-4">
                            {budgetUsage.map(budget => (
                                <div key={budget.id} className="group">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700 dark:text-gray-300">{budget.name}</span>
                                        <span className={`font-medium ${budget.percentage > 100 ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                            ¥{budget.spent} / ¥{budget.amount}
                                        </span>
                                    </div>
                                    <div className="h-3 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 group-hover:shadow-lg ${
                                                budget.percentage > 100
                                                    ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/50'
                                                    : 'bg-gradient-to-r from-blue-500 to-indigo-500 shadow-blue-500/50'
                                            }`}
                                            style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                        />
                                    </div>
                                    {budget.percentage > 100 && (
                                        <div className="text-xs text-red-500 mt-1">⚠️ Over budget!</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Recent Transactions</h3>
                    {recentTransactions.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
                    ) : (
                        <div className="space-y-3">
                            {recentTransactions.map(t => {
                                const category = categories.find(c => c.id === t.categoryId);
                                const account = accounts.find(a => a.id === t.accountId);
                                return (
                                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-200/30 dark:border-gray-700/30 last:border-0 group hover:bg-gray-100/30 dark:hover:bg-gray-700/30 -mx-2 px-2 rounded-lg transition-colors">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xl group-hover:scale-110 transition-transform">{category?.icon || '💰'}</span>
                                            <div>
                                                <div className="font-medium text-gray-800 dark:text-gray-200">{t.description || 'No description'}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {category?.name} · {account?.name}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`font-semibold ${t.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                                            {t.type === 'income' ? '+' : '-'}¥{t.amount.toLocaleString()}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Account Summary</h3>
                {accounts.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No accounts yet</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {accounts.filter(a => a.isActive).map(account => {
                            const latestBalance = accountBalances
                                .filter(ab => ab.accountId === account.id)
                                .sort((a, b) => {
                                    if (a.year !== b.year) return b.year - a.year;
                                    return b.month - a.month;
                                })[0];
                            return (
                                <div key={account.id} className="group border border-gray-200/30 dark:border-gray-700/30 rounded-xl p-4 hover:bg-gray-100/30 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{account.icon}</span>
                                        <span className="font-medium text-gray-800 dark:text-gray-200">{account.name}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-1">{account.type}</div>
                                    <div className="text-xl font-bold text-gray-800 dark:text-white">
                                        ¥{latestBalance?.closingBalance.toLocaleString() || '0'}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}