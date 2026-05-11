import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppState, useAppDispatch, useBudgetRepository } from '../contexts';
import { Modal } from '../components/ui/Modal';
import { AddBudgetForm } from '../components/forms/AddBudgetForm';
import type { Budget } from '../services/database/schemas/Budget';
import type { Category } from '../services/database/schemas/Category';
import type { Transaction } from '../services/database/schemas/Transaction';

declare global {
    interface Window {
        Chart: any;
    }
}

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';
type SortField = 'name' | 'amount' | 'spent' | 'percentage';
type SortDirection = 'asc' | 'desc';

export default function Budgets() {
    const { state } = useAppState();
    const dispatch = useAppDispatch();
    const budgetRepo = useBudgetRepository();
    const { budgets, categories, transactions, selectedMonth, theme } = state;

    const pieChartRef = useRef<HTMLCanvasElement>(null);
    const barChartRef = useRef<HTMLCanvasElement>(null);
    const pieChartInstance = useRef<any>(null);
    const barChartInstance = useRef<any>(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Search and filters
    const [searchText, setSearchText] = useState('');
    const [filterCategory, setFilterCategory] = useState<number | 'all'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'normal' | 'exceeded'>('all');
    const [showOnlyExceedBudget, setShowOnlyExceedBudget] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('monthly');

    // Sorting
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const clearFilters = () => {
        setSearchText('');
        setFilterCategory('all');
        setFilterStatus('all');
        setShowOnlyExceedBudget(false);
    };

    const hasActiveFilters = searchText || filterCategory !== 'all' || filterStatus !== 'all' || showOnlyExceedBudget;

    const getDateRangeForPeriod = (period: PeriodType): { start: Date; end: Date } => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const date = now.getDate();
        const dayOfWeek = now.getDay();

        switch (period) {
            case 'daily':
                return { start: new Date(year, month, date), end: new Date(year, month, date, 23, 59, 59) };
            case 'weekly':
                const weekStart = new Date(now);
                weekStart.setDate(date - dayOfWeek);
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                weekEnd.setHours(23, 59, 59);
                return { start: weekStart, end: weekEnd };
            case 'monthly':
                return {
                    start: new Date(year, month, 1),
                    end: new Date(year, month + 1, 0, 23, 59, 59)
                };
            case 'yearly':
                return {
                    start: new Date(year, 0, 1),
                    end: new Date(year, 11, 31, 23, 59, 59)
                };
        }
    };

    const periodBudgets = useMemo(() => {
        const { start, end } = getDateRangeForPeriod(selectedPeriod);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        return budgets.filter((b: Budget) => {
            if (b.period !== selectedPeriod) return false;
            return b.startDate <= endStr && b.endDate >= startStr;
        });
    }, [budgets, selectedPeriod]);

    const budgetData = useMemo(() => {
        const { start, end } = getDateRangeForPeriod(selectedPeriod);
        const startStr = start.toISOString().split('T')[0];
        const endStr = end.toISOString().split('T')[0];

        return periodBudgets.map((budget: Budget) => {
            const category = categories.find((c: Category) => c.id === budget.categoryId);
            const budgetTransactions = transactions.filter((t: Transaction) => {
                if (t.budgetId !== budget.id) return false;
                const tDate = t.date.split('T')[0];
                return tDate >= startStr && tDate <= endStr;
            });
            const spent = budgetTransactions.reduce((sum: number, t: Transaction) => sum + t.amount, 0);
            const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
            return {
                ...budget,
                category,
                spent,
                percentage,
                remaining: budget.amount - spent,
                isExceeded: percentage > 100,
            };
        });
    }, [periodBudgets, categories, transactions, selectedPeriod]);

    const getPeriodLabel = (period: PeriodType): string => {
        switch (period) {
            case 'daily': return 'Today';
            case 'weekly': return 'This Week';
            case 'monthly': return 'This Month';
            case 'yearly': return 'This Year';
        }
    };

    const filteredBudgets = useMemo(() => {
        let result = budgetData.filter((budget: typeof budgetData[0]) => {
            if (searchText && !budget.name?.toLowerCase().includes(searchText.toLowerCase())) {
                return false;
            }
            if (filterCategory !== 'all' && budget.categoryId !== filterCategory) return false;
            if (filterStatus === 'exceeded' && !budget.isExceeded) return false;
            if (filterStatus === 'normal' && budget.isExceeded) return false;
            if (showOnlyExceedBudget && !budget.isExceeded) return false;
            return true;
        });

        result.sort((a: typeof budgetData[0], b: typeof budgetData[0]) => {
            let comparison = 0;
            switch (sortField) {
                case 'name':
                    comparison = (a.name || '').localeCompare(b.name || '');
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'spent':
                    comparison = a.spent - b.spent;
                    break;
                case 'percentage':
                    comparison = a.percentage - b.percentage;
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [budgetData, searchText, filterCategory, filterStatus, showOnlyExceedBudget, sortField, sortDirection]);

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIndicator = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };

    const stats = useMemo(() => {
        const totalBudgeted = budgetData.reduce((sum: number, b: typeof budgetData[0]) => sum + b.amount, 0);
        const totalSpent = budgetData.reduce((sum: number, b: typeof budgetData[0]) => sum + b.spent, 0);
        const exceededCount = budgetData.filter((b: typeof budgetData[0]) => b.isExceeded).length;
        return { totalBudgeted, totalSpent, exceededCount, count: budgetData.length };
    }, [budgetData]);

    const chartData = useMemo(() => {
        return budgetData.slice(0, 8).map(b => ({
            name: b.name || 'Budget',
            icon: b.category?.icon || '📊',
            budgeted: b.amount,
            spent: b.spent,
            isExceeded: b.isExceeded,
        }));
    }, [budgetData]);

    useEffect(() => {
        if (!window.Chart || !pieChartRef.current || !barChartRef.current) return;

        const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';
        const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

        if (pieChartInstance.current) pieChartInstance.current.destroy();
        if (barChartInstance.current) barChartInstance.current.destroy();

        const pieColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#84cc16', '#f43f5e'];
        pieChartInstance.current = new window.Chart(pieChartRef.current, {
            type: 'doughnut',
            data: {
                labels: chartData.map(d => d.name),
                datasets: [{
                    data: chartData.map(d => d.budgeted),
                    backgroundColor: chartData.map((_, i) => pieColors[i % pieColors.length]),
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

        barChartInstance.current = new window.Chart(barChartRef.current, {
            type: 'bar',
            data: {
                labels: chartData.map(d => d.name),
                datasets: [
                    {
                        label: 'Budgeted',
                        data: chartData.map(d => d.budgeted),
                        backgroundColor: 'rgba(59, 130, 246, 0.6)',
                        borderColor: '#3b82f6',
                        borderWidth: 1,
                    },
                    {
                        label: 'Spent',
                        data: chartData.map(d => d.spent),
                        backgroundColor: chartData.map(d => d.isExceeded ? 'rgba(239, 68, 68, 0.6)' : 'rgba(34, 197, 94, 0.6)'),
                        borderColor: chartData.map(d => d.isExceeded ? '#ef4444' : '#22c55e'),
                        borderWidth: 1,
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

        return () => {
            if (pieChartInstance.current) pieChartInstance.current.destroy();
            if (barChartInstance.current) barChartInstance.current.destroy();
        };
    }, [chartData, theme]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                    Budgets - {getPeriodLabel(selectedPeriod)}
                </h2>
                <div className="flex items-center gap-2">
                    <div className="flex bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-xl p-1 border border-gray-300/30 dark:border-gray-600/30">
                        {(['daily', 'weekly', 'monthly', 'yearly'] as PeriodType[]).map((period) => (
                            <button
                                key={period}
                                onClick={() => setSelectedPeriod(period)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                                    selectedPeriod === period
                                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                {period.charAt(0).toUpperCase() + period.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    >
                        + Add Budget
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Budgets</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white group-hover:scale-105 transition-transform">{stats.count}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Budgeted</div>
                    <div className="text-2xl font-bold text-blue-500 group-hover:scale-105 transition-transform">¥{stats.totalBudgeted.toLocaleString()}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Spent</div>
                    <div className="text-2xl font-bold text-red-500 group-hover:scale-105 transition-transform">¥{stats.totalSpent.toLocaleString()}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Exceeded</div>
                    <div className={`text-2xl font-bold group-hover:scale-105 transition-transform ${stats.exceededCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {stats.exceededCount}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Budget Allocation</h3>
                    <div className="h-64">
                        <canvas ref={pieChartRef} />
                    </div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Budget vs Spent</h3>
                    <div className="h-64">
                        <canvas ref={barChartRef} />
                    </div>
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-64">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search budget name..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((c: Category) => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Status</label>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as 'all' | 'normal' | 'exceeded')}
                            className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            <option value="all">All Status</option>
                            <option value="normal">Normal</option>
                            <option value="exceeded">Exceeded</option>
                        </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showOnlyExceedBudget}
                            onChange={e => setShowOnlyExceedBudget(e.target.checked)}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Show only exceeded</span>
                    </label>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20 rounded-xl border border-red-200/50 dark:border-red-700/50 transition-all"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
                {filteredBudgets.length === 0 ? (
                    <div className="p-12 text-center text-gray-500 dark:text-gray-400">
                        {hasActiveFilters ? 'No budgets match your filters' : 'No budgets for this month'}
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-100/50 dark:bg-gray-700/50">
                            <tr>
                                <th
                                    className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors"
                                    onClick={() => toggleSort('name')}
                                >
                                    Budget{getSortIndicator('name')}
                                </th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">Category</th>
                                <th
                                    className="px-6 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors"
                                    onClick={() => toggleSort('amount')}
                                >
                                    Budgeted{getSortIndicator('amount')}
                                </th>
                                <th
                                    className="px-6 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors"
                                    onClick={() => toggleSort('spent')}
                                >
                                    Spent{getSortIndicator('spent')}
                                </th>
                                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">Remaining</th>
                                <th
                                    className="px-6 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors"
                                    onClick={() => toggleSort('percentage')}
                                >
                                    Progress{getSortIndicator('percentage')}
                                </th>
                                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-600 dark:text-gray-300">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                            {filteredBudgets.map((budget: typeof budgetData[0]) => (
                                <tr key={budget.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-200">{budget.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                            <span>{budget.category?.icon}</span>
                                            <span>{budget.category?.name}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-800 dark:text-gray-200">¥{budget.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-right text-gray-800 dark:text-gray-200">¥{budget.spent.toLocaleString()}</td>
                                    <td className={`px-6 py-4 text-right font-semibold ${budget.remaining >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        ¥{budget.remaining.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 h-2.5 bg-gray-200/50 dark:bg-gray-700/50 rounded-full overflow-hidden max-w-24 group-hover:shadow-md transition-shadow">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 group-hover:shadow-lg ${
                                                        budget.isExceeded
                                                            ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/50'
                                                            : budget.percentage > 80
                                                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 shadow-yellow-500/50'
                                                                : 'bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/50'
                                                    }`}
                                                    style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                                                />
                                            </div>
                                            <span className={`text-sm font-medium ${budget.isExceeded ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                {budget.percentage.toFixed(0)}%
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => {
                                                setEditingBudget(budget);
                                                setShowEditModal(true);
                                            }}
                                            className="text-blue-500 hover:text-blue-700 mr-3 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={async () => {
                                                if (!budgetRepo) return;
                                                if (window.confirm(`Delete budget "${budget.name}"?`)) {
                                                    try {
                                                        await budgetRepo.delete(budget.id);
                                                        dispatch({ type: 'DELETE_BUDGET', payload: budget.id });
                                                    } catch (err) {
                                                        console.error('Failed to delete budget:', err);
                                                        alert('Failed to delete budget');
                                                    }
                                                }
                                            }}
                                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Budget"
            >
                <AddBudgetForm onSuccess={() => setShowAddModal(false)} onCancel={() => setShowAddModal(false)} />
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingBudget(null);
                }}
                title="Edit Budget"
            >
                {editingBudget && (
                    <AddBudgetForm
                        initialData={editingBudget}
                        onSuccess={() => {
                            setShowEditModal(false);
                            setEditingBudget(null);
                        }}
                        onCancel={() => {
                            setShowEditModal(false);
                            setEditingBudget(null);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}