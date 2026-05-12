import { useState, useEffect, useMemo } from 'react';
import { useAppState } from '../contexts/AppStateContext';
import { useRepositories } from '../contexts/RepositoryContext';
import RecurringTransactionModal from '../components/forms/RecurringTransactionModal';
import DataTable from '../components/ui/DataTable';

export default function RecurringTransactions() {
    const { state } = useAppState();
    const { recurringTransactionRepo, categoryRepo, accountRepo, budgetRepo } = useRepositories();
    const { categories, accounts, budgets, recurringTransactions } = state;

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const getNextDueText = (nextDueDate: string) => {
        const now = new Date();
        const due = new Date(nextDueDate);
        const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) return 'Overdue';
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        return `Due in ${diffDays} days`;
    };

    const getFrequencyText = (frequency: string) => {
        switch (frequency) {
            case 'daily': return 'Daily';
            case 'weekly': return 'Weekly';
            case 'monthly': return 'Monthly';
            case 'yearly': return 'Yearly';
            default: return frequency;
        }
    };

    const tableData = useMemo(() => {
        return recurringTransactions.map(rt => {
            const category = categories.find(c => c.id === rt.categoryId);
            const account = accounts.find(a => a.id === rt.accountId);
            const budget = budgets.find(b => b.id === rt.budgetId);
            const nextDueText = getNextDueText(rt.nextDueDate);
            const isOverdue = nextDueText === 'Overdue';
            return {
                ...rt,
                categoryName: category?.name || 'Unknown',
                categoryIcon: category?.icon || '📦',
                accountName: account?.name || 'Unknown',
                accountIcon: account?.icon || '🏦',
                budgetName: budget?.name || 'None',
                nextDueText,
                isOverdue,
                isActive: rt.isActive ? 'Active' : 'Inactive',
            };
        });
    }, [recurringTransactions, categories, accounts, budgets]);

    const columns = useMemo(() => [
        {
            key: 'description',
            label: 'Description',
            sortable: true,
            render: (row: any) => (
                <div className="flex items-center gap-2">
                    <span className="text-lg">{row.categoryIcon}</span>
                    <div>
                        <div className="font-medium text-gray-800 dark:text-gray-200">{row.description || 'No description'}</div>
                        <div className="text-xs text-gray-500">{row.categoryName}</div>
                    </div>
                </div>
            ),
        },
        {
            key: 'amount',
            label: 'Amount',
            sortable: true,
            render: (row: any) => (
                <span className={`font-semibold ${row.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                    {row.type === 'income' ? '+' : '-'}¥{row.amount.toLocaleString()}
                </span>
            ),
        },
        {
            key: 'frequency',
            label: 'Frequency',
            sortable: true,
            render: (row: any) => (
                <span className="px-2 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-lg text-sm">
                    {getFrequencyText(row.frequency)}
                </span>
            ),
        },
        {
            key: 'nextDueDate',
            label: 'Next Due',
            sortable: true,
            render: (row: any) => (
                <div>
                    <div className={`text-sm ${row.isOverdue ? 'text-red-500 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                        {row.nextDueText}
                    </div>
                    <div className="text-xs text-gray-500">{row.nextDueDate.split('T')[0]}</div>
                </div>
            ),
        },
        {
            key: 'account',
            label: 'Account',
            sortable: true,
            render: (row: any) => (
                <div className="flex items-center gap-2">
                    <span>{row.accountIcon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{row.accountName}</span>
                </div>
            ),
        },
        {
            key: 'budget',
            label: 'Budget',
            render: (row: any) => (
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm">
                    {row.budgetName}
                </span>
            ),
        },
        {
            key: 'isActive',
            label: 'Status',
            sortable: true,
            render: (row: any) => (
                <span className={`px-2 py-1 rounded-lg text-sm ${
                    row.isActive
                        ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                    {row.isActive}
                </span>
            ),
        },
    ], []);

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setShowModal(true);
    };

    const handleDelete = async (item: any) => {
        if (!confirm(`Delete recurring transaction "${item.description || 'Untitled'}"?`)) return;
        if (recurringTransactionRepo) {
            await recurringTransactionRepo.delete(item.id);
            await (window as any).__refreshRecurringTransactions?.();
        }
    };

    const handleAdd = () => {
        setEditingItem(null);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                    Recurring Transactions
                </h2>
                <button
                    onClick={handleAdd}
                    className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl hover:from-violet-600 hover:to-purple-600 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                    + Add Recurring
                </button>
            </div>

            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6">
                <DataTable
                    data={tableData}
                    columns={columns}
                    emptyMessage="No recurring transactions yet"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showActions
                />
            </div>

            {showModal && (
                <RecurringTransactionModal
                    isOpen={showModal}
                    onClose={handleModalClose}
                    editData={editingItem}
                />
            )}
        </div>
    );
}