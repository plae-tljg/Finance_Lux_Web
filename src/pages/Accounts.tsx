import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppState, useAppDispatch, useAccountRepository } from '../contexts';
import { Modal } from '../components/ui/Modal';
import { AddAccountForm } from '../components/forms/AddAccountForm';
import { AccountBalanceModal } from '../components/forms/AccountBalanceModal';
import type { Account } from '../services/database/schemas/Account';
import type { AccountBalance } from '../services/database/schemas/AccountBalance';

declare global {
    interface Window {
        Chart: any;
    }
}

type FilterType = 'all' | 'bank' | 'cash' | 'digital' | 'credit';

export default function Accounts() {
    const { state } = useAppState();
    const dispatch = useAppDispatch();
    const accountRepo = useAccountRepository();
    const { accounts, accountBalances, theme } = state;

    const pieChartRef = useRef<HTMLCanvasElement>(null);
    const pieChartInstance = useRef<any>(null);

    const [showAddModal, setShowAddModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [balanceAccount, setBalanceAccount] = useState<Account | null>(null);
    const [showBalanceModal, setShowBalanceModal] = useState(false);

    // Search and filters
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [showInactive, setShowInactive] = useState(false);

    const clearFilters = () => {
        setSearchText('');
        setFilterType('all');
        setShowInactive(false);
    };

    const hasActiveFilters = searchText || filterType !== 'all' || showInactive;

    const getLatestBalance = (accountId: number) => {
        const balances = accountBalances
            .filter((ab: AccountBalance) => ab.accountId === accountId)
            .sort((a: AccountBalance, b: AccountBalance) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            });
        return balances[0]?.closingBalance || 0;
    };

    const filteredAccounts = useMemo(() => {
        return accounts.filter((a: Account) => {
            // Search text
            if (searchText && !a.name?.toLowerCase().includes(searchText.toLowerCase())) {
                return false;
            }

            // Type filter
            if (filterType !== 'all' && a.type !== filterType) return false;

            // Inactive filter
            if (!showInactive && !a.isActive) return false;

            return true;
        });
    }, [accounts, searchText, filterType, showInactive]);

    const groupedAccounts = filteredAccounts.reduce((groups: Record<string, Account[]>, account: Account) => {
        const type = account.type;
        if (!groups[type]) groups[type] = [];
        groups[type].push(account);
        return groups;
    }, {});

    const typeLabels: Record<string, string> = {
        bank: 'Bank Accounts',
        cash: 'Cash',
        digital: 'Digital Wallets',
        credit: 'Credit Cards',
    };

    const typeIcons: Record<string, string> = {
        bank: '🏦',
        cash: '💵',
        digital: '📱',
        credit: '💳',
    };

    // Stats
    const stats = useMemo(() => {
        const totalBalance = filteredAccounts
            .filter((a: Account) => a.isActive && a.type !== 'credit')
            .reduce((sum: number, a: Account) => sum + getLatestBalance(a.id), 0);
        const creditBalance = filteredAccounts
            .filter((a: Account) => a.isActive && a.type === 'credit')
            .reduce((sum: number, a: Account) => sum + getLatestBalance(a.id), 0);
        const inactive = accounts.filter((a: Account) => !a.isActive).length;
        return {
            total: filteredAccounts.length,
            active: filteredAccounts.filter((a: Account) => a.isActive).length,
            inactive,
            totalBalance,
            creditBalance
        };
    }, [filteredAccounts, accounts]);

    const chartData = useMemo(() => {
        return filteredAccounts
            .filter((a: Account) => a.isActive)
            .map((a: Account) => ({
                name: a.name,
                icon: a.icon,
                balance: getLatestBalance(a.id),
                type: a.type,
            }))
            .sort((x, y) => y.balance - x.balance)
            .slice(0, 8);
    }, [filteredAccounts, accountBalances]);

    useEffect(() => {
        if (!window.Chart || !pieChartRef.current) return;

        const textColor = theme === 'dark' ? '#e5e7eb' : '#374151';

        if (pieChartInstance.current) pieChartInstance.current.destroy();

        const pieColors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#06b6d4', '#84cc16', '#f43f5e'];
        pieChartInstance.current = new window.Chart(pieChartRef.current, {
            type: 'doughnut',
            data: {
                labels: chartData.map(d => d.name),
                datasets: [{
                    data: chartData.map(d => Math.abs(d.balance)),
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

        return () => {
            if (pieChartInstance.current) pieChartInstance.current.destroy();
        };
    }, [chartData, theme]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Accounts</h2>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    + Add Account
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Accounts</div>
                    <div className="text-2xl font-bold text-gray-800 dark:text-white group-hover:scale-105 transition-transform">{stats.total}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Active</div>
                    <div className="text-2xl font-bold text-green-500 group-hover:scale-105 transition-transform">{stats.active}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Inactive</div>
                    <div className="text-2xl font-bold text-gray-400 group-hover:scale-105 transition-transform">{stats.inactive}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Balance</div>
                    <div className="text-2xl font-bold text-blue-500 group-hover:scale-105 transition-transform">¥{stats.totalBalance.toLocaleString()}</div>
                </div>
                <div className="group bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Credit Balance</div>
                    <div className={`text-2xl font-bold group-hover:scale-105 transition-transform ${stats.creditBalance < 0 ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
                        ¥{stats.creditBalance.toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Account Balances</h3>
                    <div className="h-64">
                        <canvas ref={pieChartRef} />
                    </div>
                </div>
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Balance by Type</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {['bank', 'cash', 'digital', 'credit'].map(type => {
                            const typeAccounts = filteredAccounts.filter((a: Account) => a.isActive && a.type === type);
                            const total = typeAccounts.reduce((sum, a) => sum + getLatestBalance(a.id), 0);
                            return (
                                <div key={type} className="bg-gray-100/50 dark:bg-gray-700/50 rounded-xl p-4 group hover:bg-gray-200/50 dark:hover:bg-gray-600/50 transition-colors">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-2xl group-hover:scale-110 transition-transform">{typeIcons[type]}</span>
                                        <span className="text-sm text-gray-500 dark:text-gray-400">{typeLabels[type]}</span>
                                    </div>
                                    <div className={`text-xl font-bold ${total < 0 ? 'text-red-500' : 'text-gray-800 dark:text-white'}`}>
                                        ¥{total.toLocaleString()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-5">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-64">
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
                        <input
                            type="text"
                            placeholder="Search account name..."
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Type</label>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value as FilterType)}
                            className="px-4 py-2 border border-gray-300/50 dark:border-gray-600/50 rounded-xl bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm text-gray-800 dark:text-gray-200 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        >
                            <option value="all">All Types</option>
                            <option value="bank">Bank</option>
                            <option value="cash">Cash</option>
                            <option value="digital">Digital</option>
                            <option value="credit">Credit</option>
                        </select>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={e => setShowInactive(e.target.checked)}
                            className="w-4 h-4 rounded"
                        />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Show inactive</span>
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

            {Object.keys(groupedAccounts).length === 0 ? (
                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-12 text-center text-gray-500 dark:text-gray-400">
                    {hasActiveFilters ? 'No accounts match your filters' : 'No accounts yet'}
                </div>
            ) : (
                Object.entries(groupedAccounts).map(([type, typeAccounts]) => (
                    <div key={type} className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-100/50 dark:bg-gray-700/50 border-b border-gray-200/30 dark:border-gray-700/30 flex items-center gap-2">
                            <span className="text-xl">{typeIcons[type]}</span>
                            <h3 className="font-semibold text-gray-700 dark:text-gray-200">{typeLabels[type]}</h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">({typeAccounts.length})</span>
                        </div>
                        <div className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                            {typeAccounts.map((account: Account) => (
                                <div key={account.id} className={`px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group ${!account.isActive ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl group-hover:scale-110 transition-transform">{account.icon}</span>
                                            <div>
                                                <div className="font-medium text-gray-800 dark:text-gray-200">{account.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {account.currency} • {account.isActive ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className={`text-xl font-bold ${getLatestBalance(account.id) < 0 ? 'text-red-500' : 'text-green-600'}`}>
                                                ¥{getLatestBalance(account.id).toLocaleString()}
                                            </div>
                                            <button
                                                onClick={() => {
                                                    setBalanceAccount(account);
                                                    setShowBalanceModal(true);
                                                }}
                                                className="px-3 py-1 text-sm bg-green-100/50 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200/50 dark:hover:bg-green-800/40 rounded-lg transition-colors"
                                            >
                                                Balance
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setEditingAccount(account);
                                                    setShowEditModal(true);
                                                }}
                                                className="p-2 text-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!accountRepo) return;
                                                    if (window.confirm(`Delete account "${account.name}"?`)) {
                                                        try {
                                                            await accountRepo.delete(account.id);
                                                            dispatch({ type: 'DELETE_ACCOUNT', payload: account.id });
                                                        } catch (err) {
                                                            console.error('Failed to delete account:', err);
                                                            alert('Failed to delete account');
                                                        }
                                                    }
                                                }}
                                                className="p-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/30 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))
            )}

            <Modal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                title="Add Account"
            >
                <AddAccountForm onSuccess={() => setShowAddModal(false)} onCancel={() => setShowAddModal(false)} />
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => {
                    setShowEditModal(false);
                    setEditingAccount(null);
                }}
                title="Edit Account"
            >
                {editingAccount && (
                    <AddAccountForm
                        initialData={editingAccount}
                        onSuccess={() => {
                            setShowEditModal(false);
                            setEditingAccount(null);
                        }}
                        onCancel={() => {
                            setShowEditModal(false);
                            setEditingAccount(null);
                        }}
                    />
                )}
            </Modal>

            <Modal
                isOpen={showBalanceModal}
                onClose={() => {
                    setShowBalanceModal(false);
                    setBalanceAccount(null);
                }}
                title="Manage Balances"
            >
                {balanceAccount && (
                    <AccountBalanceModal
                        account={balanceAccount}
                        balances={accountBalances.filter((ab: AccountBalance) => ab.accountId === balanceAccount.id)}
                        onSuccess={() => {
                            setShowBalanceModal(false);
                            setBalanceAccount(null);
                        }}
                        onCancel={() => {
                            setShowBalanceModal(false);
                            setBalanceAccount(null);
                        }}
                    />
                )}
            </Modal>
        </div>
    );
}