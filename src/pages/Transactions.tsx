import { useState, useMemo } from 'react';
import { useAppState, useAppDispatch, useTransactionRepository } from '../contexts';
import { Modal } from '../components/ui/Modal';
import { AddTransactionForm } from '../components/forms/AddTransactionForm';
import { DataTable, type Column } from '../components/ui/DataTable';
import { RecurringTransactionsList } from '../components/forms/RecurringTransactionsList';
import type { Category } from '../services/database/schemas/Category';
import type { Account } from '../services/database/schemas/Account';
import type { Transaction } from '../services/database/schemas/Transaction';

type SortField = 'date' | 'amount' | 'type';
type SortDirection = 'asc' | 'desc';

export default function Transactions() {
    const { state } = useAppState();
    const dispatch = useAppDispatch();
    const transactionRepo = useTransactionRepository();
    const { transactions, categories, accounts } = state;

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showRecurring, setShowRecurring] = useState(false);

    // Search and filters
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
    const [filterCategory, setFilterCategory] = useState<number | 'all'>('all');
    const [filterAccount, setFilterAccount] = useState<number | 'all'>('all');
    const [dateFrom, setDateFrom] = useState<string>('');
    const [dateTo, setDateTo] = useState<string>('');
    const [amountMin, setAmountMin] = useState<string>('');
    const [amountMax, setAmountMax] = useState<string>('');
    const [filterMood, setFilterMood] = useState<string>('all');
    const [filterTag, setFilterTag] = useState<string>('');

    // Quick date presets
    const [datePreset, setDatePreset] = useState<string>('all');

    const datePresets = [
        { label: 'All Time', value: 'all' },
        { label: 'Today', value: 'today' },
        { label: 'This Week', value: 'week' },
        { label: 'This Month', value: 'month' },
        { label: 'Last Month', value: 'lastMonth' },
        { label: 'This Year', value: 'year' },
        { label: 'Custom', value: 'custom' },
    ];

    const getDateRangeFromPreset = (preset: string): { from: string; to: string } => {
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = now.getDate();

        switch (preset) {
            case 'today':
                return {
                    from: new Date(year, month, day).toISOString().split('T')[0],
                    to: new Date(year, month, day).toISOString().split('T')[0]
                };
            case 'week':
                const startOfWeek = new Date(year, month, day - day);
                const endOfWeek = new Date(year, month, day + (6 - day));
                return {
                    from: startOfWeek.toISOString().split('T')[0],
                    to: endOfWeek.toISOString().split('T')[0]
                };
            case 'month':
                return {
                    from: new Date(year, month, 1).toISOString().split('T')[0],
                    to: new Date(year, month + 1, 0).toISOString().split('T')[0]
                };
            case 'lastMonth':
                return {
                    from: new Date(year, month - 1, 1).toISOString().split('T')[0],
                    to: new Date(year, month, 0).toISOString().split('T')[0]
                };
            case 'year':
                return {
                    from: new Date(year, 0, 1).toISOString().split('T')[0],
                    to: new Date(year, 11, 31).toISOString().split('T')[0]
                };
            default:
                return { from: '', to: '' };
        }
    };

    const handleDatePresetChange = (preset: string) => {
        setDatePreset(preset);
        if (preset !== 'custom') {
            const range = getDateRangeFromPreset(preset);
            setDateFrom(range.from);
            setDateTo(range.to);
        }
    };

    // Sorting
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    // Advanced filter visibility
    const [showAdvanced, setShowAdvanced] = useState(false);

    const clearFilters = () => {
        setSearchText('');
        setFilterType('all');
        setFilterCategory('all');
        setFilterAccount('all');
        setDateFrom('');
        setDateTo('');
        setAmountMin('');
        setAmountMax('');
        setDatePreset('all');
        setFilterMood('all');
        setFilterTag('');
    };

    const hasActiveFilters = searchText || filterType !== 'all' || filterCategory !== 'all' ||
        filterAccount !== 'all' || dateFrom || dateTo || amountMin || amountMax;

    const filteredTransactions = useMemo(() => {
        let result = transactions.filter((t: Transaction) => {
            // Search text
            if (searchText && !t.description?.toLowerCase().includes(searchText.toLowerCase())) {
                return false;
            }

            // Type filter
            if (filterType !== 'all' && t.type !== filterType) return false;

            // Category filter
            if (filterCategory !== 'all' && t.categoryId !== filterCategory) return false;

            // Account filter
            if (filterAccount !== 'all' && t.accountId !== filterAccount) return false;

            // Date range filter
            if (dateFrom && t.date < dateFrom) return false;
            if (dateTo && t.date > dateTo) return false;

            // Amount range filter
            if (amountMin && t.amount < parseFloat(amountMin)) return false;
            if (amountMax && t.amount > parseFloat(amountMax)) return false;

            // Mood filter
            if (filterMood !== 'all' && t.mood !== filterMood) return false;

            // Tag filter
            if (filterTag && (!t.tags || !t.tags.toLowerCase().includes(filterTag.toLowerCase()))) return false;

            return true;
        });

        // Sort
        result.sort((a: Transaction, b: Transaction) => {
            let comparison = 0;
            switch (sortField) {
                case 'date':
                    comparison = a.date.localeCompare(b.date);
                    break;
                case 'amount':
                    comparison = a.amount - b.amount;
                    break;
                case 'type':
                    comparison = a.type.localeCompare(b.type);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [transactions, searchText, filterType, filterCategory, filterAccount, dateFrom, dateTo, amountMin, amountMax, sortField, sortDirection]);

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('zh-CN');
    };

    const toggleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIndicator = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? ' ↑' : ' ↓';
    };

    // Summary stats
    const stats = useMemo(() => {
        const income = filteredTransactions
            .filter((t: Transaction) => t.type === 'income')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        const expense = filteredTransactions
            .filter((t: Transaction) => t.type === 'expense')
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
        return { income, expense, count: filteredTransactions.length };
    }, [filteredTransactions]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Transactions</h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowRecurring(!showRecurring)}
                        className={`px-4 py-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 ${
                            showRecurring
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-purple-500/30'
                                : 'bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm text-gray-700 dark:text-gray-200 border border-gray-200/50 dark:border-gray-700/50 hover:bg-white/80 dark:hover:bg-gray-800/80'
                        }`}
                    >
                        🔄 Recurring
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                    >
                        + Add Transaction
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Showing</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white group-hover:scale-105 transition-transform">{stats.count} transactions</div>
                    <div className="mt-2 h-1 bg-gradient-to-r from-blue-500/50 to-blue-500 rounded-full" />
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Income</div>
                    <div className="text-2xl font-bold text-green-500 group-hover:scale-105 transition-transform">+¥{stats.income.toLocaleString()}</div>
                    <div className="mt-2 h-1 bg-gradient-to-r from-green-500/50 to-green-500 rounded-full" />
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Expense</div>
                    <div className="text-2xl font-bold text-red-500 group-hover:scale-105 transition-transform">-¥{stats.expense.toLocaleString()}</div>
                    <div className="mt-2 h-1 bg-gradient-to-r from-red-500/50 to-red-500 rounded-full" />
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">Net</div>
                    <div className={`text-2xl font-bold group-hover:scale-105 transition-transform ${stats.income - stats.expense >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                        {stats.income - stats.expense >= 0 ? '+' : '-'}¥{Math.abs(stats.income - stats.expense).toLocaleString()}
                    </div>
                    <div className={`mt-2 h-1 bg-gradient-to-r rounded-full ${stats.income - stats.expense >= 0 ? 'from-blue-500/50 to-blue-500' : 'from-red-500/50 to-red-500'}`} />
                </div>
            </div>

            {showRecurring && (
                <RecurringTransactionsList />
            )}

            {/* Search and Basic Filters */}
            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 space-y-4">
                {/* Date Preset Buttons */}
                <div className="flex flex-wrap gap-2">
                    {datePresets.map(preset => (
                        <button
                            key={preset.value}
                            onClick={() => handleDatePresetChange(preset.value)}
                            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-300 ${
                                datePreset === preset.value
                                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/30'
                                    : 'bg-gray-100/50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-700/80 hover:shadow-md'
                            }`}
                        >
                            {preset.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-64">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search description..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
                            className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100"
                        >
                            <option value="all">All Types</option>
                            <option value="income">Income</option>
                            <option value="expense">Expense</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Category</label>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100"
                        >
                            <option value="all">All Categories</option>
                            {categories.map((c: Category) => (
                                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Account</label>
                        <select
                            value={filterAccount}
                            onChange={e => setFilterAccount(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                            className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100"
                        >
                            <option value="all">All Accounts</option>
                            {accounts.map((a: Account) => (
                                <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                            ))}
                        </select>
                    </div>
                    <button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        className="px-4 py-2 text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 rounded-xl border border-blue-200/50 dark:border-blue-700/50 transition-all duration-300"
                    >
                        {showAdvanced ? 'Hide Advanced' : 'Advanced'}
                    </button>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/30 rounded-xl border border-red-200/50 dark:border-red-700/50 transition-all duration-300"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>

                {/* Advanced Filters */}
                {showAdvanced && (
                    <div className="flex flex-wrap gap-4 items-end pt-4 border-t border-gray-200/30 dark:border-gray-700/30">
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">From Date</label>
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">To Date</label>
                            <input
                                type="date"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Min Amount</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={amountMin}
                                onChange={e => setAmountMin(e.target.value)}
                                className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100 w-32"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Max Amount</label>
                            <input
                                type="number"
                                placeholder="999999"
                                value={amountMax}
                                onChange={e => setAmountMax(e.target.value)}
                                className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100 w-32"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Mood</label>
                            <select
                                value={filterMood}
                                onChange={e => setFilterMood(e.target.value)}
                                className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100"
                            >
                                <option value="all">All Moods</option>
                                <option value="😊">😊</option>
                                <option value="😄">😄</option>
                                <option value="😐">😐</option>
                                <option value="😢">😢</option>
                                <option value="😡">😡</option>
                                <option value="🎉">🎉</option>
                                <option value="😍">😍</option>
                                <option value="🤔">🤔</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Tag</label>
                            <input
                                type="text"
                                placeholder="Filter by tag..."
                                value={filterTag}
                                onChange={e => setFilterTag(e.target.value)}
                                className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all text-gray-900 dark:text-gray-100 w-40"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Transactions Table with Luxury DataTable */}
            <DataTable
                data={filteredTransactions}
                columns={[
                    {
                        key: 'date',
                        header: 'Date',
                        sortable: true,
                        render: (value) => formatDate(String(value))
                    },
                    {
                        key: 'description',
                        header: 'Description',
                        render: (value) => value || '-'
                    },
                    {
                        key: 'categoryId',
                        header: 'Category',
                        sortable: true,
                        render: (_, item) => {
                            const category = categories.find((c: Category) => c.id === (item as Transaction).categoryId);
                            return (
                                <span className="flex items-center gap-2">
                                    <span>{category?.icon}</span>
                                    <span>{category?.name}</span>
                                </span>
                            );
                        }
                    },
                    {
                        key: 'accountId',
                        header: 'Account',
                        sortable: true,
                        render: (_, item) => {
                            const account = accounts.find((a: Account) => a.id === (item as Transaction).accountId);
                            return (
                                <span className="flex items-center gap-2">
                                    <span>{account?.icon}</span>
                                    <span>{account?.name}</span>
                                </span>
                            );
                        }
                    },
                    {
                        key: 'amount',
                        header: 'Amount',
                        sortable: true,
                        render: (value, item) => {
                            const t = item as Transaction;
                            return (
                                <span className={`font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                    {t.type === 'income' ? '+' : '-'}¥{Number(value).toLocaleString()}
                                </span>
                            );
                        }
                    },
                    {
                        key: 'mood',
                        header: 'Mood',
                        render: (value) => value ? String(value) : '-'
                    },
                    {
                        key: 'tags',
                        header: 'Tags',
                        render: (value) => {
                            if (!value) return '-';
                            const tags = String(value).split(',').map(t => t.trim()).filter(Boolean);
                            return (
                                <div className="flex gap-1 flex-wrap">
                                    {tags.map((tag, idx) => (
                                        <span key={idx} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            );
                        }
                    },
                    {
                        key: 'sticker',
                        header: 'Sticker',
                        render: (value) => value ? String(value) : '-'
                    }
                ]}
                title={`${filteredTransactions.length} Transactions`}
                emptyMessage={hasActiveFilters ? 'No transactions match your filters' : 'No transactions yet'}
                onRowEdit={(item) => {
                    setEditingTransaction(item as Transaction);
                    setShowEditModal(true);
                }}
                onRowDelete={async (item) => {
                    if (!transactionRepo) return;
                    const t = item as Transaction;
                    if (window.confirm(`Delete transaction "${t.description || t.id}"?`)) {
                        try {
                            await transactionRepo.delete(t.id);
                            dispatch({ type: 'DELETE_TRANSACTION', payload: t.id });
                        } catch (err) {
                            alert('Failed to delete transaction');
                        }
                    }
                }}
                onBulkDelete={async (items) => {
                    if (!transactionRepo) return;
                    if (window.confirm(`Delete ${items.length} transactions?`)) {
                        try {
                            for (const item of items) {
                                const t = item as Transaction;
                                await transactionRepo.delete(t.id);
                                dispatch({ type: 'DELETE_TRANSACTION', payload: t.id });
                            }
                        } catch (err) {
                            alert('Failed to delete transactions');
                        }
                    }
                }}
                searchable
                pageable
                pageSizeOptions={[10, 20, 50, 100]}
                exportable
                exportFileName="transactions"
            />

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Transaction"
            >
                <AddTransactionForm onSuccess={() => setShowAddModal(false)} onCancel={() => setShowAddModal(false)} />
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingTransaction(null);
                }}
                title="Edit Transaction"
            >
                {editingTransaction && (
                    <AddTransactionForm
                        initialData={editingTransaction}
                        onSuccess={() => {
                            setShowEditModal(false);
                            setEditingTransaction(null);
                        }}
                        onCancel={() => {
                            setShowEditModal(false);
                            setEditingTransaction(null);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}